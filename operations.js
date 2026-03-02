// @ts-check

import {
  assert_address,
  assert_int_in_range,
  assert_register_index,
  assert_uint16,
  assert_uint8,
} from "./assert.js";
import { formatOpcodeEnum, OP_CODES, parse_opcode } from "./op_codes.js";

const WIDTH = 64;
const BYTES_PER_ROW = WIDTH / 8;

/** @param {import("./memory.js").Chip8} cpu */
export function cycle(cpu) {
  throw new Error("not implemented");
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
  const new_address = chip8.program_counter.get() + 1;
  assert_address(new_address);
  chip8.program_counter.set(new_address);
}

/**✅
 * @param {import("./memory.js").Chip8} chip8
 * @param {number} u16
 * */
export function handle_instruction(chip8, u16) {
  assert_uint16(u16);
  const opcode = parse_opcode(u16);
  switch (opcode) {
    case OP_CODES.SYS:
      break; // no-op
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
        const addr = u16 & 0xfff;
        assert_address(addr);
        chip8.program_counter.set(addr);
      }
      break;
    case OP_CODES.CALL:
      {
        const new_address = u16 & 0xfff;
        assert_address(new_address);
        const return_address = chip8.program_counter.get() + 1;
        assert_address(return_address);
        stack_push(chip8, return_address);
        chip8.program_counter.set(new_address);
      }
      break;
    case OP_CODES.SE:
      {
        const register_index = (u16 & 0x0f00) >> 8;
        assert_register_index(register_index);
        const register_val = chip8.registers[register_index];
        assert_uint8(register_val);
        const test_val = u16 & 0xff;
        assert_uint8(test_val);
        const increment = register_val === test_val ? 2 : 1;
        const new_address = chip8.program_counter.get() + increment;
        assert_address(new_address);
        chip8.program_counter.set(new_address);
      }
      break;
    case OP_CODES.SNE:
      {
        const register_index = (u16 & 0x0f00) >> 8;
        assert_register_index(register_index);
        const register_val = chip8.registers[register_index];
        assert_uint8(register_val);
        const test_val = u16 & 0xff;
        assert_uint8(test_val);
        const increment = register_val !== test_val ? 2 : 1;
        const new_address = chip8.program_counter.get() + increment;
        assert_address(new_address);
        chip8.program_counter.set(new_address);
      }
      break;
    case OP_CODES.SE2:
      {
        throw new Error("Not Implemented");
      }
      break;
    case OP_CODES.LD:
      {
        const val = u16 & 0xff;
        assert_uint8(val);
        const register_index = (u16 & 0x0f00) >> 8;
        assert_register_index(register_index);
        chip8.registers[register_index] = val;
        advance(chip8);
      }
      break;
    case OP_CODES.LD3:
      {
        const val = u16 & 0xfff;
        assert_address(val);
        chip8.index_register.set(val);
        advance(chip8);
      }
      break;
    case OP_CODES.ADD:
      {
        const register_index = (u16 & 0x0f00) >> 8;
        assert_register_index(register_index);
        const current = chip8.registers[register_index];
        assert_uint8(current);
        const addend = u16 & 0xff;
        assert_uint8(addend);
        chip8.registers[register_index] = current + addend;
        advance(chip8);
      }
      break;
    case OP_CODES.ADD2:
      {
        const register_index_x = (u16 & 0x0f00) >> 8;
        const register_index_y = (u16 & 0x00f0) >> 4;
        assert_register_index(register_index_x);
        assert_register_index(register_index_y);
        const val_x = chip8.registers[register_index_x];
        assert_uint8(val_x);
        const val_y = chip8.registers[register_index_y];
        assert_uint8(val_y);
        const sum = val_x + val_y;
        if (sum > 255) {
          chip8.registers[0xf] = 1;
          chip8.registers[register_index_x] = sum & 0xff;
        } else {
          chip8.registers[0xf] = 0;
          chip8.registers[register_index_x] = sum;
        }
        advance(chip8);
      }
      break;
    case OP_CODES.ADD3:
      {
        const register_index_x = (u16 & 0x0f00) >> 8;
        assert_register_index(register_index_x);
        const val_x = chip8.registers[register_index_x];
        assert_uint8(val_x);
        chip8.index_register.set(chip8.index_register.get() + val_x);
        advance(chip8);
      }
      break;
    case OP_CODES.DRW:
      {
        const x_register_index = (u16 & 0x0f00) >> 8;
        assert_register_index(x_register_index);
        const y_register_index = (u16 & 0x00f0) >> 4;
        assert_register_index(y_register_index);
        const x = chip8.registers[x_register_index];
        const y = chip8.registers[y_register_index];
        const n = u16 & 0xf;
        const addr = chip8.index_register.get();
        if (x % 8 === 0) {
          // easy path as we're on the byte boundary;
          const row_offset = x / 8;
          for (let i = 0; i < n; i++) {
            const sprite_byte = chip8.memory[addr + i];
            chip8.frame_buffer[(y + i) * BYTES_PER_ROW + row_offset] ^=
              sprite_byte;
          }
          advance(chip8);
          break;
        }
        // need to update two bytes per sprite byte
        const column_offset = Math.floor(x / 8);
        const bit_offset = x % 8;
        for (let i = 0; i < n; i++) {
          const sprite_byte = chip8.memory[addr + i];
          const row_offset = (y + i) * BYTES_PER_ROW;
          const byte_index = row_offset + column_offset;
          chip8.frame_buffer[byte_index] ^= (sprite_byte >> bit_offset) & 0xff;
          let second_index = byte_index + 1;
          // wrap overwrite
          if (second_index % BYTES_PER_ROW === 0) {
            second_index -= BYTES_PER_ROW;
          }
          chip8.frame_buffer[second_index] ^=
            (sprite_byte << (8 - bit_offset)) & 0xff;
        }
        advance(chip8);
      }
      break;

    default: {
      throw new Error(`Unhandled opcode: ${formatOpcodeEnum(opcode)}`);
    }
  }
}
