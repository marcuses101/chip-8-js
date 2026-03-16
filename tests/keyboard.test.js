//@ts-check
import { assert_u16_equal_binary } from "../utils/assert.js";
import { handle_keydown, handle_keyup } from "../ui.js";

export function handles_keyup_properly() {
  let keyboard_state = 0b1111_1111_1111_1111;
  keyboard_state = handle_keyup(keyboard_state, 0);
  assert_u16_equal_binary(keyboard_state, 0b0111_1111_1111_1111);
  keyboard_state = handle_keyup(keyboard_state, 0xf);
  assert_u16_equal_binary(keyboard_state, 0b0111_1111_1111_1110);
}

export function handles_keydown_properly() {
  let keyboard_state = 0b0000_0000_0000_0000;
  keyboard_state = handle_keydown(keyboard_state, 0);
  assert_u16_equal_binary(keyboard_state, 0b1000_0000_0000_0000);
  keyboard_state = handle_keydown(keyboard_state, 0); // same press, shouldn't change;
  assert_u16_equal_binary(keyboard_state, 0b1000_0000_0000_0000);
  keyboard_state = handle_keydown(keyboard_state, 4); // new press, should be both pressed;
  assert_u16_equal_binary(keyboard_state, 0b1000_1000_0000_0000);
}
