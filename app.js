const THEMES = window.OTJV_THEMES;

const app = document.getElementById("app");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");

const STORAGE_KEY = "otjv-optech-draft-v3";

const initialState = {
  step: 0,

  level: "",

  activity: "",
  activityEntryMode: "list",

  location: "",

  coachedName: "",
  coachedEntryMode: "list",

  coachName: "",

  timestamp: new Date().toISOString(),

  answers: {},

  comment: "",

  coachedSignature: "",
  coachSignature: "",
};

let state = loadState();

/**
 * Charge le brouillon sauvegardé dans le navigateur.
 */
function loadState() {
  try {
    const savedState = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "{}"
    );

    return {
      ...initialState,
      ...savedState,

      answers:
        savedState.answers &&
        typeof savedState.answers === "object"
          ? savedState.answers
          : {},
    };
  } catch (error) {
    console.error(
      "Impossible de charger le brouillon.",
      error
    );

    return {
      ...initialState,
      timestamp: new Date().toISOString(),
      answers: {},
    };
  }
}

/**
 * Sauvegarde l'état actuel du coaching.
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
 * Trie une liste de textes par ordre alphabétique français.
 */
function sortAlphabetically(values) {
  return [...values].sort(
    (firstValue, secondValue) =>
      firstValue.localeCompare(
        secondValue,
        "fr",
        {
          sensitivity: "base",
          ignorePunctuation: true,
        }
      )
  );
}

/**
 * Retourne les niveaux disponibles.
 */
function getLevels() {
  return Array.isArray(
    window.OTJV_LISTS?.levels
  )
    ? window.OTJV_LISTS.levels
    : [];
}

/**
 * Retourne la liste alphabétique des personnes coachées.
 */
function getCoachedPeople() {
  const people = Array.isArray(
    window.OTJV_LISTS?.coachedPeople
  )
    ? window.OTJV_LISTS.coachedPeople
    : [];

  return sortAlphabetically(people);
}

/**
 * Retourne les activités correspondant au niveau choisi.
 */
function getActivitiesByLevel(level) {
  const activities = Array.isArray(
    window.OTJV_LISTS?.activities
  )
    ? window.OTJV_LISTS.activities
    : [];

  return activities
    .filter((activity) => {
      if (!level) {
        return true;
      }

      return activity.level === level;
    })
    .map((activity) => activity.name)
    .sort(
      (firstActivity, secondActivity) =>
        firstActivity.localeCompare(
          secondActivity,
          "fr",
          {
            sensitivity: "base",
            ignorePunctuation: true,
          }
        )
    );
}

/**
 * Génère les options d'un select.
 */
function createSelectOptions(
  values,
  selectedValue
) {
  return values
    .map(
      (value) => `
        <option
          value="${esc(value)}"
          ${
            selectedValue === value
              ? "selected"
              : ""
          }
        >
          ${esc(value)}
        </option>
      `
    )
    .join("");
}

/**
 * Génère les options de la liste des niveaux.
 */
function createLevelOptions() {
  return getLevels()
    .map(
      (level) => `
        <option
          value="${esc(level.value)}"
          ${
            state.level === level.value
              ? "selected"
              : ""
          }
        >
          ${esc(level.label)}
        </option>
      `
    )
    .join("");
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

  if (progressBar) {
    progressBar.style.width =
      `${percentage}%`;
  }

  if (!progressText) {
    return;
  }

  if (state.step === 0) {
    progressText.textContent =
      "Préparation";

    return;
  }

  if (state.step === 1) {
    progressText.textContent =
      "Identification";

    return;
  }

  if (
    state.step >= 2 &&
    state.step < THEMES.length + 2
  ) {
    const currentTheme =
      state.step - 1;

    progressText.textContent =
      `Thème ${currentTheme} sur ${THEMES.length}`;

    return;
  }

  progressText.textContent =
    "Finalisation";
}

/**
 * Recommence entièrement le coaching.
 */
