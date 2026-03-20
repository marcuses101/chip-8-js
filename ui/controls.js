/**
 * @param {()=>void} onPlayClick
 * @param {()=>void} onPauseClick
 * @param {()=>void} onStepClick
 * @param {()=>void} onResetClick
 * @param {(programId:string)=>Promise} handleRomSelect
 */
export function setup_controls(
  onPlayClick,
  onPauseClick,
  onStepClick,
  onResetClick,
  handleRomSelect,
) {
  const rom_list =
    /** @type {HTMLDivElement} */ document.getElementById("rom-list");
  const program_form = document.getElementById("loader-form");
  assert_instanceof(rom_list, HTMLElement);
  assert_instanceof(program_form, HTMLFormElement);
  program_form?.addEventListener("submit", async (e) => {
    const sumbitEl = /** @type {HTMLButtonElement} */ (e.submitter);
    assert_instanceof(sumbitEl, HTMLButtonElement);
    const rom = sumbitEl.value;
    assert(Boolean(rom), "rom value not found");
    await handleRomSelect(rom);
  });
  for (let key of Object.keys(PROGRAM_PATHS)) {
    const button = document.createElement("button");
    button.value = key;
    button.name = "rom-key";
    button.type = "submit";
    button.innerText = key.toUpperCase();
    rom_list?.appendChild(button);
  }

  document
    .getElementById("control-play")
    ?.addEventListener("click", onPlayClick);
  document
    .getElementById("control-pause")
    ?.addEventListener("click", onPauseClick);
  document
    .getElementById("control-step")
    ?.addEventListener("click", onStepClick);
  document
    .getElementById("control-reset")
    ?.addEventListener("click", onResetClick);
}
