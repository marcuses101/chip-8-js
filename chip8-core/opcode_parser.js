// @ts-check

import { assert_int_in_range } from "../utils/assert.js";
import { OP_CODES } from "./OP_CODES.js";

// TODO: fill this properly
export const OPCODE_METADATA = {
  [OP_CODES.SYS]: { pattern: "0NNN", description: "noop" },
  [OP_CODES.LD]: { pattern: "6xKK", description: "Vx = KK" },
  [OP_CODES.LD2]: { pattern: "8XY0", description: "Vx = Vy" },
  [OP_CODES.LD3]: { pattern: "ANNN", description: "I = NNN" },
  [OP_CODES.LD4]: { pattern: "Fx07", description: "Vx = DT" },
  [OP_CODES.LD5]: { pattern: "Fx0A", description: "Vx = keypress" },
  [OP_CODES.LD6]: { pattern: "Fx15", description: "DT = Vx" },
  [OP_CODES.LD7]: { pattern: "Fx18", description: "ST = Vx" },
  [OP_CODES.LD8]: { pattern: "Fx55", description: "mem[I0-Ix] = V[0-X]" },
  [OP_CODES.LD9]: { pattern: "Fx65", description: "V[0-X] = mem[I0-Ix]" },
  [OP_CODES.SPR]: { pattern: "Fx29", description: "I=sprite(Vx)" },
  [OP_CODES.CLS]: { pattern: "00E0", description: "CLR SCRN" },
  [OP_CODES.RET]: { pattern: "00EE", description: "PC = ST--" },
  [OP_CODES.JP]: { pattern: "1NNN", description: "PC = NNN" },
  [OP_CODES.CALL]: { pattern: "2NNN", description: "STK++ = ++PC" },
  [OP_CODES.SE]: { pattern: "3XKK", description: "skip if Vx == KK" },
  [OP_CODES.SNE]: { pattern: "4XKK", description: "skip if Vx != KK" },
  [OP_CODES.SE2]: { pattern: "5XY0", description: "skip if Vx == Vy" },
  [OP_CODES.ADD]: { pattern: "7XKK", description: "Vx += KK" },
  [OP_CODES.ADD2]: { pattern: "8XY4", description: "Vx += Vy" },
  [OP_CODES.ADD3]: { pattern: "FX1E", description: "I += Vx" },
  [OP_CODES.BCD]: { pattern: "Fx33", description: "dec decode" },
  [OP_CODES.DRW]: { pattern: "DXYN", description: "draw nlines (Dx,Dy)" },
  [OP_CODES.SUB]: { pattern: "8XY5", description: "Vx -= Vy, VF=borrow" },
  [OP_CODES.SUBN]: { pattern: "8XY7", description: "Vx -= Vy, VF=!borrow" },
  [OP_CODES.RND]: { pattern: "CXKK", description: "Vx = RND & KK" },
};

/**
 * @param {number} u16
 * @returns {number} */
export function decode_opcode(u16) {
  const top_nibble = u16 >> 12;
  const rest = u16 & 0x0fff;
  switch (top_nibble) {
    case 0: {
      switch (rest) {
        case 0x0e0:
          return OP_CODES.CLS;
        case 0x0ee:
          return OP_CODES.RET;
        default:
          return OP_CODES.SYS;
      }
    }
    case 1:
      return OP_CODES.JP;
    case 2:
      return OP_CODES.CALL;
    case 3:
      return OP_CODES.SE;
    case 4:
      return OP_CODES.SNE;
    case 5:
      return OP_CODES.SE2;
    case 6:
      return OP_CODES.LD;
    case 7:
      return OP_CODES.ADD;
    case 8: {
      const bottom_nibble = u16 & 0x000f;
      switch (bottom_nibble) {
        case 0:
          return OP_CODES.LD2;
        case 1:
          return OP_CODES.OR;
        case 2:
          return OP_CODES.AND;
        case 3:
          return OP_CODES.XOR;
        case 4:
          return OP_CODES.ADD2;
        case 5:
          return OP_CODES.SUB;
        case 6:
          return OP_CODES.SHR;
        case 7:
          return OP_CODES.SUBN;
        case 0xe:
          return OP_CODES.SHL;
        default:
          return OP_CODES.UNK;
      }
    }
    case 9:
      return OP_CODES.SNE2;
    case 0xa:
      return OP_CODES.LD3;
    case 0xb:
      return OP_CODES.JP2;
    case 0xc:
      return OP_CODES.RND;
    case 0xd:
      return OP_CODES.DRW;
    case 0xe: {
      const bottom_byte = rest & 0xff;
      switch (bottom_byte) {
        case 0x9e:
          return OP_CODES.SKP;
        case 0xa1:
          return OP_CODES.SKNP;
        default:
          return OP_CODES.UNK;
      }
    }
    case 0xf: {
      const bottom_byte = rest & 0xff;
      switch (bottom_byte) {
        case 0x1e:
          return OP_CODES.ADD3;
        case 0x07:
          return OP_CODES.LD4;
        case 0x0a:
          return OP_CODES.LD5;
        case 0x15:
          return OP_CODES.LD6;
        case 0x18:
          return OP_CODES.LD7;
        case 0x55:
          return OP_CODES.LD8;
        case 0x65:
          return OP_CODES.LD9;
        case 0x33:
          return OP_CODES.BCD;
        case 0x29:
          return OP_CODES.SPR;
        default:
          return OP_CODES.UNK;
      }
    }
    default:
      return OP_CODES.UNK;
  }
}

/** @param {number} opcode_enum
 * @returns {string}
 * */
export function formatOpcodeEnum(opcode_enum) {
  assert_int_in_range(opcode_enum, -1, Object.entries(OP_CODES).length - 1);

  var opcode_key = Object.entries(OP_CODES).find(
    ([_, val]) => val === opcode_enum,
  )?.[0];
  if (!opcode_key) {
    throw new Error(`invalid opcode_enum value ${opcode_enum}`);
  }
  return opcode_key;
}
