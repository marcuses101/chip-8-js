// @ts-check

import {
  assert,
  assert_char,
  assert_int_in_range,
  assert_less_than,
} from "../utils/assert.js";
import {
  BINARY_CHARS,
  DEC_CHARS,
  HEX_CHARS,
  is_alpha,
  is_alphanumeric,
  is_digit,
  is_hex_char,
} from "../utils/utils.js";

/** @typedef InstructionToken
 * @type {"INSTR_ADD" | "INSTR_AND" | "INSTR_SUB" | "INSTR_SUBN"| "INSTR_RND" | "INSTR_LD" | "INSTR_RET" | "INSTR_CALL" | "INSTR_BCD" | "INSTR_XOR" | "INSTR_CLS" | "INSTR_JP" | "INSTR_DRW" | "INSTR_SHL" |  "INSTR_SHR" | "INSTR_SYS" | "INSTR_SE" | "INSTR_SNE" | "INSTR_OR" | "INSTR_SPR" }
 */

/** @typedef RegisterToken
 * @type {"VREG" | "PC" | "I" | "DT" | "ST" }
 */

/** @typedef TokenType
 * @type {InstructionToken | RegisterToken | "NEWLINE" | "COMMA" | "EOF" | "NUMBER_LITERAL" | "IDENT" | "RIGHT_BRACE" | "LEFT_BRACE" | "COLON" | "READ_K" | "DIRECT_BYTE" }
 */

/**
 * @typedef Token
 * @type {object}
 * @property {number} start
 * @property {number} end
 * @property {TokenType} token_type
 * @property {number} number_value
 * @property {string} string_value
 */

/** @param {string} char
 * @returns {boolean}
 * */
export function is_ignored(char) {
  assert_char(char);
  return /[^a-zA-Z0-9\n,\[\]#:]/.test(char);
}

/** @param {string} char */
export function parse_hex_char(char) {
  assert(is_hex_char(char), "Expected 0-F character");
  if (is_digit(char)) {
    const value = char.charCodeAt(0) - 48;
    assert_int_in_range(value, 0, 9);
    return value;
  }
  const value = char.toUpperCase().charCodeAt(0) - 55;
  assert_int_in_range(value, 10, 15);
  return value;
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
    number_value: value,
    string_value: "",
    start,
    end,
  };
}

/**
 * @param {TokenizerState} state
 * @param {TokenType} type
 * @param {number} number_value
 * @param {string} string_value
 * @return {Token}
 * */
function make_token(state, type, number_value = 0, string_value = "") {
  return {
    number_value: number_value,
    string_value: string_value,
    start: state.token_start,
    end: state.current_index,
    token_type: type,
  };
}

/**
 * @param {TokenizerState} state
 * @param {number} n
 * @returns {string} char
 * */
function peek(state, n = 0) {
  const char = state.source[state.current_index + n];
  return char;
}
/**
 * @param {TokenizerState} state
 * @returns {string} char */
function advance(state) {
  const char = state.source[state.current_index];
  state.current_index++;
  return char;
}

/**
 * @param {TokenizerState} state
 * @param {string} expected_char
 * @returns {string} char
 * */
function consume(state, expected_char) {
  const char = advance(state);
  if (char !== expected_char) {
    unexpected_char(state, char, state.current_index - 1);
  }
  return char;
}

/**
 * @param {TokenizerState} state
 * @param {string[]} accepted_chars
 * @returns {string} char
 * */
function consume_oneof(state, accepted_chars) {
  const char = advance(state);
  if (!accepted_chars.includes(char)) {
    unexpected_char(state, char, state.current_index - 1);
  }
  return char;
}

/**
 * @param {TokenizerState} state
 * @returns {Token} */
function end(state) {
  return {
    number_value: 0,
    string_value: "",
    token_type: "EOF",
    start: state.source.length,
    end: state.source.length,
  };
}

/**
 * @param {TokenizerState} state
 * @param {string} char
 * @param {number} index
 * */
function unexpected_char(state, char, index) {
  assert_int_in_range(index, 0, state.source.length);
  var line = 1;
  for (let i = 0; i < index; i++) {
    if (state.source[i] === "\n") {
      line++;
    }
  }
  throw new Error(`unexpected chat "${char}" at line ${line} index ${index}`);
}

/**
 * @param {string} source
 * @param {number} [token_start=0]
 * @param {number} [current_index=0]
 * @returns {TokenizerState} state */
export function build_tokenizer_state(
  source,
  current_index = 0,
  token_start = 0,
) {
  return {
    source,
    current_index,
    token_start,
  };
}

/** @typedef TokenStream
 * @type {Generator<Token, undefined, unknown>}
 */

/** @typedef TokenizerState
 * @type {object}
 * @property {string} source
 * @property {number} token_start
 * @property {number} current_index
 */

/**
 * @param {TokenizerState} state
 * @returns {TokenStream}
 * */
