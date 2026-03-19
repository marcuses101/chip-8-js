//@ts-check
//
import {
  decode_opcode,
  formatOpcodeEnum,
} from "../chip8-core/opcode_parser.js";
import { OP_CODES } from "../chip8-core/OP_CODES.js";
import { assert_equal } from "../utils/assert.js";

export function opcodes_ShouldParseAsExpected() {
  // TODO: add other opcodes
  const test_data = [
    [0x71a0, OP_CODES.ADD],
    [0x0fff, OP_CODES.SYS],
    [0x00e0, OP_CODES.CLS],
    [0x00ee, OP_CODES.RET],
    [0x1123, OP_CODES.JP],
    [0x2123, OP_CODES.CALL],
    [0x3100, OP_CODES.SE],
    [0x4100, OP_CODES.SNE],
    [0x71a0, OP_CODES.ADD],
    [0xd005, OP_CODES.DRW],
    [0xf31e, OP_CODES.ADD3],
    [0xf133, OP_CODES.BCD],
    [0xf329, OP_CODES.SPR],
  ];
  const failed = [];
  test_data.forEach(([input, expected_output]) => {
    const parsed = decode_opcode(input);
    if (parsed !== expected_output) {
      failed.push([input, expected_output, parsed]);
      console.log(
        "Input: 0x%s, Expected: %s, Received: %s",
        input.toString(16),
        formatOpcodeEnum(expected_output),
        formatOpcodeEnum(parsed),
      );
    }
  });
  assert_equal(failed.length, 0);
}
