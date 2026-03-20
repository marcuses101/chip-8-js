// @ts-check

import { OP_CODES } from "../chip8-core/OP_CODES.js";
import {
  assert,
  assert_address,
  assert_less_than,
  assert_nibble,
  assert_register_index,
  assert_u16,
  assert_u8,
} from "../utils/assert.js";
import { formatU16Hex, pack_nibbles_u16, unpack_u16 } from "../utils/utils.js";
import { build_tokenizer_state, tokenizer } from "./tokenizer.js";

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
 * @property {number} opcode_count
 * @property {Map<string,number>} label_map
 * @property {Map<number,string>} patch_locations
 * @property {ReportError} report_error
 * @property {import("./tokenizer.js").Token | null} current_token
 * @property {import("./tokenizer.js").Token | null} next_token
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
    opcode_count: 0,
    token_stream,
    report_error,
    label_map: new Map(),
    patch_locations: new Map(),
    current_token: null,
    next_token: null, // support peek
  };
}

/** @param {AssemberState} assembler_state */
function advance(assembler_state) {
  if (
    assembler_state.next_token === null &&
    assembler_state.current_token === null
  ) {
    const token = assembler_state.token_stream.next().value ?? null;
    assert(token !== null, "non null token expected");
    assembler_state.next_token = token;
  }
  const token_iteration = assembler_state.token_stream.next();
  assembler_state.current_token = assembler_state.next_token;
  assembler_state.next_token = token_iteration.value ?? null;
  if (assembler_state.current_token === null) {
    throw new Error("unexpected end of token stream");
  }
  return assembler_state.current_token;
}

/** @param {AssemberState} assembler_state */
function peek(assembler_state) {
  const token = /** @type {import("./tokenizer.js").Token} */ (
    assembler_state.next_token
  );
  assert(token !== null, "Unexpected null token");
  return token;
}

/**
 * @param {AssemberState} assembler_state
 * @param {import("./tokenizer.js").TokenType} expected_type
 * */
function consume(assembler_state, expected_type) {
  const token = advance(assembler_state);
  if (token === null || token.token_type !== expected_type) {
    assembler_state.report_error(token, assembler_state.line_number);
    throw new Error(
      `Unexpected token ${token.token_type} at line ${assembler_state.line_number}. Expected "${expected_type}"`,
    );
  }
  return token;
}
/**
 * @param {AssemberState} assembler_state
 * @returns {number} register_index
 * */
function consume_vreg(assembler_state) {
  const token = consume(assembler_state, "VREG");
  const register_index = token.number_value;
  assert_register_index(register_index);
  return register_index;
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
  return new Error(
    `Unexpected token ${token.token_type} at line ${assembler_state.line_number}`,
  );
}

/** @param {AssemberState} state */
function handle_instruction_ADD(state) {
  switch (peek(state).token_type) {
    case "VREG": {
      const x = consume_vreg(state);
      consume(state, "COMMA");
      switch (peek(state).token_type) {
        case "VREG": {
          const y = consume_vreg(state);
          return pack_nibbles_u16(8, x, y, 0x4);
        }
        case "NUMBER_LITERAL": {
          OP_CODES.ADD;
          var num_token = consume(state, "NUMBER_LITERAL");
          const value = num_token.number_value;
          assert_u16(value);
          return (0x7 << 12) | (x << 8) | value;
        }
        default: {
          throw unexpected_token(state, peek(state));
        }
      }
    }
    case "I": {
      OP_CODES.ADD3;
      consume(state, "I");
      consume(state, "COMMA");
      const x = consume_vreg(state);

      return pack_nibbles_u16(0xf, x, 0x1, 0xe);
    }
    default: {
      throw unexpected_token(state, peek(state));
    }
  }
}

/** @param {AssemberState} state */
function handle_instruction_LD(state) {
  switch (peek(state).token_type) {
    case "VREG": {
      const x = consume_vreg(state);
      consume(state, "COMMA");
      switch (peek(state).token_type) {
        case "NUMBER_LITERAL": {
          const number = consume(state, "NUMBER_LITERAL");
          const val = number.number_value;
          assert_u8(val);
          return (0x6 << 12) | (x << 8) | val;
        }
        case "VREG": {
          const y = consume_vreg(state);
          return pack_nibbles_u16(8, x, y, 0);
        }
        case "DT": {
          consume(state, "DT");
          return pack_nibbles_u16(0xf, x, 0, 7);
        }
        case "READ_K": {
          consume(state, "READ_K");
          return pack_nibbles_u16(0xf, x, 0, 0xa);
        }
        case "LEFT_BRACE": {
          consume(state, "LEFT_BRACE");
          consume(state, "I");
          consume(state, "RIGHT_BRACE");
          return pack_nibbles_u16(0xf, x, 6, 5);
        }
        default: {
          throw unexpected_token(state, peek(state));
        }
      }
    }
    case "I": {
      consume(state, "I");
      consume(state, "COMMA");
      const address = handle_address_token(state);
      return (0xa << 12) | address;
    }
    case "DT": {
      consume(state, "DT");
      consume(state, "COMMA");
      const x = consume_vreg(state);
      return pack_nibbles_u16(0xf, x, 1, 5);
    }
    case "ST": {
      consume(state, "ST");
      consume(state, "COMMA");
      const x = consume_vreg(state);
      return pack_nibbles_u16(0xf, x, 1, 8);
    }
    case "LEFT_BRACE": {
      consume(state, "LEFT_BRACE");
      consume(state, "I");
      consume(state, "RIGHT_BRACE");
      consume(state, "COMMA");
      const x = consume_vreg(state);
      return pack_nibbles_u16(0xf, x, 5, 5);
    }
    default: {
      throw unexpected_token(state, peek(state));
    }
  }
}

