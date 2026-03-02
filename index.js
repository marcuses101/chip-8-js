// @ts-check
import { buildChip8 } from "./memory.js";
import { handle_instruction } from "./operations.js";
import { load_font } from "./sprites.js";
import { runTests } from "./test.js";
import { init_browser_ui, update_ui } from "./ui.js";

function main() {
  runTests();
  const chip8 = buildChip8();
  load_font(chip8);
  const browser_ui = init_browser_ui();
  update_ui(chip8, browser_ui);

  handle_instruction(chip8, 0xa000); //instruction pointer to 0x000 "1" sprite
  handle_instruction(chip8, 0xd015); //draw "1" sprite to 0,0

  handle_instruction(chip8, 0xa00a); //instruction pointer to 0x000 "2" sprite
  handle_instruction(chip8, 0x7005); // move x to 6
  handle_instruction(chip8, 0xd015); //draw "2" sprite to 6,0

  update_ui(chip8, browser_ui);
  setTimeout(() => {
    handle_instruction(chip8, 0x00e0); //draw "2" sprite to 6,0
    update_ui(chip8, browser_ui);
  }, 2000);
}

main();
