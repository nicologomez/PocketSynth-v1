function createKeys() {
  const keyboard =
    document.getElementById("keyboard");

  keyboard.innerHTML = chromaticNotes
    .map((note, index) => {
      const pc = noteToMidi(note) % 12;

      const isBlack = [
        1,
        3,
        6,
        8,
        10
      ].includes(pc);

      return `
        <button
          class="music-key ${
            isBlack ? "black-key" : "white-key"
          }"
          data-note="${note}"
          aria-label="Play ${note}"
        >
          <span>${note}</span>
          <kbd>
            ${PocketSynthConfig.keyboardMap[
              index
            ].toUpperCase()}
          </kbd>
        </button>
      `;
    })
    .join("");

  keyboard
    .querySelectorAll(".music-key")
    .forEach((key) => {
      const note = key.dataset.note;
      const source = `pointer:${note}`;

      key.addEventListener(
        "pointerdown",
        async (event) => {
          event.preventDefault();

          try {
            /*
              Safari and Chrome on iPad require audio
              to be activated directly from a tap.
            */
            await initAudio();

            key.setPointerCapture?.(
              event.pointerId
            );

            pressNote(note, source);
          } catch (error) {
            console.error(
              "Audio could not be activated.",
              error
            );
          }
        }
      );

      [
        "pointerup",
        "pointercancel",
        "lostpointercapture"
      ].forEach((type) => {
        key.addEventListener(type, () => {
          releaseNote(source);
        });
      });
    });
}

let visibleLayerCount = 5;

function layerSettingsMenu(layer) {
  const optionList = (items, selected) =>
    Object.keys(items)
      .map(
        (name) =>
          `<option
            value="${name}"
            ${name === selected ? "selected" : ""}
          >
            ${name}
          </option>`
      )
      .join("");

  return `
    <div
      class="layer-menu"
      hidden
      data-layer-menu="${layer.index}"
    >
      <label>
        ENGINE
        <select
          data-layer-setting="instrumentName"
          data-layer="${layer.index}"
        >
          ${optionList(
            Instruments,
            layer.settings.instrumentName
          )}
        </select>
      </label>

      <label>
        SCALE
        <select
          data-layer-setting="scaleName"
          data-layer="${layer.index}"
        >
          ${optionList(
            Scales,
            layer.settings.scaleName
          )}
        </select>
      </label>

      <label>
        FX
        <select
          data-layer-setting="effectName"
          data-layer="${layer.index}"
        >
          ${optionList(
            Effects,
            layer.settings.effectName
          )}
        </select>
      </label>

      <label>
        BPM
        <input
          data-layer-setting="tempo"
          data-layer="${layer.index}"
          type="number"
          min="50"
          max="180"
          value="${layer.settings.tempo}"
        >
      </label>

      <label>
        LEVEL
        <input
          data-layer-setting="volume"
          data-layer="${layer.index}"
          type="range"
          min="0"
          max="1.25"
          step="0.05"
          value="${layer.settings.volume}"
        >
      </label>

      <label class="stroke-toggle">
        <input
          data-strokes="${layer.index}"
          type="checkbox"
          ${layer.showStrokes ? "checked" : ""}
        >
        SHOW NOTE STROKES
      </label>
    </div>
  `;
}

