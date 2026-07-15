# PocketSynth

PocketSynth is an original browser instrument with a 24-key chromatic keyboard and a nine-layer performance tape.

## Quick start

Open `index.html` in a modern browser. Click **LOAD SONG**, then **PLAY ALL** to test the core audio, effects, tempo, transport, and layer controls.

The starter song loads Piano, C Major scale guidance, Space effect, and 100 BPM on Layer 1.

Engine choices: Piano, Organ, Glass, Bass, Pulse, Drums, Pluck, Noise, Pad, and Harmonic. Every layer stores the engine selected at the time it was recorded.

The Drum engine uses the same 24-key layout as a compact kit: Kick, Snare, Closed Hat, Open Hat, Clap, Rimshot, Floor/Low/Mid/High Toms, Crash, Ride, and Shaker. Its labels replace note names while Drums is selected. Pad is a slow, warm sustained chord sound. Harmonic layers gentle sine-wave overtones for a calm, bell-like ambient texture.

## Computer keyboard

| Function | Controls |
| --- | --- |
| Lower chromatic octave | `Z S X D C V G B H N J M` |
| Upper chromatic octave | `Q 2 W 3 E R 5 T 6 Y 7 U` |
| Select a layer | Numpad `1`–`9` |
| Play all layers | `Space` |
| Record selected layer / stop | `O` / `Escape` |
| Loop selected layer / erase it | `L` / `Backspace` |
| Open guide | `?` |

Tap **OCTAVE** to cycle C2–C4, C3–C5, C4–C6, and C5–C7. Scale notes glow green and C roots glow orange.

## Scale behavior

Scale selection is a real scale lock, not only a visual guide. Every melodic key is mapped into the selected scale before it reaches the sound engine, and the key labels update to the note that will sound. Each layer stores its raw key strokes plus its own scale, so changing the scale in that layer’s `•••` menu remaps that layer on playback without changing other layers. Drums intentionally ignore scale because their keys select kit pieces rather than pitched notes.

## Nine-layer tape

Select a layer card or use numpad `1`–`9`. Record always writes only to the selected layer. Other playing layers stay audible, and each layer has separate play and loop buttons.

1. Select Layer 1, record a phrase, stop, then enable its loop.
2. Select Layer 2 with its card or numpad `2`.
3. Record the next phrase: Layer 1 keeps playing, while only Layer 2 is captured.

**PLAY ALL** starts every non-empty layer. **STOP ALL** stops them. **ERASE** affects only the selected layer.

## Saved sessions and media export

**SAVE SESSION** downloads a JSON session file. It preserves all layers, note events, per-layer engine/scale/FX/BPM/level settings, loops, note-stroke visibility, the keyboard range, and the current sound controls. **LOAD SESSION** restores it.

**EXPORT MP4 / WEBM** plays the complete session into a lightweight visual performance video. PocketSynth requests MP4 when the active browser supports it; otherwise it automatically exports WebM, the reliable browser fallback.
