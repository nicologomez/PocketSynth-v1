let tempo = Presets.starter.tempo;
let instrumentIndex = Object.keys(Instruments).indexOf(currentInstrumentName);
let scaleIndex = Object.keys(Scales).indexOf(currentScaleName);
let effectIndex = Object.keys(Effects).indexOf(currentEffectName);

function getCurrentSettings() { return { instrumentName: currentInstrumentName, scaleName: currentScaleName, effectName: currentEffectName, tempo, volume: 1 }; }

function cycleInstrument() { const names = Object.keys(Instruments); instrumentIndex = (instrumentIndex + 1) % names.length; currentInstrumentName = names[instrumentIndex]; currentInstrument = Instruments[currentInstrumentName]; updateScreen(); }
function cycleScale() { const names = Object.keys(Scales); scaleIndex = (scaleIndex + 1) % names.length; currentScaleName = names[scaleIndex]; currentScale = Scales[currentScaleName]; updateScreen(); }
function cycleEffect() { const names = Object.keys(Effects); effectIndex = (effectIndex + 1) % names.length; setEffect(names[effectIndex]); updateScreen(); }
function setTempo(value) { tempo = Math.max(PocketSynthConfig.minTempo, Math.min(PocketSynthConfig.maxTempo, Number(value))); updateScreen(); }
function transport(action) {
  ({ record: armRecording, play: playTape, stop: () => { stopRecording(); stopAllPlayback(); }, loop: toggleLayerLoop, clear: eraseLayer, help: () => setHelp(true) })[action]?.();
}
function useStarterSong() {
  currentInstrumentName = Presets.starter.instrument; currentInstrument = Instruments[currentInstrumentName]; instrumentIndex = Object.keys(Instruments).indexOf(currentInstrumentName);
  currentScaleName = Presets.starter.scale; currentScale = Scales[currentScaleName]; scaleIndex = Object.keys(Scales).indexOf(currentScaleName);
  effectIndex = Object.keys(Effects).indexOf(Presets.starter.effect); setEffect(Presets.starter.effect); setTempo(Presets.starter.tempo); loadStarterSong();
}

