// @ts-check
import { assert, assert_address, assert_instanceof } from "./assert.js";
import { buildChip8 } from "./chip8.js";
import { cycle, decrement_timers } from "./operations.js";
import { load_font } from "./sprites.js";
import { runTests } from "./test.js";
import { display_program, init_browser_ui, update_ui } from "./ui.js";

const CYCLES_HZ = 700;
const CYCLE_MS = 1000 / CYCLES_HZ;
const TIMER_RATIO = 700 / 60;
const TIMER_HZ = CYCLES_HZ / TIMER_RATIO;
const CYCLES_PER_TIMER = Math.floor(CYCLES_HZ / TIMER_HZ);

/* TODO: 
- [x] set up some loop
- [x] load ROMS
- [x] handle keyboard input
- [ ] emit_byte fn?
- [ ] write an assembler?
- [ ] Time Machine?
- [x] Controls?
*/

/** @param {import("./chip8.js").Chip8} chip8
 * @param {Uint8Array} program
 * @param {number} base_address
 * */
function load_program(chip8, program, base_address = 0x200) {
  assert_address(base_address);
  for (let i = 0; i < program.length; i++) {
    const addr = i + base_address;
    if (addr > 0xfff) {
      break;
    }
    assert_address(addr);
    chip8.memory[addr] = program[i];
  }
  chip8.program_counter.set(base_address);
}

/** @param {import("./chip8.js").Chip8} chip8
 * @param {import("./ui.js").UI} ui
 * */
function handle_keyboard(chip8, ui) {
  chip8.previous_keyboard.set(chip8.keyboard.get());
  chip8.keyboard.set(ui.keyboard.get());
}

const PROGRAM_PATHS = {
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

/**
 * @param {keyof typeof PROGRAM_PATHS} program_id
 * @return {Promise<Uint8Array | null>}
 */
async function fetch_program(program_id) {
  const path = PROGRAM_PATHS[program_id];
  if (!path) {
    return null;
  }
  const res = await fetch(path);
  if (!res.ok) {
    return null;
  }
  const buffer = await res.arrayBuffer();
  const program = new Uint8Array(buffer);
  return program;
}

/**
 * @typedef Emulator
 * @type {object}
 * @property {boolean} is_playing
 * @property {number} timestamp
 * */

async function main() {
  runTests();
  let chip8 = buildChip8();
  load_font(chip8);
  let program = await fetch_program("rockPaperScissor");
  if (!program) {
    throw new Error("Failed to load. See previous logs for error");
  }
  load_program(chip8, program);
  const browser_ui = init_browser_ui();
  display_program(browser_ui, program);
  update_ui(chip8, browser_ui);

  const rom_list =
    /** @type {HTMLDivElement} */ document.getElementById("rom-list");
  const program_form = document.getElementById("loader-form");
  assert_instanceof(rom_list, HTMLElement);
  assert_instanceof(program_form, HTMLFormElement);
  program_form?.addEventListener("submit", async (e) => {
    pause();
    const rom = /** @type {string} */ (e.submitter.value);
    assert(rom !== null, "rom value not found");
    chip8 = buildChip8();
    load_font(chip8);
    program = await fetch_program(rom);
    assert_instanceof(program, Uint8Array);
    load_program(chip8, program);
    display_program(browser_ui, program);
    update_ui(chip8, browser_ui);
    play();
  });
  for (let key of Object.keys(PROGRAM_PATHS)) {
    const button = document.createElement("button");
    button.value = key;
    button.name = "rom-key";
    button.type = "submit";
    button.innerText = key.toUpperCase();
    rom_list.appendChild(button);
  }

  // Emulator State
  let timestamp = performance.now();
  let is_playing = true;

  function loop() {
    if (!is_playing) {
      return;
    }
    const new_timestamp = performance.now();
    let delta = new_timestamp - timestamp;
    timestamp = new_timestamp;
    handle_keyboard(chip8, browser_ui);
    while (delta > CYCLE_MS) {
      delta -= CYCLE_MS;
      if (chip8.cycle_count % CYCLES_PER_TIMER === 0) {
        decrement_timers(chip8);
      }
      cycle(chip8);
    }
    update_ui(chip8, browser_ui);
    requestAnimationFrame(loop);
  }

  function play() {
    is_playing = true;
    timestamp = performance.now();
    loop();
  }
  function pause() {
    is_playing = false;
  }
  function step() {
    if (chip8.cycle_count % CYCLES_PER_TIMER === 0) {
      decrement_timers(chip8);
    }
    cycle(chip8);
    update_ui(chip8, browser_ui);
  }
  function reset() {
    if (!program) {
      return;
    }
    chip8 = buildChip8();
    load_font(chip8);
    load_program(chip8, program);
    update_ui(chip8, browser_ui);
  }

  document.getElementById("control-play").addEventListener("click", play);
  document.getElementById("control-pause").addEventListener("click", pause);
  document.getElementById("control-step").addEventListener("click", step);
  document.getElementById("control-reset").addEventListener("click", reset);

  play();
}

main();