function resetCoaching() {
  const confirmed = window.confirm(
    "Voulez-vous vraiment recommencer le coaching ?\n\n" +
    "Toutes les données, réponses, signatures et commentaires seront supprimés."
  );

  if (!confirmed) {
    return;
  }

  localStorage.removeItem(
    STORAGE_KEY
  );

  state = {
    ...initialState,

    step: 0,

    level: "",

    activity: "",
    activityEntryMode: "list",

    location: "",

    coachedName: "",
    coachedEntryMode: "list",

    coachName: "",

    timestamp:
      new Date().toISOString(),

    answers: {},

    comment: "",

    coachedSignature: "",
    coachSignature: "",
  };

  saveState();
  render();

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
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
    state.step <
      THEMES.length + 2
  ) {
    renderTheme(
      state.step - 2
    );

    return;
  }

  renderSummary();
}

/**
 * Relie un champ texte à une propriété de state.
 */
function bindInput(id, key) {
  const element =
    document.getElementById(id);

  if (!element) {
    return;
  }

  element.addEventListener(
    "input",
    (event) => {
      state[key] =
        event.target.value;

      saveState();
    }
  );
}

/**
 * Affiche un message d'erreur.
 */
function showAlert(
  containerId,
  message
) {
  const container =
    document.getElementById(
      containerId
    );

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
 * Page d'accueil.
 */
function renderHome() {
  const activities =
    getActivitiesByLevel(
      state.level
    );

  const activityIsInList =
    activities.includes(
      state.activity
    );

  if (
    state.activity &&
    !activityIsInList &&
    state.activityEntryMode !==
      "manual"
  ) {
    state.activityEntryMode =
      "manual";
  }

  app.innerHTML = `
    <section class="card">
      <div class="hero">
        <div class="hero-icon">
          ⚙️
        </div>

        <h1>OTJV OPTECH</h1>

        <p>
          Coaching technique — Étape 2
        </p>
      </div>

      <div class="grid">
        <div class="field">
          <label for="level">
            Niveau de l’activité
          </label>

          <select id="level">
            <option value="">
              Sélectionner un niveau
            </option>

            ${createLevelOptions()}
          </select>

          <small class="field-help">
            Basic correspond au niveau 1
            et Intermediate au niveau 2.
          </small>
        </div>

        <div class="field">
          <label for="activitySelect">
            Activité
          </label>

          <select
            id="activitySelect"
            ${
              !state.level
                ? "disabled"
                : ""
            }
          >
            <option value="">
              ${
                state.level
                  ? "Sélectionner une activité"
                  : "Choisir d’abord un niveau"
              }
            </option>

            ${createSelectOptions(
              activities,
              state.activityEntryMode ===
                "list"
                ? state.activity
                : ""
            )}

            <option
              value="__manual__"
              ${
                state.activityEntryMode ===
                "manual"
                  ? "selected"
                  : ""
              }
            >
              Autre — saisir manuellement
            </option>
          </select>

          ${
            state.activityEntryMode ===
            "manual"
              ? `
                <input
                  id="activityManual"
                  type="text"
                  value="${esc(
                    state.activity
                  )}"
                  placeholder="Écrire l’activité"
                  autocomplete="off"
                >
              `
              : ""
          }

          <small class="field-help">
            ${
              state.level
                ? `${activities.length} activité(s) disponible(s) pour le niveau ${esc(
                    state.level
                  )}.`
                : "La liste sera filtrée après la sélection du niveau."
            }
          </small>
        </div>

        <div class="field">
          <label for="location">
            Emplacement
          </label>

          <input
            id="location"
            type="text"
            value="${esc(
              state.location
            )}"
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

  bindInput(
    "location",
    "location"
  );

  const levelSelect =
    document.getElementById(
      "level"
    );

  levelSelect?.addEventListener(
    "change",
    (event) => {
      state.level =
        event.target.value;

      state.activity = "";
      state.activityEntryMode =
        "list";

      saveState();
      renderHome();
    }
  );

  const activitySelect =
    document.getElementById(
      "activitySelect"
    );

  activitySelect?.addEventListener(
    "change",
    (event) => {
      const selectedValue =
        event.target.value;

      if (
        selectedValue ===
        "__manual__"
      ) {
        state.activityEntryMode =
          "manual";

        state.activity = "";

        saveState();
        renderHome();

        return;
      }

      state.activityEntryMode =
        "list";

      state.activity =
        selectedValue;

      saveState();
    }
  );

  const activityManual =
    document.getElementById(
      "activityManual"
    );

  activityManual?.addEventListener(
    "input",
    (event) => {
      state.activity =
        event.target.value;

      saveState();
    }
  );

  const continueButton =
    document.getElementById(
      "continue"
    );

  continueButton?.addEventListener(
    "click",
    () => {
      if (!state.level) {
        showAlert(
          "homeAlert",
          "Sélectionne le niveau Basic ou Intermediate."
        );

        return;
      }

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

      state.timestamp =
        new Date().toISOString();

      state.step = 1;

      saveState();
      render();
    }
  );
}

/**
 * Page d'identification du coaché et du coach.
 */
function renderPerson() {
  const date = new Date(
    state.timestamp
  );

  const coachedPeople =
    getCoachedPeople();

  const coachedPersonIsInList =
    coachedPeople.includes(
      state.coachedName
    );

  if (
    state.coachedName &&
    !coachedPersonIsInList &&
    state.coachedEntryMode !==
      "manual"
  ) {
    state.coachedEntryMode =
      "manual";
  }

  app.innerHTML = `
    <section class="card">
      <div class="theme-head">
        <div class="badge">
          👤
        </div>

        <div>
          <h2>
            Informations du coaching
          </h2>

          <p>
            ${esc(
              date.toLocaleString(
                "fr-FR"
              )
            )}
          </p>
        </div>
      </div>

      <div class="grid">
        <div class="field">
          <label for="coachedSelect">
            Personne coachée
          </label>

          <select id="coachedSelect">
            <option value="">
              Sélectionner une personne
            </option>

            ${createSelectOptions(
              coachedPeople,
              state.coachedEntryMode ===
                "list"
                ? state.coachedName
                : ""
            )}

            <option
              value="__manual__"
              ${
                state.coachedEntryMode ===
                "manual"
                  ? "selected"
                  : ""
              }
            >
              Autre — saisir manuellement
            </option>
          </select>

          ${
            state.coachedEntryMode ===
            "manual"
              ? `
                <input
                  id="coachedManual"
                  type="text"
                  value="${esc(
                    state.coachedName
                  )}"
                  placeholder="Nom et prénom"
                  autocomplete="off"
                >
              `
              : ""
          }

          <small class="field-help">
            Les personnes sont classées
            par ordre alphabétique.
          </small>
        </div>

        <div class="field">
          <label for="coach">
            Coach
          </label>

          <input
            id="coach"
            type="text"
            value="${esc(
              state.coachName
            )}"
            placeholder="Nom et prénom"
            autocomplete="off"
          >
        </div>
      </div>

      <div class="information-summary">
        <strong>
          Activité sélectionnée
        </strong>

        <span>
          ${esc(state.level)}
          —
          ${esc(state.activity)}
        </span>
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

  bindInput(
    "coach",
    "coachName"
  );

  const coachedSelect =
    document.getElementById(
      "coachedSelect"
    );

  coachedSelect?.addEventListener(
    "change",
    (event) => {
      const selectedValue =
        event.target.value;

      if (
        selectedValue ===
        "__manual__"
      ) {
        state.coachedEntryMode =
          "manual";

        state.coachedName = "";

        saveState();
        renderPerson();

        return;
      }

      state.coachedEntryMode =
        "list";

      state.coachedName =
        selectedValue;

      saveState();
    }
  );

  const coachedManual =
    document.getElementById(
      "coachedManual"
    );

  coachedManual?.addEventListener(
    "input",
    (event) => {
      state.coachedName =
        event.target.value;

      saveState();
    }
  );

  document
    .getElementById("back")
    ?.addEventListener(
      "click",
      () => {
        state.step = 0;

        saveState();
        render();
      }
    );

  document
    .getElementById("start")
    ?.addEventListener(
      "click",
      () => {
        if (
          !state.coachedName.trim()
        ) {
          showAlert(
            "personAlert",
            "Renseigne le nom de la personne coachée."
          );

          return;
        }

        state.step = 2;

        saveState();
        render();
      }
    );
}

