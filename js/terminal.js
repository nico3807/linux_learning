/* ============================================================
 * MMI Linux Quest — Interface du terminal (navigateur)
 * Gère : affichage, saisie, historique (flèches), complétion Tab,
 * éditeur nano (modale) et barre de progression.
 * ============================================================ */

(() => {
  const output = document.getElementById('output');
  const input = document.getElementById('cmdline');
  const promptEl = document.getElementById('prompt');
  const screen = document.getElementById('screen');
  const missionLabel = document.getElementById('mission-label');
  const progressBar = document.getElementById('progress-bar');
  const timerEl = document.getElementById('timer');

  /* Éditeur nano */
  const editor = document.getElementById('editor');
  const editorTitle = document.getElementById('editor-title');
  const editorArea = document.getElementById('editor-area');
  const editorSave = document.getElementById('editor-save');
  const editorQuit = document.getElementById('editor-quit');
  let editorCtx = null; // { path, user, writable }

  let histIndex = -1;
  let histDraft = '';

  /* ---------------- Affichage ---------------- */

  function print(text, cls, raw = false) {
    const span = document.createElement('span');
    span.textContent = raw ? text : text + '\n';
    if (cls) span.className = 'c-' + cls;
    output.appendChild(span);
    screen.scrollTop = screen.scrollHeight;
  }

  function clear() {
    output.innerHTML = '';
  }

  /* ---------------- Moteur de jeu ---------------- */

  const game = new Game.GameEngine({
    print: (text, cls, raw) => print(text, cls, raw),
    clear,
    openEditor,
    onStateChange: updateHeader,
    onGameFinished: openCertModal,
  });

  function promptText() {
    const p = VFS.pretty(game.cwd);
    return `etudiant@serveur-mmi:${p}$ `;
  }

  function updateHeader() {
    const total = MISSIONS.missions.length;
    const done = game.finished ? total : game.state.missionIndex;
    const m = game.currentMission();
    missionLabel.textContent = game.finished
      ? '🏆 Jeu terminé — félicitations !'
      : `Mission ${m.id}/${total} — ${m.titre}`;
    progressBar.style.width = Math.round((done / total) * 100) + '%';
    promptEl.textContent = promptText();
  }

  function tickTimer() {
    if (!game.state) return;
    const end = game.state.endTime || Date.now();
    const mins = Math.floor((end - game.state.startTime) / 60000);
    const h = Math.floor(mins / 60), mn = mins % 60;
    timerEl.textContent = `⏱ ${h}:${String(mn).padStart(2, '0')}`;
  }

  /* ---------------- Saisie ---------------- */

  function submit() {
    const line = input.value;
    print(promptText(), 'prompt', true);
    print(line + '\n', 'typed', true);
    input.value = '';
    histIndex = -1;
    histDraft = '';
    game.execute(line);
    updateHeader();
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const h = game.state.history;
      if (!h.length) return;
      if (histIndex === -1) { histDraft = input.value; histIndex = h.length - 1; }
      else if (histIndex > 0) histIndex--;
      input.value = h[histIndex];
      requestAnimationFrame(() => input.setSelectionRange(input.value.length, input.value.length));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const h = game.state.history;
      if (histIndex === -1) return;
      histIndex++;
      if (histIndex >= h.length) { histIndex = -1; input.value = histDraft; }
      else input.value = h[histIndex];
    } else if (e.key === 'Tab') {
      e.preventDefault();
      autocomplete();
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      clear();
    } else if (e.key === 'c' && e.ctrlKey && !window.getSelection().toString()) {
      e.preventDefault();
      print(promptText(), 'prompt', true);
      print(input.value + '^C\n', 'typed', true);
      input.value = '';
    }
  });

  /* Clic n'importe où dans le terminal → focus sur la saisie */
  screen.addEventListener('mouseup', () => {
    if (!window.getSelection().toString()) input.focus();
  });

  /* ---------------- Complétion Tab ---------------- */

  function autocomplete() {
    const line = input.value;
    const beforeCursor = line.slice(0, input.selectionStart);
    const m = beforeCursor.match(/(^|[\s|>]+)([^\s|>]*)$/);
    if (!m) return;
    const partial = m[2];
    const isFirstWord = beforeCursor.trim() === partial
      || beforeCursor.trim() === 'sudo ' + partial;

    let candidates = [];
    if (isFirstWord && !partial.includes('/')) {
      candidates = Object.keys(Shell.COMMANDS).filter(c => c.startsWith(partial));
      if ('sudo'.startsWith(partial)) candidates.push('sudo');
    } else {
      /* Complétion de chemin */
      const slash = partial.lastIndexOf('/');
      const dirPart = slash >= 0 ? partial.slice(0, slash + 1) : '';
      const base = slash >= 0 ? partial.slice(slash + 1) : partial;
      const absDir = VFS.normalize(dirPart || '.', game.cwd);
      const node = game.fs.get(absDir);
      if (node && node.type === 'dir') {
        candidates = Object.entries(node.children)
          .filter(([name]) => name.startsWith(base) && (base.startsWith('.') || !name.startsWith('.')))
          .map(([name, child]) => dirPart + name + (child.type === 'dir' ? '/' : ''));
      }
    }
    candidates = [...new Set(candidates)].sort();
    if (!candidates.length) return;

    if (candidates.length === 1) {
      const completed = candidates[0] + (candidates[0].endsWith('/') ? '' : ' ');
      replacePartial(partial, completed);
    } else {
      /* Complète le préfixe commun, sinon liste les possibilités */
      let common = candidates[0];
      for (const c of candidates) {
        while (!c.startsWith(common)) common = common.slice(0, -1);
      }
      if (common.length > partial.length) {
        replacePartial(partial, common);
      } else {
        print(promptText() + line + '\n', 'prompt', true);
        print(candidates.map(c => c.replace(/\/$/, '')).join('  ') + '\n', null, true);
      }
    }
  }

  function replacePartial(partial, completed) {
    const pos = input.selectionStart;
    const before = input.value.slice(0, pos - partial.length);
    const after = input.value.slice(pos);
    input.value = before + completed + after;
    const newPos = (before + completed).length;
    input.setSelectionRange(newPos, newPos);
  }

  /* ---------------- Éditeur nano ---------------- */

  function openEditor(path, content, writable, user) {
    editorCtx = { path, user, writable };
    editorTitle.textContent = `GNU nano (simulé) — ${VFS.pretty(path)}${writable ? '' : '  [lecture seule]'}`;
    editorArea.value = content;
    editor.classList.add('visible');
    editorArea.focus();
  }

  function closeEditor() {
    editor.classList.remove('visible');
    editorCtx = null;
    input.focus();
  }

  function saveEditor() {
    if (!editorCtx) return;
    game.saveFromEditor(editorCtx.path, editorArea.value, editorCtx.user);
    updateHeader();
  }

  editorSave.addEventListener('click', saveEditor);
  editorQuit.addEventListener('click', closeEditor);
  editorArea.addEventListener('keydown', (e) => {
    if (e.ctrlKey && (e.key === 'o' || e.key === 's')) { e.preventDefault(); saveEditor(); }
    if (e.ctrlKey && e.key === 'x') { e.preventDefault(); closeEditor(); }
    if (e.key === 'Escape') { e.preventDefault(); closeEditor(); }
  });

  /* ---------------- Pop-up du certificat PDF ---------------- */

  const certModal = document.getElementById('certmodal');
  const certTitle = document.getElementById('certmodal-title');
  const certDesc = document.getElementById('certmodal-desc');
  const certPrenom = document.getElementById('cert-prenom');
  const certNom = document.getElementById('cert-nom');
  const certError = document.getElementById('cert-error');
  const certGenerate = document.getElementById('cert-generate');
  const certCancel = document.getElementById('cert-cancel');

  function openCertModal() {
    certError.textContent = '';
    if (game.finished) {
      certTitle.textContent = '🏆 Certificat de réussite';
      certDesc.innerHTML = 'Félicitations, tu as terminé MMI Linux Quest !<br>'
        + 'Indique ton identité pour générer ton certificat officiel en PDF '
        + '(il inclut l\'historique de toutes tes commandes) :';
    } else {
      const s = game.getStats();
      certTitle.textContent = '📜 Attestation de parcours';
      certDesc.innerHTML = `Séance terminée avant la fin du jeu ? Pas de souci !<br>`
        + `Le document PDF portera la mention <b>« NON TERMINÉ »</b> `
        + `(${s.missionsDone}/${s.missionsTotal} missions réussies) et inclura `
        + `l'historique de tes commandes. Indique ton identité :`;
    }
    certModal.classList.add('visible');
    certPrenom.focus();
  }

  function closeCertModal() {
    certModal.classList.remove('visible');
    input.focus();
  }

  async function generateCertificate() {
    const prenom = certPrenom.value.trim();
    const nom = certNom.value.trim();
    if (!prenom || !nom) {
      certError.textContent = 'Merci d\'indiquer ton prénom ET ton nom.';
      (prenom ? certNom : certPrenom).focus();
      return;
    }
    certError.textContent = '';
    certGenerate.disabled = true;
    certGenerate.textContent = 'Génération en cours…';
    try {
      const res = await Certificate.generate({
        prenom, nom,
        stats: game.getStats(),
        history: game.state.history,
      });
      closeCertModal();
      const mention = game.finished ? `Bravo ${prenom} !` : `(mention « Non terminé » — reviens le compléter !)`;
      print(`📜 Certificat PDF généré et téléchargé (${res.pages} page${res.pages > 1 ? 's' : ''}). ${mention}\n`, 'success', true);
      if (!res.logosOk) {
        print('⚠️  Les logos n\'ont pas pu être intégrés (ouverture en fichier local ?) — le certificat reste valide.\n', 'hint', true);
      }
    } catch (e) {
      certError.textContent = 'Échec de la génération du PDF : ' + e.message;
    } finally {
      certGenerate.disabled = false;
      certGenerate.textContent = '📜 Télécharger le certificat PDF';
    }
  }

  certGenerate.addEventListener('click', generateCertificate);
  certCancel.addEventListener('click', () => {
    closeCertModal();
    print('Tu pourras générer ton certificat à tout moment avec la commande « certificat »\nou le bouton 📜 de la barre du bas.\n', 'info', true);
  });

  /* Bouton « certificat » de la barre du bas : disponible à tout moment */
  const hintCert = document.getElementById('hint-cert');
  hintCert.addEventListener('click', openCertModal);
  hintCert.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCertModal(); }
  });
  [certPrenom, certNom].forEach(el => el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); generateCertificate(); }
    if (e.key === 'Escape') { e.preventDefault(); closeCertModal(); }
  }));

  /* ---------------- Démarrage ---------------- */

  const hadSave = !!localStorage.getItem(Game.SAVE_KEY);
  game.start();
  if (hadSave && game.state.history.length) {
    print('💾 Partie précédente restaurée. (« reset --confirm » pour repartir de zéro)\n', 'info', true);
    print('', null);
  }
  game.printWelcome();
  updateHeader();
  tickTimer();
  setInterval(tickTimer, 10000);
  input.focus();
})();