function createLayerControls() {
  const grid =
    document.getElementById("layerGrid");

  grid.innerHTML =
    recorder.layers
      .slice(0, visibleLayerCount)
      .map(
        (layer) => `
          <article
            class="layer"
            data-layer="${layer.index}"
          >
            <button
              class="layer-select"
              data-layer-select="${layer.index}"
            >
              <span>${layer.name}</span>
              <b>NUM ${layer.index + 1}</b>
              <em>
                ${
                  layer.events.length
                    ? "RECORDED"
                    : "EMPTY"
                }
              </em>
            </button>

            <button
              class="layer-play"
              data-layer-play="${layer.index}"
              aria-label="Play layer ${
                layer.index + 1
              }"
            >
              ▶
            </button>

            <button
              class="layer-loop"
              data-layer-loop="${layer.index}"
              aria-label="Loop layer ${
                layer.index + 1
              }"
            >
              ↻
            </button>

            <button
              class="layer-more"
              data-layer-more="${layer.index}"
              aria-label="Layer ${
                layer.index + 1
              } options"
            >
              •••
            </button>

            <div class="layer-progress">
              <i
                style="width:${
                  layer.playing
                    ? layer.progress * 100
                    : 0
                }%"
              ></i>
            </div>

            ${
              layer.showStrokes
                ? `
                  <div class="stroke-strip">
                    ${
                      [
                        ...new Set(
                          layer.events
                            .filter(
                              (event) =>
                                event.type === "on"
                            )
                            .map((event) =>
                              layerEventNote(
                                event,
                                layer
                              )
                            )
                        )
                      ]
                        .map(
                          (note) =>
                            `<span>${note}</span>`
                        )
                        .join("") || "NO NOTES"
                    }
                  </div>
                `
                : ""
            }

            ${layerSettingsMenu(layer)}
          </article>
        `
      )
      .join("") +
    `
      <div class="layer-count">
        <button
          id="removeLayerView"
          ${
            visibleLayerCount <= 5
              ? "disabled"
              : ""
          }
        >
          −
        </button>

        <b>${visibleLayerCount}/9</b>

        <button
          id="addLayerView"
          ${
            visibleLayerCount >= 9
              ? "disabled"
              : ""
          }
        >
          +
        </button>
      </div>
    `;

  grid
    .querySelectorAll("[data-layer-select]")
    .forEach((button) => {
      button.onclick = () =>
        selectLayer(
          Number(button.dataset.layerSelect)
        );
    });

  grid
    .querySelectorAll("[data-layer-play]")
    .forEach((button) => {
      button.onclick = () =>
        playLayer(
          Number(button.dataset.layerPlay)
        );
    });

  grid
    .querySelectorAll("[data-layer-loop]")
    .forEach((button) => {
      button.onclick = () =>
        toggleLayerLoop(
          Number(button.dataset.layerLoop)
        );
    });

  grid
    .querySelectorAll("[data-layer-more]")
    .forEach((button) => {
      button.onclick = () => {
        const menu = grid.querySelector(
          `[data-layer-menu="${button.dataset.layerMore}"]`
        );

        menu.hidden = !menu.hidden;
      };
    });

  grid
    .querySelectorAll("[data-layer-setting]")
    .forEach((input) => {
      input.oninput = () => {
        const layer =
          recorder.layers[
            Number(input.dataset.layer)
          ];

        const key =
          input.dataset.layerSetting;

        layer.settings[key] =
          key === "tempo" ||
          key === "volume"
            ? Number(input.value)
            : input.value;

        updateTapeUI();
      };
    });

  grid
    .querySelectorAll("[data-strokes]")
    .forEach((input) => {
      input.oninput = () => {
        recorder.layers[
          Number(input.dataset.strokes)
        ].showStrokes = input.checked;

        createLayerControls();
        updateTapeUI();
      };
    });

  document.getElementById(
    "addLayerView"
  ).onclick = () => {
    visibleLayerCount = Math.min(
      9,
      visibleLayerCount + 1
    );

    createLayerControls();
    updateTapeUI();
  };

  document.getElementById(
    "removeLayerView"
  ).onclick = () => {
    visibleLayerCount = Math.max(
      5,
      visibleLayerCount - 1
    );

    createLayerControls();
    updateTapeUI();
  };
}

function updateTapeUI() {
  const layer = activeLayer();

  const status = recorder.recording
    ? `REC LAYER ${
        recorder.recordingLayer + 1
      } · ${layer.events.length} EVENTS`
    : layer.playing
      ? `PLAY LAYER ${
          layer.index + 1
        } · ${Math.round(
          layer.progress * 100
        )}%`
      : layer.events.length
        ? `LAYER ${
            layer.index + 1
          } READY · ${
            layer.events.length
          } EVENTS`
        : `LAYER ${
            layer.index + 1
          } EMPTY`;

  document.getElementById(
    "tapeStatus"
  ).textContent = status;

  document.getElementById(
    "tapeFill"
  ).style.width = `${
    layer.playing
      ? Math.min(
          100,
          layer.progress * 100
        )
      : 0
  }%`;

  document
    .getElementById("recBtn")
    .classList.toggle(
      "lit-red",
      recorder.recording
    );

  document
    .getElementById("playBtn")
    .classList.toggle(
      "lit-green",
      recorder.layers.some(
        (item) => item.playing
      )
    );

  document
    .getElementById("loopBtn")
    .classList.toggle(
      "lit-blue",
      layer.looping
    );

  document.getElementById(
    "playBtn"
  ).disabled = !recorder.layers.some(
    (item) => item.events.length
  );

  document.getElementById(
    "eraseBtn"
  ).disabled =
    !layer.events.length &&
    !recorder.recording;

  document
    .querySelectorAll(".layer")
    .forEach((item) => {
      const itemLayer =
        recorder.layers[
          Number(item.dataset.layer)
        ];

      item.classList.toggle(
        "selected",
        itemLayer.index ===
          recorder.activeLayer
      );

      item.classList.toggle(
        "has-audio",
        Boolean(itemLayer.events.length)
      );

      item.classList.toggle(
        "is-playing",
        itemLayer.playing
      );

      item.classList.toggle(
        "is-looping",
        itemLayer.looping
      );

      item.querySelector(
        ".layer-progress i"
      ).style.width = `${
        itemLayer.playing
          ? itemLayer.progress * 100
          : 0
      }%`;
    });
}

function setHelp(open) {
  document.getElementById(
    "helpOverlay"
  ).hidden = !open;

  if (open) {
    document
      .getElementById("helpOverlay")
      .focus();
  }
}

function updateScreen() {
  document.getElementById(
    "screenInstrument"
  ).textContent =
    currentInstrumentName.toUpperCase();

  document.getElementById(
    "screenScale"
  ).textContent =
    `${currentScaleName.toUpperCase()} / C`;

  document.getElementById(
    "screenEffect"
  ).textContent =
    currentEffectName.toUpperCase();

  document.getElementById(
    "screenTempo"
  ).textContent = `${tempo} BPM`;

  document.getElementById(
    "screenRange"
  ).textContent =
    currentOctaveRange().label;

  document.getElementById(
    "octaveBtn"
  ).innerHTML =
    `OCTAVE<br><b>${
      currentOctaveRange().label
    }</b>`;

  document.getElementById(
    "tempoSlider"
  ).value = tempo;

  refreshKeyboard();
}
