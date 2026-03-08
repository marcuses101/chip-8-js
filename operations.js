// @ts-check

import {
  assert_address,
  assert_int_in_range,
  assert_register_index,
  assert_u16,
  assert_u8,
} from "./assert.js";
import { BYTES_PER_ROW, SCREEN_HEIGHT, SCREEN_WIDTH } from "./memory.js";
import { formatOpcodeEnum, OP_CODES, parse_opcode } from "./opcode_parser.js";
import { clamp, formatU16Hex, random_u8 } from "./utils.js";

export const DEFAULT_QUIRKS = {
  vf_reset: true,
  memory: true,
  display_wait: false,
  clipping: true,
  shifting: false,
  jumping: true,
};

const WIDTH_PIXELS = 64;
const WIDTH_BYTES = WIDTH_PIXELS / 8;

/** @param {import("./memory.js").Chip8} chip8 */
export function get_opcode(chip8) {
  const address = chip8.program_counter.get();
  const next_adress = address + 1;
  assert_address(address);
  assert_address(next_adress);
  const val1 = chip8.memory[address];
  const val2 = chip8.memory[next_adress];
  return (val1 << 8) | val2;
}

/** @param {import("./memory.js").Chip8} chip8 */
export function cycle(chip8) {
  var op_code = get_opcode(chip8);
  handle_instruction(chip8, op_code);
}

/** @param {import("./memory.js").Chip8} chip8 */
export function decrement_timers(chip8) {
  chip8.sound_timer.set(clamp(chip8.sound_timer.get() - 1, 0, 0xff));
  chip8.delay_timer.set(clamp(chip8.delay_timer.get() - 1, 0, 0xff));
}

/**
 * @param {import("./memory.js").Chip8} chip8
 * @param {number} address u12
 * */
function stack_push(chip8, address) {
  assert_int_in_range(address, 0, 0xfff);
  const stack_pointer = chip8.stack_pointer.get();
  assert_int_in_range(stack_pointer, 0, 15); // stack overflow
  chip8.stack[stack_pointer] = address;
  chip8.stack_pointer.set(stack_pointer + 1);
}

/**
 * @param {import("./memory.js").Chip8} chip8
 * @returns {number} address
 * */
function stack_pop(chip8) {
  const new_stack_pointer = chip8.stack_pointer.get() - 1;
  assert_int_in_range(new_stack_pointer, 0, 15);
  chip8.stack_pointer.set(new_stack_pointer);
  return chip8.stack[new_stack_pointer];
}

/**
 * @param {import("./memory.js").Chip8} chip8
 * */
function advance(chip8) {
  const new_address = chip8.program_counter.get() + 2;
  assert_address(new_address);
  chip8.program_counter.set(new_address);
}

/**
 * @param {import("./memory.js").Chip8} chip8
 * */
function skip(chip8) {
  const new_address = chip8.program_counter.get() + 4;
  assert_address(new_address);
  chip8.program_counter.set(new_address);
}

/**
 * @param {import("./memory.js").Chip8} chip8
 * @param {number} base_x
 * @param {number} base_y
 * @param {number} sprite_index
 * @param {number} sprite_height
 * */
function draw(chip8, base_x, base_y, sprite_index, sprite_height) {
  const normalized_x = base_x % SCREEN_WIDTH;
  const normalized_y = base_y % SCREEN_HEIGHT;

  const x_byte_offset = Math.floor(normalized_x / BYTES_PER_ROW);
  const x_bit_offset = normalized_x % 8;
  let flag = 0;

  for (let sprite_y = 0; sprite_y < sprite_height; sprite_y++) {
    const sprite_byte = chip8.memory[sprite_index + sprite_y];
    const first_byte = sprite_byte >> x_bit_offset;
    const second_byte = (sprite_byte << (8 - x_bit_offset)) & 0xff;

    let row_number = normalized_y + sprite_y;
    if (row_number >= SCREEN_HEIGHT) {
      continue;
    }
    const frame_buffer_index = row_number * BYTES_PER_ROW + x_byte_offset;
    if (chip8.frame_buffer[frame_buffer_index] & first_byte) {
      flag = 1;
    }
    chip8.frame_buffer[frame_buffer_index] ^= first_byte;
    if (x_byte_offset < 7) {
      if (chip8.frame_buffer[frame_buffer_index + 1] & second_byte) {
        flag = 1;
      }
      chip8.frame_buffer[frame_buffer_index + 1] ^= second_byte;
    }
  }
  chip8.registers[0xf] = flag;
}

