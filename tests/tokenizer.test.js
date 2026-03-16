//@ts-check
import { assert, assert_equal, assert_token_equal } from "../utils/assert.js";
import { is_ignored, tokenizer } from "../assembler/tokenizer.js";

export function is_ignored_behaves_as_expedted() {
  const input_expected = [
    ["A", false],
    [" ", true],
    ["\t", true],
    ["\n", false],
    ["\r", true],
    ["a", false],
    ["0", false],
    [",", false],
  ];
  input_expected.forEach(([input, expected]) => {
    const result = is_ignored(input);
    assert(
      result === expected,
      `expected "${input}" to be ${expected.toString()}`,
    );
  });
}

export function parses_registers_as_expected() {
  const input = "\nV0  ,  VA";
  const get_token = tokenizer(input);

  assert_token_equal(get_token.next().value, {
    value: 0,
    start: 0,
    end: 1,
    token_type: "NEWLINE",
  });

  assert_token_equal(get_token.next().value, {
    value: 0,
    start: 1,
    end: 3,
    token_type: "VREG",
  });

  assert_token_equal(get_token.next().value, {
    value: 0,
    start: 5,
    end: 6,
    token_type: "COMMA",
  });

  assert_token_equal(get_token.next().value, {
    value: 0xa,
    start: 8,
    end: 10,
    token_type: "VREG",
  });
}

export function ignores_comments() {
  const input = `\
# comment line
ADD V0, V1
`;
  const get_token = tokenizer(input);
  const token_types = [];
  for (const token of get_token) {
    token_types.push(token.token_type);
  }
  const expected_token_types = [
    "NEWLINE",
    "INSTR_ADD",
    "VREG",
    "COMMA",
    "VREG",
    "NEWLINE",
    "EOF",
  ];
  expected_token_types.forEach((exp, index) => {
    assert_equal(token_types[index], exp);
  });
}
