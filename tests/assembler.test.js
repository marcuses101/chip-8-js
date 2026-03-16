// @ts-check
import { assembler, build_assembler_state } from "../assembler/assembler.js";
import { assert_u16_equal_hex } from "../utils/assert.js";
import { build_token } from "../assembler/tokenizer.js";

/**
 * @param {import("../assembler/tokenizer.js").Token[]} tokens
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
