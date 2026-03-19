//@ts-check
import { assert, assert_equal, assert_token_equal } from "../utils/assert.js";
import { build_tokenizer_state, is_ignored, tokenizer } from "./tokenizer.js";

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
  const input = build_tokenizer_state("\nV0  ,  VA");
  const get_token = tokenizer(input);
  let token = /** @type {import("./tokenizer.js").Token} */ (
    get_token.next().value
  );

  assert_token_equal(token, {
    number_value: 0,
    string_value: "",
    start: 0,
    end: 1,
    token_type: "NEWLINE",
  });
  token = /** @type {import("./tokenizer.js").Token} */ (
    get_token.next().value
  );

  assert_token_equal(token, {
    number_value: 0,
    string_value: "",
    start: 1,
    end: 3,
    token_type: "VREG",
  });

  token = /** @type {import("./tokenizer.js").Token} */ (
    get_token.next().value
  );

  assert_token_equal(token, {
    number_value: 0,
    string_value: "",
    start: 5,
    end: 6,
    token_type: "COMMA",
  });

  token = /** @type {import("./tokenizer.js").Token} */ (
    get_token.next().value
  );

  assert_token_equal(token, {
    number_value: 0xa,
    string_value: "",
    start: 8,
    end: 10,
    token_type: "VREG",
  });
}

export function parses_dec_number_literals() {
  const tokenizer_state = build_tokenizer_state("123");
  const token_stream = tokenizer(tokenizer_state);
  const token = token_stream.next().value;
  assert_token_equal(token, {
    number_value: 123,
    string_value: "",
    start: 0,
    end: 3,
    token_type: "NUMBER_LITERAL",
  });
}
export function parses_hex_number_literals() {
  const input = build_tokenizer_state("  0xFF  \n");
  const token_stream = tokenizer(input);
  const token = token_stream.next().value;
  assert_token_equal(token, {
    number_value: 255,
    string_value: "",
    start: 2,
    end: 6,
    token_type: "NUMBER_LITERAL",
  });
}

export function parses_bin_number_literals() {
  const input = build_tokenizer_state("  0b100  \n");
  const token_stream = tokenizer(input);
  const token = token_stream.next().value;
  assert_token_equal(token, {
    number_value: 4,
    string_value: "",
    start: 2,
    end: 7,
    token_type: "NUMBER_LITERAL",
  });
}

export function ignores_comments() {
  const input = build_tokenizer_state(`\
# comment line
ADD V0, V1
SUB V3, 0b1100
`);
  const get_token = tokenizer(input);
  const token_types = [];
  for (const token of get_token) {
    token_types.push(token.token_type);
  }
  /** @type {import("./tokenizer.js").TokenType[]} */
  const expected_token_types = [
    "NEWLINE",
    "INSTR_ADD",
    "VREG",
    "COMMA",
    "VREG",
    "NEWLINE",
    "INSTR_SUB",
    "VREG",
    "COMMA",
    "NUMBER_LITERAL",
    "NEWLINE",
    "EOF",
  ];
  expected_token_types.forEach((exp, index) => {
    assert_equal(token_types[index], exp);
  });
}
