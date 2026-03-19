// @ts-check
import {
  assemble_from_string,
  assembler,
  build_assembler_state,
} from "./assembler.js";
import { assert_equal, assert_u16_equal_hex } from "../utils/assert.js";
import { build_token } from "./tokenizer.js";
import { pack_u16 } from "../utils/utils.js";

/**
 * @param {import("./tokenizer.js").Token[]} tokens
 * */
function* get_token_stream(tokens) {
  for (const token of tokens) {
    yield token;
  }
}

export function should_assemble_ADD_tokens() {
  const tokens = [
    build_token("INSTR_ADD", 0, 0, 4),
    build_token("VREG", 0, 4, 6),
    build_token("COMMA", 0, 6, 7),
    build_token("VREG", 1, 7, 9),
    build_token("NEWLINE", 1, 9, 10),
  ];
  const token_stream = get_token_stream(tokens);
  const assembler_state = build_assembler_state(token_stream);
  const get_opcode = assembler(assembler_state);
  assert_u16_equal_hex(get_opcode.next().value, 0x8014);
}

export function should_assemble_ADD2_tokens() {
  const tokens = [
    build_token("INSTR_ADD", 0, 0, 4),
    build_token("VREG", 0, 4, 6),
    build_token("COMMA", 0, 6, 7),
    build_token("NUMBER_LITERAL", 0x10, 7, 9),
    build_token("NEWLINE", 1, 9, 10),
  ];
  const token_stream = get_token_stream(tokens);
  const assembler_state = build_assembler_state(token_stream);
  const get_opcode = assembler(assembler_state);
  assert_u16_equal_hex(get_opcode.next().value, 0x7010);
}

export function should_assemble_ADD3_tokens() {
  const tokens = [
    build_token("INSTR_ADD", 0, 0, 4),
    build_token("I", 0, 4, 6),
    build_token("COMMA", 0, 6, 7),
    build_token("VREG", 0xf, 7, 9),
    build_token("NEWLINE", 1, 9, 10),
  ];
  const token_stream = get_token_stream(tokens);
  const assembler_state = build_assembler_state(token_stream);
  const get_opcode = assembler(assembler_state);
  assert_u16_equal_hex(get_opcode.next().value, 0xff1e);
}

export function assemble_from_string_opcode_tests() {
  const test_data = [
    ["  CLS\n", 0x00e0],
    [" ADD V0, 05\n", 0x7005],
    [" ADD V0, V1\n", 0x8014],
    [" ADD I, VF\n", 0xff1e],
  ];
  test_data.forEach(([input, expected], index) => {
    const program = assemble_from_string(/** @type {string} */ (input));
    const output_opcode = pack_u16(program[0], program[1]);
    assert_u16_equal_hex(
      output_opcode,
      expected,
      `test_data[${index}] input: "${input}"`,
    );
  });
}
export function should_resolve_labels() {
  const source = `
    addStuff:
      ADD V1, 0xA0
      RET

    CALL addStuff
    `;
  const program = assemble_from_string(source, 0x200);
  assert_equal(program.length, 6, "expected program to be 6 bytes (3 opcodes)");
  const opcode_1 = pack_u16(program[0], program[1]);
  const opcode_2 = pack_u16(program[2], program[3]);
  const opcode_3 = pack_u16(program[4], program[5]);

  assert_u16_equal_hex(opcode_1, 0x71a0, "Expected ADD");
  assert_u16_equal_hex(opcode_2, 0x00ee, "Expected RET");
  assert_u16_equal_hex(opcode_3, 0x2200, "Expected CALL");
}
