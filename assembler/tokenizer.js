// @ts-check

import {
  assert,
  assert_char,
  assert_int_in_range,
  assert_less_than,
} from "../utils/assert.js";

/** @typedef InstructionToken
 * @type {"INSTR_ADD" | "INSTR_SUB" | "INSTR_LD" | "INSTR_RET" | "INSTR_CALL" | "INSTR_BCD" | "INSTR_XOR"}
 */

/** @typedef RegisterToken
 * @type {"VREG" | "PC" | "I" | "DT" | "ST" }
 */

/** @typedef TokenType
 * @type {InstructionToken | RegisterToken | "NEWLINE" | "COMMA" | "EOF" | "NUMBER_LITERAL"}
 */

/**
 * @typedef Token
 * @type {object}
 * @property {number} start
 * @property {number} end
 * @property {TokenType} token_type
 * @property {number} value
 */

/** @param {string} char
 * @returns {boolean}
 * */
export function is_ignored(char) {
  assert(char.length === 1, "expected char");
  return /[^a-zA-Z0-9\n,\[\]]/.test(char);
}

/**
 * @param {TokenType} type
 * @param {number} value
 * @param {number} start
 * @param {number} end
 * @return {Token}
 * */
export function build_token(type, value, start, end) {
  assert_int_in_range(value, 0, 0xfff);
  assert_less_than(start, end);
  return {
    token_type: type,
    value,
    start,
    end,
  };
}

/** @typedef TokenStream
 * @type {Generator<Token, undefined, unknown>}
 */

/** @typedef TokenizerState
 * @type {object}
 * @property {number} token_start
 * @property {number} current_index
 */

/** @param {string} input
/** @param {TokenizerState} state
 * @returns {TokenStream}
 * */
export function* tokenizer(
  input,
  state = { current_index: 0, token_start: 0 },
) {
  let tokenizer_state = state;
  /**
   * @param {TokenType} type
   * @param {number} value
   * @return {Token}
   * */
  function make_token(type, value = 0) {
    return {
      value,
      start: tokenizer_state.token_start,
      end: tokenizer_state.current_index,
      token_type: type,
    };
  }

  /** @param {number} n
   * @returns {string} char
   * */
  function peek(n = 0) {
    const char = input[tokenizer_state.current_index + n];
    assert_char(char);
    return char;
  }
  /** @returns {string} char */
  function advance() {
    const char = input[tokenizer_state.current_index];
    tokenizer_state.current_index++;
    return char;
  }
  /** @returns {Token} */
  function end() {
    return {
      value: 0,
      token_type: "EOF",
      start: input.length,
      end: input.length,
    };
  }
  /**
   * @param {string} char
   * @param {number} index
   */
  function unexpected_char(char, index) {
    var line = 1;
    for (let i = 0; i < index; i++) {
      if (input[i] === "\n") {
        line++;
      }
    }
    throw new Error(`unexpected chat "${char}" at line ${line} index ${index}`);
  }
  /**
   * @param {string} expected_char
   */
  function consume(expected_char) {
    const char = advance();
    if (char !== expected_char) {
      unexpected_char(char, tokenizer_state.current_index - 1);
    }
  }
  /** @type {Token} */
  while (tokenizer_state.current_index < input.length) {
    tokenizer_state.token_start = tokenizer_state.current_index;
    const char = advance();
    if (is_ignored(char)) {
      continue;
    }
    switch (char) {
      case "#":
        {
          let next = advance();
          while (next && next !== "\n") {
            next = advance();
          }
          if (next === "\n") {
            yield make_token("NEWLINE");
          }
        }
        break;
      case "\n":
        {
          yield make_token("NEWLINE");
        }
        break;
      case ",":
        {
          yield make_token("COMMA");
        }
        break;
      case "A":
        {
          consume("D");
          consume("D");
          yield make_token("INSTR_ADD");
        }
        break;
      case "X":
        {
          consume("O");
          consume("R");
          yield make_token("INSTR_XOR");
        }
        break;
      case "I":
        {
          yield make_token("I");
        }
        break;
      case "P":
        {
          consume("C");
          yield make_token("PC");
        }
        break;
      case "D":
        {
          consume("T");
          yield make_token("DT");
        }
        break;
      case "S":
        {
          consume("T");
          yield make_token("ST");
        }
        break;
      case "V":
        {
          const register = advance();
          switch (register) {
            case "0":
              {
                yield make_token("VREG", 0);
              }
              break;
            case "1":
              {
                yield make_token("VREG", 1);
              }
              break;
            case "2":
              {
                yield make_token("VREG", 2);
              }
              break;
            case "3":
              {
                yield make_token("VREG", 3);
              }
              break;
            case "4":
              {
                yield make_token("VREG", 4);
              }
              break;
            case "5":
              {
                yield make_token("VREG", 5);
              }
              break;
            case "6":
              {
                yield make_token("VREG", 0x6);
              }
              break;
            case "7":
              {
                yield make_token("VREG", 0x7);
              }
              break;
            case "8":
              {
                yield make_token("VREG", 0x8);
              }
              break;
            case "9":
              {
                yield make_token("VREG", 0x9);
              }
              break;
            case "a":
            case "A":
              {
                yield make_token("VREG", 0xa);
              }
              break;
            case "b":
            case "B":
              {
                yield make_token("VREG", 0xb);
              }
              break;
            case "c":
            case "C":
              {
                yield make_token("VREG", 0xc);
              }
              break;
            case "d":
            case "D":
              {
                yield make_token("VREG", 0xd);
              }
              break;
            case "e":
            case "E":
              {
                yield make_token("VREG", 0xe);
              }
              break;
            case "f":
            case "F":
              {
                yield make_token("VREG", 0xf);
              }
              break;
            default: {
              unexpected_char(register, tokenizer_state.current_index - 1);
            }
          }
        }
        break;
    }
  }
  yield end();
}

/** @param {string} source
 * @param {Token} token
 * @returns {string} slice
 */
export function get_token_slice(source, token) {
  const token_len = token.end - token.start;
  assert_int_in_range(token_len, 0, Number.POSITIVE_INFINITY);
  assert(token.start < token.end, "token start must be less than token end");
  assert(source.length > token.end, "source must be longer than token end");
  return source.slice(token.start, token.end);
}
