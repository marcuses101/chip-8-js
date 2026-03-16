// @ts-check
import { buildU16, buildU8 } from "../utils/utils.js";

export const SCREEN_WIDTH = 64;
export const SCREEN_HEIGHT = 32;
export const BYTES_PER_ROW = 8;

export const CHIP_8_QUIRKS = {
  vf_reset: true,
  memory: true,
  display_wait: false,
  clipping: true,
  shifting: false,
  jumping: false,
};

/**
 * @typedef Chip8
 * @type {object}
 * @property {Uint8Array} registers
 * @property {import("../utils/utils.js").U16} index_register
 * @property {Uint16Array} stack
 * @property {import("../utils/utils.js").U8} stack_pointer 0-15
 * @property {import("../utils/utils.js").U8} delay_timer
 * @property {import("../utils/utils.js").U8} sound_timer
 * @property {Uint8Array} frame_buffer
 * @property {Uint8Array} memory
 * @property {import("../utils/utils.js").U16} program_counter
 * @property {import("../utils/utils.js").U16} keyboard
 * @property {import("../utils/utils.js").U16} previous_keyboard
 * @property {number} cycle_count
 * @property {typeof CHIP_8_QUIRKS} quirk_options
 */

/**
 * @returns {Chip8}
 */
export function buildChip8(quirk_options = CHIP_8_QUIRKS) {
  const registers = new Uint8Array(16);
  return {
    registers,
    index_register: buildU16(),
    stack: new Uint16Array(16),
    stack_pointer: buildU8(),
    delay_timer: buildU8(),
    sound_timer: buildU8(),
    frame_buffer: new Uint8Array(BYTES_PER_ROW * SCREEN_HEIGHT),
    memory: new Uint8Array(4096),
    program_counter: buildU16(),
    keyboard: buildU16(),
    previous_keyboard: buildU16(),
    cycle_count: 0,
    quirk_options,
  };
}
