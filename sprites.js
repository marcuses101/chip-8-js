// @ts-check

// @ts-nocheck
/** @type {Record<string,Uint8Array>} */
export const SPRITES = {
  0: Uint8Array.fromHex("F0909090F0"),
  1: Uint8Array.fromHex("2060202070"),
  2: Uint8Array.fromHex("F010F080F0"),
  3: Uint8Array.fromHex("F010F010F0"),
  4: Uint8Array.fromHex("9090F01010"),
  5: Uint8Array.fromHex("F080F010F0"),
  6: Uint8Array.fromHex("F080F090F0"),
  7: Uint8Array.fromHex("F010101010"),
  8: Uint8Array.fromHex("F090F090F0"),
  9: Uint8Array.fromHex("F090F01010"),
  A: Uint8Array.fromHex("F090F09090"),
  B: Uint8Array.fromHex("F090F090F0"),
  C: Uint8Array.fromHex("F0808080F0"),
  D: Uint8Array.fromHex("E0909090E0"),
  E: Uint8Array.fromHex("F080F080F0"),
  F: Uint8Array.fromHex("F080F08080"),
};

const BYTES_PER_SPRITE = SPRITES[0].length;

/** @param {string} char */
export function render_sprite_to_string(char) {
  var buffer = SPRITES[char];
  if (!buffer) {
    throw new Error("Only single characters 0-9,A-F supported");
  }
  let output = "";
  const lines = [];
  for (const initial_val of buffer) {
    let formattedLine = "";
    const val = initial_val >> 4;
    for (let shift = 3; shift >= 0; shift--) {
      const condition = (val >> shift) & 1;
      const output_char = condition ? "*" : " ";
      formattedLine += output_char;
    }
    lines.push(formattedLine);
  }
  return lines.join("\n");
}

/** @param {import("./memory").Chip8} chip8 */
export function load_font(chip8) {
  const start = 0x000;
  let offset = 0;
  Object.values(SPRITES).forEach((sprite, offset_index) => {
    sprite.forEach((byte, sprite_index) => {
      chip8.memory[offset_index * 5 + sprite_index] = byte;
    });
  });
}
