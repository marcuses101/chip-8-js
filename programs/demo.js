// load at 0x100
let PROGRAM = "";
PROGRAM += "a000"; // LD I 0x00 # "0" sprite
PROGRAM += "6000"; // LD V0 0x00
PROGRAM += "610A"; // LD V1 0x00
PROGRAM += "6205"; // LD V1 0x00

PROGRAM += "d015"; // Drw

PROGRAM += "F21E"; // I =  I + V2
PROGRAM += "7005"; // add 5 to V0
PROGRAM += "d015"; // Drw

PROGRAM += "F21E"; // I =  I + V2
PROGRAM += "7005"; // add 5 to V0
PROGRAM += "d015"; // Drw

PROGRAM += "F21E"; // I =  I + V2
PROGRAM += "7005"; // add 5 to V0
PROGRAM += "d015"; // Drw

PROGRAM += "F21E"; // I =  I + V2
PROGRAM += "7005"; // add 5 to V0
PROGRAM += "d015"; // Drw

PROGRAM += "F21E"; // I =  I + V2
PROGRAM += "7005"; // add 5 to V0
PROGRAM += "d015"; // Drw

PROGRAM += "F21E"; // I =  I + V2
PROGRAM += "7005"; // add 5 to V0
PROGRAM += "d015"; // Drw

PROGRAM += "F21E"; // I =  I + V2
PROGRAM += "7005"; // add 5 to V0
PROGRAM += "d015"; // Drw

PROGRAM += "F21E"; // I =  I + V2
PROGRAM += "7005"; // add 5 to V0
PROGRAM += "d015"; // Drw

PROGRAM += "F21E"; // I =  I + V2
PROGRAM += "7005"; // add 5 to V0
PROGRAM += "d015"; // Drw

PROGRAM += "F21E"; // I =  I + V2
PROGRAM += "7005"; // add 5 to V0
PROGRAM += "d015"; // Drw

PROGRAM += "F21E"; // I =  I + V2
PROGRAM += "7005"; // add 5 to V0
PROGRAM += "d015"; // Drw

PROGRAM += "F21E"; // I =  I + V2
PROGRAM += "7005"; // add 5 to V0
PROGRAM += "d015"; // Drw

PROGRAM += "f90a";

export const DEMO_PROGRAM = Uint8Array.fromHex(PROGRAM);
