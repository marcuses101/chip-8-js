// @ts-check

export const OP_CODES = {
  /**
    0NNN
    Jump to a machine code routine at nnn. This instruction is only used on the old computers on which Chip-8
    was originally implemented. It is ignored by modern interpreters. This will not be implemented.
  */
  SYS: 0,
  /** 00E0 - CLS
Clear the display.
    */
  CLS: 1,
  /**
    00EE - RET
Return from a subroutine.The interpreter sets the program counter to the address at the top of the stack,
then subtracts 1 from the stack pointer. */
  RET: 2,
  /** 1nnn - JP addr
Jump to location nnn. The interpreter sets the program counter to nnn. */
  JP: 3,
  /** 2nnn - CALL addr
Call subroutine at nnn. The interpreter increments the stack pointer, then puts the current PC on the top
of the stack. The PC is then set to nnn. */
  CALL: 4,
  /** 3xkk - SE Vx, byte
Skip next instruction if Vx = kk. The interpreter compares register Vx to kk, and if they are equal,
increments the program counter by 2. */
  SE: 5,
  /** 4xkk - SNE Vx, byte
Skip next instruction if Vx != kk. The interpreter compares register Vx to kk, and if they are not equal,
increments the program counter by 2.*/
  SNE: 6,

  /** 5xy0 - SE2 Vx, Vy
Skip next instruction if Vx = Vy. The interpreter compares register Vx to register Vy, and if they are equal,
increments the program counter by 2. */
  SE2: 7,
  /** 6xkk - LD Vx, byte
Set Vx = kk. The interpreter puts the value kk into register Vx. */
  LD: 8,
  /** 7xkk - ADD Vx, byte
Set Vx = Vx + kk. Adds the value kk to the value of register Vx, then stores the result in Vx. */
  ADD: 9,
  /** 8xy0 - LD2 Vx, Vy
Set Vx = Vy. Stores the value of register Vy in register Vx. */
  LD2: 10,
  /** 8xy1 - OR Vx, Vy
Set Vx = Vx OR Vy. Performs a bitwise OR on the values of Vx and Vy, then stores the result in Vx. A
bitwise OR compares the corresponding bits from two values, and if either bit is 1, then the same bit in the
result is also 1. Otherwise, it is 0. */
  OR: 11,
  /** 8xy2 - AND Vx, Vy
Set Vx = Vx AND Vy. Performs a bitwise AND on the values of Vx and Vy, then stores the result in Vx.
A bitwise AND compares the corresponding bits from two values, and if both bits are 1, then the same bit
in the result is also 1. Otherwise, it is 0. */
  AND: 12,
  /** 8xy3 - XOR Vx, Vy
Set Vx = Vx XOR Vy. Performs a bitwise exclusive OR on the values of Vx and Vy, then stores the result
in Vx. An exclusive OR compares the corresponding bits from two values, and if the bits are not both the
same, then the corresponding bit in the result is set to 1. Otherwise, it is 0 */
  XOR: 13,
  /** 8xy4 - ADD Vx, Vy
Set Vx = Vx + Vy, set VF = carry. The values of Vx and Vy are added together. If the result is greater
than 8 bits (i.e., ¿ 255,) VF is set to 1, otherwise 0. Only the lowest 8 bits of the result are kept, and stored
in Vx. */
  ADD2: 14,
  /** 
8xy5 - SUB Vx, Vy
Set Vx = Vx - Vy, set VF = NOT borrow. If Vx ¿ Vy, then VF is set to 1, otherwise 0. Then Vy is
subtracted from Vx, and the results stored in Vx. */
  SUB: 15,

  /** 8xy6 - SHR Vx {, Vy}
Set Vx = Vx SHR 1. If the least-significant bit of Vx is 1, then VF is set to 1, otherwise 0. Then Vx is
divided by 2. */
  SHR: 16,
  /** 8xy7 - SUBN Vx, Vy
Set Vx = Vy - Vx, set VF = NOT borrow. If Vy ¿ Vx, then VF is set to 1, otherwise 0. Then Vx is
subtracted from Vy, and the results stored in Vx. */
  SUBN: 17,
  /** 8xyE - SHL Vx {, Vy}
Set Vx = Vx SHL 1. If the most-significant bit of Vx is 1, then VF is set to 1, otherwise to 0. Then Vx is
multiplied by 2. */
  SHL: 18,
  /** 9xy0 - SNE Vx, Vy
Skip next instruction if Vx != Vy. The values of Vx and Vy are compared, and if they are not equal, the
program counter is increased by 2. */
  SNE2: 19,
  /** Annn - LD I, addr
Set I = nnn. The value of register I is set to nnn.*/
  LD3: 20,
  /** Bnnn - JP V0, addr
Jump to location nnn + V0. The program counter is set to nnn plus the value of V0. */
  JP2: 21,
  /** Cxkk - RND Vx, byte
Set Vx = random byte AND kk. The interpreter generates a random number from 0 to 255, which is then
ANDed with the value kk. The results are stored in Vx. See instruction 8xy2 for more information on AND. */
  RND: 22,
  /** Dxyn - DRW Vx, Vy, nibble
Display n-byte sprite starting at memory location I at (Vx, Vy), set VF = collision. The interpreter reads n
bytes from memory, starting at the address stored in I. These bytes are then displayed as sprites on screen
at coordinates (Vx, Vy). Sprites are XOR’d onto the existing screen. If this causes any pixels to be erased,
VF is set to 1, otherwise it is set to 0. If the sprite is positioned so part of it is outside the coordinates of
the display, it wraps around to the opposite side of the screen. */
  DRW: 23,
  /** Ex9E - SKP Vx
Skip next instruction if key with the value of Vx is pressed. Checks the keyboard, and if the key corresponding
to the value of Vx is currently in the down position, PC is increased by 2.*/
  SKP: 24,
  /** ExA1 - SKNP Vx
Skip next instruction if key with the value of Vx is not pressed. Checks the keyboard, and if the key
corresponding to the value of Vx is currently in the up position, PC is increased by 2.*/
  SKNP: 25,
  /** Fx07 - LD Vx, DT
Set Vx = delay timer value. The value of DT is placed into Vx.*/
  LD4: 26,
  /**Fx0A - LD Vx, K
Wait for a key press, store the value of the key in Vx. All execution stops until a key is pressed, then the
value of that key is stored in Vx.*/
  LD5: 27,
  /** Fx15 - LD DT, Vx
Set delay timer = Vx. Delay Timer is set equal to the value of Vx. */
  LD6: 28,
  /** Fx18 - LD ST, Vx
Set sound timer = Vx. Sound Timer is set equal to the value of Vx. */
  LD7: 29,
  /** Fx1E - ADD I, Vx
Set I = I + Vx. The values of I and Vx are added, and the results are stored in I */
  ADD3: 30,
  /** Noop */
  UNK: 31,
};

