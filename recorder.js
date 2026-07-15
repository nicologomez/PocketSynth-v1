function makeLayer(index) {
  return { index, name: `LAYER ${index + 1}`, events: [], duration: 0, settings: { instrumentName: "Piano", scaleName: "Major", effectName: "Space", tempo: 100, volume: 1 }, playing: false, looping: false, timers: [], clock: 0, progress: 0, showStrokes: false };
}

const recorder = {
  layers: Array.from({ length: 9 }, (_, index) => makeLayer(index)),
  activeLayer: 0,
  recording: false,
  recordingLayer: null,
  startTime: 0
};

function activeLayer() { return recorder.layers[recorder.activeLayer]; }
function recordEvent(type, note, source = note, rawNote = note) {
  if (!recorder.recording) return;
  const layer = recorder.layers[recorder.recordingLayer];
  const time = performance.now() - recorder.startTime;
  layer.events.push({ type, note, rawNote, source, time });
  layer.duration = Math.max(layer.duration, time);
  updateTapeUI();
}
function selectLayer(index) {
  if (recorder.recording || index < 0 || index >= recorder.layers.length) return;
  recorder.activeLayer = index;
  updateTapeUI();
}
function armRecording() {
  if (recorder.recording) return;
  const layer = activeLayer();
  stopLayer(layer.index);
  layer.events = []; layer.duration = 0; layer.settings = getCurrentSettings();
  recorder.recording = true; recorder.recordingLayer = layer.index; recorder.startTime = performance.now();
  createLayerControls(); updateTapeUI();
}
function stopRecording() {
  if (!recorder.recording) return;
  const layer = recorder.layers[recorder.recordingLayer];
  layer.duration = Math.max(layer.duration, performance.now() - recorder.startTime);
  recorder.recording = false; recorder.recordingLayer = null;
  createLayerControls(); updateTapeUI();
}
function stopLayer(index) {
  const layer = recorder.layers[index];
  layer.timers.forEach(clearTimeout); layer.timers = [];
  clearInterval(layer.clock); layer.clock = 0; layer.playing = false; layer.progress = 0;
  if (synth) layer.events.filter((event) => event.type === "on").forEach((event) => stopNote(event.note, `layer-${index}-${event.source}`, true));
}
function stopAllPlayback() { recorder.layers.forEach((layer) => stopLayer(layer.index)); if (synth) synth.stopAll(); updateTapeUI(); }
function eraseLayer() { const layer = activeLayer(); stopLayer(layer.index); layer.events = []; layer.duration = 0; createLayerControls(); updateTapeUI(); }
function toggleLayerLoop(index = recorder.activeLayer) { const layer = recorder.layers[index]; layer.looping = !layer.looping; updateTapeUI(); }
function layerEventNote(event, layer) { return layer.settings.instrumentName === "Drums" ? (event.rawNote || event.note) : quantizeNoteToScale(event.rawNote || event.note, layer.settings.scaleName); }
function playLayer(index) {
  const layer = recorder.layers[index];
  if (!layer.events.length) return;
  if (layer.playing) { stopLayer(index); updateTapeUI(); return; }
  layer.playing = true; layer.progress = 0;
  const scale = layer.settings.tempo / tempo;
  const duration = Math.max(layer.duration, layer.events.at(-1).time + 100) * scale;
  const began = performance.now();
  layer.events.forEach((event) => {
    const voiceId = `layer-${index}-${event.source}`;
    const layerNote = layerEventNote(event, layer);
    layer.timers.push(setTimeout(() => event.type === "on" ? startNote(layerNote, voiceId, layer.settings) : stopNote(layerNote, voiceId), event.time * scale));
  });
  layer.clock = setInterval(() => { layer.progress = Math.min(1, (performance.now() - began) / duration); updateTapeUI(); }, 40);
  layer.timers.push(setTimeout(() => {
    clearInterval(layer.clock); layer.clock = 0; layer.playing = false; layer.progress = 0;
    if (synth) layer.events.filter((event) => event.type === "on").forEach((event) => stopNote(event.note, `layer-${index}-${event.source}`, true));
    updateTapeUI(); if (layer.looping) playLayer(index);
  }, duration + 50));
  updateTapeUI();
}
function playTape() { recorder.layers.filter((layer) => layer.events.length && !layer.playing).forEach((layer) => playLayer(layer.index)); }
function loadStarterSong() {
  stopAllPlayback(); recorder.layers = Array.from({ length: 9 }, (_, index) => makeLayer(index)); recorder.activeLayer = 0;
  const layer = activeLayer(); layer.events = createStarterSong(); layer.duration = 19200; layer.settings = { instrumentName: Presets.starter.instrument, scaleName: Presets.starter.scale, effectName: Presets.starter.effect, tempo: Presets.starter.tempo, volume: 1 };
  createLayerControls(); updateTapeUI();
}
