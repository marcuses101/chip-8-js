// @ts-check

import {
  assert_instanceof,
  assert_int_in_range,
  assert_u16,
} from "../utils/assert.js";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "../chip8-core/chip8.js";
import {
  formatOpcodeEnum,
  OPCODE_METADATA,
  decode_opcode,
} from "../chip8-core/opcode_parser.js";
import { get_current_opcode } from "../chip8-core/operations.js";
import { init_sound_chip, sound_off, sound_on } from "./sound_chip.js";
import {
  buildU16,
  formatU16Hex,
  formatU8Binary,
  formatU8Hex,
} from "../utils/utils.js";

const PIXEL_COUNT = SCREEN_WIDTH * SCREEN_HEIGHT;
const FRAME_BUDGET_MS = 10;

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
    console.debug("Key received: %s", key);
    console.debug(
      "Decoded: " + typeof number === "number" ? formatU8Hex(number) : "null",
    );
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

/**
 * @typedef UI
 * @type {object}
 * @property {HTMLDivElement} chip8ScreenEl
 * @property {HTMLDivElement} programSectionEl
 * @property {HTMLTableElement} registerTableEl
 * @property {HTMLTableElement} ipPcTableEl
 * @property {HTMLTableElement} stackTableEl
 * @property {HTMLTableElement} instructionTableEl
 * @property {HTMLTableRowElement} ip_row
 * @property {HTMLTableRowElement} pc_row
 * @property {HTMLTableRowElement} sound_timer_row
 * @property {HTMLTableRowElement} delay_timer_row
 * @property {Uint8Array} previousFrame
 * @property {import("./sound_chip.js").SoundChip} sound_chip
 * @property {import("../utils/utils.js").U16} keyboard
 * @property {()=>void} keyboard_cleanup
 */

/**
 * @returns {UI}
 * */
export function init_browser_ui() {
  const [keyboard, keyboard_cleanup] = init_keyboard(ALT_KEYMAP);
  const chip8ScreenEl = document.getElementById("screen");
  assert_instanceof(chip8ScreenEl, HTMLDivElement);
  for (let i = 0; i < PIXEL_COUNT; i++) {
    const child = document.createElement("div");
    child.classList.add("pixel");
    chip8ScreenEl?.appendChild(child);
  }
  const registerTableEl = document.querySelector("#registers table");
  assert_instanceof(registerTableEl, HTMLTableElement);

  const stackTableEl = document.querySelector("#stack table");
  assert_instanceof(stackTableEl, HTMLTableElement);

  const ipPcTableEl = document.querySelector("#ip-pc table");
  assert_instanceof(ipPcTableEl, HTMLTableElement);

  const instructionTableEl = /** @type {HTMLTableElement} */ (
    document.querySelector("#instruction table")
  );
  assert_instanceof(instructionTableEl, HTMLTableElement);

  const programSectionEl = document.querySelector("#program pre");

  // @ts-ignore
  var ip_row = ipPcTableEl.querySelector("#ip-row");
  assert_instanceof(ip_row, HTMLTableRowElement);
  // @ts-ignore
  var pc_row = ipPcTableEl.querySelector("#pc-row");
  assert_instanceof(pc_row, HTMLTableRowElement);
  // @ts-ignore
  var sound_timer_row = ipPcTableEl.querySelector("#sound-timer-row");
  assert_instanceof(sound_timer_row, HTMLTableRowElement);
  // @ts-ignore
  var delay_timer_row = ipPcTableEl.querySelector("#delay-timer-row");
  assert_instanceof(delay_timer_row, HTMLTableRowElement);
  return {
    // @ts-ignore
    chip8ScreenEl,
    previousFrame: new Uint8Array(PIXEL_COUNT / 8),
    // @ts-ignore
    registerTableEl,
    // @ts-ignore
    stackTableEl,
    // @ts-ignore
    ipPcTableEl,
    instructionTableEl,
    // @ts-ignore
    ip_row,
    // @ts-ignore
    pc_row,
    // @ts-ignore
    sound_timer_row,
    // @ts-ignore
    delay_timer_row,
    //@ts-ignore
    programSectionEl,
    keyboard,
    keyboard_cleanup,
    sound_chip: init_sound_chip(),
  };
}

/**
 * @param {UI} ui
 * @param {Uint8Array} program_bytes
 */
export function display_program(ui, program_bytes) {
  ui.programSectionEl.innerText = format_program(program_bytes, 0x200);
  ui.programSectionEl.dataset.initialized = "true";
}

/**
 * @param row {HTMLTableRowElement} row
 * @param value {number} value
 * */
// @ts-ignore
// @ts-ignore
function update_row_2(row, value) {
  var new_value_string = value.toString();
  if (row.dataset.value === new_value_string) {
    return;
  }
  row.dataset.value = new_value_string;
  // @ts-ignore
  row.children[1].innerText = formatU16Hex(value);
  // @ts-ignore
  row.children[2].innerText = value.toString(10).padStart(4, "0");
}

