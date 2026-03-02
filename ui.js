// @ts-check

import { assert_instanceof } from "./assert.js";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "./memory.js";
import {
  formatAddress,
  formatU16Hex,
  formatU8Binary,
  formatU8Hex,
} from "./utils.js";

const PIXEL_COUNT = SCREEN_WIDTH * SCREEN_HEIGHT;
const FRAME_BUDGET_MS = 10;

/**
 * @typedef UI
 * @type {object}
 * @property {HTMLDivElement} chip8ScreenEl
 * @property {HTMLTableElement} registerTableEl
 * @property {HTMLTableElement} ipPcTableEl
 * @property {HTMLTableElement} stackTableEl
 * @property {Uint8Array} previousFrame
 */

/**
 * @returns {UI}
 * */
export function init_browser_ui() {
  const chip8ScreenEl = document.getElementById("screen");
  assert_instanceof(chip8ScreenEl, HTMLDivElement);
  for (let i = 0; i < PIXEL_COUNT; i++) {
    const child = document.createElement("div");
    child.classList.add("pixel");
    chip8ScreenEl?.appendChild(child);
  }
  const registerTableEl = document.querySelector("#registers table");
  assert_instanceof(chip8ScreenEl, HTMLDivElement);

  const stackTableEl = document.querySelector("#stack table");
  assert_instanceof(chip8ScreenEl, HTMLDivElement);

  const ipPcTableEl = document.querySelector("#ip-pc table");
  assert_instanceof(chip8ScreenEl, HTMLDivElement);
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
  };
}

/**
 * @param {UI} ui
 * @param {import("./memory.js").Chip8} chip8
 */
export function update_ui(chip8, ui) {
  const timestamp = performance.now();
  // HANDLE REGISTERS
  var tableBody = ui.registerTableEl.querySelector("tbody");
  chip8.registers.forEach((val, index) => {
    var row = tableBody?.children[index]; //offset or I and PC
    assert_instanceof(row, HTMLTableRowElement);
    // @ts-ignore
    row.children[1].innerHTML = formatU8Binary(val);
    // @ts-ignore
    row.children[2].innerHTML = formatU8Hex(val);
    // @ts-ignore
    row.children[3].innerHTML = val;
  });

  var ip_row = ui.ipPcTableEl.querySelector("#ip-row");
  assert_instanceof(ip_row, HTMLTableRowElement);
  // @ts-ignore
  ip_row.children[1].innerHTML = formatU16Hex(chip8.index_register.get());
  // @ts-ignore
  ip_row.children[2].innerHTML = chip8.index_register.get();

  var pc_row = ui.ipPcTableEl.querySelector("#pc-row");
  assert_instanceof(pc_row, HTMLTableRowElement);
  // @ts-ignore
  pc_row.children[1].innerHTML = formatU16Hex(chip8.program_counter.get());
  // @ts-ignore
  pc_row.children[2].innerHTML = chip8.program_counter.get();

  // HANDLE STACK
  const stack_pointer_index = chip8.stack_pointer.get();
  const stackTableBody = ui.stackTableEl.querySelector("tbody");
  for (let i = 0; i < 16; i++) {
    const row = stackTableBody?.children[16 - i];
    assert_instanceof(row, HTMLTableRowElement);
    const is_stack_pointer = i === stack_pointer_index;
    // @ts-ignore
    row.classList.toggle("stack-pointer", is_stack_pointer);
    // @ts-ignore
    row.children[0].innerHTML = is_stack_pointer
      ? "> " + formatU16Hex(chip8.stack[i])
      : formatU16Hex(chip8.stack[i]);
  }

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
  console.debug(`update_ui():  ${execution_time.toFixed(2)}ms`);
  if (execution_time > FRAME_BUDGET_MS) {
    throw new Error(
      `Exceeded frame budget. Current: ${execution_time}ms, Max: ${FRAME_BUDGET_MS}ms`,
    );
  }
}
