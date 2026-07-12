/**
 * Génération du fichier Excel à partir de template.xlsx.
 *
 * Nécessite :
 * - ExcelJS
 * - FileSaver
 * - data.js
 */

window.OTJVExcel = (() => {
  const SCORE_COLUMNS = {
    na: "E",
    green: "F",
    orange: "G",
    red: "H",
  };

  function placeThemeScore(worksheet, row, score) {
    Object.values(SCORE_COLUMNS).forEach((column) => {
      worksheet.getCell(`${column}${row}`).value = "";
    });

    if (score === null) {
      worksheet.getCell(`${SCORE_COLUMNS.na}${row}`).value = "X";
      return;
    }

    if (score >= 2) {
      worksheet.getCell(`${SCORE_COLUMNS.green}${row}`).value = "X";
      return;
    }

    if (score > 0) {
      worksheet.getCell(`${SCORE_COLUMNS.orange}${row}`).value = "X";
      return;
    }

    worksheet.getCell(`${SCORE_COLUMNS.red}${row}`).value = "X";
  }

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

  async function download(state) {
    if (!window.ExcelJS) {
      throw new Error(
        "La bibliothèque ExcelJS n'est pas chargée."
      );
    }

    if (typeof window.saveAs !== "function") {
      throw new Error(
        "La bibliothèque FileSaver n'est pas chargée."
      );
    }

    const response = await fetch("template.xlsx", {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `Modèle Excel introuvable : erreur ${response.status}.`
      );
    }

    const templateBuffer = await response.arrayBuffer();
    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.load(templateBuffer);

    const worksheet =
      workbook.getWorksheet("Feuil1") ||
      workbook.worksheets[0];

    if (!worksheet) {
      throw new Error(
        "Aucune feuille n'a été trouvée dans le modèle Excel."
      );
    }

    const results = OTJVData.calculateTotals(state.answers);
    const themes = OTJVData.getThemes();

    /*
     * Informations générales du formulaire.
     */
    worksheet.getCell("A6").value = state.coachedName;
    worksheet.getCell("D6").value = state.coachName || "";

    worksheet.getCell("F6").value = new Date(state.timestamp);
    worksheet.getCell("F6").numFmt = "dd/mm/yyyy hh:mm";

    worksheet.getCell("A9").value = state.activity;
    worksheet.getCell("F9").value = state.location;

    /*
     * Les huit thèmes sont placés sur les lignes 14 à 21.
     */
    themes.forEach((theme, index) => {
      const row = 14 + index;
      const score = results.scores[index];

      placeThemeScore(worksheet, row, score);
    });

    /*
     * Résultats.
     */
    worksheet.getCell("F24").value = results.total;
    worksheet.getCell("F25").value = results.possible;

    worksheet.getCell("F26").value =
      results.percent / 100;

    worksheet.getCell("F26").numFmt = "0.0%";

    /*
     * Commentaire.
     */
    worksheet.getCell("I24").value =
      state.comment || "";

    /*
     * Signatures.
     *
     * Les positions peuvent être ajustées après le premier
     * test visuel du fichier Excel généré.
     */
    addSignatureImage(
      workbook,
      worksheet,
      state.coachedSignature,
      {
        tl: {
          col: 0.2,
          row: 21.2,
        },
        ext: {
          width: 190,
          height: 75,
        },
      }
    );

    addSignatureImage(
      workbook,
      worksheet,
      state.coachSignature,
      {
        tl: {
          col: 2.5,
          row: 21.2,
        },
        ext: {
          width: 190,
          height: 75,
        },
      }
    );

    const outputBuffer =
      await workbook.xlsx.writeBuffer();

    const fileName =
      OTJVData.createFileName(state);

    const blob = new Blob([outputBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, `${fileName}.xlsx`);
  }

  async function downloadSafely(state) {
    try {
      await download(state);
    } catch (error) {
      console.error(error);

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
