# Reference Instructions
# SYS - 0NNN - jump to nnn deprecated
# CLS - 00E0 - Clear the display.
# RET - 00EE - pop stack, set addr
# JP  - 1nnn - Jump to location nnn
# CALL- 2nnn - Call subroutine at nnn
# SE  - 3xkk - Vx, byte - Skip next instruction if Vx = kk 
# SNE - 4xkk - Vx, byte - Skip next instruction if Vx != kk
# SE2 - 5xy0  - Vx, Vy, Skip next instruction if Vx = Vy. 
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
