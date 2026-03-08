// @ts-check
//
import {
  assert,
  assert_equal,
  assert_program_counter,
  assert_u16_equal_hex,
  assert_u8,
  assert_u8_equal_binary,
  assert_u8_equal_hex,
} from "../assert.js";
import { buildChip8, BYTES_PER_ROW } from "../memory.js";
import { OP_CODES } from "../opcode_parser.js";
import {
  DEFAULT_QUIRKS,
  get_opcode,
  handle_instruction,
} from "../operations.js";
import { random_u8 } from "../utils.js";

export function ADD_ShouldHaveDesiredffect() {
  const chip8 = buildChip8();
  const opcode = 0x710a; // V1 += 10;
  const expected = 10;
  handle_instruction(chip8, opcode);
  const received = chip8.registers[1];
  assert_equal(expected, received);
  assert_program_counter(chip8, 2); //should advance
}
export function CLS_ShouldClearScreenBuffer() {
  const chip8 = buildChip8();
  chip8.frame_buffer.fill(0b10101010);
  const opcode = 0x00e0; // CLS
  handle_instruction(chip8, opcode);
  assert(
    chip8.frame_buffer.every((x) => x === 0),
    "Expected frame buffer to be cleared",
  );
  assert_program_counter(chip8, 2); //should advance
}
export function DRW_ShouldSetFrameBufferAsExpectedOnByteBoundary() {
  const chip8 = buildChip8();
  chip8.index_register.set(0);
  // set up sprite
  chip8.memory[0] = 0xf0;
  chip8.memory[1] = 0x0f;
  // set up location
  chip8.registers[0] = 0; // will draw to x = 0
  chip8.registers[1] = 0; // will draw to y = 0
  handle_instruction(chip8, 0xd012); //dxyn
  assert_equal(chip8.frame_buffer[0], 0xf0);
  assert_equal(chip8.frame_buffer[1 * BYTES_PER_ROW], 0x0f);
  assert_program_counter(chip8, 2); //should advance
}
export function DRW_ShouldSetFrameBufferAsExpectedOnNonByteBoundary() {
  const chip8 = buildChip8();
  chip8.index_register.set(0);
  // set up sprite
  chip8.memory[0] = 0b10100101;
  chip8.memory[1] = 0b01011010;
  // set up location
  chip8.registers[0] = 4; // will draw to x = 4
  chip8.registers[1] = 0; // will draw to y = 0
  handle_instruction(chip8, 0xd012); //dxyn
  assert_u8_equal_binary(chip8.frame_buffer[0], 0b00001010);
  assert_u8_equal_binary(chip8.frame_buffer[1], 0b01010000);
  assert_u8_equal_binary(chip8.frame_buffer[8], 0b00000101);
  assert_u8_equal_binary(chip8.frame_buffer[9], 0b10100000);
  assert_program_counter(chip8, 2); //should advance
}
export function DRW_ShouldSetFrameBufferAsExpectedOnNonByteBoundary2() {
  const chip8 = buildChip8();
  chip8.index_register.set(0);
  // set up sprite
  chip8.memory[0] = 0xff;
  // set up location
  chip8.registers[0] = 1; // will draw to x = 1
  chip8.registers[1] = 0; // will draw to y = 0
  handle_instruction(chip8, 0xd011); //dxyn
  assert_u8_equal_binary(chip8.frame_buffer[0], 0b01111111);
  assert_u8_equal_binary(chip8.frame_buffer[1], 0b10000000);
  assert_program_counter(chip8, 2); //should advance
}

