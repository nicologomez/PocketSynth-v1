const DRUM_KIT = ["Kick", "Snare", "Closed Hat", "Open Hat", "Clap", "Rimshot", "Floor Tom", "Low Tom", "Mid Tom", "High Tom", "Crash", "Ride", "Shaker"];

function drumNameForNote(note) { return DRUM_KIT[(noteToMidi(note) - 60 + DRUM_KIT.length) % DRUM_KIT.length]; }

class Synth {
  constructor(context, output) { this.context = context; this.output = output; this.voices = new Map(); }

  start(note, voiceId = note, instrument = currentInstrument, output = this.output, level = 1) {
    if (this.voices.has(voiceId)) return;
    if (instrument.kind === "drum") return this.startDrum(note, voiceId, output, level);
    if (instrument.kind === "harmonic") return this.startHarmonic(note, voiceId, instrument, output, level);
    const now = this.context.currentTime;
    const source = instrument.kind === "noise" ? this.createNoiseSource() : this.context.createOscillator();
    const filter = this.context.createBiquadFilter(); const amp = this.context.createGain(); const frequency = noteToFrequency(note);
    if (source instanceof OscillatorNode) { source.type = instrument.waveform; source.frequency.setValueAtTime(frequency, now); }
    filter.type = instrument.kind === "noise" ? "bandpass" : "lowpass";
    filter.frequency.setValueAtTime(instrument.kind === "noise" ? Math.max(180, frequency * 1.5) : 450 + instrument.brightness * 5700, now);
    filter.Q.value = instrument.kind === "pluck" ? 3.2 : instrument.kind === "noise" ? 1.6 : instrument.kind === "pad" ? 0.45 : 0.7;
    amp.gain.setValueAtTime(0.0001, now); amp.gain.exponentialRampToValueAtTime(instrument.volume * level, now + Math.max(0.008, instrument.attack));
    source.connect(filter).connect(amp).connect(output); source.start(now);
    this.voices.set(voiceId, { sources: [source], amps: [amp], release: instrument.release });
  }

  startHarmonic(note, voiceId, instrument, output, level) {
    const now = this.context.currentTime; const frequency = noteToFrequency(note); const sources = []; const amps = [];
    [[1, 1], [2, 0.36], [3, 0.18]].forEach(([ratio, strength]) => {
      const osc = this.context.createOscillator(); const amp = this.context.createGain(); const filter = this.context.createBiquadFilter();
      osc.type = "sine"; osc.frequency.setValueAtTime(frequency * ratio, now); filter.type = "lowpass"; filter.frequency.value = 3600;
      amp.gain.setValueAtTime(0.0001, now); amp.gain.exponentialRampToValueAtTime(instrument.volume * level * strength, now + instrument.attack);
      osc.connect(filter).connect(amp).connect(output); osc.start(now); sources.push(osc); amps.push(amp);
    });
    this.voices.set(voiceId, { sources, amps, release: instrument.release });
  }

  startDrum(note, voiceId, output, level) {
    const now = this.context.currentTime; const name = drumNameForNote(note); const sources = []; const amps = [];
    const addOsc = (frequency, duration, type = "sine", endFrequency = null, gain = 0.25) => { const osc = this.context.createOscillator(); const amp = this.context.createGain(); osc.type = type; osc.frequency.setValueAtTime(frequency, now); if (endFrequency) osc.frequency.exponentialRampToValueAtTime(endFrequency, now + duration * 0.65); amp.gain.setValueAtTime(gain * level, now); amp.gain.exponentialRampToValueAtTime(0.0001, now + duration); osc.connect(amp).connect(output); osc.start(now); osc.stop(now + duration + 0.03); sources.push(osc); amps.push(amp); };
    const addNoise = (duration, frequency, gain, q = 0.7) => { const noise = this.createNoiseSource(); const filter = this.context.createBiquadFilter(); const amp = this.context.createGain(); filter.type = "bandpass"; filter.frequency.value = frequency; filter.Q.value = q; amp.gain.setValueAtTime(gain * level, now); amp.gain.exponentialRampToValueAtTime(0.0001, now + duration); noise.connect(filter).connect(amp).connect(output); noise.start(now); noise.stop(now + duration + 0.03); sources.push(noise); amps.push(amp); };
    if (name === "Kick") addOsc(155, 0.42, "sine", 46, 0.48);
    else if (name === "Snare") { addNoise(0.2, 1800, 0.28, 0.8); addOsc(185, 0.14, "triangle", null, 0.12); }
    else if (name === "Closed Hat") addNoise(0.075, 7800, 0.16, 2.2);
    else if (name === "Open Hat") addNoise(0.42, 7100, 0.14, 1.8);
    else if (name === "Clap") { [0, 0.035, 0.07].forEach((offset) => { const noise = this.createNoiseSource(); const filter = this.context.createBiquadFilter(); const amp = this.context.createGain(); filter.type = "bandpass"; filter.frequency.value = 1450; amp.gain.setValueAtTime(0.0001, now); amp.gain.setValueAtTime(0.23 * level, now + offset); amp.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.07); noise.connect(filter).connect(amp).connect(output); noise.start(now); noise.stop(now + 0.24); sources.push(noise); amps.push(amp); }); }
    else if (name === "Rimshot") { addOsc(1450, 0.07, "square", null, 0.12); addNoise(0.06, 3400, 0.12, 2); }
    else if (name.includes("Tom")) { const frequency = { "Floor Tom": 82, "Low Tom": 105, "Mid Tom": 135, "High Tom": 185 }[name]; addOsc(frequency, 0.38, "sine", frequency * 0.68, 0.3); }
    else if (name === "Crash") addNoise(1.15, 5900, 0.19, 0.5);
    else if (name === "Ride") { addNoise(0.72, 5100, 0.11, 1.4); addOsc(780, 0.5, "triangle", null, 0.06); }
    else if (name === "Shaker") addNoise(0.14, 6800, 0.13, 1.9);
    this.voices.set(voiceId, { sources, amps, release: 0.03, oneShot: true });
  }

  stop(voiceId, force = false) {
    const voice = this.voices.get(voiceId); if (!voice) return;
    if (voice.oneShot) { if (force) voice.sources.forEach((source) => source.stop()); this.voices.delete(voiceId); return; }
    const now = this.context.currentTime;
    voice.amps.forEach((amp) => { amp.gain.cancelScheduledValues(now); amp.gain.setValueAtTime(Math.max(amp.gain.value, 0.0001), now); amp.gain.exponentialRampToValueAtTime(0.0001, now + voice.release); });
    voice.sources.forEach((source) => source.stop(now + voice.release + 0.04)); this.voices.delete(voiceId);
  }

  stopAll() { [...this.voices.keys()].forEach((voiceId) => this.stop(voiceId, true)); }
  createNoiseSource() { const buffer = this.context.createBuffer(1, Math.ceil(this.context.sampleRate * 1.5), this.context.sampleRate); const data = buffer.getChannelData(0); for (let index = 0; index < data.length; index++) data[index] = Math.random() * 2 - 1; const source = this.context.createBufferSource(); source.buffer = buffer; return source; }
}
