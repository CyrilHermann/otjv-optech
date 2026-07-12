const THEMES = window.OTJV_THEMES;
const app = document.getElementById("app");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");

const STORAGE_KEY = "otjv-optech-draft-v1";

const initial = {
  step: 0,
  activity: "",
  location: "",
  coachedName: "",
  coachName: "",
  timestamp: new Date().toISOString(),
  answers: {},
  comment: "",
  coachedSignature: "",
  coachSignature: "",
};

let state = loadState();

/**
 * Charge le brouillon enregistré dans le navigateur.
 */
function loadState() {
  try {
    const savedState = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "{}"
    );

    return {
      ...initial,
      ...savedState,
      answers: savedState.answers || {},
    };
  } catch (error) {
    console.error(
      "Impossible de charger le brouillon.",
      error
    );

    return {
      ...initial,
      answers: {},
    };
  }
}

/**
 * Sauvegarde le coaching dans le navigateur.
 */
function saveState() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(state)
    );
  } catch (error) {
    console.error(
      "Impossible de sauvegarder le brouillon.",
      error
    );
  }
}

/**
 * Protège les textes insérés dans le HTML.
 */
function esc(value = "") {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character]
  );
}

/**
 * Met à jour la barre de progression.
 */
function setProgress() {
  const totalSteps = THEMES.length + 3;

  const percentage = Math.min(
    100,
    (state.step / totalSteps) * 100
  );

  progressBar.style.width = `${percentage}%`;

  if (state.step === 0) {
    progressText.textContent = "Préparation";
    return;
  }

  if (state.step <= THEMES.length + 1) {
    progressText.textContent =
      `Étape ${state.step} sur ${THEMES.length + 2}`;
    return;
  }

  progressText.textContent = "Finalisation";
}

/**
 * Affiche la page correspondant à l'étape actuelle.
 */
function render() {
  setProgress();

  if (state.step === 0) {
    renderHome();
    return;
  }

  if (state.step === 1) {
    renderPerson();
    return;
  }

  if (
    state.step >= 2 &&
    state.step < THEMES.length + 2
  ) {
    renderTheme(state.step - 2);
    return;
  }

  renderSummary();
}

/**
 * Relie un champ à une propriété de l'état.
 */
function bindInput(id, key) {
  const element = document.getElementById(id);

  if (!element) {
    return;
  }

  element.addEventListener("input", (event) => {
    state[key] = event.target.value;
    saveState();
  });
}

/**
 * Affiche un message d'erreur dans une zone.
 */
function showAlert(containerId, message) {
  const container =
    document.getElementById(containerId);

  if (!container) {
    return;
  }

  container.innerHTML = `
    <div class="alert">
      ${esc(message)}
    </div>
  `;
}

/**
 * Page d'accueil : activité et emplacement.
 */
function renderHome() {
  app.innerHTML = `
    <section class="card">
      <div class="hero">
        <div class="hero-icon">⚙️</div>

        <h1>OTJV OPTECH</h1>

        <p>Coaching technique — Étape 2</p>
      </div>

      <div class="grid">
        <div class="field">
          <label for="activity">
            Activité
          </label>

          <input
            id="activity"
            value="${esc(state.activity)}"
            placeholder="Ex. Maintenance préventive"
            autocomplete="off"
          >
        </div>

        <div class="field">
          <label for="location">
            Emplacement
          </label>

          <input
            id="location"
            value="${esc(state.location)}"
            placeholder="Ex. Ligne 4"
            autocomplete="off"
          >
        </div>
      </div>

      <div id="homeAlert"></div>

      <div class="actions">
        <span></span>

        <button
          type="button"
          class="btn btn-primary"
          id="continue"
        >
          Continuer →
        </button>
      </div>
    </section>
  `;

  bindInput("activity", "activity");
  bindInput("location", "location");

  document
    .getElementById("continue")
    .addEventListener("click", () => {
      if (
        !state.activity.trim() ||
        !state.location.trim()
      ) {
        showAlert(
          "homeAlert",
          "Renseigne l’activité et l’emplacement."
        );

        return;
      }

      /*
       * L'horodatage est enregistré au moment
       * où le coaching est réellement commencé.
       */
      state.timestamp = new Date().toISOString();
      state.step = 1;

      saveState();
      render();
    });
}

/**
 * Page d'identification de la personne coachée.
 */
