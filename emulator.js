// @ts-check
import { buildChip8 } from "./chip8-core/chip8.js";
import {
  cycle,
  decrement_timers,
  handle_keyboard_input,
} from "./chip8-core/operations.js";
import { load_font } from "./chip8-core/sprites.js";
import { display_program } from "./ui/ui.js";
import { assert_address } from "./utils/assert.js";

const CYCLES_HZ = 700;
const CYCLE_MS = 1000 / CYCLES_HZ;
const TIMER_RATIO = 700 / 60;
const TIMER_HZ = CYCLES_HZ / TIMER_RATIO;
const CYCLES_PER_TIMER = Math.floor(CYCLES_HZ / TIMER_HZ);

/**
 * @typedef UiCallback
 * @type {(chip8: import("./chip8-core/chip8.js").Chip8)=>void}
 */

/**
 * @typedef KeyboardCallback
 * @type {()=>number}
 */

/**
 * @typedef Emulator
 * @type {object}
 * @property {boolean} is_playing
 * @property {number | null} timestamp
 * @property {import("./chip8-core/chip8.js").Chip8} chip8
 * @property {UiCallback} ui_callback
 * @property {KeyboardCallback} keyboard_callback
 * @property {(callback:any)=>void} req_frame
 * @property {Uint8Array} current_program
 * */

/**
 * @param {UiCallback} ui_callback
 * @param {KeyboardCallback} keyboard_callback
 * @param {(callback:any)=>void} req_frame
 * @returns {Emulator} */
export function build_emulator(ui_callback, keyboard_callback, req_frame) {
  return {
    chip8: buildChip8(),
    timestamp: null,
    is_playing: false,
    ui_callback,
    keyboard_callback,
    req_frame,
    current_program: new Uint8Array(),
  };
}

/**
 * @param {Emulator} emulator
 * @param {number} timestamp
 * */
function loop(emulator, timestamp) {
  /** @type {FrameRequestCallback} */
  const loop_callback = (new_timestamp) => {
    loop(emulator, new_timestamp);
  };
  if (!emulator.is_playing) {
    return;
  }
  if (emulator.timestamp === null) {
    emulator.timestamp = timestamp;
    emulator.req_frame(loop_callback);
    return;
  }
  const new_timestamp = timestamp;
  let delta = new_timestamp - emulator.timestamp;
  emulator.timestamp = new_timestamp;
  while (delta > CYCLE_MS) {
    delta -= CYCLE_MS;
    if (emulator.chip8.cycle_count % CYCLES_PER_TIMER === 0) {
      decrement_timers(emulator.chip8);
    }
    handle_keyboard_input(emulator.chip8, emulator.keyboard_callback());
    cycle(emulator.chip8);
  }
  emulator.ui_callback(emulator.chip8);
  emulator.req_frame(loop_callback);
}

/** @param {Emulator} emulator */
export function play(emulator) {
  /** @type {FrameRequestCallback} */
  const loop_callback = (new_timestamp) => {
    loop(emulator, new_timestamp);
  };
  emulator.is_playing = true;
  emulator.timestamp = null;
  emulator.req_frame(loop_callback);
}
/** @param {Emulator} emulator */
export function pause(emulator) {
  emulator.is_playing = false;
}

/** @param {Emulator} emulator */
export function step(emulator) {
  if (emulator.chip8.cycle_count % CYCLES_PER_TIMER === 0) {
    decrement_timers(emulator.chip8);
  }
  cycle(emulator.chip8);
  emulator.ui_callback(emulator.chip8);
}

/** @param {Emulator} emulator
 * @param {Uint8Array} program
 * @param {number} base_address
 * */
export function load_program(emulator, program, base_address = 0x200) {
  assert_address(base_address);
  emulator.chip8 = buildChip8();
  load_font(emulator.chip8);

  for (let i = 0; i < program.length; i++) {
    const addr = i + base_address;
    if (addr > 0xfff) {
      break;
    }
    assert_address(addr);
    emulator.chip8.memory[addr] = program[i];
  }

  emulator.chip8.program_counter.set(base_address);
  emulator.current_program = program;
}

/**
 * @param {Emulator} emulator
 * */
export function reset(emulator) {
  emulator.chip8 = buildChip8();
  load_font(emulator.chip8);
  load_program(emulator, emulator.current_program);
  emulator.ui_callback(emulator.chip8);
}
