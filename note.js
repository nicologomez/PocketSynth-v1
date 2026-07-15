const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function midiToNote(midi) { return `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`; }
function noteToMidi(note) {
  const match = /^([A-G]#?)(-?\d+)$/.exec(note);
  if (!match) throw new Error(`Invalid note: ${note}`);
  return NOTE_NAMES.indexOf(match[1]) + (Number(match[2]) + 1) * 12;
}
function noteToFrequency(note) { return 440 * 2 ** ((noteToMidi(note) - 69) / 12); }
function isScaleNote(note) { return currentScale.includes(noteToMidi(note) % 12); }
function quantizeNoteToScale(note, scaleName = currentScaleName) {
  const midi = noteToMidi(note); const scale = Scales[scaleName] || Scales.Major; const octave = Math.floor(midi / 12); const pitchClass = midi % 12;
  let target = scale.filter((degree) => degree <= pitchClass).at(-1);
  if (target === undefined) target = scale.at(-1) - 12;
  return midiToNote(octave * 12 + target);
}