/**
 * @param {import("./memory.js").Chip8} chip8
 * @param {number} x
 * @param {number} y
 * @param {number} bit
 * @param {boolean} should_clip
 */
function put_pixel(chip8, x, y, bit, should_clip) {
  if (bit === 0) {
    return 0;
  }
  let local_x = x;
  let local_y = y;
  assert_u8(local_x);
  assert_u8(local_y);
  if (x >= SCREEN_WIDTH || y >= SCREEN_HEIGHT) {
    if (should_clip) {
      return 0;
    } else {
      local_x %= SCREEN_WIDTH;
      local_y %= SCREEN_HEIGHT;
    }
  }
  const buffer_index = local_y * 8 + Math.floor(local_x / 8);
  const bit_shift = 7 - (local_x % 8);
  const mask = 1 << bit_shift;
  const current_bit = (chip8.frame_buffer[buffer_index] & mask) >> bit_shift;
  chip8.frame_buffer[buffer_index] ^= bit << bit_shift;
  return current_bit === 1;
}

/**
 * @param {import("./memory.js").Chip8} chip8
 * @param {number} base_x
 * @param {number} base_y
 * @param {number} sprite_index
 * @param {number} sprite_height
 * @param {boolean} should_clip
 * */
function draw_2(
  chip8,
  base_x,
  base_y,
  sprite_index,
  sprite_height,
  should_clip,
) {
  const normalized_x = base_x % SCREEN_WIDTH;
  const normalized_y = base_y % SCREEN_HEIGHT;
  let flag = 0;
  for (let sprite_y = 0; sprite_y < sprite_height; sprite_y++) {
    const sprite_byte = chip8.memory[sprite_index + sprite_y];
    for (let sprite_x = 0; sprite_x < 8; sprite_x++) {
      const shift = 7 - sprite_x;
      const mask = 1 << shift;
      const bit = ((sprite_byte & mask) >> shift) & 1;
      const pixel_x = normalized_x + sprite_x;
      const pixel_y = normalized_y + sprite_y;
      if (put_pixel(chip8, pixel_x, pixel_y, bit, should_clip)) {
        flag = 1;
      }
    }
  }
  chip8.registers[0xf] = flag;
}

/**
 * @param {import("./memory.js").Chip8} chip8
 * @param {number} opcode
 * @param {typeof DEFAULT_QUIRKS} quirk_options
 * @param {()=>number} rnd_fn
 * */
