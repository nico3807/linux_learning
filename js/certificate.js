/* ============================================================
 * MMI Linux Quest — Génération du certificat PDF (jsPDF)
 * Page 1 : certificat officiel avec les logos de part et
 * d'autre du titre (logo_UM_hack26.png à gauche, logo MMI à
 * droite), identité de l'étudiant et statistiques de jeu.
 * Ensuite : l'historique complet des commandes de la partie.
 * ============================================================ */

const Certificate = (() => {

  const LOGO_LEFT = 'assets/logo_UM_hack26.png';
  const LOGO_RIGHT = 'assets/logo_mmi.jpg';

  /** Charge une image et retourne { dataURL, ratio largeur/hauteur, format }. */
  function loadImage(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx2d = canvas.getContext('2d');
          const isJpeg = /\.jpe?g$/i.test(url);
          if (isJpeg) { ctx2d.fillStyle = '#ffffff'; ctx2d.fillRect(0, 0, canvas.width, canvas.height); }
          ctx2d.drawImage(img, 0, 0);
          resolve({
            dataURL: isJpeg ? canvas.toDataURL('image/jpeg', 0.9) : canvas.toDataURL('image/png'),
            ratio: img.naturalWidth / img.naturalHeight,
            format: isJpeg ? 'JPEG' : 'PNG',
          });
        } catch { resolve(null); /* canvas « tainted » (ouverture en file://) */ }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  /** Nettoie une chaîne pour les polices standard du PDF (latin-1). */
  function sanitize(s) {
    return String(s).replace(/[^\x20-\x7EÀ-ÿŒœ€«»'’‘…–—°]/g, '').replace(/\s+/g, ' ').trim();
  }

  /**
   * Génère et télécharge le certificat.
   * opts = { prenom, nom, stats: { duree, missionsTotal, indices, date }, history: [...] }
   */
  async function generate(opts) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = 210, H = 297;
    const MARGIN = 14;

    const prenom = sanitize(opts.prenom);
    const nom = sanitize(opts.nom).toUpperCase();

    const [logoLeft, logoRight] = await Promise.all([loadImage(LOGO_LEFT), loadImage(LOGO_RIGHT)]);

    /* ---------- Cadre décoratif ---------- */
    doc.setDrawColor(123, 92, 255);
    doc.setLineWidth(1.2);
    doc.roundedRect(7, 7, W - 14, H - 14, 4, 4);
    doc.setDrawColor(87, 211, 100);
    doc.setLineWidth(0.4);
    doc.roundedRect(9.5, 9.5, W - 19, H - 19, 3, 3);

    /* ---------- Logos de part et d'autre du titre ---------- */
    const logoTop = 16, logoH = 20;
    if (logoLeft) {
      const w = Math.min(logoH * logoLeft.ratio, 48);
      doc.addImage(logoLeft.dataURL, logoLeft.format, MARGIN, logoTop + (logoH - w / logoLeft.ratio) / 2, w, w / logoLeft.ratio);
    }
    if (logoRight) {
      const w = Math.min(logoH * logoRight.ratio, 48);
      doc.addImage(logoRight.dataURL, logoRight.format, W - MARGIN - w, logoTop + (logoH - w / logoRight.ratio) / 2, w, w / logoRight.ratio);
    }

    /* ---------- Titre (entre les deux logos) ---------- */
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 60);
    doc.setFontSize(19);
    doc.text('CERTIFICAT DE RÉUSSITE', W / 2, logoTop + 9, { align: 'center' });
    doc.setFontSize(12);
    doc.setTextColor(123, 92, 255);
    doc.text('MMI Linux Quest', W / 2, logoTop + 16, { align: 'center' });

    doc.setDrawColor(180, 180, 200);
    doc.setLineWidth(0.3);
    doc.line(MARGIN + 6, 42, W - MARGIN - 6, 42);

    /* ---------- Corps du certificat ---------- */
    let y = 52;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 80);
    doc.setFontSize(11);
    doc.text('Le département MMI certifie que', W / 2, y, { align: 'center' });

    y += 11;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(20, 20, 40);
    doc.text(`${prenom} ${nom}`, W / 2, y, { align: 'center' });

    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 80);
    const intro = doc.splitTextToSize(
      'a terminé avec succès les 12 missions du jeu sérieux « MMI Linux Quest » : '
      + 'navigation dans l\'arborescence, gestion de fichiers et de répertoires, droits et permissions, '
      + 'administration (sudo, apt), installation et démarrage du serveur web Apache, '
      + 'et publication d\'une page web.', W - 2 * MARGIN - 20);
    doc.text(intro, W / 2, y, { align: 'center' });
    y += intro.length * 5 + 8;

    /* ---------- Statistiques ---------- */
    const stats = [
      ['Date', opts.stats.date],
      ['Durée du parcours', opts.stats.duree],
      ['Missions réussies', `${opts.stats.missionsTotal} / ${opts.stats.missionsTotal}`],
      ['Indices utilisés', String(opts.stats.indices)],
      ['Commandes saisies', String(opts.history.length)],
    ];
    doc.setFontSize(10.5);
    for (const [label, value] of stats) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(80, 80, 110);
      doc.text(label + ' :', W / 2 - 4, y, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 40, 60);
      doc.text(sanitize(value), W / 2 + 2, y);
      y += 6.5;
    }

    /* ---------- Historique des commandes ---------- */
    y += 6;
    doc.setDrawColor(180, 180, 200);
    doc.line(MARGIN + 6, y, W - MARGIN - 6, y);
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 30, 60);
    doc.text('Historique des commandes de la session', MARGIN, y);
    y += 6;

    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    const lineH = 3.8;
    const bottom = H - 16;
    const numW = 11;

    opts.history.forEach((cmd, i) => {
      const wrapped = doc.splitTextToSize('$ ' + sanitize(cmd), W - 2 * MARGIN - numW);
      if (y + wrapped.length * lineH > bottom) {
        doc.addPage();
        y = 18;
        doc.setFont('courier', 'normal');
        doc.setFontSize(8);
      }
      doc.setTextColor(150, 150, 170);
      doc.text(String(i + 1).padStart(3) + '.', MARGIN, y);
      doc.setTextColor(40, 40, 60);
      doc.text(wrapped, MARGIN + numW, y);
      y += wrapped.length * lineH;
    });

    /* ---------- Pieds de page ---------- */
    const pages = doc.getNumberOfPages();
    for (let p = 1; p <= pages; p++) {
      doc.setPage(p);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 160);
      doc.text('MMI Linux Quest — certificat généré automatiquement à la fin du jeu', MARGIN, H - 9);
      doc.text(`page ${p} / ${pages}`, W - MARGIN, H - 9, { align: 'right' });
    }

    const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'etudiant';
    doc.save(`certificat_mmi_linux_quest_${slug(opts.nom)}_${slug(opts.prenom)}.pdf`);
    return { pages, logosOk: !!(logoLeft && logoRight) };
  }

  return { generate };
})();

if (typeof module !== 'undefined') module.exports = Certificate;
