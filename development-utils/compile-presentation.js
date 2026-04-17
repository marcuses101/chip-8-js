// @ts-check

import { readFileSync, writeFileSync } from "node:fs";
import { argv } from "node:process";
import { assert_int_in_range } from "../utils/assert.js";
import { is_alpha, is_digit } from "../utils/utils.js";

const A_OFFSET = "A".charCodeAt(0);
const ASM_A_OFFSET = 10;

/**@param {string} input */
function translate(input) {
	/** @type {[string,number][]} */
	const chars = [];
	const normalized = input.toUpperCase();
	for (let i = 0; i < input.length; i++) {
		const char = normalized[i];
		if (is_digit(char)) {
			const value = char.charCodeAt(0) - 48;
			chars.push([char, value]);
		} else if (is_alpha(char)) {
			const value = char.charCodeAt(0) - A_OFFSET + ASM_A_OFFSET;
			chars.push([char, value]);
		} else if (char === " ") {
			chars.push([char, 37]);
		} else if (char === "\n") {
			chars.push([char, 36]);
		}
	}
	/** @type {string[]} */
	const lines = [];
	for (const [currentChar, code] of chars) {
		assert_int_in_range(code, 0, 37);
		const formattedCode = code.toString(10).padStart(3, "0");
		lines.push(
			`    DB ${formattedCode} # '${currentChar === "\n" ? "\\n" : currentChar}'`,
		);
	}
	return lines.join("\n");
}

function main() {
	const presentation_assembly = readFileSync(
		"./programs/presentation.asm",
		"utf-8",
	);
	const slidesLabel = "slides:";
	let index = presentation_assembly.lastIndexOf(slidesLabel);
	if (index === -1) {
		throw new Error(
			`presentation.asm must contain the label "${slidesLabel.trim()}"`,
		);
	}
	index = presentation_assembly.indexOf("\n", index) + 1;
	const input = readFileSync("./development-utils/presentation.txt", "utf-8");
	// const input = argv[2];
	const slides = input
		.trim()
		.split("---")
		.map((chunk) => chunk.trim())
		.filter(Boolean);

	const presentation_asm_bytes = `${slides
		.map((slide) => translate(slide))
		.join("\n    DB 038 # 'next slide'\n")}\n    DB 0xFF # terminator\n\n`;

	const output = `${presentation_assembly.slice(0, index)}${presentation_asm_bytes}`;
	writeFileSync("./programs/presentation.asm", output);
	console.log("presentation.asm updated");
}

main();
