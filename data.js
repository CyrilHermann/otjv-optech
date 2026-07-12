/**
 * Gestion des données et des scores OTJV OPTECH.
 *
 * Une seule note est attribuée à chaque thème.
 * Les questions A, B, C, etc. servent à déterminer
 * la note globale du thème.
 */

window.OTJVData = (() => {
  const SCORE_OPTIONS = [
    {
      value: "2.5",
      cssClass: "green",
      label: "Vert",
      pointsLabel: "2,5 points",
    },
    {
      value: "1.5",
      cssClass: "orange",
      label: "Orange",
      pointsLabel: "1,5 point",
    },
    {
      value: "0",
      cssClass: "red",
      label: "Rouge",
      pointsLabel: "0 point",
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
   * Retourne l'identifiant unique d'un thème.
   */
  function getThemeId(theme, index) {
    return theme.id || `theme-${index + 1}`;
  }

  /**
   * Retourne la note d'un thème.
   */
  function getThemeScore(theme, index, answers) {
    const themeId = getThemeId(theme, index);
    const answer = answers[themeId];

    if (answer === undefined) {
      return undefined;
    }

    if (answer === "NA") {
      return null;
    }

    const numericScore = Number(answer);

    return Number.isFinite(numericScore)
      ? numericScore
      : undefined;
  }

  /**
   * Calcule les résultats des huit thèmes.
   *
   * Chaque thème vaut au maximum 2,5 points.
   * Un thème N/A est exclu du total possible.
   */
  function calculateTotals(answers) {
    const themes = getThemes();

    const scores = themes.map((theme, index) =>
      getThemeScore(theme, index, answers)
    );

    const applicableScores = scores.filter(
      (score) =>
        score !== null &&
        score !== undefined
    );

    const total = applicableScores.reduce(
      (sum, score) => sum + score,
      0
    );

    const possible = applicableScores.length * 2.5;

    const percent =
      possible > 0
        ? (total / possible) * 100
        : 0;

    return {
      scores,
      total,
      possible,
      percent,
    };
  }

  /**
   * Vérifie qu'une note a été choisie pour le thème.
   */
  function isThemeAnswered(theme, index, answers) {
    const themeId = getThemeId(theme, index);

    return answers[themeId] !== undefined;
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
      cleanFileNamePart(state.coachedName) ||
      "Personne";

    const activity =
      cleanFileNamePart(state.activity) ||
      "Activite";

    return `${date}_${coachedName}_${activity}`;
  }

  return {
    SCORE_OPTIONS,
    getThemes,
    getThemeId,
    getThemeScore,
    calculateTotals,
    isThemeAnswered,
    formatNumber,
    createFileName,
  };
})();
