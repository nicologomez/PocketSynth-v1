let octaveRangeIndex = 2;
let chromaticNotes = [];
const activeComputerKeys = new Map();

function setOctaveRange(index) {
  octaveRangeIndex = (index + PocketSynthConfig.octaveRanges.length) % PocketSynthConfig.octaveRanges.length;
  [...activeComputerKeys.keys()].forEach(releaseNote);
  const range = PocketSynthConfig.octaveRanges[octaveRangeIndex];
  chromaticNotes = Array.from({ length: 24 }, (_, noteIndex) => midiToNote(range.start + noteIndex));
  createKeys();
  updateScreen();
}

function cycleOctaveRange() { setOctaveRange(octaveRangeIndex + 1); }

function currentOctaveRange() { return PocketSynthConfig.octaveRanges[octaveRangeIndex]; }

function refreshKeyboard() {
  chromaticNotes.forEach((note) => {
    const key = document.querySelector(`[data-note="${note}"]`);
    if (!key) return;
    key.querySelector("span").textContent = currentInstrumentName === "Drums" ? drumNameForNote(note) : quantizeNoteToScale(note);
    key.classList.toggle("in-scale", isScaleNote(note));
    key.classList.toggle("root-note", noteToMidi(note) % 12 === 0);
  });
}
function pressNote(note, source) {
  if (activeComputerKeys.has(source)) return;
  const soundingNote = currentInstrumentName === "Drums" ? note : quantizeNoteToScale(note);
  activeComputerKeys.set(source, { soundingNote, rawNote: note }); document.querySelector(`[data-note="${note}"]`)?.classList.add("pressed"); recordEvent("on", soundingNote, source, note); startNote(soundingNote, source, getCurrentSettings());
}
function releaseNote(source) {
  const active = activeComputerKeys.get(source); if (!active) return;
  document.querySelector(`[data-note="${active.rawNote}"]`)?.classList.remove("pressed"); recordEvent("off", active.soundingNote, source, active.rawNote); stopNote(active.soundingNote, source); activeComputerKeys.delete(source);
}
document.addEventListener("keydown", (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
  const numpadMatch = /^Numpad([1-9])$/.exec(event.code);
  if (numpadMatch) { event.preventDefault(); selectLayer(Number(numpadMatch[1]) - 1); return; }
  const key = event.key.toLowerCase();
  const index = PocketSynthConfig.keyboardMap.indexOf(key);
  if (index >= 0) { event.preventDefault(); pressNote(chromaticNotes[index], `key:${key}`); return; }
  const action = PocketSynthConfig.transportKeys[key];
  if (action) { event.preventDefault(); transport(action); }
});
document.addEventListener("keyup", (event) => { const key = event.key.toLowerCase(); if (PocketSynthConfig.keyboardMap.includes(key)) { event.preventDefault(); releaseNote(`key:${key}`); } });
window.addEventListener("blur", () => [...activeComputerKeys.keys()].forEach(releaseNote));