function renderPerson() {
  const date = new Date(state.timestamp);

  app.innerHTML = `
    <section class="card">
      <div class="theme-head">
        <div class="badge">👤</div>

        <div>
          <h2>Informations du coaching</h2>

          <p>
            ${esc(date.toLocaleString("fr-FR"))}
          </p>
        </div>
      </div>

      <div class="grid">
        <div class="field">
          <label for="coached">
            Personne coachée
          </label>

          <input
            id="coached"
            value="${esc(state.coachedName)}"
            placeholder="Nom et prénom"
            autocomplete="off"
          >
        </div>

        <div class="field">
          <label for="coach">
            Coach
          </label>

          <input
            id="coach"
            value="${esc(state.coachName)}"
            placeholder="Nom et prénom"
            autocomplete="off"
          >
        </div>
      </div>

      <div id="personAlert"></div>

      <div class="actions">
        <button
          type="button"
          class="btn btn-secondary"
          id="back"
        >
          ← Retour
        </button>

        <button
          type="button"
          class="btn btn-primary"
          id="start"
        >
          Commencer le coaching →
        </button>
      </div>
    </section>
  `;

  bindInput("coached", "coachedName");
  bindInput("coach", "coachName");

  document
    .getElementById("back")
    .addEventListener("click", () => {
      state.step = 0;

      saveState();
      render();
    });

  document
    .getElementById("start")
    .addEventListener("click", () => {
      if (!state.coachedName.trim()) {
        showAlert(
          "personAlert",
          "Renseigne le nom de la personne coachée."
        );

        return;
      }

      state.step = 2;

      saveState();
      render();
    });
}

/**
 * Affiche une page de thème.
 */
function renderTheme(index) {
  const theme = THEMES[index];

  if (!theme) {
    state.step = THEMES.length + 2;
    saveState();
    render();
    return;
  }

  app.innerHTML = `
    <section class="card">
      <div class="theme-head">
        <div class="badge">
          ${esc(theme.number)}
        </div>

        <div>
          <h2>${esc(theme.title)}</h2>

          <p>
            ${theme.questions.length}
            question${theme.questions.length > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      ${theme.questions
        .map((question) => questionHtml(question))
        .join("")}

      <div id="themeAlert"></div>

      <div class="actions">
        <button
          type="button"
          class="btn btn-secondary"
          id="back"
        >
          ← Précédent
        </button>

        <button
          type="button"
          class="btn btn-primary"
          id="next"
        >
          ${
            index === THEMES.length - 1
              ? "Voir le résultat"
              : "Suivant"
          }
          →
        </button>
      </div>
    </section>
  `;

  document
    .querySelectorAll(".score")
    .forEach((button) => {
      button.addEventListener("click", () => {
        state.answers[button.dataset.q] =
          button.dataset.val;

        saveState();
        renderTheme(index);
      });
    });

  document
    .getElementById("back")
    .addEventListener("click", () => {
      state.step -= 1;

      saveState();
      render();
    });

  document
    .getElementById("next")
    .addEventListener("click", () => {
      const missingQuestions =
        OTJVData.getMissingQuestions(
          theme,
          state.answers
        );

      if (missingQuestions.length > 0) {
        showAlert(
          "themeAlert",
          "Réponds à toutes les questions, y compris avec N/A si nécessaire."
        );

        return;
      }

      state.step += 1;

      saveState();
      render();
    });
}

/**
 * Génère le HTML d'une question.
 */
function questionHtml(question) {
  const options = OTJVData.SCORE_OPTIONS;

  return `
    <div class="question">
      <div class="question-title">
        <span class="qid">
          ${esc(question.id)}.
        </span>

        ${esc(question.text)}
      </div>

      <div class="score-options">
        ${options
          .map((option) => {
            const selected =
              state.answers[question.id] ===
              option.value;

            return `
              <button
                type="button"
                class="
                  score
                  ${option.cssClass}
                  ${selected ? "selected" : ""}
                "
                data-q="${esc(question.id)}"
                data-val="${esc(option.value)}"
                aria-pressed="${selected}"
              >
                ${esc(option.label)}

                <small>
                  ${esc(option.pointsLabel)}
                </small>
              </button>
            `;
          })
          .join("")}
      </div>
    </div>
  `;
}

/**
 * Retourne les résultats du coaching.
 */
function totals() {
  return OTJVData.calculateTotals(
    state.answers
  );
}

/**
 * Formate un nombre en français.
 */
function fmt(number) {
  return OTJVData.formatNumber(number);
}

/**
 * Affiche la page de résultat et de signatures.
 */
