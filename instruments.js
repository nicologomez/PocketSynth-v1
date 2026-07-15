const Instruments = {
  Piano: { waveform: "triangle", attack: 0.012, release: 0.72, volume: 0.19, brightness: 0.52 },
  Organ: { waveform: "square", attack: 0.01, release: 0.5, volume: 0.11, brightness: 0.45 },
  Glass: { waveform: "sine", attack: 0.008, release: 1.65, volume: 0.18, brightness: 0.74 },
  Bass: { waveform: "sawtooth", attack: 0.025, release: 0.38, volume: 0.15, brightness: 0.23 },
  Pulse: { waveform: "sawtooth", attack: 0.035, release: 0.85, volume: 0.12, brightness: 0.62 },
  Drums: { kind: "drum", waveform: "sine", attack: 0.002, release: 0.28, volume: 0.28, brightness: 0.32 },
  Pluck: { kind: "pluck", waveform: "triangle", attack: 0.002, release: 0.42, volume: 0.18, brightness: 0.72 },
  Noise: { kind: "noise", attack: 0.003, release: 0.32, volume: 0.16, brightness: 0.66 },
  Pad: { kind: "pad", waveform: "sawtooth", attack: 0.32, release: 1.8, volume: 0.09, brightness: 0.32 },
  Harmonic: { kind: "harmonic", waveform: "sine", attack: 0.12, release: 2.5, volume: 0.11, brightness: 0.56 }
};

let currentInstrumentName = "Piano";
let currentInstrument = Instruments[currentInstrumentName];
