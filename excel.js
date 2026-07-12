/**
 * Export Excel OTJV OPTECH.
 *
 * Ce fichier utilise le modèle template.xlsx présent
 * à la racine du projet.
 *
 * Bibliothèques requises :
 * - ExcelJS
 * - FileSaver
 * - data.js
 */

window.OTJVExcel = (() => {
  const TEMPLATE_PATH = "template.xlsx";
  const WORKSHEET_NAME = "Feuil1";

  /*
   * Correspondance des cellules du modèle Excel.
   */
  const CELLS = {
    coachedName: "A6",
    coachName: "D6",
    coachingDate: "F6",
    activity: "A9",
    location: "F9",

    total: "F24",
    possible: "F25",
    percentage: "F26",

    comment: "I24",
  };

  /*
   * Les huit thèmes correspondent aux lignes 14 à 21.
   */
  const FIRST_THEME_ROW = 14;

  /*
   * Colonnes des choix dans le modèle.
   */
  const SCORE_COLUMNS = {
    na: "E",
    green: "F",
    orange: "G",
    red: "H",
  };

  /**
   * Efface les anciennes croix d'une ligne.
   */
  function clearScoreCells(worksheet, row) {
    Object.values(SCORE_COLUMNS).forEach((column) => {
      worksheet.getCell(`${column}${row}`).value = null;
    });
  }

  /**
   * Place une croix dans la colonne correspondant
   * au score du thème.
   */
  function placeThemeScore(worksheet, row, score) {
    clearScoreCells(worksheet, row);

    if (score === null || score === "NA") {
      worksheet.getCell(
        `${SCORE_COLUMNS.na}${row}`
      ).value = "X";

      return;
    }

    const numericScore = Number(score);

    if (!Number.isFinite(numericScore)) {
      return;
    }

    if (numericScore === 2.5) {
      worksheet.getCell(
        `${SCORE_COLUMNS.green}${row}`
      ).value = "X";

      return;
    }

    if (numericScore === 1.5) {
      worksheet.getCell(
        `${SCORE_COLUMNS.orange}${row}`
      ).value = "X";

      return;
    }

    worksheet.getCell(
      `${SCORE_COLUMNS.red}${row}`
    ).value = "X";
  }

  /**
   * Centre et met en évidence une croix de score.
   */
  function formatScoreCrosses(worksheet) {
    for (
      let row = FIRST_THEME_ROW;
      row < FIRST_THEME_ROW + 8;
      row += 1
    ) {
      Object.values(SCORE_COLUMNS).forEach((column) => {
        const cell = worksheet.getCell(
          `${column}${row}`
        );

        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
        };

        cell.font = {
          ...cell.font,
          bold: true,
          size: 14,
        };
      });
    }
  }

  /**
   * Ajoute une image PNG dans le classeur.
   */
  function addSignatureImage(
    workbook,
    worksheet,
    base64Image,
    position
  ) {
    if (!base64Image) {
      return;
    }

    const imageId = workbook.addImage({
      base64: base64Image,
      extension: "png",
    });

    worksheet.addImage(imageId, position);
  }

  /**
   * Ajoute les deux signatures à gauche des totaux.
   *
   * Les coordonnées utilisent les colonnes et lignes Excel
   * sous forme décimale.
   */
  function addSignatures(workbook, worksheet, state) {
    addSignatureImage(
      workbook,
      worksheet,
      state.coachedSignature,
      {
        tl: {
          col: 0.15,
          row: 21.15,
        },
        ext: {
          width: 130,
          height: 48,
        },
        editAs: "oneCell",
      }
    );

    addSignatureImage(
      workbook,
      worksheet,
      state.coachSignature,
      {
        tl: {
          col: 2.1,
          row: 21.15,
        },
        ext: {
          width: 130,
          height: 48,
        },
        editAs: "oneCell",
      }
    );
  }

  /**
   * Calcule le total à partir des huit notes.
   *
   * Un thème N/A vaut zéro point dans le total obtenu.
   * Le résultat reste calculé sur un maximum fixe de 20.
   */
  function calculateFixedResults(state) {
    const themes = OTJVData.getThemes();

    const scores = themes.map((theme, index) =>
      OTJVData.getThemeScore(
        theme,
        index,
        state.answers
      )
    );

    const total = scores.reduce((sum, score) => {
      if (
        score === null ||
        score === undefined
      ) {
        return sum;
      }

      return sum + Number(score);
    }, 0);

    const possible = 20;
    const percentage = total / possible;

    return {
      scores,
      total,
      possible,
      percentage,
    };
  }

  /**
   * Charge le modèle Excel.
   */
  async function loadWorkbook() {
    const response = await fetch(TEMPLATE_PATH, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `Le modèle Excel n'a pas pu être chargé. Erreur ${response.status}.`
      );
    }

    const templateBuffer =
      await response.arrayBuffer();

    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.load(templateBuffer);

    return workbook;
  }

  /**
   * Remplit les informations générales.
   */
  function fillGeneralInformation(
    worksheet,
    state
  ) {
    worksheet.getCell(
      CELLS.coachedName
    ).value = state.coachedName || "";

    worksheet.getCell(
      CELLS.coachName
    ).value = state.coachName || "";

    worksheet.getCell(
      CELLS.activity
    ).value = state.activity || "";

    worksheet.getCell(
      CELLS.location
    ).value = state.location || "";

    const timestamp = new Date(
      state.timestamp
    );

    const dateCell = worksheet.getCell(
      CELLS.coachingDate
    );

    dateCell.value = Number.isNaN(
      timestamp.getTime()
    )
      ? new Date()
      : timestamp;

    dateCell.numFmt = "dd/mm/yyyy hh:mm";
  }

  /**
   * Remplit les huit notes du formulaire.
   */
  function fillThemeScores(
    worksheet,
    scores
  ) {
    scores.forEach((score, index) => {
      const row = FIRST_THEME_ROW + index;

      placeThemeScore(
        worksheet,
        row,
        score
      );
    });

    formatScoreCrosses(worksheet);
  }

  /**
   * Remplit les résultats.
   */
  function fillResults(
    worksheet,
    results
  ) {
    const totalCell = worksheet.getCell(
      CELLS.total
    );

    totalCell.value = results.total;
    totalCell.numFmt = "0.0";

    const possibleCell = worksheet.getCell(
      CELLS.possible
    );

    possibleCell.value = results.possible;
    possibleCell.numFmt = "0.0";

    const percentageCell =
      worksheet.getCell(
        CELLS.percentage
      );

    percentageCell.value =
      results.percentage;

    percentageCell.numFmt = "0.0%";
  }

  /**
   * Remplit la zone commentaire.
   */
  function fillComment(worksheet, state) {
    const commentCell = worksheet.getCell(
      CELLS.comment
    );

    commentCell.value =
      state.comment?.trim() || "";

    commentCell.alignment = {
      ...commentCell.alignment,
      vertical: "top",
      horizontal: "left",
      wrapText: true,
    };
  }

  /**
   * Génère et télécharge le fichier Excel.
   */
  async function download(state) {
    if (!window.ExcelJS) {
      throw new Error(
        "La bibliothèque ExcelJS n'est pas chargée."
      );
    }

    if (
      typeof window.saveAs !== "function"
    ) {
      throw new Error(
        "La bibliothèque FileSaver n'est pas chargée."
      );
    }

    if (!window.OTJVData) {
      throw new Error(
        "Le module data.js n'est pas chargé."
      );
    }

    const workbook =
      await loadWorkbook();

    const worksheet =
      workbook.getWorksheet(
        WORKSHEET_NAME
      ) || workbook.worksheets[0];

    if (!worksheet) {
      throw new Error(
        "La feuille Feuil1 est introuvable dans le modèle."
      );
    }

    const results =
      calculateFixedResults(state);

    fillGeneralInformation(
      worksheet,
      state
    );

    fillThemeScores(
      worksheet,
      results.scores
    );

    fillResults(
      worksheet,
      results
    );

    fillComment(
      worksheet,
      state
    );

    addSignatures(
      workbook,
      worksheet,
      state
    );

    /*
     * Place Feuil1 comme feuille active lors de
     * l'ouverture du document.
     */
    workbook.views = [
      {
        activeTab: worksheet.id - 1,
      },
    ];

    const outputBuffer =
      await workbook.xlsx.writeBuffer();

    const fileName =
      OTJVData.createFileName(state);

    const blob = new Blob(
      [outputBuffer],
      {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }
    );

    saveAs(
      blob,
      `${fileName}.xlsx`
    );
  }

  /**
   * Version sécurisée utilisée par app.js.
   */
  async function downloadSafely(state) {
    try {
      await download(state);
    } catch (error) {
      console.error(
        "Erreur pendant l'export Excel :",
        error
      );

      alert(
        `Impossible de générer le fichier Excel : ${error.message}`
      );
    }
  }

  return {
    download,
    downloadSafely,
  };
})();
