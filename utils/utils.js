//@ts-check
import {
  assert_address,
  assert_char,
  assert_int_in_range,
  assert_nibble,
  assert_u16,
  assert_u8,
} from "./assert.js";

/**
 * @typedef U8
 * @property {Uint8Array} _buffer
 * @property {function():number} get
 * @property {function(number):void} set
 */
/**
 * @typedef U16
 * @property {Uint16Array} _buffer
 * @property {function():number} get
 * @property {function(number):void} set
 */

/** @returns {U8} */
export function buildU8() {
  const buffer = new Uint8Array(1);
  const get = () => buffer[0];
  /** @param {number} val */
  const set = (val) => {
    assert_int_in_range(val, 0, 0xff);
    buffer[0] = val;
  };

  return {
    _buffer: buffer,
    get,
    set,
  };
}

/** @returns {U16} */
export function buildU16() {
  const buffer = new Uint16Array(1);
  const get = () => buffer[0];
  /** @param {number} val */
  const set = (val) => {
    assert_int_in_range(val, 0, 0xffff);
    buffer[0] = val;
  };

  return {
    _buffer: buffer,
    get,
    set,
  };
}

/**
 * @param {number} num
 * @param {number} min
 * @param {number} max
 * */
export function clamp(num, min, max) {
  if (num < min) {
    return min;
  }
  if (num > max) {
    return max;
  }
  return num;
}

/** @param {any} val */
export function formatU8Binary(val) {
  assert_u16(val);
  return `0b${val.toString(2).padStart(8, "0")}`;
}

/** @param {any} val */
export function formatU8Hex(val) {
  assert_u16(val);
  return `0x${val.toString(16).padStart(2, "0").toUpperCase()}`;
}

/** @param {any} val */
export function formatU16Hex(val) {
  assert_u16(val);
  return `0x${val.toString(16).padStart(4, "0").toUpperCase()}`;
}

/** @param {any} val */
export function formatU16Binary(val) {
  assert_u16(val);
  return `0b${val.toString(2).padStart(16, "0").toUpperCase()}`;
}

/** @param {any} val */
export function formatAddress(val) {
  assert_address(val);
  return `0x${val.toString(16).padStart(3, "0").toUpperCase()}`;
}

export function random_u8() {
  return Math.floor(Math.random() * 256);
}

/** @param {number} byte_a
 * @param {number} byte_b
 */
export function pack_u16(byte_a, byte_b) {
  assert_u8(byte_a);
  assert_u8(byte_b);
  const u16 = (byte_a << 8) | byte_b;
  assert_u16(u16);
  return u16;
}

/**
 * @param {number} a
 * @param {number} b
 * @param {number} c
 * @param {number} d
 */
export function pack_nibbles_u16(a, b, c, d) {
  assert_nibble(a);
  assert_nibble(b);
  assert_nibble(c);
  assert_nibble(d);
  return (a << 12) | (b << 8) | (c << 4) | d;
}

/**
 * @param {number} u16
 */
export function unpack_u16(u16) {
  assert_u16(u16);
  const first_byte = (0xff00 & u16) >> 8;
  assert_u8(first_byte);
  const second_byte = 0xff & u16;
  assert_u8(second_byte);
  return [first_byte, second_byte];
}

export const BINARY_CHARS = ["0", "1"];
export const DEC_CHARS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
export const HEX_CHARS = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
];

/** @param {string} char*/
function charCode(char) {
  assert_char(char);
  return char.charCodeAt(0);
}

/** @param {string} char */
export function is_digit(char) {
  if (typeof char !== "string") {
    return false;
  }
  assert_char(char);
  const code = char.charCodeAt(0);
  return charCode("0") <= code && code <= charCode("9");
}

/** @param {string} char */
export function is_alpha(char) {
  assert_char(char);
  const code = char.charCodeAt(0);
  return (
    (charCode("a") <= code && code <= charCode("z")) ||
    (charCode("A") <= code && code <= charCode("Z"))
  );
}

/** @param {string | undefined} char */
export function is_alphanumeric(char) {
  if (typeof char !== "string") {
    return false;
  }
  return is_alpha(char) || is_digit(char);
}

/** @param {string} char */
export function is_hex_char(char) {
  assert_char(char);
  return /[0-9a-fA-F]/.test(char);
}
