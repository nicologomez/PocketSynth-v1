const PocketSynthConfig = {
  minTempo: 50,
  maxTempo: 180,
  defaultTempo: 100,
  octaveRanges: [
    { start: 36, label: "C2–C4" },
    { start: 48, label: "C3–C5" },
    { start: 60, label: "C4–C6" },
    { start: 72, label: "C5–C7" }
  ],
  keyboardMap: [
    "z", "s", "x", "d", "c", "v", "g", "b", "h", "n", "j", "m",
    "q", "2", "w", "3", "e", "r", "5", "t", "6", "y", "7", "u"
  ],
  transportKeys: { " ": "play", "o": "record", "escape": "stop", "l": "loop", "backspace": "clear", "?": "help" }
};