/** @param {AssemberState} state */
function handle_instruction_CALL(state) {
  OP_CODES.CALL;
  const address = handle_address_token(state) ?? 0x000;
  return 0x2000 | address;
}

/** @param {AssemberState} state
 * @returns {number} address_or_label*/
function handle_address_token(state) {
  switch (peek(state).token_type) {
    case "IDENT": {
      const ident_token = consume(state, "IDENT");
      const label = ident_token.string_value;
      state.patch_locations.set(state.opcode_count, label);
      return 0x000;
    }
    case "LEFT_BRACE": {
      consume(state, "LEFT_BRACE");
      const address_token = consume(state, "NUMBER_LITERAL");
      const address = address_token.number_value;
      assert_address(address);
      consume(state, "RIGHT_BRACE");
      return address;
    }
    default: {
      throw unexpected_token(state, peek(state));
    }
  }
}

/** @param {AssemberState} state */
function handle_instruction_JP(state) {
  OP_CODES.JP;
  const next_token = peek(state);
  if (next_token.token_type === "VREG") {
    OP_CODES.JP2;
    const register_index = consume_vreg(state);
    assert(register_index === 0, "Only V0 supported");
    consume(state, "COMMA");
    const address = handle_address_token(state) ?? 0x000;
    return 0xb000 | address;
  }
  const address = handle_address_token(state) ?? 0x000;
  return 0x1000 | address;
}

/** @param {AssemberState} state
 * @param {import("./tokenizer.js").Token} current_token
 * @returns {number} opcode
 */
function handle_instruction_line(state, current_token) {
  let opcode = null;
  switch (current_token.token_type) {
    case "INSTR_ADD":
      {
        opcode = handle_instruction_ADD(state);
      }
      break;
    case "INSTR_AND":
      {
        const x = consume_vreg(state);
        consume(state, "COMMA");
        const y = consume_vreg(state);
        opcode = pack_nibbles_u16(8, x, y, 2);
      }
      break;
    case "INSTR_BCD":
      {
        const x = consume_vreg(state);
        opcode = pack_nibbles_u16(0xf, x, 3, 3);
      }
      break;
    case "INSTR_CALL":
      {
        opcode = handle_instruction_CALL(state);
      }
      break;
    case "INSTR_CLS":
      {
        opcode = 0x00e0;
      }
      break;
    case "INSTR_DRW":
      {
        OP_CODES.DRW;
        // Dxyn - DRW Vx, Vy, nibble
        const x = consume_vreg(state);
        consume(state, "COMMA");
        const y = consume_vreg(state);
        consume(state, "COMMA");
        const number_token = consume(state, "NUMBER_LITERAL");
        const n = number_token.number_value;
        assert_nibble(n);
        opcode = pack_nibbles_u16(0xd, x, y, n);
      }
      break;
    case "INSTR_LD":
      {
        opcode = handle_instruction_LD(state);
      }
      break;
    case "INSTR_JP":
      {
        opcode = handle_instruction_JP(state);
      }
      break;
    case "INSTR_OR":
      {
        const x = consume_vreg(state);
        consume(state, "COMMA");
        const y = consume_vreg(state);
        opcode = pack_nibbles_u16(8, x, y, 1);
      }
      break;
    case "INSTR_RET":
      {
        opcode = 0x00ee;
      }
      break;
    case "INSTR_RND":
      {
        OP_CODES.RND;
        const x = consume_vreg(state);
        consume(state, "COMMA");
        const number_token = consume(state, "NUMBER_LITERAL");
        assert_u8(number_token.number_value);
        opcode = (0xc << 12) | (x << 8) | number_token.number_value;
      }
      break;
    case "INSTR_SE":
      {
        OP_CODES.SE;
        const x = consume_vreg(state);
        consume(state, "COMMA");
        const num_token = consume(state, "NUMBER_LITERAL");
        const val = num_token.number_value;
        assert_u8(val);
        opcode = (0x3 << 12) | (x << 8) | val;
      }
      break;
    case "INSTR_SNE":
      {
        OP_CODES.SNE;
        const x = consume_vreg(state);
        consume(state, "COMMA");
        const num_token = consume(state, "NUMBER_LITERAL");
        const val = num_token.number_value;
        assert_u8(val);
        opcode = (0x4 << 12) | (x << 8) | val;
      }
      break;
    case "INSTR_SHL":
      {
        OP_CODES.SHL;
        const x = consume_vreg(state);
        consume(state, "COMMA");
        const y = consume_vreg(state);
        opcode = pack_nibbles_u16(8, x, y, 0xe);
      }
      break;
    case "INSTR_SHR":
      {
        OP_CODES.SHR;
        const x = consume_vreg(state);
        consume(state, "COMMA");
        const y = consume_vreg(state);
        opcode = pack_nibbles_u16(8, x, y, 0x6);
      }
      break;
    case "INSTR_SPR":
      {
        OP_CODES.SPR;
        // Fx29 - LD I set I to the sprite of the xchar x
        var x = consume_vreg(state);
        opcode = pack_nibbles_u16(0xf, x, 2, 9);
      }
      break;
    case "INSTR_SUB":
      {
        const x = consume_vreg(state);
        consume(state, "COMMA");
        const y = consume_vreg(state);
        opcode = pack_nibbles_u16(0x8, x, y, 5);
      }
      break;
    case "INSTR_SUBN":
      {
        const x = consume_vreg(state);
        consume(state, "COMMA");
        const y = consume_vreg(state);
        opcode = pack_nibbles_u16(0x8, x, y, 7);
      }
      break;
    case "INSTR_SYS":
      {
        OP_CODES.SYS;
        const token = consume(state, "NUMBER_LITERAL");
        const num = token.number_value;
        assert_address(num);
        opcode = num;
      }
      break;
    case "INSTR_XOR":
      {
        const x = consume_vreg(state);
        consume(state, "COMMA");
        const y = consume_vreg(state);
        opcode = pack_nibbles_u16(0x8, x, y, 3);
      }
      break;
    default: {
      throw new Error(`${current_token.token_type} not yet handled`);
    }
  }
  assert_u16(opcode);
  state.opcode_count++;
  return /** @type {number} */ (opcode);
}

