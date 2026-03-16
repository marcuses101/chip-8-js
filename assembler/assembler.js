// @ts-check

import {
  assert_equal,
  assert_register_index,
  assert_u8,
} from "../utils/assert.js";

/**
 * @typedef OpcodeStream
 * @type {Generator<number, void, unknown>}
 */

/**
 * @param {import("./tokenizer.js").Token | null} token
 * @param {number} line_number
 */
function default_error_reporter(token, line_number) {
  if (token === null) {
    console.error(`unexpected null at line ${line_number}`);
    return;
  }
  console.error(`unexpected token ${token.token_type} at line ${line_number}`);
}

/** @typedef ReportError
 * @type {(token: import("./tokenizer.js").Token | null, line_number: number)=>void}
 */

/** @typedef AssemberState
 * @type {object}
 * @property {Generator<import("./tokenizer.js").Token,void,unknown>} token_stream
 * @property {number} line_number
 * @property {ReportError} report_error
 * @property {import("./tokenizer.js").Token | null} current_token
 */

/**
 * @param {Generator<import("./tokenizer.js").Token,void,unknown>} token_stream
 * @param {ReportError} report_error
 * @returns {AssemberState}
 */
export function build_assembler_state(
  token_stream,
  report_error = default_error_reporter,
) {
  return {
    line_number: 1,
    token_stream,
    report_error,
    current_token: null,
  };
}

/** @param {AssemberState} assembler_state */
function advance(assembler_state) {
  const token_iteration = assembler_state.token_stream.next();
  if (token_iteration.done) {
    assembler_state.current_token = null;
    throw new Error("unexpected end of inputs");
  }
  assembler_state.current_token = token_iteration.value;
  return assembler_state.current_token;
}

/**
 * @param {AssemberState} assembler_state
 * @param {import("./tokenizer.js").TokenType} expected_type
 * */
function consume(assembler_state, expected_type) {
  const token = advance(assembler_state);
  if (token === null || token.token_type !== expected_type) {
    assembler_state.report_error(token, assembler_state.line_number);
    throw new Error("unexpected token");
  }
  return token;
}

/**
 * @param {AssemberState} assembler_state
 * */
function consume_newline(assembler_state) {
  consume(assembler_state, "NEWLINE");
  assembler_state.line_number++;
}

/**
 * @param {AssemberState} assembler_state
 * @param {import("./tokenizer.js").Token} token */
function unexpected_token(assembler_state, token) {
  throw new Error(
    `Unexpected token ${token.token_type} at line ${assembler_state.line_number}`,
  );
}

/** @param {import("./tokenizer.js").Token} token
 * @param {import("./tokenizer.js").TokenType} token_type} */
function assert_token_type(token, token_type) {
  assert_equal(token.token_type, token_type);
}

/**

/**
 * @param {AssemberState} assembler_state
 */
export function* assembler(assembler_state) {
  while (true) {
    const current_token = advance(assembler_state);
    if (current_token.token_type == "EOF") {
      break;
    }
    if (current_token.token_type === "NEWLINE") {
      assembler_state.line_number++;
      continue;
    }
    // we expect non-newlines tokens to be instructions
    switch (current_token.token_type) {
      case "INSTR_LD":
        {
        }
        break;
      case "INSTR_ADD":
        {
          const first_operand = advance(assembler_state);
          consume(assembler_state, "COMMA");
          const second_operand = advance(assembler_state);
          consume_newline(assembler_state);
          switch (first_operand.token_type) {
            case "VREG":
              {
                switch (second_operand.token_type) {
                  case "VREG":
                    {
                      const register_index = first_operand.value;
                      assert_register_index(register_index);
                      const register_index_2 = second_operand.value;
                      assert_register_index(register_index_2);
                      yield (0x8 << 12) |
                        (register_index << 8) |
                        (register_index_2 << 4) |
                        4;
                    }
                    break;
                  case "NUMBER_LITERAL":
                    {
                      const register_index = first_operand.value;
                      assert_register_index(register_index);
                      const value = second_operand.value;
                      assert_u8(value);
                      yield (0x7 << 12) | (register_index << 8) | value;
                    }
                    break;
                  default: {
                    unexpected_token(assembler_state, second_operand);
                  }
                }
              }
              break;
            case "I":
              {
                assert_token_type(second_operand, "VREG");
                const register_index = second_operand.value;
                assert_register_index(register_index);
                yield (0xf << 12) | (register_index << 8) | 0x1e;
              }
              break;
            default: {
              unexpected_token(assembler_state, first_operand);
            }
          }
        }
        break;
      default: {
        throw new Error("not yet handled");
      }
    }
  }
}