export function DRW_ShouldWrapXOnByteBoundary() {
  const chip8 = buildChip8();
  chip8.index_register.set(0);
  // set up sprite
  chip8.memory[0] = 0xff;
  chip8.registers[0] = 64; // will draw to x = 1
  chip8.registers[1] = 0; // will draw to y = 0

  handle_instruction(chip8, 0xd011, random_u8, {
    ...DEFAULT_QUIRKS,
    clipping: true,
  });
  assert_u8_equal_binary(chip8.frame_buffer[0], 0xff);
  assert_u8_equal_binary(chip8.frame_buffer[8], 0);
}
export function DRW_ShouldNotPartialWrapX() {
  const chip8 = buildChip8();
  chip8.index_register.set(0);
  // set up sprite
  chip8.memory[0] = 0xff;
  chip8.registers[0] = 60; // will draw to x = 1
  chip8.registers[1] = 0; // will draw to y = 0

  handle_instruction(chip8, 0xd011, random_u8, {
    ...DEFAULT_QUIRKS,
    clipping: true,
  });
  assert_u8_equal_binary(chip8.frame_buffer[0], 0);
  assert_u8_equal_binary(chip8.frame_buffer[7], 0x0f);
  assert_u8_equal_binary(chip8.frame_buffer[8], 0);
}

export function RET_ShoulBehaveAsExpected() {
  /**00EE - RET
Return from a subroutine.The interpreter sets the program counter to the address at the top of the stack,
then subtracts 1 from the stack pointer. */
  const chip8 = buildChip8();
  chip8.program_counter.set(0x0fe);
  chip8.stack[0] = 0x0aa;
  chip8.stack_pointer.set(1);
  assert_program_counter(chip8, 0x0fe);
  handle_instruction(chip8, 0x00ee); // RET instruction;
  assert_program_counter(chip8, 0x0aa);
  assert_equal(chip8.stack_pointer.get(), 0);
}
export function JP_ShoulBehaveAsExpected() {
  /*1nnn - JP addr
Jump to location nnn. The interpreter sets the program counter to nnn.*/
  const chip8 = buildChip8();
  chip8.program_counter.set(0x0fe);
  assert_program_counter(chip8, 0x0fe);
  handle_instruction(chip8, 0x10aa);
  assert_program_counter(chip8, 0x0aa);
}
export function CALL_ShoulBehaveAsExpected() {
  /*2nnn - CALL addr
Call subroutine at nnn. The interpreter increments the stack pointer, then puts the current PC on the top
of the stack. The PC is then set to nnn.*/
  const chip8 = buildChip8();
  chip8.program_counter.set(0x0fe);
  assert_program_counter(chip8, 0x0fe);

  handle_instruction(chip8, 0x20aa); // call

  assert_program_counter(chip8, 0x0aa);
  assert_u16_equal_hex(chip8.stack[0], 0x100); // should have pushed next instruction
  assert_equal(chip8.stack_pointer.get(), 1);

  handle_instruction(chip8, 0x20ba);

  assert_program_counter(chip8, 0x0ba);
  assert_u16_equal_hex(chip8.stack[1], 0x0ac);
  assert_equal(chip8.stack_pointer.get(), 2);
}

export function LD_ShoulBehaveAsExpected() {
  /*6xkk - LD Vx, byte
Set Vx = kk. The interpreter puts the value kk into register Vx.*/
  const chip8 = buildChip8();
  handle_instruction(chip8, 0x65aa);
  assert_u8_equal_hex(chip8.registers[5], 0xaa);
  assert_program_counter(chip8, 2);
}
export function SE_ShoulBehaveAsExpected() {
  /** 3xkk - SE Vx, byte
Skip next instruction if Vx = kk. The interpreter compares register Vx to kk, and if they are equal,
increments the program counter by 2. */
  const chip8 = buildChip8();
  chip8.program_counter.set(0x010);
  chip8.registers[4] = 0xbb;
  handle_instruction(chip8, 0x34aa); // does not match reg, advance as usual
  assert_program_counter(chip8, 0x012);
  handle_instruction(chip8, 0x34bb); // does match;
  assert_program_counter(chip8, 0x016); // moved forward 2
}
export function SNE_ShoulBehaveAsExpected() {
  OP_CODES.SNE;
  /** 4xkk - SNE Vx, byte
Skip next instruction if Vx != kk. The interpreter compares register Vx to kk, and if they are not equal,
increments the program counter by 2.*/
  const chip8 = buildChip8();
  chip8.program_counter.set(0x010);
  chip8.registers[4] = 0xbb;
  handle_instruction(chip8, 0x44aa); // does not match reg, advance 4
  assert_program_counter(chip8, 0x014);
  handle_instruction(chip8, 0x44bb); // does match;
  assert_program_counter(chip8, 0x016); // moved forward 2
}