export function handle_instruction(
  chip8,
  opcode,
  rnd_fn = random_u8,
  quirk_options = DEFAULT_QUIRKS,
) {
  assert_u16(opcode);
  const opcode_enum = parse_opcode(opcode);
  switch (opcode_enum) {
    case OP_CODES.SYS:
      advance(chip8); // no-op
      break;
    case OP_CODES.CLS:
      {
        chip8.frame_buffer.fill(0);
        advance(chip8);
      }
      break;
    case OP_CODES.RET:
      {
        const new_address = stack_pop(chip8);
        assert_address(new_address);

        chip8.program_counter.set(new_address);
      }
      break;
    case OP_CODES.JP:
      {
        const addr = opcode & 0xfff;
        assert_address(addr);
        chip8.program_counter.set(addr);
      }
      break;
    case OP_CODES.CALL:
      {
        const new_address = opcode & 0xfff;
        assert_address(new_address);
        const return_address = chip8.program_counter.get() + 2;
        assert_address(return_address);
        stack_push(chip8, return_address);
        chip8.program_counter.set(new_address);
      }
      break;
    case OP_CODES.SE:
      {
        const register_index = (opcode & 0x0f00) >> 8;
        assert_register_index(register_index);
        const register_val = chip8.registers[register_index];
        assert_u8(register_val);
        const test_val = opcode & 0xff;
        assert_u8(test_val);
        if (register_val === test_val) {
          skip(chip8);
        } else {
          advance(chip8);
        }
      }
      break;
    case OP_CODES.SNE:
      {
        const register_index = (opcode & 0x0f00) >> 8;
        assert_register_index(register_index);
        const register_val = chip8.registers[register_index];
        assert_u8(register_val);
        const test_val = opcode & 0xff;
        assert_u8(test_val);
        if (register_val !== test_val) {
          skip(chip8);
        } else {
          advance(chip8);
        }
      }
      break;
    case OP_CODES.SE2:
      {
        assert_int_in_range(opcode, 0, 0xffff);
        const register_index_x = (opcode & 0x0f00) >> 8;
        const register_index_y = (opcode & 0x00f0) >> 4;
        assert_register_index(register_index_x);
        assert_register_index(register_index_y);
        const val_x = chip8.registers[register_index_x];
        assert_u8(val_x);
        const val_y = chip8.registers[register_index_y];
        assert_u8(val_y);
        if (val_x === val_y) {
          skip(chip8);
        } else {
          advance(chip8);
        }
      }
      break;
    case OP_CODES.LD:
      {
        const val = opcode & 0xff;
        assert_u8(val);
        const register_index = (opcode & 0x0f00) >> 8;
        assert_register_index(register_index);
        chip8.registers[register_index] = val;
        advance(chip8);
      }
      break;
    case OP_CODES.ADD:
      {
        const register_index = (opcode & 0x0f00) >> 8;
        assert_register_index(register_index);
        const current = chip8.registers[register_index];
        assert_u8(current);
        const addend = opcode & 0xff;
        assert_u8(addend);
        chip8.registers[register_index] = current + addend;
        advance(chip8);
      }
      break;
    case OP_CODES.LD2:
      {
        const register_index_x = (opcode & 0x0f00) >> 8;
        const register_index_y = (opcode & 0x00f0) >> 4;
        assert_register_index(register_index_x);
        assert_register_index(register_index_y);
        const val_y = chip8.registers[register_index_y];
        assert_u8(val_y);
        chip8.registers[register_index_x] = val_y;
        advance(chip8);
      }
      break;
    case OP_CODES.OR:
      {
        const register_index_x = (opcode & 0x0f00) >> 8;
        const register_index_y = (opcode & 0x00f0) >> 4;
        assert_register_index(register_index_x);
        assert_register_index(register_index_y);
        const val_y = chip8.registers[register_index_y];
        chip8.registers[register_index_x] |= val_y;
        if (quirk_options.vf_reset) {
          chip8.registers[0xf] = 0;
        }
        advance(chip8);
      }
      break;
    case OP_CODES.AND:
      {
        const register_index_x = (opcode & 0x0f00) >> 8;
        const register_index_y = (opcode & 0x00f0) >> 4;
        assert_register_index(register_index_x);
        assert_register_index(register_index_y);
        const val_y = chip8.registers[register_index_y];
        chip8.registers[register_index_x] &= val_y;
        if (quirk_options.vf_reset) {
          chip8.registers[0xf] = 0;
        }
        advance(chip8);
      }
      break;
    case OP_CODES.XOR:
      {
        const register_index_x = (opcode & 0x0f00) >> 8;
        const register_index_y = (opcode & 0x00f0) >> 4;
        assert_register_index(register_index_x);
        assert_register_index(register_index_y);
        const val_y = chip8.registers[register_index_y];
        chip8.registers[register_index_x] ^= val_y;
        if (quirk_options.vf_reset) {
          chip8.registers[0xf] = 0;
        }
        advance(chip8);
      }
      break;
    case OP_CODES.ADD2:
      {
        const register_index_x = (opcode & 0x0f00) >> 8;
        const register_index_y = (opcode & 0x00f0) >> 4;
        assert_register_index(register_index_x);
        assert_register_index(register_index_y);
        const val_x = chip8.registers[register_index_x];
        assert_u8(val_x);
        const val_y = chip8.registers[register_index_y];
        assert_u8(val_y);
        const sum = val_x + val_y;
        chip8.registers[register_index_x] = sum;
        chip8.registers[0xf] = sum > 255 ? 1 : 0;
        advance(chip8);
      }
      break;
    case OP_CODES.SUB:
      {
        const register_index_x = (opcode & 0x0f00) >> 8;
        const register_index_y = (opcode & 0x00f0) >> 4;
        assert_register_index(register_index_x);
        assert_register_index(register_index_y);
        const val_x = chip8.registers[register_index_x];
        assert_u8(val_x);
        const val_y = chip8.registers[register_index_y];
        assert_u8(val_y);

        chip8.registers[register_index_x] = val_x - val_y;
        chip8.registers[0xf] = val_x >= val_y ? 1 : 0;
        advance(chip8);
      }
      break;
    case OP_CODES.SHR:
      {
        const register_index_x = (opcode & 0x0f00) >> 8;
        assert_register_index(register_index_x);
        const register_index_y = (opcode & 0x00f0) >> 4;
        assert_register_index(register_index_y);
        const val_x = chip8.registers[register_index_x];
        const val_y = chip8.registers[register_index_y];
        const val_to_shift = quirk_options.shifting ? val_x : val_y;
        chip8.registers[register_index_x] = val_to_shift >> 1;
        chip8.registers[0xf] = val_to_shift & 1;
        advance(chip8);
      }
      break;
    case OP_CODES.SHL:
      {
        const register_index_x = (opcode & 0x0f00) >> 8;
        assert_register_index(register_index_x);
        const register_index_y = (opcode & 0x00f0) >> 4;
        assert_register_index(register_index_y);
        const val_x = chip8.registers[register_index_x];
        const val_y = chip8.registers[register_index_y];
        const val_to_shift = quirk_options.shifting ? val_x : val_y;
        chip8.registers[register_index_x] = (val_to_shift << 1) & 0xff;
        chip8.registers[0xf] = (val_to_shift & (1 << 7)) >> 7;
        advance(chip8);
      }
      break;
    case OP_CODES.SUBN:
      {
        const register_index_x = (opcode & 0x0f00) >> 8;
        const register_index_y = (opcode & 0x00f0) >> 4;
        assert_register_index(register_index_x);
        assert_register_index(register_index_y);
        const val_x = chip8.registers[register_index_x];
        assert_u8(val_x);
        const val_y = chip8.registers[register_index_y];
        assert_u8(val_y);
        chip8.registers[register_index_x] = val_y - val_x;
        chip8.registers[0xf] = val_y >= val_x ? 1 : 0;
        advance(chip8);
      }
      break;
    case OP_CODES.SNE2:
      {
        const register_index_x = (opcode & 0x0f00) >> 8;
        const register_index_y = (opcode & 0x00f0) >> 4;
        assert_register_index(register_index_x);
        assert_register_index(register_index_y);
        const val_x = chip8.registers[register_index_x];
        assert_u8(val_x);
        const val_y = chip8.registers[register_index_y];
        assert_u8(val_y);
        if (val_x !== val_y) {
          skip(chip8);
        } else {
          advance(chip8);
        }
      }
      break;
    case OP_CODES.LD3:
      {
        const val = opcode & 0xfff;
        assert_address(val);
        chip8.index_register.set(val);
        advance(chip8);
      }
      break;
    case OP_CODES.JP2:
      {
        const val = opcode & 0xfff;
        assert_address(val);
        const v0_val = chip8.registers[0];
        assert_u8(v0_val);
        const new_addr = val + v0_val;
        assert_address(new_addr);
        chip8.program_counter.set(new_addr);
      }
      break;
    case OP_CODES.RND:
      {
        const random_byte = rnd_fn();
        assert_u8(random_byte);
        const register_index_x = (opcode & 0x0f00) >> 8;
        assert_register_index(register_index_x);
        const val = opcode & 0xff;
        chip8.registers[register_index_x] = val & random_byte;
        advance(chip8);
      }
      break;
    case OP_CODES.DRW:
      {
        if (quirk_options.display_wait) {
          throw new Error("Not Implemented");
        }
        const x_register_index = (opcode & 0x0f00) >> 8;
        const y_register_index = (opcode & 0x00f0) >> 4;

        assert_register_index(x_register_index);
        assert_register_index(y_register_index);

        const base_x = chip8.registers[x_register_index];
        const base_y = chip8.registers[y_register_index];

        const sprite_base = chip8.index_register.get();
        const sprite_height = opcode & 0xf;

        draw(
          chip8,
          base_x,
          base_y,
          sprite_base,
          sprite_height,
          quirk_options.clipping,
        );
        // draw_2(
        //   chip8,
        //   base_x,
        //   base_y,
        //   sprite_base,
        //   sprite_height,
        //   quirk_options.clipping,
        // );
        advance(chip8);
      }
      break;
    case OP_CODES.SKP:
      {
        const register_index_x = (opcode & 0x0f00) >> 8;
        assert_register_index(register_index_x);
        const val_x = chip8.registers[register_index_x];
        if (val_x > 15) {
          break; // no corresponding key
        }
        const shift = 15 - val_x;
        const isPressed = (chip8.keyboard.get() & (1 << shift)) >> shift;
        if (isPressed) {
          skip(chip8);
        } else {
          advance(chip8);
        }
      }
      break;
    case OP_CODES.SKNP:
      {
        const register_index_x = (opcode & 0x0f00) >> 8;
        assert_register_index(register_index_x);
        const val_x = chip8.registers[register_index_x];
        if (val_x > 15) {
          break; // no corresponding key
        }
        const shift = 15 - val_x;
        const isPressed = (chip8.keyboard.get() & (1 << shift)) >> shift;
        if (!isPressed) {
          skip(chip8);
        } else {
          advance(chip8);
        }
      }
      break;
    case OP_CODES.LD4:
      {
        const register_index_x = (opcode & 0x0f00) >> 8;
        assert_register_index(register_index_x);
        chip8.registers[register_index_x] = chip8.delay_timer.get();
        advance(chip8);
      }
      break;
    case OP_CODES.LD5: {
      const register_index_x = (opcode & 0x0f00) >> 8;
      assert_register_index(register_index_x);

      const keyboard_state = chip8.keyboard.get();
      const previous_keyboard_state = chip8.previous_keyboard.get();
      if (previous_keyboard_state === 0) {
        break;
      }
      for (let k = 0; k < 16; k++) {
        const shift = 15 - k;
        const wasPressed = (previous_keyboard_state & (1 << shift)) >> shift;
        const isPressed = (keyboard_state & (1 << shift)) >> shift;
        if (wasPressed && !isPressed) {
          chip8.registers[register_index_x] = k;
          advance(chip8);
          break;
        }
      }
      break;
    }
    case OP_CODES.LD6:
      {
        const register_index_x = (opcode & 0x0f00) >> 8;
        assert_register_index(register_index_x);
        const val_x = chip8.registers[register_index_x];
        assert_u8(val_x);
        chip8.delay_timer.set(val_x);
        advance(chip8);
      }
      break;
    case OP_CODES.LD7:
      {
        const register_index_x = (opcode & 0x0f00) >> 8;
        assert_register_index(register_index_x);
        const val_x = chip8.registers[register_index_x];
        assert_u8(val_x);
        chip8.sound_timer.set(val_x);
        advance(chip8);
      }
      break;
    case OP_CODES.LD8:
      {
        const register_index_x = (opcode & 0x0f00) >> 8;
        assert_register_index(register_index_x);
        const index_register = chip8.index_register.get();
        for (let i = 0; i <= register_index_x; i++) {
          chip8.memory[chip8.index_register.get() + i] = chip8.registers[i];
        }
        if (quirk_options.memory) {
          chip8.index_register.set(index_register + register_index_x + 1);
        }
        advance(chip8);
      }
      break;
    case OP_CODES.LD9:
      {
        const register_index_x = (opcode & 0x0f00) >> 8;
        assert_register_index(register_index_x);
        const index_register = chip8.index_register.get();
        for (let i = 0; i <= register_index_x; i++) {
          chip8.registers[i] = chip8.memory[chip8.index_register.get() + i];
        }
        if (quirk_options.memory) {
          chip8.index_register.set(index_register + register_index_x + 1);
        }
        advance(chip8);
      }
      break;
    case OP_CODES.LD9:
      {
        const register_index_x = (opcode & 0x0f00) >> 8;
        assert_register_index(register_index_x);
        for (let i = 0; i <= register_index_x; i++) {
          chip8.registers[i] = chip8.memory[chip8.index_register.get() + i];
        }
        advance(chip8);
      }
      break;
    case OP_CODES.LD10:
      {
        const register_index_x = (opcode & 0x0f00) >> 8;
        assert_register_index(register_index_x);
        const val = chip8.registers[register_index_x];
        assert_u8(val);
        const index_register = chip8.index_register.get();
        chip8.memory[index_register + 0] = Math.floor(val / 100);
        chip8.memory[index_register + 1] = Math.floor((val / 10) % 10);
        chip8.memory[index_register + 2] = Math.floor(val % 10);
        advance(chip8);
      }
      break;
    case OP_CODES.ADD3:
      {
        const register_index_x = (opcode & 0x0f00) >> 8;
        assert_register_index(register_index_x);
        const val_x = chip8.registers[register_index_x];
        assert_u8(val_x);
        chip8.index_register.set(chip8.index_register.get() + val_x);
        advance(chip8);
      }
      break;
    case OP_CODES.UNK: {
      // Should an unrecognized opcode be an error?
      throw new Error(`UNK opcode encountered: ${formatU16Hex(opcode)}`);
    }

    default: {
      throw new Error(`Unhandled opcode: ${formatOpcodeEnum(opcode_enum)}`);
    }
  }
}
