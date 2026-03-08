// @ts-check
import { assert_address } from "./assert.js";
import { buildChip8 } from "./memory.js";
import { cycle, decrement_timers, handle_instruction } from "./operations.js";
import { load_font } from "./sprites.js";
import { runTests } from "./test.js";
import { display_program, init_browser_ui, update_ui } from "./ui.js";
import { HAPPY_FACE } from "./utils.js";

const CYCLES_HZ = 700;
const CYCLE_MS = 1000 / CYCLES_HZ;
const TIMER_HZ = 60;
const CYCLES_PER_TIMER = Math.floor(CYCLES_HZ / TIMER_HZ);

/* TODO: 
- [x] set up some loop
- [x] load ROMS
- [ ] handle keyboard input
- [ ] emit_byte fn?
*/

/** @param {import("./memory.js").Chip8} chip8
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

/** @param {import("./memory.js").Chip8} chip8
 * @param {import("./ui.js").UI} ui
 * */
function handle_keyboard(chip8, ui) {
  // todo handle keyboard buffering?
  chip8.previous_keyboard.set(chip8.keyboard.get());
  chip8.keyboard.set(ui.keyboard.get());
}

const PROGRAM_PATHS = {
  octo9: "/programs/9.ch8",
  maze: "/programs/maze.ch8",
  oneD: "/programs/1dcell.ch8",
  octo: "/programs/octo.ch8",
  br8: "/programs/br8out.ch8",
  test1: "/programs/1-chip8-logo.ch8",
  test2: "/programs/2-ibm-logo.ch8",
  test3: "/programs/3-corax+.ch8",
  test4: "/programs/4-flags.ch8",
  test5: "/programs/5-quirks.ch8",
  test6: "/programs/6-keypad.ch8",
  test7: "/programs/7-beep.ch8",
};

async function main() {
  runTests();
  const chip8 = buildChip8();
  load_font(chip8);
  const path = PROGRAM_PATHS.oneD;
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`Program not found at ${path}`);
  }
  const buffer = await res.arrayBuffer();
  const program = new Uint8Array(buffer);
  load_program(chip8, program);
  //  test5 preselect
  chip8.memory[0x1ff] = 1;
  const browser_ui = init_browser_ui();
  display_program(browser_ui, program);
  update_ui(chip8, browser_ui);
  let timestamp = performance.now();
  let cycles = 0;

  function loop() {
    const new_timestamp = performance.now();
    let delta = new_timestamp - timestamp;
    timestamp = new_timestamp;
    handle_keyboard(chip8, browser_ui);
    while (delta > CYCLE_MS) {
      delta -= CYCLE_MS;
      if (cycles % CYCLES_PER_TIMER === 0) {
        decrement_timers(chip8);
      }
      cycle(chip8);
      cycles++;
    }
    update_ui(chip8, browser_ui);
    requestAnimationFrame(loop);
  }
  loop();
}
main();
