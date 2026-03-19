//@ts-check
import * as CHIP8_TESTS from "./chip8.test.js";
import * as KEYBOARD_TESTS from "./keyboard.test.js";
import * as PARSER_TESTS from "./opcode_parser.test.js";
import * as TOKENIZER_TESTS from "../assembler/tokenizer.test.js";
import * as ASSEMBLER_TESTS from "../assembler/assembler.test.js";

const test_modules = {
  KEYBOARD_TESTS,
  CHIP8_TESTS,
  PARSER_TESTS,
  TOKENIZER_TESTS,
  ASSEMBLER_TESTS,
};

export function runTests() {
  let total = 0;
  let pass = 0;
  let fail = 0;
  const start = performance.now();

  Object.entries(test_modules).forEach(([module_name, module]) => {
    console.log("\n%s:\n\n", module_name);
    Object.entries(module).forEach(([test_function_name, test_fn]) => {
      if (typeof test_fn !== "function") {
        return;
      }
      try {
        test_fn();
        console.log("%s %cPASS", test_function_name, "color:green");
        pass++;
      } catch (e) {
        fail++;
        console.log("%s %cFAIL", test_function_name, "color:red");
        console.error(e);
      } finally {
        total++;
      }
    });
  });
  console.log("=============");
  console.log("Test Results:");
  console.log("  Success: %d", pass);
  console.log("  Fail   : %d", fail);
  console.log("Execution: %sms", (performance.now() - start).toFixed(4));
  console.log("=============");
}
