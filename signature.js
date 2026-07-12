/**
 * Gestion des deux zones de signature.
 *
 * Nécessite la bibliothèque Signature Pad chargée dans index.html.
 */

window.OTJVSignature = (() => {
  let signaturePads = [];

  function resizeCanvas(canvas) {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rectangle = canvas.getBoundingClientRect();

    canvas.width = rectangle.width * ratio;
    canvas.height = 160 * ratio;

    const context = canvas.getContext("2d");
    context.scale(ratio, ratio);
  }

  function createSignaturePad({
    canvasId,
    clearButtonId,
    stateKey,
    state,
    saveState,
  }) {
    const canvas = document.getElementById(canvasId);
    const clearButton = document.getElementById(clearButtonId);

    if (!canvas) {
      throw new Error(`Canvas de signature introuvable : ${canvasId}`);
    }

    resizeCanvas(canvas);

    const pad = new SignaturePad(canvas, {
      minWidth: 1,
      maxWidth: 2.5,
      penColor: "#172033",
      backgroundColor: "rgba(255,255,255,0)",
    });

    if (state[stateKey]) {
      pad.fromDataURL(state[stateKey]).catch((error) => {
        console.error(
          `Impossible de restaurer la signature ${stateKey}.`,
          error
        );
      });
    }

    pad.addEventListener("endStroke", () => {
      state[stateKey] = pad.toDataURL("image/png");
      saveState();
    });

    if (clearButton) {
      clearButton.addEventListener("click", () => {
        pad.clear();
        state[stateKey] = "";
        saveState();
      });
    }

    signaturePads.push({
      pad,
      stateKey,
    });
  }

  function setup(state, saveState) {
    signaturePads = [];

    createSignaturePad({
      canvasId: "sigCoached",
      clearButtonId: "clearCoached",
      stateKey: "coachedSignature",
      state,
      saveState,
    });

    createSignaturePad({
      canvasId: "sigCoach",
      clearButtonId: "clearCoach",
      stateKey: "coachSignature",
      state,
      saveState,
    });
  }

  function capture(state, saveState) {
    signaturePads.forEach(({ pad, stateKey }) => {
      if (!pad.isEmpty()) {
        state[stateKey] = pad.toDataURL("image/png");
      }
    });

    saveState();
  }

  function hasBothSignatures(state) {
    return Boolean(
      state.coachedSignature &&
      state.coachSignature
    );
  }

  function requireBothSignatures(state, saveState) {
    capture(state, saveState);

    if (!hasBothSignatures(state)) {
      alert(
        "La signature de la personne coachée et celle du coach sont nécessaires."
      );

      return false;
    }

    return true;
  }

  return {
    setup,
    capture,
    hasBothSignatures,
    requireBothSignatures,
  };
})();
