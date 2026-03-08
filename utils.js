//@ts-check
import { assert_address, assert_int_in_range, assert_u16 } from "./assert.js";

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

export const HAPPY_FACE = /**@type {Uint8Array} */ (
  Uint8Array.fromHex("3C4281A581A599423C")
);
