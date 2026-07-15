/* ============================================================
 * MMI Linux Quest — Interpréteur de commandes (shell simulé)
 * Gère : parsing (guillemets), pipes |, redirections > et >>,
 * sudo, exécution de scripts ./x.sh et toutes les commandes.
 * ============================================================ */

const Shell = (() => {

  const { normalize, pretty, HOME } = (typeof VFS !== 'undefined' ? VFS : require('./vfs.js'));

  /* ---------- Découpage d'une ligne en tokens (gère les guillemets) ---------- */
  function tokenize(line) {
    const tokens = [];
    let cur = '';
    let quote = null;
    let has = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (quote) {
        if (c === quote) quote = null;
        else cur += c;
      } else if (c === '"' || c === "'") {
        quote = c; has = true;
      } else if (c === ' ' || c === '\t') {
        if (has || cur !== '') { tokens.push(cur); cur = ''; has = false; }
      } else if (c === '>' || c === '|') {
        if (has || cur !== '') { tokens.push(cur); cur = ''; has = false; }
        if (c === '>' && line[i + 1] === '>') { tokens.push('>>'); i++; }
        else tokens.push(c);
      } else {
        cur += c;
      }
    }
    if (has || cur !== '') tokens.push(cur);
    return tokens;
  }

  /* ---------- Sink de sortie : accumule {text, cls} ---------- */
  function makeSink() {
    const parts = [];
    return {
      parts,
      push(text, cls) { parts.push({ text, cls: cls || null }); },
      line(text, cls) { parts.push({ text: (text || '') + '\n', cls: cls || null }); },
      text() { return parts.map(p => p.text).join(''); },
    };
  }

  /* ---------- Distance de Levenshtein (suggestions) ---------- */
  function lev(a, b) {
    const m = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 0; j <= b.length; j++) m[0][j] = j;
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++)
        m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return m[a.length][b.length];
  }

  /* ---------- Lecture d'un fichier pour cat/grep/head... ---------- */
  function readFileArg(ctx, path, cmdName) {
    const abs = normalize(path, ctx.cwd);
    const node = ctx.fs.get(abs);
    if (!node) return { error: `${cmdName}: ${path}: Aucun fichier ou dossier de ce type` };
    if (node.type === 'dir') return { error: `${cmdName}: ${path}: Est un dossier` };
    return { abs, content: node.content };
  }

  /* ============================================================
   * DÉFINITION DES COMMANDES
   * Chaque commande : { desc, usage, man, run(ctx, args) }
   * ctx = { fs, cwd, setCwd, user, stdin, sink, state, game }
   * ============================================================ */
  const COMMANDS = {

    /* ----- Aide du jeu ----- */
    aide: {
      desc: 'affiche la liste des commandes disponibles',
      usage: 'aide',
      run(ctx) {
        ctx.sink.line('╭─ COMMANDES DISPONIBLES ─────────────────────────────╮', 'info');
        const names = Object.keys(COMMANDS).sort();
        for (const n of names) {
          ctx.sink.push('  ' + n.padEnd(12), 'cmd');
          ctx.sink.line(COMMANDS[n].desc);
        }
        ctx.sink.line('╰─────────────────────────────────────────────────────╯', 'info');
        ctx.sink.line('Détail d\'une commande : man <commande>   —   Coincé(e) ? : indice', 'info');
      },
    },

    help: {
      desc: 'synonyme de « aide »',
      usage: 'help',
      run(ctx) { COMMANDS.aide.run(ctx); },
    },

    indice: {
      desc: 'donne un indice pour la mission en cours (jamais la réponse !)',
      usage: 'indice',
      run(ctx) { ctx.game.giveHint(ctx); },
    },

    mission: {
      desc: 'rappelle la mission en cours',
      usage: 'mission',
      run(ctx) { ctx.game.remindMission(ctx); },
    },

    progression: {
      desc: 'affiche ta progression dans le jeu',
      usage: 'progression',
      run(ctx) { ctx.game.showProgress(ctx); },
    },

    man: {
      desc: 'affiche le manuel d\'une commande',
      usage: 'man <commande>',
      run(ctx, args) {
        if (!args.length) { ctx.sink.line('Quelle page de manuel voulez-vous ?\nExemple : man ls'); return; }
        const c = COMMANDS[args[0]];
        if (!c) { ctx.sink.line(`man: aucune entrée de manuel pour ${args[0]}`, 'error'); return; }
        ctx.sink.line(`NOM\n    ${args[0]} — ${c.desc}\n\nSYNOPSIS\n    ${c.usage}${c.man ? '\n\nDESCRIPTION\n    ' + c.man : ''}`);
      },
    },

    /* ----- Navigation ----- */
    pwd: {
      desc: 'affiche le chemin du répertoire courant',
      usage: 'pwd',
      man: 'Print Working Directory : indique où tu te trouves dans l\'arborescence.',
      run(ctx) { ctx.sink.line(ctx.cwd); },
    },

    cd: {
      desc: 'change de répertoire',
      usage: 'cd [dossier]',
      man: 'Change Directory. Sans argument (ou avec ~), retourne au dossier personnel.\n    « cd .. » remonte d\'un niveau.',
      run(ctx, args) {
        const target = args.length ? args[0] : '~';
        const abs = normalize(target, ctx.cwd);
        const node = ctx.fs.get(abs);
        if (!node) { ctx.sink.line(`cd: ${target}: Aucun fichier ou dossier de ce type`, 'error'); return; }
        if (node.type !== 'dir') { ctx.sink.line(`cd: ${target}: N'est pas un dossier`, 'error'); return; }
        ctx.setCwd(abs);
      },
    },

    ls: {
      desc: 'liste le contenu d\'un répertoire',
      usage: 'ls [-a] [-l] [dossier]',
      man: 'List. Options :\n    -a  affiche aussi les fichiers cachés (noms commençant par .)\n    -l  format long : droits, propriétaire, taille',
      run(ctx, args) {
        let all = false, long = false;
        const paths = [];
        for (const a of args) {
          if (a.startsWith('-') && a.length > 1) {
            if (a.includes('a')) all = true;
            if (a.includes('l')) long = true;
          } else paths.push(a);
        }
        if (!paths.length) paths.push('.');
        const multiple = paths.length > 1;
        paths.forEach((p, idx) => {
          const abs = normalize(p, ctx.cwd);
          const node = ctx.fs.get(abs);
          if (!node) { ctx.sink.line(`ls: impossible d'accéder à '${p}': Aucun fichier ou dossier de ce type`, 'error'); return; }
          if (multiple) ctx.sink.line(`${p}:`);
          const entries = node.type === 'dir'
            ? Object.keys(node.children).sort()
            : [abs.split('/').pop()];
          const src = node.type === 'dir' ? node.children : { [entries[0]]: node };
          let shown = 0;
          for (const name of entries) {
            if (!all && name.startsWith('.')) continue;
            const child = src[name];
            const cls = child.type === 'dir' ? 'dir' : (ctx.fs.isExecutable(child) ? 'exec' : null);
            if (long) {
              const size = child.type === 'file' ? String(child.content.length) : '4096';
              ctx.sink.push(`${ctx.fs.permString(child)} ${child.owner.padEnd(8)} ${size.padStart(6)} `);
              ctx.sink.push(name, cls);
              ctx.sink.push('\n');
            } else {
              ctx.sink.push(name, cls);
              ctx.sink.push('  ');
            }
            shown++;
          }
          if (!long && shown > 0) ctx.sink.push('\n');
          if (multiple && idx < paths.length - 1) ctx.sink.push('\n');
        });
      },
    },

    tree: {
      desc: 'affiche l\'arborescence d\'un dossier',
      usage: 'tree [dossier]',
      run(ctx, args) {
        const abs = normalize(args[0] || '.', ctx.cwd);
        const node = ctx.fs.get(abs);
        if (!node || node.type !== 'dir') { ctx.sink.line(`tree: ${args[0] || '.'}: Dossier introuvable`, 'error'); return; }
        ctx.sink.line(pretty(abs), 'dir');
        const walk = (n, prefix) => {
          const names = Object.keys(n.children).sort().filter(x => !x.startsWith('.'));
          names.forEach((name, i) => {
            const last = i === names.length - 1;
            const child = n.children[name];
            ctx.sink.push(prefix + (last ? '└── ' : '├── '));
            ctx.sink.push(name + '\n', child.type === 'dir' ? 'dir' : null);
            if (child.type === 'dir') walk(child, prefix + (last ? '    ' : '│   '));
          });
        };
        walk(node, '');
      },
    },

    /* ----- Lecture ----- */
    cat: {
      desc: 'affiche le contenu d\'un fichier',
      usage: 'cat <fichier> [...]',
      man: 'Concatenate : affiche un ou plusieurs fichiers à l\'écran.',
      run(ctx, args) {
        if (!args.length) {
          if (ctx.stdin !== null) { ctx.sink.push(ctx.stdin); return; }
          ctx.sink.line('cat: précise un fichier à afficher. Exemple : cat README.txt', 'error');
          return;
        }
        for (const a of args) {
          const r = readFileArg(ctx, a, 'cat');
          if (r.error) { ctx.sink.line(r.error, 'error'); continue; }
          ctx.state.catted.add(r.abs);
          ctx.sink.push(r.content.endsWith('\n') || r.content === '' ? r.content : r.content + '\n');
        }
      },
    },

    head: {
      desc: 'affiche les premières lignes d\'un fichier',
      usage: 'head [-n N] <fichier>',
      run(ctx, args) { headTail(ctx, args, true); },
    },

    tail: {
      desc: 'affiche les dernières lignes d\'un fichier',
      usage: 'tail [-n N] <fichier>',
      run(ctx, args) { headTail(ctx, args, false); },
    },

    wc: {
      desc: 'compte les lignes, mots et caractères',
      usage: 'wc [-l] [fichier]',
      run(ctx, args) {
        let linesOnly = false; const files = [];
        for (const a of args) { if (a === '-l') linesOnly = true; else files.push(a); }
        let content, label = '';
        if (files.length) {
          const r = readFileArg(ctx, files[0], 'wc');
          if (r.error) { ctx.sink.line(r.error, 'error'); return; }
          content = r.content; label = ' ' + files[0];
        } else if (ctx.stdin !== null) content = ctx.stdin;
        else { ctx.sink.line('wc: précise un fichier. Exemple : wc -l notes.txt', 'error'); return; }
        const lines = content === '' ? 0 : content.split('\n').filter((l, i, arr) => i < arr.length - 1 || l !== '').length;
        if (linesOnly) ctx.sink.line(`${lines}${label}`);
        else {
          const words = content.split(/\s+/).filter(Boolean).length;
          ctx.sink.line(`${lines} ${words} ${content.length}${label}`);
        }
      },
    },

    /* ----- Création / modification ----- */
    mkdir: {
      desc: 'crée un ou plusieurs répertoires',
      usage: 'mkdir [-p] <dossier> [...]',
      man: 'Make Directory. L\'option -p crée aussi les dossiers parents manquants.',
      run(ctx, args) {
        let parents = false; const paths = [];
        for (const a of args) { if (a === '-p') parents = true; else paths.push(a); }
        if (!paths.length) { ctx.sink.line('mkdir: opérande manquant. Exemple : mkdir mon_dossier', 'error'); return; }
        for (const p of paths) {
          const r = ctx.fs.mkdir(normalize(p, ctx.cwd), ctx.user, parents);
          if (r.error) ctx.sink.line(r.error, 'error');
        }
      },
    },

    touch: {
      desc: 'crée un fichier vide',
      usage: 'touch <fichier> [...]',
      run(ctx, args) {
        if (!args.length) { ctx.sink.line('touch: opérande manquant. Exemple : touch notes.txt', 'error'); return; }
        for (const p of args) {
          const r = ctx.fs.touch(normalize(p, ctx.cwd), ctx.user);
          if (r.error) ctx.sink.line(r.error, 'error');
        }
      },
    },

    echo: {
      desc: 'affiche un texte (utile avec > et >> pour écrire dans un fichier)',
      usage: 'echo "texte" [> fichier | >> fichier]',
      man: 'Affiche le texte donné. Combiné à une redirection :\n    >  écrit dans un fichier (écrase)\n    >> ajoute à la fin d\'un fichier',
      run(ctx, args) { ctx.sink.line(args.join(' ')); },
    },

    /* ----- Déplacement / copie / suppression ----- */
    cp: {
      desc: 'copie un fichier ou un dossier',
      usage: 'cp [-r] <source> <destination>',
      man: 'Copy. L\'original est conservé. Pour copier un dossier entier : option -r.',
      run(ctx, args) {
        let rec = false; const paths = [];
        for (const a of args) { if (a === '-r' || a === '-R') rec = true; else paths.push(a); }
        if (paths.length < 2) { ctx.sink.line('cp: il faut une source ET une destination. Exemple : cp photo.png dossier/', 'error'); return; }
        const r = ctx.fs.copy(normalize(paths[0], ctx.cwd), normalize(paths[1], ctx.cwd), ctx.user, rec);
        if (r.error) ctx.sink.line(r.error, 'error');
      },
    },

    mv: {
      desc: 'déplace ou renomme un fichier ou un dossier',
      usage: 'mv <source> <destination>',
      man: 'Move. Si la destination est un dossier, la source est déplacée dedans.\n    Sinon, la source est renommée.',
      run(ctx, args) {
        if (args.length < 2) { ctx.sink.line('mv: il faut une source ET une destination. Exemple : mv brouillon.txt final.txt', 'error'); return; }
        const r = ctx.fs.move(normalize(args[0], ctx.cwd), normalize(args[1], ctx.cwd), ctx.user);
        if (r.error) ctx.sink.line(r.error, 'error');
      },
    },

    rm: {
      desc: 'supprime des fichiers (ou des dossiers avec -r)',
      usage: 'rm [-r] [-f] <cible> [...]',
      man: 'Remove. ATTENTION : pas de corbeille, la suppression est définitive !\n    -r supprime récursivement un dossier et son contenu.',
      run(ctx, args) {
        let rec = false; const paths = [];
        for (const a of args) {
          if (a.startsWith('-') && a.length > 1) { if (a.includes('r') || a.includes('R')) rec = true; }
          else paths.push(a);
        }
        if (!paths.length) { ctx.sink.line('rm: opérande manquant. Exemple : rm vieux_fichier.txt', 'error'); return; }
        for (const p of paths) {
          const abs = normalize(p, ctx.cwd);
          if (abs === '/' || abs === HOME) { ctx.sink.line(`rm: refus de supprimer '${p}' : sécurité du jeu 😅`, 'error'); continue; }
          const r = ctx.fs.remove(abs, ctx.user, rec);
          if (r.error) ctx.sink.line(r.error, 'error');
        }
      },
    },

    rmdir: {
      desc: 'supprime un répertoire vide',
      usage: 'rmdir <dossier>',
      run(ctx, args) {
        if (!args.length) { ctx.sink.line('rmdir: opérande manquant. Exemple : rmdir dossier_vide', 'error'); return; }
        for (const p of args) {
          const r = ctx.fs.rmdir(normalize(p, ctx.cwd), ctx.user);
          if (r.error) ctx.sink.line(r.error, 'error');
        }
      },
    },

    /* ----- Recherche ----- */
    find: {
      desc: 'cherche des fichiers par leur NOM',
      usage: 'find [dossier] -name "motif"',
      run(ctx, args) {
        let start = '.'; let pattern = null;
        for (let i = 0; i < args.length; i++) {
          if (args[i] === '-name') { pattern = args[i + 1]; i++; }
          else if (!args[i].startsWith('-')) start = args[i];
        }
        const abs = normalize(start, ctx.cwd);
        const node = ctx.fs.get(abs);
        if (!node) { ctx.sink.line(`find: '${start}': Aucun fichier ou dossier de ce type`, 'error'); return; }
        const regex = pattern
          ? new RegExp('^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$')
          : null;
        const results = [];
        const walk = (n, path) => {
          const name = path.split('/').pop() || '/';
          if (!regex || regex.test(name)) results.push(path);
          if (n.type === 'dir') for (const [k, v] of Object.entries(n.children)) walk(v, path + '/' + k);
        };
        walk(node, abs === '/' ? '' : abs);
        if (!results.length) ctx.sink.line('(aucun résultat)');
        results.forEach(r => ctx.sink.line(pretty(r || '/')));
      },
    },

    grep: {
      desc: 'cherche un texte DANS le contenu des fichiers',
      usage: 'grep [-r] [-i] [-n] <motif> <fichier|dossier>',
      man: 'Cherche les lignes contenant le motif.\n    -r cherche récursivement dans un dossier\n    -i ignore la casse (majuscules/minuscules)\n    -n affiche les numéros de ligne',
      run(ctx, args) {
        let rec = false, icase = false, nums = false;
        const rest = [];
        for (const a of args) {
          if (a.startsWith('-') && a.length > 1 && /^-[rinRA]+$/.test(a)) {
            if (a.toLowerCase().includes('r')) rec = true;
            if (a.includes('i')) icase = true;
            if (a.includes('n')) nums = true;
          } else rest.push(a);
        }
        if (!rest.length) { ctx.sink.line('grep: précise un motif. Exemple : grep -r "mot" dossier', 'error'); return; }
        const pattern = rest[0];
        const targets = rest.slice(1);
        const flags = icase ? 'i' : '';
        let regex;
        try { regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags); }
        catch { ctx.sink.line(`grep: motif invalide`, 'error'); return; }

        const matchContent = (content, label) => {
          content.split('\n').forEach((lineTxt, i) => {
            if (regex.test(lineTxt)) {
              let prefix = '';
              if (label) prefix += label + ':';
              if (nums) prefix += (i + 1) + ':';
              ctx.sink.push(prefix, 'info');
              ctx.sink.push(lineTxt + '\n');
            }
          });
        };

        if (!targets.length) {
          if (ctx.stdin !== null) { matchContent(ctx.stdin.replace(/\n$/, ''), ''); return; }
          ctx.sink.line('grep: précise un fichier ou un dossier à fouiller', 'error');
          return;
        }
        for (const t of targets) {
          const abs = normalize(t, ctx.cwd);
          const node = ctx.fs.get(abs);
          if (!node) { ctx.sink.line(`grep: ${t}: Aucun fichier ou dossier de ce type`, 'error'); continue; }
          if (node.type === 'dir') {
            if (!rec) { ctx.sink.line(`grep: ${t}: est un dossier (utilise l'option récursive)`, 'error'); continue; }
            const walk = (n, path) => {
              for (const [k, v] of Object.entries(n.children)) {
                if (v.type === 'dir') walk(v, path + '/' + k);
                else matchContent(v.content.replace(/\n$/, ''), pretty(path + '/' + k));
              }
            };
            walk(node, abs);
          } else {
            matchContent(node.content.replace(/\n$/, ''), targets.length > 1 || rec ? pretty(abs) : '');
          }
        }
      },
    },

    /* ----- Droits ----- */
    chmod: {
      desc: 'modifie les droits d\'un fichier',
      usage: 'chmod <mode> <fichier>   (ex : chmod +x script.sh, chmod 755 fichier)',
      man: 'Change Mode. Droits : r (lire), w (écrire), x (exécuter).\n    Notation symbolique : +x, u+x, go-w...\n    Notation numérique : 755, 644... (propriétaire/groupe/autres)',
      run(ctx, args) {
        if (args.length < 2) { ctx.sink.line('chmod: utilisation : chmod <mode> <fichier>. Exemple : chmod +x script.sh', 'error'); return; }
        const r = ctx.fs.chmod(normalize(args[1], ctx.cwd), args[0], ctx.user);
        if (r.error) ctx.sink.line(r.error, 'error');
      },
    },

    /* ----- Système / administration ----- */
    whoami: {
      desc: 'affiche l\'utilisateur courant',
      usage: 'whoami',
      run(ctx) { ctx.sink.line(ctx.user); },
    },

    hostname: {
      desc: 'affiche le nom de la machine',
      usage: 'hostname',
      run(ctx) { ctx.sink.line('serveur-mmi'); },
    },

    date: {
      desc: 'affiche la date et l\'heure',
      usage: 'date',
      run(ctx) { ctx.sink.line(new Date().toLocaleString('fr-FR')); },
    },

    history: {
      desc: 'affiche l\'historique des commandes',
      usage: 'history',
      run(ctx) {
        ctx.state.history.forEach((h, i) => ctx.sink.line(`  ${String(i + 1).padStart(4)}  ${h}`));
      },
    },

    clear: {
      desc: 'efface l\'écran',
      usage: 'clear',
      run(ctx) { ctx.game.clearScreen(); },
    },

    sudo: {
      desc: 'exécute une commande en tant qu\'administrateur (root)',
      usage: 'sudo <commande>',
      man: 'Super User DO : donne temporairement les droits administrateur.\n    Indispensable pour installer des logiciels ou modifier les fichiers système.',
      run(ctx) {
        ctx.sink.line('sudo: précise la commande à exécuter en administrateur.\nExemple : sudo apt update', 'error');
      },
    },

    apt: {
      desc: 'gestionnaire de paquets (installer des logiciels)',
      usage: 'sudo apt update | sudo apt install <paquet>',
      man: 'Advanced Package Tool (Debian/Ubuntu).\n    update  : met à jour la liste des paquets disponibles\n    install : installe un paquet\n    Nécessite les droits administrateur (sudo).',
      run(ctx, args) {
        const action = args[0];
        if (!action) { ctx.sink.line('apt: précise une action : update ou install. Exemple : sudo apt update', 'error'); return; }
        if (action === 'update') {
          if (ctx.user !== 'root') {
            ctx.sink.line('E: Impossible d\'ouvrir le fichier verrou /var/lib/apt/lists/lock - Permission non accordée', 'error');
            ctx.sink.line('   💡 Les commandes d\'administration se lancent avec un préfixe spécial... (voir mission)', 'hint');
            return;
          }
          ctx.sink.line('Atteint :1 http://fr.archive.ubuntu.com/ubuntu noble InRelease');
          ctx.sink.line('Réception de :2 http://fr.archive.ubuntu.com/ubuntu noble-updates InRelease [126 kB]');
          ctx.sink.line('Lecture des listes de paquets... Fait');
          ctx.sink.line('Tous les paquets sont à jour.', 'success');
          ctx.state.flags.aptUpdated = true;
          return;
        }
        if (action === 'install') {
          const pkg = args.filter(a => a !== '-y')[1];
          if (!pkg) { ctx.sink.line('apt install: précise le nom du paquet à installer', 'error'); return; }
          if (ctx.user !== 'root') {
            ctx.sink.line('E: Impossible d\'ouvrir le fichier verrou /var/lib/dpkg/lock - Permission non accordée', 'error');
            ctx.sink.line('   💡 Il te manque les droits administrateur pour installer un logiciel...', 'hint');
            return;
          }
          if (pkg !== 'apache2') {
            ctx.sink.line(`E: Impossible de trouver le paquet ${pkg}`, 'error');
            ctx.sink.line('   💡 Dans ce jeu, seul le serveur web « apache2 » est disponible à l\'installation.', 'hint');
            return;
          }
          if (!ctx.state.flags.aptUpdated) {
            ctx.sink.line('E: Le paquet apache2 n\'a pas de version disponible (liste des paquets périmée)', 'error');
            ctx.sink.line('   💡 Commence par mettre à jour la liste des paquets (action « update »).', 'hint');
            return;
          }
          if (ctx.state.flags.apacheInstalled) {
            ctx.sink.line('apache2 est déjà la version la plus récente.');
            return;
          }
          ctx.sink.line('Lecture des listes de paquets... Fait');
          ctx.sink.line('Les NOUVEAUX paquets suivants seront installés : apache2 apache2-bin apache2-data');
          ctx.sink.line('Réception de apache2 (2.4.58-1ubuntu8) [1 968 kB]');
          ctx.sink.line('Dépaquetage de apache2... Paramétrage de apache2...');
          ctx.sink.line('✔ apache2 installé avec succès.', 'success');
          ctx.state.flags.apacheInstalled = true;
          ctx.state.services.apache2 = 'stopped';
          ctx.fs.mkdir('/etc/apache2', 'root', true);
          ctx.fs.writeFile('/etc/apache2/apache2.conf',
            '# Configuration principale d\'Apache\nServerRoot "/etc/apache2"\nDocumentRoot /var/www/html\nListen 80\n', 'root');
          ctx.fs.mkdir('/var/www/html', 'root', true);
          ctx.fs.writeFile('/var/www/html/index.html',
            '<html><body>\n<h1>Apache2 Ubuntu Default Page</h1>\n<p>It works! Ceci est la page par defaut d\'Apache.</p>\n</body></html>\n', 'root');
          return;
        }
        ctx.sink.line(`apt: action inconnue « ${action} ». Actions disponibles : update, install`, 'error');
      },
    },

    'apt-get': {
      desc: 'synonyme de apt',
      usage: 'sudo apt-get update | install <paquet>',
      run(ctx, args) { COMMANDS.apt.run(ctx, args); },
    },

    systemctl: {
      desc: 'pilote les services système (start, stop, status)',
      usage: 'systemctl <start|stop|status> <service>',
      man: 'Contrôle systemd :\n    start   démarre un service (droits admin requis)\n    stop    arrête un service (droits admin requis)\n    status  affiche l\'état du service',
      run(ctx, args) {
        const [action, service] = args;
        if (!action || !service) { ctx.sink.line('systemctl: utilisation : systemctl <start|stop|status> <service>', 'error'); return; }
        if (service !== 'apache2') {
          ctx.sink.line(`Unit ${service}.service could not be found.`, 'error');
          ctx.sink.line('   💡 Le seul service de ce jeu est « apache2 ».', 'hint');
          return;
        }
        if (!ctx.state.flags.apacheInstalled) {
          ctx.sink.line('Unit apache2.service could not be found.', 'error');
          ctx.sink.line('   💡 Apache ne semble pas encore installé...', 'hint');
          return;
        }
        if (action === 'status') {
          const running = ctx.state.services.apache2 === 'running';
          ctx.sink.line('● apache2.service - The Apache HTTP Server');
          ctx.sink.push('     Active: ');
          ctx.sink.push(running ? 'active (running)' : 'inactive (dead)', running ? 'success' : 'error');
          ctx.sink.push('\n');
          ctx.sink.line('     Docs: https://httpd.apache.org/docs/');
          return;
        }
        if (action === 'start' || action === 'stop' || action === 'restart') {
          if (ctx.user !== 'root') {
            ctx.sink.line(`Failed to ${action} apache2.service: Access denied`, 'error');
            ctx.sink.line('   💡 Démarrer ou arrêter un service demande les droits administrateur...', 'hint');
            return;
          }
          ctx.state.services.apache2 = action === 'stop' ? 'stopped' : 'running';
          ctx.sink.line(`✔ apache2.service : ${action === 'stop' ? 'arrêté' : 'démarré'}.`, 'success');
          return;
        }
        ctx.sink.line(`systemctl: action inconnue « ${action} ». Utilise start, stop ou status.`, 'error');
      },
    },

    service: {
      desc: 'synonyme historique de systemctl',
      usage: 'service <service> <start|stop|status>',
      run(ctx, args) {
        if (args.length < 2) { ctx.sink.line('service: utilisation : service <service> <action>', 'error'); return; }
        COMMANDS.systemctl.run(ctx, [args[1], args[0]]);
      },
    },

    curl: {
      desc: 'interroge une URL (teste ton serveur web)',
      usage: 'curl <url>   (ex : curl localhost)',
      man: 'Client URL : envoie une requête HTTP et affiche la réponse.\n    « localhost » désigne ta propre machine.',
      run(ctx, args) {
        if (!args.length) { ctx.sink.line('curl: précise une URL. Exemple : curl localhost', 'error'); return; }
        const url = args[args.length - 1].replace(/^https?:\/\//, '').replace(/\/$/, '');
        if (url !== 'localhost' && url !== '127.0.0.1') {
          ctx.sink.line(`curl: (6) Could not resolve host: ${url}`, 'error');
          ctx.sink.line('   💡 Dans ce jeu, seul « localhost » (ta machine) répond.', 'hint');
          return;
        }
        if (ctx.state.services.apache2 !== 'running') {
          ctx.sink.line('curl: (7) Failed to connect to localhost port 80: Connexion refusée', 'error');
          ctx.sink.line('   💡 Y a-t-il bien un serveur web installé ET démarré ?', 'hint');
          return;
        }
        const page = ctx.fs.get('/var/www/html/index.html');
        const content = page && page.type === 'file' ? page.content : '';
        ctx.sink.push(content.endsWith('\n') ? content : content + '\n');
        ctx.state.flags.curledLocalhost = true;
        if (content && !content.includes('Apache2 Ubuntu Default Page')) {
          ctx.state.flags.curledCustomPage = true;
        }
      },
    },

    nano: {
      desc: 'ouvre un fichier dans l\'éditeur de texte',
      usage: 'nano <fichier>',
      man: 'Éditeur de texte simple. Dans l\'éditeur :\n    Ctrl+O (ou bouton Enregistrer) : sauvegarder\n    Ctrl+X (ou bouton Quitter)     : fermer',
      run(ctx, args) {
        if (!args.length) { ctx.sink.line('nano: précise un fichier à ouvrir. Exemple : nano notes.txt', 'error'); return; }
        const abs = normalize(args[0], ctx.cwd);
        const node = ctx.fs.get(abs);
        if (node && node.type === 'dir') { ctx.sink.line(`nano: ${args[0]}: Est un dossier`, 'error'); return; }
        const [parent] = ctx.fs.parentOf(abs);
        if (!parent || parent.type !== 'dir') { ctx.sink.line(`nano: ${args[0]}: le dossier parent n'existe pas`, 'error'); return; }
        const writable = node ? ctx.fs.canWrite(node, ctx.user) : ctx.fs.canWrite(parent, ctx.user);
        ctx.game.openEditor(abs, node ? node.content : '', writable, ctx.user);
      },
    },

    reset: {
      desc: 'réinitialise complètement le jeu (progression perdue !)',
      usage: 'reset --confirm',
      run(ctx, args) {
        if (args[0] === '--confirm') { ctx.game.resetGame(); return; }
        ctx.sink.line('⚠️  Cette commande efface TOUTE ta progression.', 'error');
        ctx.sink.line('Pour confirmer, tape : reset --confirm');
      },
    },
  };

  /* head/tail factorisé */
  function headTail(ctx, args, isHead) {
    let n = 10; const files = [];
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '-n') { n = parseInt(args[i + 1], 10) || 10; i++; }
      else if (/^-\d+$/.test(args[i])) n = parseInt(args[i].slice(1), 10);
      else files.push(args[i]);
    }
    let content;
    if (files.length) {
      const r = readFileArg(ctx, files[0], isHead ? 'head' : 'tail');
      if (r.error) { ctx.sink.line(r.error, 'error'); return; }
      content = r.content;
    } else if (ctx.stdin !== null) content = ctx.stdin;
    else { ctx.sink.line(`${isHead ? 'head' : 'tail'}: précise un fichier`, 'error'); return; }
    const lines = content.replace(/\n$/, '').split('\n');
    const sel = isHead ? lines.slice(0, n) : lines.slice(-n);
    if (sel.length && !(sel.length === 1 && sel[0] === '')) ctx.sink.push(sel.join('\n') + '\n');
  }

  /* ---------- Exécution d'un script shell simulé ---------- */
  function runScript(ctx, absPath) {
    const node = ctx.fs.get(absPath);
    if (!node || node.type !== 'file') {
      ctx.sink.line(`bash: ${pretty(absPath)}: Aucun fichier ou dossier de ce type`, 'error');
      return;
    }
    if (!ctx.fs.isExecutable(node)) {
      ctx.sink.line(`bash: ${pretty(absPath)}: Permission non accordée`, 'error');
      ctx.sink.line('   💡 Ce fichier n\'a pas le droit d\'exécution (x). Observe-le avec ls -l...', 'hint');
      return;
    }
    if (absPath.includes('validation_finale') && ctx.user !== 'root') {
      ctx.sink.line('Ce script doit être lancé en administrateur.', 'error');
      ctx.sink.line('   💡 Souviens-toi du préfixe magique de la mission 9...', 'hint');
      return;
    }
    for (const rawLine of node.content.split('\n')) {
      const l = rawLine.trim();
      const flagMatch = l.match(/^#@flag:(\w+)$/);
      if (flagMatch) { ctx.state.flags[flagMatch[1]] = true; continue; }
      if (l.startsWith('echo ')) {
        const txt = l.slice(5).replace(/^["']|["']$/g, '');
        ctx.sink.line(txt);
      } else if (l === 'echo') {
        ctx.sink.line('');
      }
    }
  }

  /* ============================================================
   * EXÉCUTION D'UNE LIGNE COMPLÈTE
   * env = { fs, getCwd, setCwd, state, game, sink }
   * ============================================================ */
  function run(line, env) {
    const trimmed = line.trim();
    if (!trimmed) return;

    /* Découpage en segments de pipeline */
    const tokens = tokenize(trimmed);
    const segments = [];
    let cur = [];
    for (const t of tokens) {
      if (t === '|') { segments.push(cur); cur = []; }
      else cur.push(t);
    }
    segments.push(cur);

    let stdin = null;

    for (let s = 0; s < segments.length; s++) {
      let seg = segments[s];
      if (!seg.length) { env.sink.line('erreur de syntaxe près de « | »', 'error'); return; }

      /* Redirections > / >> (sur le dernier segment en pratique) */
      let redirect = null, append = false;
      const gt = seg.findIndex(t => t === '>' || t === '>>');
      if (gt !== -1) {
        if (!seg[gt + 1]) { env.sink.line(`erreur de syntaxe près de « ${seg[gt]} »`, 'error'); return; }
        redirect = seg[gt + 1];
        append = seg[gt] === '>>';
        seg = seg.slice(0, gt).concat(seg.slice(gt + 2));
      }

      /* sudo */
      let user = 'etudiant';
      if (seg[0] === 'sudo') {
        if (seg.length === 1) { COMMANDS.sudo.run({ sink: env.sink }); return; }
        user = 'root';
        seg = seg.slice(1);
      }

      const isLast = s === segments.length - 1;
      const sink = (isLast && !redirect) ? env.sink : makeSink();

      const ctx = {
        fs: env.fs,
        cwd: env.getCwd(),
        setCwd: env.setCwd,
        user,
        stdin,
        sink,
        state: env.state,
        game: env.game,
      };

      const name = seg[0];
      const args = seg.slice(1);

      if (name.startsWith('./') || name.startsWith('/') || name.startsWith('~/')) {
        runScript(ctx, normalize(name, ctx.cwd));
      } else if (COMMANDS[name]) {
        env.state.used.add(name);
        COMMANDS[name].run(ctx, args);
      } else {
        /* Suggestion de commande proche */
        let best = null, bestD = 3;
        for (const c of Object.keys(COMMANDS)) {
          const d = lev(name, c);
          if (d < bestD) { bestD = d; best = c; }
        }
        env.sink.line(`${name} : commande introuvable`, 'error');
        if (best) env.sink.line(`   💡 Voulais-tu dire « ${best} » ?`, 'hint');
        else env.sink.line('   💡 Tape « aide » pour voir les commandes disponibles.', 'hint');
        return;
      }

      /* Application de la redirection */
      if (redirect) {
        const absOut = normalize(redirect, ctx.cwd);
        const r = env.fs.writeFile(absOut, sink.text(), user, append);
        if (r.error) env.sink.line(r.error, 'error');
        else if (append) env.state.usedAppend = true;
        stdin = null;
      } else if (!isLast) {
        stdin = sink.text();
      }
    }
  }

  return { run, COMMANDS, tokenize };
})();

if (typeof module !== 'undefined') module.exports = Shell;