export function* tokenizer(state) {
  while (state.current_index < state.source.length) {
    state.token_start = state.current_index;
    const char = advance(state);
    if (typeof char === "undefined") {
      break;
    }
    if (is_ignored(char)) {
      continue;
    }
    if (is_digit(char)) {
      // determine if bin,hex,dec
      const base_indicator = peek(state);
      switch (base_indicator) {
        case "b":
          {
            consume(state, "b");
            let bin_char = peek(state);
            let value = 0;
            while (bin_char === "0" || bin_char === "1") {
              const char_val = bin_char.charCodeAt(0) - 48;
              value = (value << 1) | char_val;
              consume_oneof(state, BINARY_CHARS);
              bin_char = peek(state);
            }
            yield make_token(state, "NUMBER_LITERAL", value);
          }
          break;
        case "x":
          {
            consume(state, "x");
            let hex_char = peek(state);
            let value = 0;
            while (is_hex_char(hex_char)) {
              const char_value = parse_hex_char(hex_char);
              value = value * 16 + char_value;
              consume_oneof(state, HEX_CHARS);
              hex_char = peek(state);
            }
            yield make_token(state, "NUMBER_LITERAL", value);
          }
          break;
        default: {
          let dec_char = peek(state);
          let value = char.charCodeAt(0) - 48;
          while (is_digit(dec_char)) {
            const current_digit = dec_char.charCodeAt(0) - 48;
            value = value * 10 + current_digit;
            consume_oneof(state, DEC_CHARS);
            dec_char = peek(state);
          }
          yield make_token(state, "NUMBER_LITERAL", value);
        }
      }
      continue;
    }
    if (is_alpha(char)) {
      let buffer = char;
      let next_char = peek(state);
      while (is_alphanumeric(next_char)) {
        buffer += next_char;
        advance(state);
        next_char = peek(state);
      }
      yield determine_keyword(state, buffer);
      continue;
    }
    switch (char) {
      case "#":
        {
          let next = advance(state);
          while (next && next !== "\n") {
            next = advance(state);
          }
          if (next === "\n") {
            yield make_token(state, "NEWLINE");
          }
        }
        break;
      case "\n":
        {
          yield make_token(state, "NEWLINE");
        }
        break;
      case ":":
        {
          yield make_token(state, "COLON");
        }
        break;
      case ",":
        {
          yield make_token(state, "COMMA");
        }
        break;
      default: {
        unexpected_char(state, char, state.current_index - 1);
      }
    }
  }
  yield end(state);
}

/**
 * @param {TokenizerState} state
 * @param {string} buffer
 * @returns {Token}
 */
function determine_keyword(state, buffer) {
  switch (buffer) {
    case "ADD": {
      return make_token(state, "INSTR_ADD");
    }
    case "AND": {
      return make_token(state, "INSTR_AND");
    }
    case "BCD": {
      return make_token(state, "INSTR_BCD");
    }
    case "CALL": {
      return make_token(state, "INSTR_CALL");
    }
    case "CLS": {
      return make_token(state, "INSTR_CLS");
    }
    case "DB": {
      return make_token(state, "DIRECT_BYTE");
    }
    case "DRW": {
      return make_token(state, "INSTR_DRW");
    }
    case "JP": {
      return make_token(state, "INSTR_JP");
    }
    case "K": {
      return make_token(state, "READ_K");
    }
    case "LD": {
      return make_token(state, "INSTR_LD");
    }
    case "OR": {
      return make_token(state, "INSTR_OR");
    }
    case "RET": {
      return make_token(state, "INSTR_RET");
    }
    case "RND": {
      return make_token(state, "INSTR_RND");
    }
    case "SE": {
      return make_token(state, "INSTR_SE");
    }
    case "SNE": {
      return make_token(state, "INSTR_SNE");
    }
    case "SHL": {
      return make_token(state, "INSTR_SHL");
    }
    case "SPR": {
      return make_token(state, "INSTR_SPR");
    }
    case "SHR": {
      return make_token(state, "INSTR_SHR");
    }
    case "SUB": {
      return make_token(state, "INSTR_SUB");
    }
    case "SUBN": {
      return make_token(state, "INSTR_SUBN");
    }
    case "SYS": {
      return make_token(state, "INSTR_SYS");
    }
    case "XOR": {
      return make_token(state, "INSTR_XOR");
    }
    case "I": {
      return make_token(state, "I");
    }
    case "PC": {
      return make_token(state, "PC");
    }
    case "DT": {
      return make_token(state, "DT");
    }
    case "ST": {
      return make_token(state, "ST");
    }
    case "V0": {
      return make_token(state, "VREG", 0);
    }
    case "V1": {
      return make_token(state, "VREG", 1);
    }
    case "V2": {
      return make_token(state, "VREG", 2);
    }
    case "V3": {
      return make_token(state, "VREG", 3);
    }
    case "V4": {
      return make_token(state, "VREG", 4);
    }
    case "V5": {
      return make_token(state, "VREG", 5);
    }
    case "V6": {
      return make_token(state, "VREG", 0x6);
    }
    case "V7": {
      return make_token(state, "VREG", 0x7);
    }
    case "V8": {
      return make_token(state, "VREG", 0x8);
    }
    case "V9": {
      return make_token(state, "VREG", 0x9);
    }
    case "VA": {
      return make_token(state, "VREG", 0xa);
    }
    case "VB": {
      return make_token(state, "VREG", 0xb);
    }
    case "VC": {
      return make_token(state, "VREG", 0xc);
    }
    case "VD": {
      return make_token(state, "VREG", 0xd);
    }
    case "VE": {
      return make_token(state, "VREG", 0xe);
    }
    case "VF": {
      return make_token(state, "VREG", 0xf);
    }
    default: {
      return make_token(state, "IDENT", 0, buffer);
    }
  }
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