export function SE2_ShoulBehaveAsExpected() {
  /** 5xy0 - SE2 Vx, Vy
Skip next instruction if Vx = Vy. The interpreter compares register Vx to register Vy, and if they are equal,
increments the program counter by 2. */
  const chip8 = buildChip8();
  chip8.program_counter.set(0x010);
  chip8.registers[0] = 0x11;
  chip8.registers[1] = 0x22;
  handle_instruction(chip8, 0x5010); // does not match reg, advance as usual
  assert_program_counter(chip8, 0x012);
  chip8.registers[0] = 0xaa;
  chip8.registers[1] = 0xaa;
  handle_instruction(chip8, 0x5010); // does  match reg, advance 2
  assert_program_counter(chip8, 0x016); // moved forward 2
}
export function LD2_ShoulBehaveAsExpected() {
  /** 8xy0 - LD2 Vx, Vy
Set Vx = Vy. Stores the value of register Vy in register Vx. */
  const chip8 = buildChip8();
  chip8.registers[0] = 0x11;
  chip8.registers[1] = 0x22;
  assert_u16_equal_hex(chip8.registers[0], 0x11);

  handle_instruction(chip8, 0x8010); // does not match reg, advance as usual

  assert_u16_equal_hex(chip8.registers[0], 0x22);
  assert_program_counter(chip8, 0x0002); // moved forward 2
}
export function OR_ShoulBehaveAsExpected() {
  /** 8xy1 - OR Vx, Vy
Set Vx = Vx OR Vy. Performs a bitwise OR on the values of Vx and Vy, then stores the result in Vx. A
bitwise OR compares the corresponding bits from two values, and if either bit is 1, then the same bit in the
result is also 1. Otherwise, it is 0. */
  const chip8 = buildChip8();
  chip8.registers[0] = 0b10101010;
  chip8.registers[1] = 0b01010101;

  handle_instruction(chip8, 0x8011);

  assert_u8_equal_hex(chip8.registers[0], 0b11111111);
  assert_program_counter(chip8, 2);
}
export function AND_ShoulBehaveAsExpected() {
  /** 8xy2 - AND Vx, Vy
Set Vx = Vx AND Vy. Performs a bitwise AND on the values of Vx and Vy, then stores the result in Vx.
A bitwise AND compares the corresponding bits from two values, and if both bits are 1, then the same bit
in the result is also 1. Otherwise, it is 0. */
  const chip8 = buildChip8();
  chip8.registers[0] = 0b10101010;
  chip8.registers[1] = 0b01010101;

  handle_instruction(chip8, 0x8012);

  assert_u8_equal_hex(chip8.registers[0], 0b00000000);
  assert_program_counter(chip8, 2);
}
export function XOR_ShoulBehaveAsExpected() {
  /** 8xy3 - XOR Vx, Vy
Set Vx = Vx XOR Vy. Performs a bitwise exclusive OR on the values of Vx and Vy, then stores the result
in Vx. An exclusive OR compares the corresponding bits from two values, and if the bits are not both the
same, then the corresponding bit in the result is set to 1. Otherwise, it is 0 */
  const chip8 = buildChip8();
  chip8.registers[0] = 0b10101010;
  chip8.registers[1] = 0b01011111;

  handle_instruction(chip8, 0x8013);

  assert_u8_equal_hex(chip8.registers[0], 0b11110101);
  assert_program_counter(chip8, 2);
}
export function ADD2_ShoulBehaveAsExpected() {
  /** 8xy4 - ADD Vx, Vy
Set Vx = Vx + Vy, set VF = carry. The values of Vx and Vy are added together. If the result is greater
than 8 bits (i.e., ¿ 255,) VF is set to 1, otherwise 0. Only the lowest 8 bits of the result are kept, and stored
in Vx. */
  const chip8 = buildChip8();
  // no carry

  chip8.registers[0] = 50;
  chip8.registers[1] = 60;
  handle_instruction(chip8, 0x8014);
  assert_u8_equal_hex(chip8.registers[0], 110);
  assert_u8_equal_hex(chip8.registers[15], 0);
  assert_program_counter(chip8, 2);

  chip8.registers[0] = 200;
  chip8.registers[1] = 60;
  handle_instruction(chip8, 0x8014);
  assert_u8_equal_hex(chip8.registers[0], 4);
  assert_u8_equal_hex(chip8.registers[15], 1);
  assert_program_counter(chip8, 4);
}
export function SUB_ShoulBehaveAsExpected() {
  /* 8xy5 - SUB Vx, Vy
Set Vx = Vx - Vy, set VF = NOT borrow. If Vx > Vy, then VF is set to 1, otherwise 0. Then Vy is
subtracted from Vx, and the results stored in Vx. */
  const chip8 = buildChip8();

  // no borrow
  chip8.registers[0] = 200;
  chip8.registers[1] = 60;
  handle_instruction(chip8, 0x8015);
  assert_equal(chip8.registers[0], 140);
  assert_u8_equal_hex(chip8.registers[0xf], 1);
  assert_program_counter(chip8, 2);

  // borrow
  chip8.registers[0] = 50; // X
  chip8.registers[1] = 60; // Y
  handle_instruction(chip8, 0x8015);
  assert_equal(chip8.registers[0], 246);
  assert_u8_equal_hex(chip8.registers[0xf], 0);
  assert_program_counter(chip8, 4);
}
export function SHR_ShoulBehaveAsExpected() {
  /** 8xy6 - SHR Vx {, Vy}
Set Vx = Vx SHR 1. If the least-significant bit of Vx is 1, then VF is set to 1, otherwise 0. Then Vx is
divided by 2. */

  const chip8 = buildChip8();
  chip8.registers[5] = 0b11110001;
  handle_instruction(chip8, 0x8516);
  assert_u8_equal_binary(chip8.registers[5], 0b01111000);
  assert_equal(chip8.registers[0xf], 1);
  assert_program_counter(chip8, 2);
}
export function SUBN_ShoulBehaveAsExpected() {
  /** 8xy7 - SUBN Vx, Vy
Set Vx = Vy - Vx, set VF = NOT borrow. If Vy > Vx, then VF is set to 1, otherwise 0. Then Vx is
subtracted from Vy, and the results stored in Vx. */
  const chip8 = buildChip8();

  chip8.registers[0] = 50;
  chip8.registers[1] = 60;
  handle_instruction(chip8, 0x8017);
  assert_equal(chip8.registers[0], 10);
  assert_u8_equal_hex(chip8.registers[0xf], 1);
  assert_program_counter(chip8, 2);

  chip8.registers[0] = 200;
  chip8.registers[1] = 60;
  handle_instruction(chip8, 0x8017);
  assert_equal(chip8.registers[0], 116);
  assert_u8_equal_hex(chip8.registers[15], 0);
  assert_program_counter(chip8, 4);
}
export function SHL_ShoulBehaveAsExpected() {
  /** 8xyE - SHL Vx {, Vy}
Set Vx = Vx SHL 1. If the most-significant bit of Vx is 1, then VF is set to 1, otherwise to 0. Then Vx is
multiplied by 2. */
  const chip8 = buildChip8();
  chip8.registers[0] = 0b1000_0001;

  handle_instruction(chip8, 0x801e);

  assert_u8_equal_binary(chip8.registers[0], 0b00000010);
  assert_u8_equal_binary(chip8.registers[0xf], 1);
  assert_program_counter(chip8, 2);
}
export function SNE2_ShoulBehaveAsExpected() {
  /** 9xy0 - SNE Vx, Vy
Skip next instruction if Vx != Vy. The values of Vx and Vy are compared, and if they are not equal, the
program counter is increased by 2. */
  const chip8 = buildChip8();
  chip8.registers[0] = 1;
  chip8.registers[1] = 2;
  handle_instruction(chip8, 0x9010);
  assert_program_counter(chip8, 4);
  chip8.registers[0] = 5;
  chip8.registers[1] = 5;
  handle_instruction(chip8, 0x9010);
  assert_program_counter(chip8, 6); // are equal, increase only by one
}
export function LD3_ShoulBehaveAsExpected() {
  /** Annn - LD I, addr
Set I = nnn. The value of register I is set to nnn.*/
  const chip8 = buildChip8();
  handle_instruction(chip8, 0xa123);
  assert_u16_equal_hex(chip8.index_register.get(), 0x0123);
  assert_program_counter(chip8, 2);
}
export function JP2_ShoulBehaveAsExpected() {
  /** Bnnn - JP V0, addr
Jump to location nnn + V0. The program counter is set to nnn plus the value of V0. */
  const chip8 = buildChip8();
  chip8.registers[0] = 3;

  handle_instruction(chip8, 0xb123);
  assert_program_counter(chip8, 0x0126);
}
export function RND_ShoulBehaveAsExpected() {
  /** Cxkk - RND Vx, byte
Set Vx = random byte AND kk. The interpreter generates a random number from 0 to 255, which is then
ANDed with the value kk. The results are stored in Vx. See instruction 8xy2 for more information on AND. */
  const chip8 = buildChip8();
  const mock_rnd = () => 0b11110000;
  handle_instruction(chip8, 0xc0aa, mock_rnd); // 0xAA === 0b10101010;
  assert_u8_equal_binary(chip8.registers[0], 0b10100000);
  assert_program_counter(chip8, 2);
}
export function SKP_ShoulBehaveAsExpected() {
  /** Ex9E - SKP Vx
Skip next instruction if key with the value of Vx is pressed. Checks the keyboard, and if the key corresponding
to the value of Vx is currently in the down position, PC is increased by 2.*/
  const chip8 = buildChip8();
  // represents keys 0123_4567_89AB_CDEF
  // Here "0" is pressed
  chip8.keyboard.set(0b1000_0000_0000_0000);

  chip8.registers[0] = 0x0;
  handle_instruction(chip8, 0xe09e); // check "0", is match, increment 4;
  assert_program_counter(chip8, 4);
  chip8.registers[0] = 0xa;
  handle_instruction(chip8, 0xe09e); // check "a" not match, increment 2;
  assert_program_counter(chip8, 6);
}
export function SKNP_ShoulBehaveAsExpected() {
  /** ExA1 - SKNP Vx
Skip next instruction if key with the value of Vx is not pressed. Checks the keyboard, and if the key
corresponding to the value of Vx is currently in the up position, PC is increased by 2.*/
  const chip8 = buildChip8();
  // represents keys 0123_4567_89AB_CDEF
  // Here "0" is pressed
  chip8.keyboard.set(0b1000_0000_0000_0000);

  chip8.registers[0] = 0x0;
  handle_instruction(chip8, 0xe0a1); // check "0";
  assert_program_counter(chip8, 2);
  chip8.registers[0] = 0xa;
  handle_instruction(chip8, 0xe0a1); // check "A";
  assert_program_counter(chip8, 6);
}
export function LD4_ShoulBehaveAsExpected() {
  /** Fx07 - LD Vx, DT
Set Vx = delay timer value. The value of DT is placed into Vx.*/
  const chip8 = buildChip8();
  chip8.delay_timer.set(0x12);
  handle_instruction(chip8, 0xf307);
  assert_u8_equal_hex(chip8.registers[3], 0x12);
  assert_program_counter(chip8, 2);
}
export function LD5_ShoulBehaveAsExpected() {
  /**Fx0A - LD Vx, K
Wait for a key press, store the value of the key in Vx. All execution stops until a key is pressed, then the
value of that key is stored in Vx.*/
  const chip8 = buildChip8();
  chip8.registers[0] = 0xff;
  // represents keys 0123_4567_89AB_CDEF
  // Here "0" is pressed
  chip8.keyboard.set(0b0000_1000_0000_0000);
  handle_instruction(chip8, 0xf00a); // should not change
  assert_u8_equal_hex(chip8.registers[0], 0xff);
  assert_program_counter(chip8, 0); // no advance

  chip8.previous_keyboard.set(0b0000_1000_0000_0000);
  chip8.keyboard.set(0b0000_0000_0000_0000); // indicates release
  handle_instruction(chip8, 0xf00a);
  assert_u8_equal_hex(chip8.registers[0], 0x04);
  assert_program_counter(chip8, 2); //
}
export function LD6_ShoulBehaveAsExpected() {
  /** Fx15 - LD DT, Vx
Set delay timer = Vx. Delay Timer is set equal to the value of Vx. */
  const chip8 = buildChip8();
  chip8.registers[3] = 0x24;
  handle_instruction(chip8, 0xf315);
  assert_u8_equal_hex(chip8.delay_timer.get(), 0x24);
  assert_program_counter(chip8, 2); //
}
export function LD7_ShoulBehaveAsExpected() {
  /** Fx18 - LD ST, Vx
Set sound timer = Vx. Sound Timer is set equal to the value of Vx. */
  const chip8 = buildChip8();
  chip8.registers[3] = 0x24;
  handle_instruction(chip8, 0xf318);
  assert_u8_equal_hex(chip8.sound_timer.get(), 0x24);
  assert_program_counter(chip8, 2); //
}
export function ADD3_ShoulBehaveAsExpected() {
  /** Fx1E - ADD I, Vx
Set I = I + Vx. The values of I and Vx are added, and the results are stored in I */
  const chip8 = buildChip8();
  chip8.registers[3] = 0x05;
  chip8.index_register.set(5);
  handle_instruction(chip8, 0xf31e);
  assert_u16_equal_hex(chip8.index_register.get(), 0x000a);
  assert_program_counter(chip8, 2); //
}

