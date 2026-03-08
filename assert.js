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

/**
 * @param {any} a
 * @param {any} b
 * */
export function assert_equal(a, b) {
  const message = `Expected ${a} === ${b}`;
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
 * */
export function assert_u16_equal_hex(a, b) {
  const message = `Expected ${formatU16Hex(a)} === ${formatU16Hex(b)}`;
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
 * @param {any} num
 */
export function assert_address(num) {
  assert_int_in_range(num, 0, 0xfff);
}

/** @param {import("./memory.js").Chip8} chip8
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

/** @param {number} num */
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
