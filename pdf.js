/**
 * Génération du rapport PDF OTJV OPTECH.
 *
 * Nécessite :
 * - jsPDF
 * - data.js
 *
 * Le logo doit se trouver ici :
 * assets/logo.jpg
 */

window.OTJVPdf = (() => {
  const LOGO_PATH =
    "assets/logo.jpg";

  /**
   * Charge un fichier image et le transforme
   * en URL Data compatible avec jsPDF.
   */
  async function loadImageAsDataUrl(path) {
    const response = await fetch(path, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `Le logo n'a pas pu être chargé : erreur ${response.status}.`
      );
    }

    const blob = await response.blob();

    return new Promise(
      (resolve, reject) => {
        const reader =
          new FileReader();

        reader.onload = () =>
          resolve(reader.result);

        reader.onerror = () =>
          reject(
            new Error(
              "Impossible de lire le logo."
            )
          );

        reader.readAsDataURL(blob);
      }
    );
  }

  /**
   * Crée une nouvelle page si la place
   * restante est insuffisante.
   */
  function addPageWhenNecessary(
    document,
    currentY,
    requiredHeight
  ) {
    const pageHeight =
      document.internal.pageSize.getHeight();

    const bottomMargin = 15;

    if (
      currentY + requiredHeight <=
      pageHeight - bottomMargin
    ) {
      return currentY;
    }

    document.addPage();

    return 18;
  }

  /**
   * Ajoute le logo et les informations générales.
   */
  function drawHeader(
    document,
    state,
    logoDataUrl
  ) {
    let y = 14;

    if (logoDataUrl) {
      /*
       * Le dernier argument conserve le logo
       * dans une taille raisonnable.
       */
      document.addImage(
        logoDataUrl,
        "JPEG",
        15,
        9,
        24,
        24
      );
    }

    document.setFont(
      "helvetica",
      "bold"
    );

    document.setFontSize(18);

    document.text(
      "OTJV STEP 2 OPTECH",
      105,
      18,
      {
        align: "center",
      }
    );

    document.setFont(
      "helvetica",
      "normal"
    );

    document.setFontSize(9);

    document.text(
      "Outil de coaching technique",
      105,
      24,
      {
        align: "center",
      }
    );

    /*
     * Ligne sous l'en-tête.
     */
    document.setDrawColor(
      111,
      78,
      55
    );

    document.setLineWidth(0.6);

    document.line(
      15,
      34,
      195,
      34
    );

    y = 43;

    document.setFontSize(10);

    document.setFont(
      "helvetica",
      "bold"
    );

    document.text(
      "Personne coachée :",
      15,
      y
    );

    document.setFont(
      "helvetica",
      "normal"
    );

    document.text(
      state.coachedName || "-",
      48,
      y
    );

    document.setFont(
      "helvetica",
      "bold"
    );

    document.text(
      "Coach :",
      110,
      y
    );

    document.setFont(
      "helvetica",
      "normal"
    );

    document.text(
      state.coachName || "-",
      127,
      y
    );

    y += 7;

    document.setFont(
      "helvetica",
      "bold"
    );

    document.text(
      "Date :",
      15,
      y
    );

    document.setFont(
      "helvetica",
      "normal"
    );

    document.text(
      new Date(
        state.timestamp
      ).toLocaleString("fr-FR"),
      30,
      y
    );

    y += 7;

    document.setFont(
      "helvetica",
      "bold"
    );

    document.text(
      "Niveau :",
      15,
      y
    );

    document.setFont(
      "helvetica",
      "normal"
    );

    document.text(
      state.level || "-",
      34,
      y
    );

    document.setFont(
      "helvetica",
      "bold"
    );

    document.text(
      "Emplacement :",
      110,
      y
    );

    document.setFont(
      "helvetica",
      "normal"
    );

    document.text(
      state.location || "-",
      140,
      y
    );

    y += 7;

    document.setFont(
      "helvetica",
      "bold"
    );

    document.text(
      "Activité :",
      15,
      y
    );

    document.setFont(
      "helvetica",
      "normal"
    );

    const activityLines =
      document.splitTextToSize(
        state.activity || "-",
        155
      );

    document.text(
      activityLines,
      34,
      y
    );

    return (
      y +
      Math.max(
        8,
        activityLines.length * 5
      )
    );
  }

  /**
   * Affiche les résultats par thème.
   */
  function drawResults(
    document,
    state,
    startY
  ) {
    const themes =
      OTJVData.getThemes();

    const results =
      OTJVData.calculateTotals(
        state.answers
      );

    let y = startY;

    document.setFont(
      "helvetica",
      "bold"
    );

    document.setFontSize(11);

    document.text(
      "Résultats",
      15,
      y
    );

    y += 7;

    document.setFontSize(10);

    themes.forEach(
      (theme, index) => {
        y = addPageWhenNecessary(
          document,
          y,
          7
        );

        const score =
          results.scores[index];

        const scoreText =
          score === null
            ? "N/A"
            : `${OTJVData.formatNumber(
                score
              )} / 2,5`;

        document.setFont(
          "helvetica",
          "normal"
        );

        document.text(
          `${theme.number}. ${theme.title}`,
          18,
          y
        );

        document.setFont(
          "helvetica",
          "bold"
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
      }
    );

    y += 3;

    y = addPageWhenNecessary(
      document,
      y,
      15
    );

    document.setFont(
      "helvetica",
      "bold"
    );

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

  /**
   * Affiche le commentaire.
   */
  function drawComment(
    document,
    state,
    startY
  ) {
    let y = addPageWhenNecessary(
      document,
      startY,
      25
    );

    document.setFont(
      "helvetica",
      "bold"
    );

    document.setFontSize(10);

    document.text(
      "Commentaire",
      15,
      y
    );

    y += 6;

    document.setFont(
      "helvetica",
      "normal"
    );

    const comment =
      state.comment?.trim() ||
      "Aucun commentaire.";

    const lines =
      document.splitTextToSize(
        comment,
        180
      );

    document.text(
      lines,
      15,
      y
    );

    const usedHeight = Math.max(
      14,
      lines.length * 5
    );

    return y + usedHeight + 5;
  }

  /**
   * Affiche les signatures et les noms complets
   * directement sous chaque signature.
   */
  function drawSignatures(
    document,
    state,
    startY
  ) {
    let y = addPageWhenNecessary(
      document,
      startY,
      58
    );

    document.setFont(
      "helvetica",
      "bold"
    );

    document.setFontSize(10);

    document.text(
      "Signatures",
      15,
      y
    );

    y += 8;

    document.setFontSize(9);

    document.text(
      "Personne coachée",
      52,
      y,
      {
        align: "center",
      }
    );

    document.text(
      "Coach",
      147,
      y,
      {
        align: "center",
      }
    );

    const signatureY = y + 3;

    /*
     * Cadres des signatures.
     */
    document.setDrawColor(
      190,
      180,
      172
    );

    document.roundedRect(
      15,
      signatureY,
      75,
      30,
      2,
      2
    );

    document.roundedRect(
      110,
      signatureY,
      75,
      30,
      2,
      2
    );

    if (state.coachedSignature) {
      document.addImage(
        state.coachedSignature,
        "PNG",
        18,
        signatureY + 2,
        69,
        25
      );
    }

    if (state.coachSignature) {
      document.addImage(
        state.coachSignature,
        "PNG",
        113,
        signatureY + 2,
        69,
        25
      );
    }

    /*
     * Noms sous les signatures.
     */
    document.setFont(
      "helvetica",
      "bold"
    );

    document.setFontSize(9);

    document.text(
      state.coachedName || "",
      52,
      signatureY + 37,
      {
        align: "center",
        maxWidth: 75,
      }
    );

    document.text(
      state.coachName || "",
      147,
      signatureY + 37,
      {
        align: "center",
        maxWidth: 75,
      }
    );
  }

  /**
   * Génère le document PDF.
   */
  async function download(state) {
    if (
      !window.jspdf ||
      !window.jspdf.jsPDF
    ) {
      throw new Error(
        "La bibliothèque jsPDF n'est pas chargée."
      );
    }

    const { jsPDF } =
      window.jspdf;

    const document = new jsPDF({
      unit: "mm",
      format: "a4",
      orientation: "portrait",
    });

    let logoDataUrl = "";

    try {
      logoDataUrl =
        await loadImageAsDataUrl(
          LOGO_PATH
        );
    } catch (error) {
      /*
       * Le PDF reste généré si le logo est absent,
       * mais l'erreur apparaît dans la console.
       */
      console.warn(
        "Le logo n'a pas pu être ajouté au PDF.",
        error
      );
    }

    let y = drawHeader(
      document,
      state,
      logoDataUrl
    );

    y = drawResults(
      document,
      state,
      y
    );

    y = drawComment(
      document,
      state,
      y
    );

    drawSignatures(
      document,
      state,
      y
    );

    const fileName =
      OTJVData.createFileName(
        state
      );

    document.save(
      `${fileName}.pdf`
    );
  }

  /**
   * Version sécurisée appelée depuis app.js.
   */
  async function downloadSafely(
    state
  ) {
    try {
      await download(state);
    } catch (error) {
      console.error(
        "Erreur pendant l'export PDF :",
        error
      );

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
