//@ts-check
import { buildChip8, BYTES_PER_ROW } from "./memory.js";
import {
  assert,
  assert_equal,
  assert_equal_binary,
  assert_program_counter,
  assert_u16_equal_hex,
  assert_u8_equal_hex,
} from "./assert.js";
import { handle_instruction } from "./operations.js";
import { formatOpcodeEnum, OP_CODES, parse_opcode } from "./op_codes.js";

const TESTS = {
  opcodes_ShouldParseAsExpected() {
    const test_data = [
      [0x71a0, OP_CODES.ADD],
      [0x0fff, OP_CODES.SYS],
      [0x00e0, OP_CODES.CLS],
      [0x00ee, OP_CODES.RET],
      [0x1123, OP_CODES.JP],
      [0x2123, OP_CODES.CALL],
      [0x3100, OP_CODES.SE],
      [0x4100, OP_CODES.SNE],
      [0x71a0, OP_CODES.ADD],
      [0xd005, OP_CODES.DRW],
    ];
    const failed = [];
    test_data.forEach(([input, expected_output]) => {
      const parsed = parse_opcode(input);
      if (parsed !== expected_output) {
        failed.push([input, expected_output, parsed]);
        console.log(
          "Input: 0x%s, Expected: %s, Received: %s",
          input.toString(16),
          formatOpcodeEnum(expected_output),
          formatOpcodeEnum(parsed),
        );
      }
    });
    assert_equal(failed.length, 0);
  },
  opcode_ADD_ShouldHaveDesiredffect() {
    const chip8 = buildChip8();
    const opcode = 0x710a; // V1 += 10;
    const expected = 10;
    handle_instruction(chip8, opcode);
    const received = chip8.registers[1];
    assert_equal(expected, received);
    assert_program_counter(chip8, 1); //should advance
  },
  opcode_CLS_ShouldClearScreenBuffer() {
    const chip8 = buildChip8();
    chip8.frame_buffer.fill(0b10101010);
    const opcode = 0x00e0; // CLS
    handle_instruction(chip8, opcode);
    assert(
      chip8.frame_buffer.every((x) => x === 0),
      "Expected frame buffer to be cleared",
    );
    assert_program_counter(chip8, 1); //should advance
  },
  opcode_DRW_ShouldSetFrameBufferAsExpectedOnByteBoundary() {
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
    assert_program_counter(chip8, 1); //should advance
  },
  opcode_DRW_ShouldSetFrameBufferAsExpectedOnNonByteBoundary() {
    const chip8 = buildChip8();
    chip8.index_register.set(0);
    // set up sprite
    chip8.memory[0] = 0b10100101;
    chip8.memory[1] = 0b01011010;
    // set up location
    chip8.registers[0] = 4; // will draw to x = 4
    chip8.registers[1] = 0; // will draw to y = 0
    handle_instruction(chip8, 0xd012); //dxyn
    assert_equal_binary(chip8.frame_buffer[0], 0b00001010);
    assert_equal_binary(chip8.frame_buffer[1], 0b01010000);
    assert_equal_binary(chip8.frame_buffer[8], 0b00000101);
    assert_equal_binary(chip8.frame_buffer[9], 0b10100000);
    assert_program_counter(chip8, 1); //should advance
  },
  opcode_DRW_ShouldSetFrameBufferAsExpectedOnNonByteBoundary2() {
    const chip8 = buildChip8();
    chip8.index_register.set(0);
    // set up sprite
    chip8.memory[0] = 0xff;
    // set up location
    chip8.registers[0] = 1; // will draw to x = 1
    chip8.registers[1] = 0; // will draw to y = 0
    handle_instruction(chip8, 0xd011); //dxyn
    assert_equal_binary(chip8.frame_buffer[0], 0b01111111);
    assert_equal_binary(chip8.frame_buffer[1], 0b10000000);
    assert_program_counter(chip8, 1); //should advance
  },
  opcode_DRW_ShouldWrapAtEndOfLine() {
    const chip8 = buildChip8();
    chip8.index_register.set(0);
    // set up sprite
    chip8.memory[0] = 0xff;
    // set up location
    chip8.registers[0] = 60; // will draw to x = 1
    chip8.registers[1] = 0; // will draw to y = 0
    handle_instruction(chip8, 0xd011); //dxyn
    assert_equal_binary(chip8.frame_buffer[0], 0b11110000);
    assert_equal_binary(chip8.frame_buffer[7], 0b00001111);
    assert_program_counter(chip8, 1); //should advance
  },

  opcode_RET_ShoulBehaveAsExpected() {
    /**00EE - RET
Return from a subroutine.The interpreter sets the program counter to the address at the top of the stack,
then subtracts 1 from the stack pointer. */
    const chip8 = buildChip8();
    chip8.program_counter.set(0x0ff);
    chip8.stack[0] = 0x0aa;
    chip8.stack_pointer.set(1);
    assert_program_counter(chip8, 0x0ff);
    handle_instruction(chip8, 0x00ee); // RET instruction;
    assert_program_counter(chip8, 0x0aa);
    assert_equal(chip8.stack_pointer.get(), 0);
  },
  opcode_JP_ShoulBehaveAsExpected() {
    /*1nnn - JP addr
Jump to location nnn. The interpreter sets the program counter to nnn.*/
    const chip8 = buildChip8();
    chip8.program_counter.set(0x0ff);
    assert_program_counter(chip8, 0x0ff);
    handle_instruction(chip8, 0x10aa);
    assert_program_counter(chip8, 0x0aa);
  },
  opcode_CALL_ShoulBehaveAsExpected() {
    /*2nnn - CALL addr
Call subroutine at nnn. The interpreter increments the stack pointer, then puts the current PC on the top
of the stack. The PC is then set to nnn.*/
    const chip8 = buildChip8();
    chip8.program_counter.set(0x0ff);
    assert_program_counter(chip8, 0x0ff);

    handle_instruction(chip8, 0x20aa); // call

    assert_program_counter(chip8, 0x0aa);
    assert_u16_equal_hex(chip8.stack[0], 0x100); // should have pushed next instruction
    assert_equal(chip8.stack_pointer.get(), 1);

    handle_instruction(chip8, 0x20bb);

    assert_program_counter(chip8, 0x0bb);
    assert_u16_equal_hex(chip8.stack[1], 0x0ab);
    assert_equal(chip8.stack_pointer.get(), 2);
  },

  opcode_LD_ShoulBehaveAsExpected() {
    /*6xkk - LD Vx, byte
Set Vx = kk. The interpreter puts the value kk into register Vx.*/
    const chip8 = buildChip8();
    handle_instruction(chip8, 0x65aa);
    assert_u8_equal_hex(chip8.registers[5], 0xaa);
    assert_program_counter(chip8, 1);
  },
  opcode_LD3_ShoulBehaveAsExpected() {
    /** Annn - LD I, addr
Set I = nnn. The value of register I is set to nnn.*/
    const chip8 = buildChip8();
    handle_instruction(chip8, 0xa123);
    assert_u16_equal_hex(chip8.index_register.get(), 0x0123);
    assert_program_counter(chip8, 1);
  },
  opcode_SE_ShoulBehaveAsExpected() {
    /** 3xkk - SE Vx, byte
Skip next instruction if Vx = kk. The interpreter compares register Vx to kk, and if they are equal,
increments the program counter by 2. */
    const chip8 = buildChip8();
    chip8.program_counter.set(0x010);
    chip8.registers[4] = 0xbb;
    handle_instruction(chip8, 0x34aa); // does not match reg, advance as usual
    assert_program_counter(chip8, 0x011);
    handle_instruction(chip8, 0x34bb); // does match;
    assert_program_counter(chip8, 0x013); // moved forward 2
  },
  opcode_SNE_ShoulBehaveAsExpected() {
    OP_CODES.SNE;
    /** 4xkk - SNE Vx, byte
Skip next instruction if Vx != kk. The interpreter compares register Vx to kk, and if they are not equal,
increments the program counter by 2.*/
    const chip8 = buildChip8();
    chip8.program_counter.set(0x010);
    chip8.registers[4] = 0xbb;
    handle_instruction(chip8, 0x44aa); // does not match reg, advance 2
    assert_program_counter(chip8, 0x012);
    handle_instruction(chip8, 0x44bb); // does match;
    assert_program_counter(chip8, 0x013); // moved forward 1
  },
};

export function runTests() {
  let total = 0;
  let pass = 0;
  let fail = 0;
  const start = performance.now();
  Object.entries(TESTS).forEach(([name, test_fn]) => {
    try {
      test_fn();
      console.log("%s %cPASS", name, "color:green");
      pass++;
    } catch (e) {
      fail++;
      console.log("%s %cFAIL", name, "color:red");
      console.error(e);
    } finally {
      total++;
    }
  });
  console.log("=============");
  console.log("Test Results:");
  console.log("  Success: %d", pass);
  console.log("  Fail   : %d", fail);
  console.log("Execution: %sms", (performance.now() - start).toFixed(4));
  console.log("=============");
}
