/* ============================================================
 * MMI Linux Quest — Moteur de jeu
 * Gère : l'état du jeu, le monde initial, le cycle des missions,
 * les indices progressifs, la sauvegarde et le certificat final.
 * ============================================================ */

const Game = (() => {

  const V = (typeof VFS !== 'undefined' ? VFS : require('./vfs.js'));
  const M = (typeof MISSIONS !== 'undefined' ? MISSIONS : require('./missions.js'));
  const { HOME } = V;

  /* v3 : sessions nominatives — une sauvegarde par étudiant sur le poste */
  const SAVE_PREFIX = 'mmi-linux-quest-v3';
  const REGISTRY_KEY = `${SAVE_PREFIX}:etudiants`;

  /** Identifiant technique à partir d'un nom (accents/espaces retirés). */
  function slug(s) {
    return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'x';
  }

  class GameEngine {
    /**
     * ui : callbacks fournis par l'interface (terminal web ou tests) :
     *  print(text, cls), clear(), openEditor(path, content, writable, user),
     *  onStateChange(), storage {get, set, remove} (facultatif)
     */
    constructor(ui) {
      this.ui = ui;
      this.storage = ui.storage || defaultStorage();
      this.fs = null;
      this.cwd = HOME;
      this.state = null;
      this.finished = false;
      this.player = null; // { prenom, nom } — demandé en début de session
    }

    /* ---------------- Sessions nominatives ---------------- */

    /** Liste des étudiants ayant une partie enregistrée sur ce poste. */
    listPlayers() {
      try {
        const arr = JSON.parse(this.storage.get(REGISTRY_KEY) || '[]');
        return Array.isArray(arr) ? arr : [];
      } catch { return []; }
    }

    playerId() { return `${slug(this.player.nom)}_${slug(this.player.prenom)}`; }

    saveKey() { return `${SAVE_PREFIX}:save:${this.playerId()}`; }

    /**
     * Démarre la session d'un étudiant : reprend sa sauvegarde si elle
     * existe sur ce poste, sinon crée une nouvelle partie.
     * Retourne true si une partie a été reprise.
     */
    startForPlayer(prenom, nom) {
      this.player = { prenom: String(prenom).trim(), nom: String(nom).trim() };
      const resumed = this.loadSave();
      if (!resumed) this.newGame();
      this.updateRegistry();
      this.ui.onStateChange && this.ui.onStateChange();
      return resumed;
    }

    /** Met à jour l'annuaire des parties du poste (pour l'écran d'accueil). */
    updateRegistry() {
      if (!this.player) return;
      try {
        const M2 = (typeof MISSIONS !== 'undefined' ? MISSIONS : require('./missions.js'));
        const players = this.listPlayers().filter(p => p.id !== this.playerId());
        players.unshift({
          id: this.playerId(),
          prenom: this.player.prenom,
          nom: this.player.nom,
          missionsDone: this.finished ? M2.missions.length : this.state.missionIndex,
          missionsTotal: M2.missions.length,
          finished: this.finished,
          lastPlayed: Date.now(),
        });
        this.storage.set(REGISTRY_KEY, JSON.stringify(players));
      } catch { /* stockage indisponible */ }
    }

    /** Fin de session : sauvegarde et retour à l'écran d'identification. */
    logoutRequest(ctx) {
      this.save();
      if (ctx && ctx.sink) {
        ctx.sink.line(`Session de ${this.player.prenom} sauvegardée sur ce poste. À bientôt ! 👋`, 'success');
      }
      if (this.ui.onLogout) this.ui.onLogout();
      else if (ctx && ctx.sink) {
        ctx.sink.line('(Le changement d\'étudiant n\'est disponible que dans le navigateur.)', 'info');
      }
    }

    newGame() {
      this.fs = new V.FileSystem();
      this.cwd = HOME;
      this.finished = false;
      this.state = {
        missionIndex: 0,
        hintLevel: 0,
        hintsUsedTotal: 0,
        startTime: Date.now(),
        endTime: null,
        used: new Set(),
        catted: new Set(),
        usedAppend: false,
        flags: {},
        services: {},
        history: [],
      };
      this.buildWorld();
      this.startMission(0, true);
      this.save();
    }

    /** Construit l'arborescence Linux de départ. */
    buildWorld() {
      const fs = this.fs;
      for (const d of ['bin', 'etc', 'tmp', 'usr', 'var']) fs.mkdir('/' + d, 'root', true);
      fs.mkdir('/var/www', 'root', true);
      fs.mkdir('/home', 'root', true);
      fs.mkdir(HOME, 'root', true);
      // Le home appartient à l'étudiant, mais /home reste à root
      fs.get(HOME).owner = 'etudiant';
      fs.mkdir(`${HOME}/missions`, 'etudiant', true);
      fs.writeFile(`${HOME}/README.txt`,
        `Bienvenue sur le serveur d'entraînement du département MMI ! 🎓

Ta première mission t'attend dans le dossier « missions ».
Affiche-la avec :

    cat missions/mission_01.txt

Rappels utiles à tout moment :
  aide         → liste des commandes disponibles
  mission      → rappelle la mission en cours
  indice       → un coup de pouce (jamais la réponse !)
  progression  → où en es-tu dans le jeu
`, 'etudiant');
    }

    /* ---------------- Cycle des missions ---------------- */

    currentMission() {
      return M.missions[this.state.missionIndex] || null;
    }

    startMission(index, silentIntro = false) {
      const m = M.missions[index];
      if (!m) return;
      this.state.missionIndex = index;
      this.state.hintLevel = 0;
      this.state.used = new Set();
      m.setup({ fs: this.fs, state: this.state });
      this.fs.writeFile(m.fichier, m.texte, 'etudiant');
      const p = V.pretty(m.fichier);
      if (!silentIntro) {
        this.ui.print('', null);
        this.ui.print(`📬 Nouvelle mission débloquée : « ${m.titre} »`, 'mission');
        this.ui.print(`   Lis les consignes avec :  cat ${p}`, 'mission');
      }
      this.ui.onStateChange && this.ui.onStateChange();
    }

    /** Appelé après chaque commande : vérifie la mission en cours. */
    checkMission() {
      if (this.finished) return;
      const m = this.currentMission();
      if (!m) return;
      const ctx = { fs: this.fs, state: this.state, cwd: this.cwd };
      let ok = false;
      try { ok = m.check(ctx); } catch { ok = false; }
      if (!ok) return;

      this.ui.print('', null);
      this.ui.print(`✅ MISSION ${m.id} RÉUSSIE — ${m.titre}`, 'success');
      if (m.bravo) this.ui.print(m.bravo, 'success');

      const next = this.state.missionIndex + 1;
      if (next < M.missions.length) {
        this.startMission(next);
      } else {
        this.finishGame();
      }
      this.save();
    }

    finishGame() {
      this.finished = true;
      this.state.endTime = Date.now();
      const mins = Math.round((this.state.endTime - this.state.startTime) / 60000);
      const h = Math.floor(mins / 60), mn = mins % 60;
      const duree = h > 0 ? `${h} h ${String(mn).padStart(2, '0')} min` : `${mn} min`;
      this.ui.print('', null);
      this.ui.print(
        `
   ██████████████████████████████████████████████████████
   █                                                    █
   █          🏆  CERTIFICAT MMI LINUX QUEST  🏆         █
   █                                                    █
   █   Décerné à : etudiant@serveur-mmi                 █
   █                                                    █
   █   Pour avoir maîtrisé le terminal Linux :          █
   █   navigation, fichiers, droits, sudo, apt,         █
   █   services système et déploiement web !            █
   █                                                    █
   █   Durée du parcours : ${duree.padEnd(27)}█
   █   Indices utilisés  : ${String(this.state.hintsUsedTotal).padEnd(27)}█
   █                                                    █
   █   Félicitations, futur(e) pro du multimédia ! 🎓   █
   █                                                    █
   ██████████████████████████████████████████████████████
`, 'success');
      this.ui.print('Le jeu est terminé, mais le terminal reste ouvert : entraîne-toi librement !', 'info');
      this.ui.print('📜 Pour télécharger ton certificat officiel en PDF : tape  certificat', 'mission');
      this.ui.print('Pour tout recommencer : reset --confirm', 'info');
      this.ui.onStateChange && this.ui.onStateChange();
      this.ui.onGameFinished && this.ui.onGameFinished();
    }

    /** Statistiques pour le certificat PDF. */
    getStats() {
      const M2 = (typeof MISSIONS !== 'undefined' ? MISSIONS : require('./missions.js'));
      const mins = Math.round(((this.state.endTime || Date.now()) - this.state.startTime) / 60000);
      const h = Math.floor(mins / 60), mn = mins % 60;
      return {
        duree: h > 0 ? `${h} h ${String(mn).padStart(2, '0')} min` : `${mn} min`,
        missionsTotal: M2.missions.length,
        missionsDone: this.finished ? M2.missions.length : this.state.missionIndex,
        finished: this.finished,
        indices: this.state.hintsUsedTotal,
        date: new Date(this.state.endTime || Date.now())
          .toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
      };
    }

    /**
     * Commande « certificat » : ouvre la fenêtre du certificat.
     * Disponible à tout moment — avant la fin, le document portera
     * la mention « NON TERMINÉ » (utile si la séance s'achève avant
     * la fin du parcours).
     */
    requestCertificate(ctx) {
      if (!this.ui.onGameFinished) {
        ctx.sink && ctx.sink.line('(La génération du certificat n\'est disponible que dans le navigateur.)', 'info');
        return;
      }
      if (!this.finished && ctx.sink) {
        const stats = this.getStats();
        ctx.sink.line(`Parcours en cours (${stats.missionsDone}/${stats.missionsTotal} missions) : le document portera la mention « NON TERMINÉ ».`, 'info');
        ctx.sink.line('Tu pourras rééditer un certificat complet quand tu auras tout terminé. 💪', 'info');
      }
      this.ui.onGameFinished();
    }

    /* ---------------- Indices (jamais la réponse) ---------------- */

    giveHint(ctx) {
      const m = this.currentMission();
      if (!m || this.finished) {
        ctx.sink.line('Le jeu est terminé, plus besoin d\'indices ! 🎉');
        return;
      }
      const level = Math.min(this.state.hintLevel, m.indices.length - 1);
      ctx.sink.line(`💡 Indice ${level + 1}/${m.indices.length} — Mission ${m.id} :`, 'hint');
      ctx.sink.line('   ' + m.indices[level], 'hint');
      if (this.state.hintLevel < m.indices.length - 1) {
        ctx.sink.line('   (retape « indice » pour un indice plus précis)', 'info');
      } else {
        ctx.sink.line('   (c\'était l\'indice le plus précis — relis aussi la mission avec « mission »)', 'info');
      }
      if (this.state.hintLevel < m.indices.length) {
        this.state.hintLevel++;
        this.state.hintsUsedTotal++;
      }
      this.save();
    }

    remindMission(ctx) {
      const m = this.currentMission();
      if (!m || this.finished) { ctx.sink.line('🎉 Toutes les missions sont terminées !', 'success'); return; }
      ctx.sink.line(`Mission en cours : n°${m.id} — ${m.titre}`, 'mission');
      ctx.sink.line(`Consignes complètes :  cat ${V.pretty(m.fichier)}`, 'mission');
    }

    showProgress(ctx) {
      const idx = this.finished ? M.missions.length : this.state.missionIndex;
      ctx.sink.line(`Progression : ${idx}/${M.missions.length} missions réussies`, 'info');
      M.missions.forEach((m, i) => {
        const done = i < idx;
        const current = i === idx && !this.finished;
        const icon = done ? '✅' : current ? '👉' : '🔒';
        const title = done || current ? m.titre : '???';
        ctx.sink.line(` ${icon} Mission ${String(m.id).padStart(2)} : ${title}`, done ? 'success' : current ? 'mission' : null);
      });
      const mins = Math.round(((this.state.endTime || Date.now()) - this.state.startTime) / 60000);
      ctx.sink.line(`Temps de jeu : ${mins} min — Indices utilisés : ${this.state.hintsUsedTotal}`, 'info');
    }

    /* ---------------- Callbacks appelés par le shell ---------------- */

    clearScreen() { this.ui.clear && this.ui.clear(); }

    openEditor(path, content, writable, user) {
      this.ui.openEditor(path, content, writable, user);
    }

    /** Appelé par l'éditeur quand l'utilisateur enregistre. */
    saveFromEditor(path, content, user) {
      const r = this.fs.writeFile(path, content, user);
      if (r.error) {
        this.ui.print(`nano: ${r.error}`, 'error');
        this.ui.print('   💡 Ce fichier appartient à root : il faut ouvrir nano avec sudo...', 'hint');
        return false;
      }
      this.ui.print(`[ ${V.pretty(path)} enregistré ]`, 'success');
      this.checkMission();
      this.save();
      return true;
    }

    resetGame() {
      this.storage.remove(this.saveKey());
      this.ui.print(`Partie de ${this.player.prenom} réinitialisée. Bonne chance pour cette nouvelle partie ! 🍀`, 'info');
      this.newGame();
      this.updateRegistry();
      this.ui.clear && this.ui.clear();
      this.printWelcome();
      this.ui.onStateChange && this.ui.onStateChange();
    }

    /* ---------------- Exécution d'une ligne ---------------- */

    execute(line) {
      const S = (typeof Shell !== 'undefined' ? Shell : require('./commands.js'));
      if (line.trim()) this.state.history.push(line.trim());
      S.run(line, {
        fs: this.fs,
        getCwd: () => this.cwd,
        setCwd: (p) => { this.cwd = p; },
        state: this.state,
        game: this,
        sink: {
          push: (text, cls) => this.ui.print(text, cls, true),
          line: (text, cls) => this.ui.print((text || '') + '\n', cls, true),
          text: () => '',
        },
      });
      this.checkMission();
      this.save();
    }

    printWelcome() {
      this.ui.print(
        ` __  __ __  __ ___   _     _                     ___                  _
|  \\/  |  \\/  |_ _| | |   (_)_ _  _  ___ __    / _ \\ _  _ ___ ___| |_
| |\\/| | |\\/| || |  | |__ | | ' \\| || \\ \\ /   | (_) | || / -_|_-<  _|
|_|  |_|_|  |_|___| |____||_|_||_|\\_,_/_\\_\\    \\__\\_\\\\_,_\\___/__/\\__|
`, 'logo');
      this.ui.print('Bienvenue sur le serveur d\'entraînement Linux du BUT MMI ! 🐧', 'info');
      const who = this.player ? ` — ${this.player.prenom} ${this.player.nom.toUpperCase()}` : '';
      this.ui.print(`Session ouverte : etudiant@serveur-mmi${who}`, 'info');
      this.ui.print('', null);
      this.ui.print('Pour commencer, lis le fichier d\'accueil :  cat README.txt', 'mission');
      this.ui.print('', null);
    }

    /* ---------------- Sauvegarde ---------------- */

    save() {
      if (!this.player) return;
      try {
        this.storage.set(this.saveKey(), JSON.stringify({
          player: this.player,
          fs: this.fs.toJSON(),
          cwd: this.cwd,
          finished: this.finished,
          state: {
            ...this.state,
            used: [...this.state.used],
            catted: [...this.state.catted],
          },
        }));
        this.updateRegistry();
      } catch { /* stockage indisponible : le jeu reste jouable sans sauvegarde */ }
    }

    loadSave() {
      try {
        const raw = this.storage.get(this.saveKey());
        if (!raw) return false;
        const data = JSON.parse(raw);
        this.fs = V.FileSystem.fromJSON(data.fs);
        this.cwd = data.cwd || HOME;
        this.finished = !!data.finished;
        if (data.player) this.player = data.player;
        this.state = {
          ...data.state,
          used: new Set(data.state.used),
          catted: new Set(data.state.catted),
        };
        return true;
      } catch { return false; }
    }
  }

  function defaultStorage() {
    if (typeof localStorage !== 'undefined') {
      return {
        get: k => localStorage.getItem(k),
        set: (k, v) => localStorage.setItem(k, v),
        remove: k => localStorage.removeItem(k),
      };
    }
    const mem = {};
    return { get: k => mem[k] || null, set: (k, v) => { mem[k] = v; }, remove: k => { delete mem[k]; } };
  }

  return { GameEngine, SAVE_PREFIX, REGISTRY_KEY };
})();

if (typeof module !== 'undefined') module.exports = Game;