/**
 * @param row {HTMLTableRowElement} row
 * @param value {number} value
 * */
// @ts-ignore
// @ts-ignore
function update_row_3(row, value) {
  var new_value_string = value.toString();
  if (row.dataset.value === new_value_string) {
    return;
  }
  row.dataset.value = new_value_string;
  // @ts-ignore
  row.children[1].innerText = formatU8Binary(value);
  // @ts-ignore
  row.children[2].innerText = formatU8Hex(value);
  // @ts-ignore
  row.children[3].innerText = value.toString(10).padStart(3, "0");
}

/**
 * @param {UI} ui
 * @param {import("../chip8-core/chip8.js").Chip8} chip8
 */
export function update_ui(chip8, ui) {
  const timestamp = performance.now();
  if (chip8.sound_timer.get() > 0) {
    sound_on(ui.sound_chip);
  } else {
    sound_off(ui.sound_chip);
  }
  // HANDLE REGISTERS
  var register_table_body = ui.registerTableEl.querySelector("tbody");
  chip8.registers.forEach((val, index) => {
    var row = /** @type {HTMLTableRowElement}*/ (
      register_table_body?.children[index]
    );
    assert_instanceof(row, HTMLTableRowElement);
    update_row_3(row, val);
  });
  const program_counter = chip8.program_counter.get();

  update_row_2(ui.ip_row, chip8.index_register.get());
  update_row_2(ui.pc_row, program_counter);
  update_row_2(ui.sound_timer_row, chip8.sound_timer.get());
  update_row_2(ui.delay_timer_row, chip8.sound_timer.get());

  // HANDLE STACK
  const stack_pointer_index = chip8.stack_pointer.get();
  const stackTableBody = ui.stackTableEl.querySelector("tbody");
  for (let i = 0; i < 16; i++) {
    const row = stackTableBody?.children[15 - i];
    assert_instanceof(row, HTMLTableRowElement);
    const is_stack_pointer = i === stack_pointer_index;
    // @ts-ignore
    row.classList.toggle("stack-pointer", is_stack_pointer);
    // @ts-ignore
    row.children[0].innerText = is_stack_pointer
      ? "> " + formatU16Hex(chip8.stack[i])
      : formatU16Hex(chip8.stack[i]);
  }

  const instructionBody = /** @type {HTMLElement} */ (
    ui.instructionTableEl.querySelector("tbody")
  );
  assert_instanceof(instructionBody, HTMLElement);
  const opcode = get_current_opcode(chip8);
  const opcode_enum = decode_opcode(opcode);
  instructionBody.children[0].children[0].innerText =
    formatOpcodeEnum(opcode_enum);
  instructionBody.children[1].children[0].innerText = formatU16Hex(opcode);
  instructionBody.children[2].children[0].innerText =
    OPCODE_METADATA[opcode_enum]?.pattern ?? "UNKN";
  instructionBody.children[3].children[0].innerText =
    OPCODE_METADATA[opcode_enum]?.description.slice(0, 16) ?? "unknown";

  // HANDLE SCREEN
  const cells = ui.chip8ScreenEl.children;
  for (let i = 0; i < chip8.frame_buffer.length; i++) {
    const current_block = chip8.frame_buffer[i];
    const previous_block = ui.previousFrame[i];
    const delta = current_block ^ previous_block;
    ui.previousFrame[i] = current_block;
    if (delta === 0) {
      continue;
    }
    for (let j = 0; j < 8; j++) {
      const should_toggle = (delta >> (7 - j)) & 1;
      if (should_toggle) {
        const cell = cells[i * 8 + j];
        assert_instanceof(cell, HTMLDivElement);
        cell.classList.toggle("on");
      }
    }
  }
  const execution_time = performance.now() - timestamp;
  // console.debug(`update_ui():  ${execution_time.toFixed(2)}ms`);
  if (execution_time > FRAME_BUDGET_MS) {
    console.error(
      `Exceeded frame budget. Current: ${execution_time}ms, Max: ${FRAME_BUDGET_MS}ms`,
    );
  }
}

/** @param {Uint8Array} rom
 * @param {number} base_address
 * @param {number} offset
 * @returns {string}
 * */
export function format_program(rom, base_address, offset = 0) {
  let lines = [];
  for (let i = 0; i < rom.length; i += 8) {
    const address = formatU16Hex(i + base_address);
    const ops = [];
    for (let j = 0; j < 8 && i + j < rom.length; j += 2) {
      let index = i + j;
      const val1 = rom[index + offset];
      const val2 = rom[index + offset + 1];
      const opcode = (val1 << 8) | val2;
      const opcode_enum = decode_opcode(opcode);
      ops.push(
        `${opcode.toString(16).padStart(4, "0").toUpperCase()} ${formatOpcodeEnum(opcode_enum).padEnd(8)}`,
      );
    }
    lines.push(`${address} |   ${ops.join(" ")}`);
  }
  return lines.join("\n");
}