export function LD8_ShoulBehaveAsExpected() {
  /** Fx55
   * The value of each variable register from V0 to VX inclusive (if X is 0, then only V0)
   * will be stored in successive memory addresses, starting with the one that’s stored in I.
   * V0 will be stored at the address in I,
   * V1 will be stored in I + 1, and so on,
   * until VX is stored in I + X.
   * */
  const chip8 = buildChip8();
  chip8.registers[0] = 0xaa;
  chip8.registers[1] = 0xbb;
  chip8.registers[2] = 0xcc;
  chip8.index_register.set(0x200);
  handle_instruction(chip8, 0xf255);
  assert_u8_equal_hex(chip8.memory[0x200], 0xaa);
  assert_u8_equal_hex(chip8.memory[0x201], 0xbb);
  assert_u8_equal_hex(chip8.memory[0x202], 0xcc);
  assert_program_counter(chip8, 2);
}

export function LD9_ShoulBehaveAsExpected() {
  /** Fx1E - ADD I, Vx
Set I = I + Vx. The values of I and Vx are added, and the results are stored in I */
  const chip8 = buildChip8();
  chip8.memory[0x200] = 0xaa;
  chip8.memory[0x201] = 0xbb;
  chip8.memory[0x202] = 0xcc;
  chip8.index_register.set(0x200);
  handle_instruction(chip8, 0xf265);
  assert_u8_equal_hex(chip8.registers[0], 0xaa);
  assert_u8_equal_hex(chip8.registers[1], 0xbb);
  assert_u8_equal_hex(chip8.registers[2], 0xcc);
  assert_program_counter(chip8, 2);
}

export function LD10_ShoulBehaveAsExpected() {
  OP_CODES.LD10;
  const chip8 = buildChip8();
  chip8.registers[0] = 123;
  chip8.index_register.set(0x209);

  handle_instruction(chip8, 0xf033);
  assert_equal(chip8.memory[0x209], 1);
  assert_equal(chip8.memory[0x20a], 2);
  assert_equal(chip8.memory[0x20b], 3);

  assert_program_counter(chip8, 2);
}

export function get_opcode_should_return_u16_at_pc() {
  const chip8 = buildChip8();
  chip8.program_counter.set(0x004);
  chip8.memory[0x004] = 0xab;
  chip8.memory[0x005] = 0xcd;
  var opcode = get_opcode(chip8);
  assert_u16_equal_hex(opcode, 0xabcd);
}
