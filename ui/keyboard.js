// @ts-check

import { assert_int_in_range, assert_u16 } from "../utils/assert.js";
import { buildU16, formatU8Hex } from "../utils/utils.js";

export const STANDARD_KEYMAP = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  A: 0xa,
  B: 0xb,
  C: 0xc,
  D: 0xd,
  E: 0xe,
  F: 0xf,
};
export const ALT_KEYMAP = {
  1: 1,
  2: 2,
  3: 3,
  Q: 4,
  W: 5,
  E: 6,
  A: 7,
  S: 8,
  D: 9,
  Z: 0xa,
  X: 0,
  C: 0xb,
  4: 0xc,
  R: 0xd,
  F: 0xe,
  V: 0xf,
};

/**
 * @param {number} current_keyboard_state
 * @param {number} key_number 0-0xF
 * @returns {number} */
export function handle_keyup(current_keyboard_state, key_number) {
  assert_int_in_range(key_number, 0, 0xf);
  const shift = 15 - key_number;
  const mask = (1 << shift) ^ 0xffff;
  return current_keyboard_state & mask;
}
/**
 * @param {number} current_keyboard_state
 * @param {number} key_number 0-0xF
 * @returns {number} */
export function handle_keydown(current_keyboard_state, key_number) {
  assert_int_in_range(key_number, 0, 0xf);
  const shift = 15 - key_number;
  const bit_mask = 1 << shift;
  return current_keyboard_state | bit_mask;
}

/**
 * @param {object} keymap
 * @returns {[import("../utils/utils.js").U16, ()=>void]}*/
export function init_keyboard(keymap = STANDARD_KEYMAP) {
  const keyboard_state = buildU16();

  /** @param {KeyboardEvent} e */
  function handle_keyboard(e) {
    if (e.key.length !== 1) {
      return;
    }
    const key = e.key.toUpperCase();
    const number = keymap[key];
    if (
      typeof number != "number" ||
      Number.isNaN(number) ||
      number < 0 ||
      number > 0xf
    ) {
      console.debug("unsupported key: ", key);
      console.debug(keymap);
      return;
    }
    if (e.type != "keyup" && e.type != "keydown") {
      return;
    }
    const fn = e.type === "keyup" ? handle_keyup : handle_keydown;
    const current_state = keyboard_state.get();
    const new_state = fn(current_state, number);
    assert_u16(new_state);
    keyboard_state.set(new_state);
  }

  function cleanup() {
    document.removeEventListener("keyup", handle_keyboard);
    document.removeEventListener("keydown", handle_keyboard);
  }
  document.addEventListener("keyup", handle_keyboard);
  document.addEventListener("keydown", handle_keyboard);
  return [keyboard_state, cleanup];
}