/**
 * @param {number} u16
 * @returns {number} */
export function parse_opcode(u16) {
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
      // TODO(marcus): maybe collapse with SE. not sure
      return OP_CODES.SE2;
    case 6:
      return OP_CODES.LD;
    case 7:
      return OP_CODES.ADD;
    case 8: {
      const bottom = rest & 0xf;
      switch (bottom) {
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
          return OP_CODES.SHR;
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
    case 0xe:
      {
        const bottom_byte = rest & 0xff;
        switch (bottom_byte) {
          case 0x9e:
            return OP_CODES.SKP;
          case 0x1a:
            return OP_CODES.SKNP;
          default:
            break;
        }
      }
      break;
    case 0xf:
      {
        const bottom_byte = rest & 0xff;
        switch (bottom_byte) {
          case 0x07:
            return OP_CODES.LD4;
          case 0x0a:
            return OP_CODES.LD5;
          case 0x15:
            return OP_CODES.LD6;
          case 0x18:
            return OP_CODES.LD7;
          case 0x15:
            return OP_CODES.ADD3;
          default:
            break;
        }
      }
      break;
    default:
      throw new Error(`Unsupported opcode 0x${two_byte.toString(16)}`);
  }
  return OP_CODES.UKN;
}

/** @param {number} opcode_enum
 * @returns {string}
 * */
export function formatOpcodeEnum(opcode_enum) {
  return (
    Object.entries(OP_CODES).find((entry) => entry[1] === opcode_enum)?.[0] ??
    "UKN"
  );
}
