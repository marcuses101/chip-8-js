// @ts-check
import {
  formatU16Binary,
  formatU16Hex,
  formatU8Binary,
  formatU8Hex,
} from "./utils.js";

/**
 * @param {boolean} expression
 * @param {string} message
 */
export function assert(expression, message) {
  if (expression) return;
  throw new Error(message);
}

/** @param {string} char */
export function assert_char(char) {
  assert(
    typeof char === "string" && char.length === 1,
    `expected char, received "${char}"(${typeof char})`,
  );
}

/**
 * @param {any} a
 * @param {any} b
 * @param {string} optional_message
 * */
export function assert_equal(a, b, optional_message = "") {
  let message = `Expected ${a}(${typeof a}) === ${b}(${typeof b})`;
  if (optional_message) {
    message = `${message}; ${optional_message}`;
  }
  assert(a === b, message);
}

/**
 * @param {any} a
 * @param {any} b
 * */
export function assert_u8_equal_binary(a, b) {
  assert_u8(a);
  assert_u8(b);
  const message = `Expected ${formatU8Binary(a)} === ${formatU8Binary(b)}`;
  assert(a === b, message);
}

/**
 * @param {any} a
 * @param {any} b
 * */
export function assert_u8_equal_hex(a, b) {
  const message = `Expected ${formatU8Hex(a)} === ${formatU8Hex(b)}`;
  assert(a === b, message);
}

/**
 * @param {any} a
 * @param {any} b
 * @param {string} optional_message
 * */
export function assert_u16_equal_hex(a, b, optional_message = "") {
  let message = `Expected ${formatU16Hex(a)} === ${formatU16Hex(b)}`;
  if (optional_message) {
    message += `; ${optional_message}`;
  }
  assert(a === b, message);
}

/**
 * @param {any} a
 * @param {any} b
 * */
export function assert_u16_equal_binary(a, b) {
  assert_u16(a);
  assert_u16(b);
  const message = `Expected ${formatU16Binary(a)} === ${formatU16Binary(b)}`;
  assert(a === b, message);
}

/**
 * @param {any} num
 * @param {number} start
 * @param {number} end
 */
export function assert_int_in_range(num, start, end) {
  let range_start = start;
  let range_end = end;
  if (range_start > range_end) {
    [range_start, range_end] = [end, start];
  }
  assert(
    Number.isSafeInteger(num) && num >= range_start && num <= range_end,
    `input must be and int between ${range_start} and ${range_end}. Received: ${num}`,
  );
}
/**
 * @param {number} a
 * @param {number} b
 */
export function assert_less_than(a, b) {
  assert(
    Number.isSafeInteger(a) && Number.isSafeInteger(b) && a < b,
    `a must be an integer less than b`,
  );
}

/**
 * @param {any} num
 */
export function assert_address(num) {
  assert_int_in_range(num, 0, 0xfff);
}

/** @param {import("../chip8-core/chip8.js").Chip8} chip8
 * @param {number} address
 * */
export function assert_program_counter(chip8, address) {
  assert(
    chip8.program_counter.get() % 2 === 0,
    "program counter should always be even",
  );
  assert_u16(chip8.program_counter.get());
  assert_u16(address);
  const message = `Expected program_counter = ${formatU16Hex(address)}, Actually = ${formatU16Hex(chip8.program_counter.get())}`;
  assert(chip8.program_counter.get() == address, message);
}

/** @param {any} num */
export function assert_register_index(num) {
  assert_int_in_range(num, 0, 0xf);
}

/** @param {any} num */
export function assert_u8(num) {
  assert_int_in_range(num, 0, 0xff);
}
/** @param {any} num */
export function assert_nibble(num) {
  assert_int_in_range(num, 0, 0xf);
}

/** @param {any} num */
export function assert_u16(num) {
  assert_int_in_range(num, 0, 0xffff);
}

/**
 * @param {object} el
 * @param {object} class_def
 */
export function assert_instanceof(el, class_def) {
  if (el instanceof class_def) {
    return;
  }
  throw new Error(
    `Expected ${el}(${typeof el}) to be instance of ${class_def?.name ?? "UNKNOWN"}`,
  );
}

/**
 * @param {import("../assembler/tokenizer.js").Token | undefined} token_a
 * @param {import("../assembler/tokenizer.js").Token} token_b
 */
export function assert_token_equal(token_a, token_b) {
  if (typeof token_a === "undefined") {
    throw new Error("token undefined");
  }
  assert_equal(token_a.start, token_b.start);
  assert_equal(token_a.end, token_b.end);
  assert_equal(token_a.token_type, token_b.token_type);
  assert_equal(token_a.number_value, token_b.number_value);
}