function renderSummary() {
  const results = totals();

  app.innerHTML = `
    <section class="card">
      <div class="theme-head">
        <div class="badge">✓</div>

        <div>
          <h2>Résultat du coaching</h2>

          <p>
            Vérification, commentaire et signatures
          </p>
        </div>
      </div>

      <div class="result-box">
        <div class="result-score">
          ${fmt(results.total)}
          /
          ${fmt(results.possible)}
        </div>

        <div class="result-percent">
          ${fmt(results.percent)} %
        </div>
      </div>

      <table class="summary-table">
        <thead>
          <tr>
            <th>Thème</th>
            <th>Score</th>
          </tr>
        </thead>

        <tbody>
          ${THEMES.map((theme, index) => {
            const score =
              results.scores[index];

            return `
              <tr>
                <td>
                  ${esc(theme.number)}.
                  ${esc(theme.title)}
                </td>

                <td>
                  ${
                    score === null
                      ? "N/A"
                      : `${fmt(score)} / 2,5`
                  }
                </td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>

      <div class="field">
        <label for="comment">
          Commentaire
        </label>

        <textarea
          id="comment"
          placeholder="Observations générales et axes d’amélioration…"
        >${esc(state.comment)}</textarea>
      </div>

      <div class="sign-grid">
        <div class="signature-box">
          <h3>
            Signature de la personne coachée
          </h3>

          <canvas id="sigCoached"></canvas>

          <div class="signature-actions">
            <button
              type="button"
              class="link-btn"
              id="clearCoached"
            >
              Effacer
            </button>
          </div>
        </div>

        <div class="signature-box">
          <h3>
            Signature du coach
          </h3>

          <canvas id="sigCoach"></canvas>

          <div class="signature-actions">
            <button
              type="button"
              class="link-btn"
              id="clearCoach"
            >
              Effacer
            </button>
          </div>
        </div>
      </div>

      <div class="export-grid">
        <button
          type="button"
          class="btn btn-success"
          id="excel"
        >
          Télécharger Excel
        </button>

        <button
          type="button"
          class="btn btn-danger"
          id="pdf"
        >
          Télécharger PDF
        </button>
      </div>

      <div class="actions">
        <button
          type="button"
          class="btn btn-secondary"
          id="back"
        >
          ← Modifier
        </button>

        <button
          type="button"
          class="btn btn-secondary"
          id="new"
        >
          Nouveau coaching
        </button>
      </div>

      <p class="note">
        Les données restent uniquement dans ce
        navigateur jusqu’au téléchargement. Elles
        ne sont envoyées vers aucun serveur.
      </p>
    </section>
  `;

  bindInput("comment", "comment");

  setupSignatures();

  document
    .getElementById("back")
    .addEventListener("click", () => {
      captureSignatures();

      state.step = THEMES.length + 1;

      saveState();
      render();
    });

  document
    .getElementById("new")
    .addEventListener("click", () => {
      const confirmed = window.confirm(
        "Effacer ce coaching et recommencer ?"
      );

      if (!confirmed) {
        return;
      }

      localStorage.removeItem(STORAGE_KEY);

      state = {
        ...initial,
        timestamp: new Date().toISOString(),
        answers: {},
      };

      render();
    });

  document
    .getElementById("excel")
    .addEventListener("click", exportExcel);

  document
    .getElementById("pdf")
    .addEventListener("click", exportPdf);
}

/**
 * Initialise les deux zones de signature.
 */
function setupSignatures() {
  OTJVSignature.setup(
    state,
    saveState
  );
}

/**
 * Enregistre les signatures dans l'état.
 */
function captureSignatures() {
  OTJVSignature.capture(
    state,
    saveState
  );
}

/**
 * Vérifie que les deux signatures sont présentes.
 */
function requireSignatures() {
  return OTJVSignature.requireBothSignatures(
    state,
    saveState
  );
}

/**
 * Génère le fichier Excel.
 */
async function exportExcel() {
  if (!requireSignatures()) {
    return;
  }

  await OTJVExcel.downloadSafely(state);
}

/**
 * Génère le fichier PDF.
 */
function exportPdf() {
  if (!requireSignatures()) {
    return;
  }

  OTJVPdf.downloadSafely(state);
}

/**
 * Vérifie que les modules nécessaires sont chargés.
 */
function checkDependencies() {
  const missingDependencies = [];

  if (!Array.isArray(THEMES)) {
    missingDependencies.push("questions.js");
  }

  if (!window.OTJVData) {
    missingDependencies.push("data.js");
  }

  if (!window.OTJVSignature) {
    missingDependencies.push("signature.js");
  }

  if (!window.OTJVExcel) {
    missingDependencies.push("excel.js");
  }

  if (!window.OTJVPdf) {
    missingDependencies.push("pdf.js");
  }

  if (missingDependencies.length === 0) {
    return true;
  }

  app.innerHTML = `
    <section class="card">
      <div class="alert">
        Certains fichiers nécessaires ne sont pas
        chargés :
        ${esc(missingDependencies.join(", "))}.
      </div>
    </section>
  `;

  console.error(
    "Dépendances manquantes :",
    missingDependencies
  );

  return false;
}

/**
 * Démarrage de l'application.
 */
if (checkDependencies()) {
  render();
}