function downloadBlob(blob, filename) { const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000); }
function exportSession() {
  const data = { version: 1, savedAt: new Date().toISOString(), current: { instrumentName: currentInstrumentName, scaleName: currentScaleName, effectName: currentEffectName, tempo, octaveRangeIndex }, visibleLayerCount, layers: recorder.layers.map(({ index, name, events, duration, settings, looping, showStrokes }) => ({ index, name, events, duration, settings, looping, showStrokes })) };
  downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), "pocketsynth-session.json");
}
function importSession(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result); if (!Array.isArray(data.layers)) throw new Error("Not a PocketSynth session.");
      stopAllPlayback();
      recorder.layers = Array.from({ length: 9 }, (_, index) => Object.assign(makeLayer(index), data.layers[index] || {}, { index, settings: { ...makeLayer(index).settings, ...(data.layers[index]?.settings || {}) }, timers: [], clock: 0, playing: false, progress: 0 }));
      recorder.activeLayer = 0; visibleLayerCount = Math.max(5, Math.min(9, Number(data.visibleLayerCount) || 5));
      const current = data.current || {}; currentInstrumentName = Instruments[current.instrumentName] ? current.instrumentName : "Piano"; currentInstrument = Instruments[currentInstrumentName]; instrumentIndex = Object.keys(Instruments).indexOf(currentInstrumentName); currentScaleName = Scales[current.scaleName] ? current.scaleName : "Major"; currentScale = Scales[currentScaleName]; scaleIndex = Object.keys(Scales).indexOf(currentScaleName); currentEffectName = Effects[current.effectName] ? current.effectName : "Space"; effectIndex = Object.keys(Effects).indexOf(currentEffectName); tempo = Math.max(PocketSynthConfig.minTempo, Math.min(PocketSynthConfig.maxTempo, Number(current.tempo) || 100)); setOctaveRange(Number.isInteger(current.octaveRangeIndex) ? current.octaveRangeIndex : 2);
      createLayerControls(); updateScreen(); updateTapeUI(); document.getElementById("exportHint").textContent = "Session loaded.";
    } catch (error) { document.getElementById("exportHint").textContent = "Could not load that session file."; }
  };
  reader.readAsText(file);
}
function exportPerformanceVideo() {
  const usedLayers = recorder.layers.filter((layer) => layer.events.length);
  if (!usedLayers.length) { document.getElementById("exportHint").textContent = "Record or load a layer before exporting."; return; }
  if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) { document.getElementById("exportHint").textContent = "Video export is not available in this browser."; return; }
  initAudio(); stopAllPlayback();
  const canvas = document.createElement("canvas"); canvas.width = 1280; canvas.height = 720; const ctx = canvas.getContext("2d");
  const draw = () => { ctx.fillStyle = "#11171b"; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = "#e7eeee"; ctx.font = "bold 62px system-ui"; ctx.fillText("POCKETSYNTH", 70, 105); ctx.fillStyle = "#6f98a1"; ctx.font = "24px monospace"; ctx.fillText("LAYER PERFORMANCE EXPORT", 74, 145); usedLayers.forEach((layer, index) => { const y = 220 + index * 66; ctx.fillStyle = "#2d3b42"; ctx.fillRect(70, y, 1140, 34); ctx.fillStyle = layer.playing ? "#15b941" : "#7c8b90"; ctx.fillRect(70, y, 1140 * layer.progress, 34); ctx.fillStyle = "#efffff"; ctx.font = "bold 18px monospace"; ctx.fillText(`${layer.name}  ${layer.settings.instrumentName} / ${layer.settings.effectName}`, 84, y + 23); }); if (exportFrame) requestAnimationFrame(draw); };
  const videoStream = canvas.captureStream(30); const stream = new MediaStream([...videoStream.getVideoTracks(), ...recordDestination.stream.getAudioTracks()]);
  const mp4 = "video/mp4"; const mimeType = MediaRecorder.isTypeSupported(mp4) ? mp4 : "video/webm;codecs=vp8,opus"; const extension = mimeType.includes("mp4") ? "mp4" : "webm"; const chunks = []; let exportFrame = 1;
  const mediaRecorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 2000000, audioBitsPerSecond: 160000 });
  mediaRecorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
  mediaRecorder.onstop = () => { exportFrame = 0; videoStream.getTracks().forEach((track) => track.stop()); downloadBlob(new Blob(chunks, { type: mimeType }), `pocketsynth-performance.${extension}`); document.getElementById("exportHint").textContent = extension === "mp4" ? "MP4 performance exported." : "Your browser exported WebM (MP4 was not supported)."; };
  const exportDuration = Math.max(...usedLayers.map((layer) => Math.max(layer.duration, layer.events.at(-1).time + 100) * (layer.settings.tempo / tempo)));
  draw(); mediaRecorder.start(); playTape(); document.getElementById("exportHint").textContent = `Exporting ${Math.ceil(exportDuration / 1000)} seconds…`; setTimeout(() => { stopAllPlayback(); if (mediaRecorder.state !== "inactive") mediaRecorder.stop(); }, exportDuration + 300);
}

setOctaveRange(octaveRangeIndex);
document.getElementById("octaveBtn").onclick = cycleOctaveRange;
createLayerControls();
document.querySelector("[data-control='instrument']").onclick = cycleInstrument;
document.querySelector("[data-control='scale']").onclick = cycleScale;
document.querySelector("[data-control='effect']").onclick = cycleEffect;
document.querySelector("[data-control='tempo']").onclick = () => setTempo(tempo >= 180 ? 50 : tempo + 5);
document.getElementById("tempoSlider").oninput = (event) => setTempo(event.target.value);
document.getElementById("recBtn").onclick = () => transport("record"); document.getElementById("playBtn").onclick = () => transport("play"); document.getElementById("stopBtn").onclick = () => transport("stop"); document.getElementById("eraseBtn").onclick = () => transport("clear"); document.getElementById("loopBtn").onclick = () => transport("loop");
document.getElementById("demoBtn").onclick = useStarterSong; document.getElementById("helpBtn").onclick = () => setHelp(true); document.getElementById("closeHelp").onclick = () => setHelp(false);
document.getElementById("saveSessionBtn").onclick = exportSession; document.getElementById("importSessionInput").onchange = (event) => importSession(event.target.files[0]); document.getElementById("exportVideoBtn").onclick = exportPerformanceVideo;
document.getElementById("helpOverlay").addEventListener("click", (event) => { if (event.target.id === "helpOverlay") setHelp(false); });
document.getElementById("volume").oninput = (event) => { document.getElementById("volumeValue").textContent = `${event.target.value}%`; if (masterGain) masterGain.gain.setTargetAtTime(Number(event.target.value) / 100, audioContext.currentTime, 0.02); };

// Disable right-click and long-press menus inside the app
document.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});

// Prevent accidental element dragging
document.addEventListener("dragstart", (event) => {
  event.preventDefault();
});

// Prevent accidental double-click zoom
document.addEventListener(
  "dblclick",
  (event) => {
    event.preventDefault();
  },
  { passive: false }
);
updateScreen(); updateTapeUI();
