const Presets = {
  starter: { instrument: "Piano", scale: "Major", effect: "Space", tempo: 100 }
};

function createStarterSong() {
  const beat = 60000 / Presets.starter.tempo;
  const events = [];
  const add = (time, notes, length) => notes.forEach((note) => {
    events.push({ type: "on", note, time });
    events.push({ type: "off", note, time: time + length });
  });
  const progression = [["C4", "E4", "G4"], ["G3", "B3", "D4"], ["A3", "C4", "E4"], ["F3", "A3", "C4"]];
  const melody = ["E5", "G5", "A5", "G5", "E5", "D5", "C5", "D5", "G5", "A5", "G5", "E5", "D5", "C5", "D5", "E5"];
  for (let bar = 0; bar < 8; bar++) {
    const base = bar * beat * 4;
    add(base, progression[bar % progression.length], beat * 3.55);
    add(base, [melody[(bar * 2) % melody.length]], beat * 0.72);
    add(base + beat, [melody[(bar * 2 + 1) % melody.length]], beat * 0.72);
    add(base + beat * 2, [melody[(bar * 2 + 2) % melody.length]], beat * 0.72);
    add(base + beat * 3, [melody[(bar * 2 + 3) % melody.length]], beat * 0.72);
  }
  return events.sort((a, b) => a.time - b.time || (a.type === "off" ? 1 : -1));
}
