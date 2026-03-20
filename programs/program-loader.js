//@ts-check

import { assemble_from_string } from "../assembler/assembler.js";
import { assert } from "../utils/assert.js";

const PROGRAM_PATHS = {
  move_test: "./programs/move_test.asm",
  example_assembly: "./programs/test.asm",
  octo9: "./programs/9.ch8",
  maze: "./programs/maze.ch8",
  oneD: "./programs/1dcell.ch8",
  octo: "./programs/octo.ch8",
  br8: "./programs/br8out.ch8",
  rockPaperScissor: "https://johnearnest.github.io/chip8Archive/roms/RPS.ch8",
  tank: "./programs/tank.ch8",
  test1: "./programs/1-chip8-logo.ch8",
  test2: "./programs/2-ibm-logo.ch8",
  test3: "./programs/3-corax+.ch8",
  test4: "./programs/4-flags.ch8",
  test5: "./programs/5-quirks.ch8",
  test6: "./programs/6-keypad.ch8",
  test7: "./programs/7-beep.ch8",
  piper: "https://johnearnest.github.io/chip8Archive/roms/piper.ch8",
};

/** @typedef ProgramId
 * @type {keyof typeof PROGRAM_PATHS}
 */

/**
 * @param {ProgramId} program_id
 * @return {Promise<Uint8Array>}
 */
export async function fetch_program(program_id) {
  const path = PROGRAM_PATHS[program_id];
  assert(Boolean(path), `ProgramId :${program_id} not found`);
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`Failed to load "${program_id}"`);
  }
  const extension = path.split(".").at(-1);
  switch (extension) {
    case "ch8": {
      const buffer = await res.arrayBuffer();
      const program = new Uint8Array(buffer);
      return program;
    }
    case "asm": {
      const source = await res.text();
      const program = assemble_from_string(source);
      return program;
    }
    default: {
      throw new Error(
        `unsupported extenstion .${extension}. Expected ".asm" or ".ch8"`,
      );
    }
  }
}
