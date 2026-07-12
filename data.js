/**
 * Fonctions communes liées aux données et aux scores.
 * Le fichier questions.js doit être chargé avant data.js.
 */

window.OTJVData = (() => {
  const SCORE_OPTIONS = [
    {
      value: "2.5",
      cssClass: "green",
      label: "Vert",
      pointsLabel: "2,5 pts",
    },
    {
      value: "1.5",
      cssClass: "orange",
      label: "Orange",
      pointsLabel: "1,5 pt",
    },
    {
      value: "0",
      cssClass: "red",
      label: "Rouge",
      pointsLabel: "0 pt",
    },
    {
      value: "NA",
      cssClass: "na",
      label: "N/A",
      pointsLabel: "Non applicable",
    },
  ];

  function getThemes() {
    if (!Array.isArray(window.OTJV_THEMES)) {
      throw new Error(
        "Les thèmes sont introuvables. Vérifie que questions.js est chargé avant data.js."
      );
    }

    return window.OTJV_THEMES;
  }

  /**
   * Calcule le score d'un thème.
   *
   * Chaque question vaut :
   * - Vert : 2,5
   * - Orange : 1,5
   * - Rouge : 0
   * - N/A : exclue du calcul
   *
   * Le résultat du thème reste ramené sur 2,5 points.
   */
  function calculateThemeScore(theme, answers) {
    const applicableAnswers = theme.questions
      .map((question) => answers[question.id])
      .filter((value) => value !== undefined && value !== "NA")
      .map(Number)
      .filter((value) => Number.isFinite(value));

    if (applicableAnswers.length === 0) {
      return null;
    }

    const total = applicableAnswers.reduce(
      (sum, currentValue) => sum + currentValue,
      0
    );

    return total / applicableAnswers.length;
  }

  /**
   * Calcule le résultat global.
   * Les thèmes entièrement N/A sont exclus du total possible.
   */
  function calculateTotals(answers) {
    const themes = getThemes();

    const themeScores = themes.map((theme) =>
      calculateThemeScore(theme, answers)
    );

    const applicableScores = themeScores.filter(
      (score) => score !== null
    );

    const total = applicableScores.reduce(
      (sum, currentValue) => sum + currentValue,
      0
    );

    const possible = applicableScores.length * 2.5;
    const percent = possible > 0 ? (total / possible) * 100 : 0;

    return {
      scores: themeScores,
      total,
      possible,
      percent,
    };
  }

  function getMissingQuestions(theme, answers) {
    return theme.questions.filter(
      (question) => answers[question.id] === undefined
    );
  }

  function formatNumber(value) {
    return Number(value).toLocaleString("fr-FR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  function cleanFileNamePart(value = "") {
    return String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function createFileName(state) {
    const date = new Date(state.timestamp)
      .toISOString()
      .slice(0, 10);

    const coachedName =
      cleanFileNamePart(state.coachedName) || "Personne";

    const activity =
      cleanFileNamePart(state.activity) || "Activite";

    return `${date}_${coachedName}_${activity}`;
  }

  return {
    SCORE_OPTIONS,
    getThemes,
    calculateThemeScore,
    calculateTotals,
    getMissingQuestions,
    formatNumber,
    createFileName,
  };
})();
