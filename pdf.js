/**
 * Génération d'un rapport PDF.
 *
 * Nécessite :
 * - jsPDF
 * - data.js
 */

window.OTJVPdf = (() => {
  function addPageWhenNecessary(document, currentY, requiredHeight) {
    const pageHeight = document.internal.pageSize.getHeight();
    const bottomMargin = 15;

    if (currentY + requiredHeight <= pageHeight - bottomMargin) {
      return currentY;
    }

    document.addPage();
    return 18;
  }

  function drawHeader(document, state) {
    let y = 16;

    document.setFont("helvetica", "bold");
    document.setFontSize(18);

    document.text(
      "OTJV STEP 2 OPTECH",
      105,
      y,
      {
        align: "center",
      }
    );

    y += 10;

    document.setFont("helvetica", "normal");
    document.setFontSize(10);

    document.text(
      `Personne coachée : ${state.coachedName}`,
      15,
      y
    );

    document.text(
      `Coach : ${state.coachName || "-"}`,
      110,
      y
    );

    y += 7;

    document.text(
      `Date : ${new Date(
        state.timestamp
      ).toLocaleString("fr-FR")}`,
      15,
      y
    );

    y += 7;

    document.text(
      `Activité : ${state.activity}`,
      15,
      y
    );

    document.text(
      `Emplacement : ${state.location}`,
      110,
      y
    );

    return y + 10;
  }

  function drawResults(document, state, startY) {
    const themes = OTJVData.getThemes();
    const results = OTJVData.calculateTotals(
      state.answers
    );

    let y = startY;

    document.setFont("helvetica", "bold");
    document.setFontSize(11);
    document.text("Résultats", 15, y);

    y += 7;

    document.setFont("helvetica", "normal");
    document.setFontSize(10);

    themes.forEach((theme, index) => {
      y = addPageWhenNecessary(document, y, 7);

      const score = results.scores[index];

      const scoreText =
        score === null
          ? "N/A"
          : `${OTJVData.formatNumber(score)} / 2,5`;

      document.text(
        `${theme.number}. ${theme.title}`,
        18,
        y
      );

      document.text(
        scoreText,
        190,
        y,
        {
          align: "right",
        }
      );

      y += 6;
    });

    y += 3;
    y = addPageWhenNecessary(document, y, 15);

    document.setFont("helvetica", "bold");
    document.setFontSize(14);

    document.text(
      `Total : ${OTJVData.formatNumber(
        results.total
      )} / ${OTJVData.formatNumber(
        results.possible
      )} — ${OTJVData.formatNumber(
        results.percent
      )} %`,
      105,
      y,
      {
        align: "center",
      }
    );

    return y + 12;
  }

  function drawComment(document, state, startY) {
    let y = startY;

    y = addPageWhenNecessary(document, y, 25);

    document.setFont("helvetica", "bold");
    document.setFontSize(10);
    document.text("Commentaire", 15, y);

    y += 6;

    document.setFont("helvetica", "normal");

    const comment =
      state.comment.trim() ||
      "Aucun commentaire.";

    const lines = document.splitTextToSize(
      comment,
      180
    );

    document.text(lines, 15, y);

    const usedHeight = Math.max(
      14,
      lines.length * 5
    );

    return y + usedHeight + 5;
  }

  function drawSignatures(document, state, startY) {
    let y = addPageWhenNecessary(
      document,
      startY,
      48
    );

    document.setFont("helvetica", "bold");
    document.setFontSize(10);
    document.text("Signatures", 15, y);

    y += 7;

    document.setFont("helvetica", "normal");

    document.text(
      "Personne coachée",
      15,
      y
    );

    document.text(
      "Coach",
      110,
      y
    );

    if (state.coachedSignature) {
      document.addImage(
        state.coachedSignature,
        "PNG",
        15,
        y + 3,
        75,
        30
      );
    }

    if (state.coachSignature) {
      document.addImage(
        state.coachSignature,
        "PNG",
        110,
        y + 3,
        75,
        30
      );
    }
  }

  function download(state) {
    if (
      !window.jspdf ||
      !window.jspdf.jsPDF
    ) {
      throw new Error(
        "La bibliothèque jsPDF n'est pas chargée."
      );
    }

    const { jsPDF } = window.jspdf;

    const document = new jsPDF({
      unit: "mm",
      format: "a4",
      orientation: "portrait",
    });

    let y = drawHeader(document, state);
    y = drawResults(document, state, y);
    y = drawComment(document, state, y);

    drawSignatures(document, state, y);

    const fileName =
      OTJVData.createFileName(state);

    document.save(`${fileName}.pdf`);
  }

  function downloadSafely(state) {
    try {
      download(state);
    } catch (error) {
      console.error(error);

      alert(
        `Impossible de générer le fichier PDF : ${error.message}`
      );
    }
  }

  return {
    download,
    downloadSafely,
  };
})();