/**

/**
 * @param {AssemberState} state
 */
export function* assembler(state) {
  while (true) {
    const current_token = advance(state);
    if (current_token.token_type == "EOF") {
      break;
    }
    if (current_token.token_type === "NEWLINE") {
      state.line_number++;
      continue;
    }
    if (current_token.token_type === "IDENT") {
      consume(state, "COLON");
      consume_newline(state);
      assert(
        current_token.string_value.length > 0,
        "non-empty string expected",
      );
      state.label_map.set(current_token.string_value, state.opcode_count);
      // make label
      continue;
    }
    if (current_token.token_type === "DIRECT_BYTE") {
      const number_token = consume(state, "NUMBER_LITERAL");
      const val = number_token.number_value;
      assert_u8(val);
      let output_u16 = val << 8;
      consume_newline(state);
      if (peek(state).token_type === "DIRECT_BYTE") {
        consume(state, "DIRECT_BYTE");
        const number_token = consume(state, "NUMBER_LITERAL");
        const val = number_token.number_value;
        assert_u8(val);
        output_u16 |= val;
      }
      state.opcode_count++;
      yield output_u16;
      continue;
    }
    yield handle_instruction_line(state, current_token);
  }
}

const PROGRAM_MAX = 0xfff - 0x200;

const PLACEHOLDER_BYTES = [
  0x1000, // JP
  0x2000, // CALL
  0xa000, // LD I
];

/** @param {AssemberState} state
 * @param {number[]} opcodes
 * @param {number} base_address
 * */
function resolve_labels(state, opcodes, base_address = 0x200) {
  state.patch_locations.forEach((label, index) => {
    const currentOpcode = opcodes[index];
    if (!PLACEHOLDER_BYTES.includes(currentOpcode)) {
      throw new Error(
        `Unexpected opcode ${formatU16Hex(currentOpcode)}.
          Expected: ${PLACEHOLDER_BYTES.map(formatU16Hex).join(", ")}
    `,
      );
    }
    const proc_start_index = state.label_map.get(label);
    if (typeof proc_start_index == "undefined") {
      throw new Error(`unable to resolve label ${label}`);
    }
    const instruction_nibble = 0xf000 & currentOpcode;
    const address = proc_start_index * 2 + base_address;
    assert_address(address);
    opcodes[index] = instruction_nibble | address;
  });
}

/**
 * @param {string} input
 * @param {number} base_address
 * */
export function assemble_from_string(input, base_address = 0x200) {
  assert_address(base_address);
  const tokenizer_state = build_tokenizer_state(input);
  const token_stream = tokenizer(tokenizer_state);
  const assembler_state = build_assembler_state(token_stream);
  const opcodes = [];
  for (const opcode of assembler(assembler_state)) {
    opcodes.push(opcode);
  }
  resolve_labels(assembler_state, opcodes);
  const program_length = opcodes.length * 2;
  assert_less_than(program_length, PROGRAM_MAX);
  const program = new Uint8Array(program_length);
  for (let i = 0; i < opcodes.length; i++) {
    const opcode = opcodes[i];
    const [first_byte, second_byte] = unpack_u16(opcode);
    program[i * 2] = first_byte;
    program[i * 2 + 1] = second_byte;
  }
  return program;
}
