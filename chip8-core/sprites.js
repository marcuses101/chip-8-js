// @ts-check

/** @type {Uint8Array[]} */
export const SPRITES = [
  Uint8Array.fromHex("F0909090F0"), // 0
  Uint8Array.fromHex("2060202070"), // 1
  Uint8Array.fromHex("F010F080F0"), // 2
  Uint8Array.fromHex("F010F010F0"), // 3
  Uint8Array.fromHex("9090F01010"), // 4
  Uint8Array.fromHex("F080F010F0"), // 5
  Uint8Array.fromHex("F080F090F0"), // .
  Uint8Array.fromHex("F010101010"), // .
  Uint8Array.fromHex("F090F090F0"), // .
  Uint8Array.fromHex("F090F01010"),
  Uint8Array.fromHex("F090F09090"),
  Uint8Array.fromHex("F090F090F0"),
  Uint8Array.fromHex("F0808080F0"),
  Uint8Array.fromHex("E0909090E0"),
  Uint8Array.fromHex("F080F080F0"),
  Uint8Array.fromHex("F080F08080"),
];

export const HAPPY_FACE = /**@type {Uint8Array} */ (
  Uint8Array.fromHex("3C4281A581A599423C")
);

const SPRITES_BASE_ADDRESS = 0x000;
const BYTES_PER_SPRITE = 5;

/** @param {string} char */
export function render_sprite_to_string(char) {
  var buffer = SPRITES[char];
  if (!buffer) {
    throw new Error("Only single characters 0-9,A-F supported");
  }
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

/** @param {import("./chip8").Chip8} chip8 */
export function load_font(chip8, base_address = SPRITES_BASE_ADDRESS) {
  SPRITES.forEach((sprite, index) => {
    sprite.forEach((byte, sprite_index) => {
      chip8.memory[index * BYTES_PER_SPRITE + sprite_index + base_address] =
        byte;
    });
  });
}