/**
 * Affiche un thème.
 */
function renderTheme(index) {
  const theme = THEMES[index];

  if (!theme) {
    state.step =
      THEMES.length + 2;

    saveState();
    render();

    return;
  }

  const themeId =
    OTJVData.getThemeId(
      theme,
      index
    );

  const selectedValue =
    state.answers[themeId];

  app.innerHTML = `
    <section class="card">
      <div class="theme-head">
        <div class="badge">
          ${esc(theme.number)}
        </div>

        <div>
          <h2>
            ${esc(theme.title)}
          </h2>

          <p>
            Pose les questions ci-dessous,
            puis attribue une seule note
            globale au thème.
          </p>
        </div>
      </div>

      <div class="question-group">
        <h3>
          Questions à poser
        </h3>

        <div class="question-list">
          ${theme.questions
            .map(
              (question) => `
                <div class="question">
                  <div class="question-title">
                    <span class="qid">
                      ${esc(
                        question.id
                      )}.
                    </span>

                    ${esc(
                      question.text
                    )}
                  </div>
                </div>
              `
            )
            .join("")}
        </div>
      </div>

      <div class="theme-score-block">
        <h3>
          Note globale du thème
        </h3>

        <p>
          Sélectionne la note correspondant
          à l'ensemble des réponses du groupe.
        </p>

        <div class="score-options">
          ${OTJVData.SCORE_OPTIONS
            .map((option) => {
              const selected =
                selectedValue ===
                option.value;

              return `
                <button
                  type="button"
                  class="
                    score
                    ${option.cssClass}
                    ${
                      selected
                        ? "selected"
                        : ""
                    }
                  "
                  data-theme="${esc(
                    themeId
                  )}"
                  data-val="${esc(
                    option.value
                  )}"
                  aria-pressed="${selected}"
                >
                  ${esc(
                    option.label
                  )}

                  <small>
                    ${esc(
                      option.pointsLabel
                    )}
                  </small>
                </button>
              `;
            })
            .join("")}
        </div>
      </div>

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
            index ===
            THEMES.length - 1
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
      button.addEventListener(
        "click",
        () => {
          state.answers[
            button.dataset.theme
          ] = button.dataset.val;

          saveState();
          renderTheme(index);
        }
      );
    });

  document
    .getElementById("back")
    ?.addEventListener(
      "click",
      () => {
        state.step -= 1;

        saveState();
        render();
      }
    );

  document
    .getElementById("next")
    ?.addEventListener(
      "click",
      () => {
        const answered =
          OTJVData.isThemeAnswered(
            theme,
            index,
            state.answers
          );

        if (!answered) {
          showAlert(
            "themeAlert",
            "Sélectionne une note globale : Vert, Orange, Rouge ou N/A."
          );

          return;
        }

        state.step += 1;

        saveState();
        render();
      }
    );
}

/**
 * Calcule le résultat global.
 */
function totals() {
  return OTJVData.calculateTotals(
    state.answers
  );
}

/**
 * Formate un nombre.
 */
function fmt(number) {
  return OTJVData.formatNumber(
    number
  );
}

/**
 * Affiche la page finale.
 */
function renderSummary() {
  const results = totals();

  app.innerHTML = `
    <section class="card">
      <div class="theme-head">
        <div class="badge">
          ✓
        </div>

        <div>
          <h2>
            Résultat du coaching
          </h2>

          <p>
            Vérification, commentaire
            et signatures
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
          ${fmt(results.percent)}
          %
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
          ${THEMES.map(
            (theme, index) => {
              const score =
                results.scores[index];

              let scoreText =
                "Non répondu";

              if (score === null) {
                scoreText = "N/A";
              } else if (
                score !== undefined
              ) {
                scoreText =
                  `${fmt(score)} / 2,5`;
              }

              return `
                <tr>
                  <td>
                    ${esc(
                      theme.number
                    )}.
                    ${esc(
                      theme.title
                    )}
                  </td>

                  <td>
                    ${scoreText}
                  </td>
                </tr>
              `;
            }
          ).join("")}
        </tbody>
      </table>

      <div class="field">
        <label for="comment">
          Commentaire
        </label>

        <textarea
          id="comment"
          placeholder="Observations générales et axes d’amélioration…"
        >${esc(
          state.comment
        )}</textarea>
      </div>

      <div class="sign-grid">
        <div class="signature-box">
          <h3>
            Signature de la personne coachée
          </h3>

          <canvas
            id="sigCoached"
          ></canvas>

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

          <canvas
            id="sigCoach"
          ></canvas>

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
        Les données restent uniquement
        dans ce navigateur jusqu’au téléchargement.
      </p>
    </section>
  `;

  bindInput(
    "comment",
    "comment"
  );

  setupSignatures();

  document
    .getElementById("back")
    ?.addEventListener(
      "click",
      () => {
        captureSignatures();

        state.step =
          THEMES.length + 1;

        saveState();
        render();
      }
    );

  document
    .getElementById("new")
    ?.addEventListener(
      "click",
      resetCoaching
    );

  document
    .getElementById("excel")
    ?.addEventListener(
      "click",
      exportExcel
    );

  document
    .getElementById("pdf")
    ?.addEventListener(
      "click",
      exportPdf
    );
}

/**
 * Initialise les zones de signature.
 */
function setupSignatures() {
  OTJVSignature.setup(
    state,
    saveState
  );
}

/**
 * Capture les signatures.
 */
function captureSignatures() {
  OTJVSignature.capture(
    state,
    saveState
  );
}

/**
 * Vérifie que les deux signatures existent.
 */
function requireSignatures() {
  return OTJVSignature.requireBothSignatures(
    state,
    saveState
  );
}

/**
 * Export Excel.
 */
async function exportExcel() {
  if (!requireSignatures()) {
    return;
  }

  await OTJVExcel.downloadSafely(
    state
  );
}

/**
 * Export PDF.
 */
async function exportPdf() {
  if (!requireSignatures()) {
    return;
  }

  await OTJVPdf.downloadSafely(
    state
  );
}

/**
 * Vérifie que tous les modules nécessaires sont chargés.
 */
function checkDependencies() {
  const missingDependencies = [];

  if (!Array.isArray(THEMES)) {
    missingDependencies.push(
      "questions.js"
    );
  }

  if (!window.OTJV_LISTS) {
    missingDependencies.push(
      "lists.js"
    );
  }

  if (!window.OTJVData) {
    missingDependencies.push(
      "data.js"
    );
  }

  if (!window.OTJVSignature) {
    missingDependencies.push(
      "signature.js"
    );
  }

  if (!window.OTJVExcel) {
    missingDependencies.push(
      "excel.js"
    );
  }

  if (!window.OTJVPdf) {
    missingDependencies.push(
      "pdf.js"
    );
  }

  if (
    missingDependencies.length === 0
  ) {
    return true;
  }

  app.innerHTML = `
    <section class="card">
      <div class="alert">
        Certains fichiers nécessaires
        ne sont pas chargés :
        ${esc(
          missingDependencies.join(
            ", "
          )
        )}.
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
 * Relie le bouton fixe de la barre supérieure.
 */
function setupRestartButton() {
  const restartButton =
    document.getElementById(
      "restartApp"
    );

  if (!restartButton) {
    console.warn(
      "Le bouton #restartApp est introuvable dans index.html."
    );

    return;
  }

  restartButton.addEventListener(
    "click",
    resetCoaching
  );
}

/**
 * Démarrage de l'application.
 */
if (checkDependencies()) {
  setupRestartButton();
  render();
}
