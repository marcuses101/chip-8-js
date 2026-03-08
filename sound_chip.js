//@ts-check
const BLACK_KEYS = [
  277, // c#
  311, // d#
  370, // f#
  415,
  466,
];

const OCTAVE_MULT = [1, 2];

/** @typedef SoundChip
 * @type {object}
 * @property {boolean} previous_state
 * @property {boolean} current_state
 * @property {number} frequency_index
 * @property {AudioContext} audio_context
 * @property {OscillatorNode} oscillator_node
 * @property {GainNode} gain_node
 */

/**
 * @returns {SoundChip}
 * */
export function init_sound_chip() {
  const audio_context = new AudioContext();
  const oscillator_node = new OscillatorNode(audio_context, {
    type: "triangle",
    frequency: BLACK_KEYS[0],
  });
  const gain_node = new GainNode(audio_context);
  gain_node.gain.setValueAtTime(0, audio_context.currentTime);
  oscillator_node.connect(gain_node).connect(audio_context.destination);
  oscillator_node.start(audio_context.currentTime);
  // One-liner to resume playback when user interacted with the page.
  // TODO improve this
  document.addEventListener("click", function () {
    audio_context.resume().then(() => {
      console.log("Playback resumed successfully");
    });
  });
  return {
    previous_state: false,
    current_state: false,
    frequency_index: 0,
    audio_context,
    gain_node,
    oscillator_node,
  };
}
/** @param {SoundChip} sound_chip
 */
export function sound_on(sound_chip) {
  sound_chip.previous_state = sound_chip.current_state;
  sound_chip.current_state = true;
  if (sound_chip.previous_state != sound_chip.current_state) {
    sound_chip.frequency_index++;
    const base_frequency =
      BLACK_KEYS[sound_chip.frequency_index % BLACK_KEYS.length];
    const octave_index =
      Math.floor(sound_chip.frequency_index / BLACK_KEYS.length) %
      OCTAVE_MULT.length;
    const octave_mul = OCTAVE_MULT[octave_index];
    const frequency = base_frequency * octave_mul;
    sound_chip.oscillator_node.frequency.value = frequency;
  }
  sound_chip.gain_node.gain.linearRampToValueAtTime(
    1,
    sound_chip.audio_context.currentTime + 0.05,
  );
}

/** @param {SoundChip} sound_chip
 */
export function sound_off(sound_chip) {
  sound_chip.previous_state = sound_chip.current_state;
  sound_chip.current_state = false;
  sound_chip.gain_node.gain.linearRampToValueAtTime(
    0,
    sound_chip.audio_context.currentTime + 0.05,
  );
}
