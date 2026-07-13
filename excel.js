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
 * Charge une image depuis une URL Data.
 */
function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(
        new Error(
          "Impossible de charger une signature."
        )
      );

    image.src = dataUrl;
  });
}

/**
 * Crée une image réunissant la signature
 * et le nom complet placé juste en dessous.
 */
async function createSignatureBlock(
  signatureDataUrl,
  fullName
) {
  if (!signatureDataUrl) {
    return "";
  }

  const signatureImage =
    await loadImage(signatureDataUrl);

  const canvas =
    document.createElement("canvas");

  canvas.width = 700;
  canvas.height = 260;

  const context =
    canvas.getContext("2d");

  context.fillStyle = "#ffffff";
  context.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  /*
   * Signature.
   */
  const signatureAreaHeight = 185;
  const maximumWidth = 620;
  const maximumHeight = 165;

  const scale = Math.min(
    maximumWidth / signatureImage.width,
    maximumHeight / signatureImage.height,
    1
  );

  const imageWidth =
    signatureImage.width * scale;

  const imageHeight =
    signatureImage.height * scale;

  const imageX =
    (canvas.width - imageWidth) / 2;

  const imageY =
    (signatureAreaHeight - imageHeight) / 2;

  context.drawImage(
    signatureImage,
    imageX,
    imageY,
    imageWidth,
    imageHeight
  );

  /*
   * Ligne séparatrice.
   */
  context.strokeStyle = "#b9afa8";
  context.lineWidth = 2;

  context.beginPath();
  context.moveTo(45, 190);
  context.lineTo(canvas.width - 45, 190);
  context.stroke();

  /*
   * Nom complet.
   */
  context.fillStyle = "#2f2925";
  context.font =
    'bold 28px Arial, sans-serif';

  context.textAlign = "center";
  context.textBaseline = "middle";

  context.fillText(
    fullName || "",
    canvas.width / 2,
    225,
    canvas.width - 60
  );

  return canvas.toDataURL("image/png");
}
  /**
   * Ajoute les deux signatures à gauche des totaux.
   *
   * Les coordonnées utilisent les colonnes et lignes Excel
   * sous forme décimale.
   */
  /**
 * Ajoute les signatures avec les noms en dessous.
 */
async function addSignatures(
  workbook,
  worksheet,
  state
) {
  const coachedSignatureBlock =
    await createSignatureBlock(
      state.coachedSignature,
      state.coachedName
    );

  const coachSignatureBlock =
    await createSignatureBlock(
      state.coachSignature,
      state.coachName
    );

  addSignatureImage(
    workbook,
    worksheet,
    coachedSignatureBlock,
    {
      tl: {
        col: 0.15,
        row: 21.1,
      },
      ext: {
        width: 145,
        height: 72,
      },
      editAs: "oneCell",
    }
  );

  addSignatureImage(
    workbook,
    worksheet,
    coachSignatureBlock,
    {
      tl: {
        col: 2.25,
        row: 21.1,
      },
      ext: {
        width: 145,
        height: 72,
      },
      editAs: "oneCell",
    }
  );
}

 /**
 * Calcule le résultat en excluant les thèmes N/A.
 *
 * Exemple :
 * - 8 thèmes applicables : maximum 20 points
 * - 1 thème N/A : maximum 17,5 points
 * - 2 thèmes N/A : maximum 15 points
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

  const applicableScores = scores.filter(
    (score) =>
      score !== null &&
      score !== undefined
  );

  const total = applicableScores.reduce(
    (sum, score) => sum + Number(score),
    0
  );

  const possible =
    applicableScores.length * 2.5;

  const percentage =
    possible > 0
      ? total / possible
      : 0;

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

    await addSignatures(
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
