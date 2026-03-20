// @ts-check
import {
  build_emulator,
  load_program,
  pause,
  play,
  reset,
  step,
} from "./emulator.js";
import { fetch_program } from "./programs/program-loader.js";
import { runTests } from "./tests/test.js";
import { setup_controls } from "./ui/controls.js";
import { display_program, init_browser_ui, update_ui } from "./ui/ui.js";

async function main() {
  runTests();
  const browser_ui = init_browser_ui();
  /** @type {import("./emulator.js").UiCallback} */
  const ui_callback = (chip8) => {
    update_ui(chip8, browser_ui);
  };

  /** @type {import("./emulator.js").KeyboardCallback} */
  const keyboard_callback = () => {
    return browser_ui.keyboard.get();
  };
  const emulator = build_emulator(ui_callback, keyboard_callback, (cb) => {
    requestAnimationFrame(cb);
  });
  const program = await fetch_program("maze");
  load_program(emulator, program);
  display_program(browser_ui, program);
  setup_controls(
    () => {
      play(emulator);
    },
    () => {
      pause(emulator);
    },
    () => {
      step(emulator);
    },
    () => {
      reset(emulator);
    },
    async (id) => {
      const program = await fetch_program(
        /** @type {import("./programs/program-loader.js").ProgramId} */ (id),
      );
      load_program(emulator, program);
      display_program(browser_ui, program);
    },
  );
}

main();
