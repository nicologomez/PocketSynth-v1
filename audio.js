let audioContext;
let masterGain;
let synth;
let recordDestination;
let effectInputs = {};

function createImpulse(seconds) {
  const impulse = audioContext.createBuffer(
    2,
    audioContext.sampleRate * seconds,
    audioContext.sampleRate
  );

  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);

    for (let i = 0; i < data.length; i++) {
      data[i] =
        (Math.random() * 2 - 1) *
        (1 - i / data.length) ** 2.5;
    }
  }

  return impulse;
}

async function initAudio() {
  if (!audioContext) {
    audioContext = new (
      window.AudioContext ||
      window.webkitAudioContext
    )();

    masterGain = audioContext.createGain();
    masterGain.gain.value =
      Number(document.getElementById("volume").value) / 100;

    masterGain.connect(audioContext.destination);

    try {
      recordDestination =
        audioContext.createMediaStreamDestination();

      masterGain.connect(recordDestination);
    } catch (error) {
      console.warn("Recording is unavailable on this browser.", error);
    }

    effectInputs.Clean = audioContext.createGain();
    effectInputs.Clean.connect(masterGain);

    effectInputs.Space = audioContext.createGain();

    const reverb = audioContext.createConvolver();
    const reverbWet = audioContext.createGain();

    reverb.buffer = createImpulse(1.8);
    reverbWet.gain.value = 0.34;

    effectInputs.Space.connect(masterGain);
    effectInputs.Space
      .connect(reverb)
      .connect(reverbWet)
      .connect(masterGain);

    effectInputs.Echo = audioContext.createGain();

    const delay = audioContext.createDelay(1);
    const feedback = audioContext.createGain();
    const echoWet = audioContext.createGain();

    delay.delayTime.value = 0.31;
    feedback.gain.value = 0.34;
    echoWet.gain.value = 0.4;

    effectInputs.Echo.connect(masterGain);
    effectInputs.Echo.connect(delay);
    delay.connect(feedback).connect(delay);
    delay.connect(echoWet).connect(masterGain);

    effectInputs.Motion = audioContext.createGain();

    const chorus = audioContext.createDelay(0.08);
    const lfo = audioContext.createOscillator();
    const depth = audioContext.createGain();
    const chorusWet = audioContext.createGain();

    chorus.delayTime.value = 0.024;
    lfo.frequency.value = 1.3;
    depth.gain.value = 0.012;
    chorusWet.gain.value = 0.42;

    lfo.connect(depth).connect(chorus.delayTime);
    effectInputs.Motion.connect(masterGain);
    effectInputs.Motion
      .connect(chorus)
      .connect(chorusWet)
      .connect(masterGain);

    lfo.start();

    synth = new Synth(audioContext, effectInputs.Clean);
  }

  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  return audioContext;
}

function setEffect(name) {
  currentEffectName = name;
}

async function startNote(
  note,
  voiceId = note,
  settings = getCurrentSettings()
) {
  await initAudio();

  const instrument =
    Instruments[settings.instrumentName] ||
    currentInstrument;

  synth.start(
    note,
    voiceId,
    instrument,
    effectInputs[settings.effectName] ||
      effectInputs.Clean,
    Number(settings.volume ?? 1)
  );
}

function stopNote(note, voiceId = note, force = false) {
  if (synth) {
    synth.stop(voiceId, force);
  }
}

/*
  iPad and iPhone audio unlock.
  The first tap enables the Web Audio context.
*/
async function unlockAudio() {
  try {
    await initAudio();
  } catch (error) {
    console.error("Audio could not start:", error);
  }
}

document.addEventListener("pointerdown", unlockAudio, {
  once: true,
  passive: true
});

document.addEventListener("touchstart", unlockAudio, {
  once: true,
  passive: true
});
