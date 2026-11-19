/* ============================================================
 * MMI Linux Quest — Définition des missions
 * 18 missions progressives (~3-4h) sur le thème du BUT MMI.
 * Chaque mission : consignes (fichier texte à lire avec cat),
 * 3 indices progressifs (jamais la réponse complète),
 * une fonction check() de validation automatique.
 * ============================================================ */

const MISSIONS = (() => {

  const H = '/home/etudiant';
  const SECRET_CODE = 'KERNEL-42';

  /**
   * Ce que l'étudiant a réellement vérifié (voir verif() dans commands.js) :
   * kind = 'cat' (contenu lu), 'curl' (page servie) ou 'perms' (droits vus
   * avec ls -l). Comparé à l'état actuel, cela garantit que la vérification
   * a eu lieu APRÈS la dernière modification du fichier.
   */
  function vu(ctx, kind, path) {
    const v = ctx.state.verif;
    return v && v[kind] ? v[kind][path] : undefined;
  }

  /** Encadre le texte d'une mission. */
  function box(title, body) {
    const line = '═'.repeat(58);
    return `╔${line}╗
  ${title}
╚${line}╝

${body}
`;
  }

  const missions = [

    /* ---------------- MISSION 1 ---------------- */
    {
      id: 1,
      titre: 'Premiers pas dans le terminal',
      fichier: `${H}/missions/mission_01.txt`,
      texte: box('MISSION 1 — PREMIERS PAS DANS LE TERMINAL', `Bienvenue en première année de BUT MMI !

Pour ta SAÉ 105 (« Produire un site web »), ton enseignant t'a
créé un compte sur le serveur Linux de l'IUT. Avant de foncer,
apprends à te repérer.

  OBJECTIFS :
  1. Affiche le chemin du dossier où tu te trouves actuellement
     (ton « répertoire courant »).
  2. Liste le contenu de ton dossier personnel pour découvrir
     ce qui s'y trouve.

  💡 Liste des commandes disponibles : aide
  💡 Pour de l'aide sur une commande : man <commande>
  💡 Bloqué(e) ? Tape : indice`),
      indices: [
        `Deux commandes suffisent. Tape « aide » : la liste affiche toutes les commandes disponibles, avec ce que fait chacune.`,
        `Dans cette liste, cherche la commande qui « affiche le chemin du répertoire courant » (son nom vient de l'anglais « print working directory »), puis celle qui « liste le contenu d'un répertoire ».`,
        `La première fait 3 lettres et commence par « pw » ; la seconde fait 2 lettres et commence par « l ». Tape-les l'une après l'autre, chacune validée par Entrée.`,
      ],
      setup(ctx) {
        const { fs } = ctx;
        fs.mkdir(`${H}/cours`, 'etudiant', true);
        fs.mkdir(`${H}/cours/dev_web`, 'etudiant', true);
        fs.mkdir(`${H}/cours/audiovisuel`, 'etudiant', true);
        fs.mkdir(`${H}/cours/culture_numerique`, 'etudiant', true);
        fs.writeFile(`${H}/cours/dev_web/html_bases.txt`,
          'HTML = HyperText Markup Language.\nLes balises structurent le contenu : <h1>, <p>, <a>...\n', 'etudiant');
        fs.writeFile(`${H}/cours/dev_web/css_bases.txt`,
          'CSS = Cascading Style Sheets.\nOn met en forme le HTML : couleurs, polices, mise en page.\n', 'etudiant');
        fs.writeFile(`${H}/cours/audiovisuel/cadrage.txt`,
          'Règle des tiers, plan large, plan serré, plongée, contre-plongée.\n', 'etudiant');
        fs.writeFile(`${H}/cours/culture_numerique/histoire_internet.txt`,
          '1969 : ARPANET. 1989 : le Web est inventé par Tim Berners-Lee au CERN.\n', 'etudiant');
        fs.writeFile(`${H}/cours/culture_numerique/.acces_labo.txt`,
          `Fichier caché trouvé ! 🎉\n\nMot de passe du labo multimédia : MMI-R101\n\nRetiens-le, puis retourne dans ton dossier personnel (~).\n`, 'etudiant');
      },
      check(ctx) {
        return ctx.state.used.has('pwd') && ctx.state.used.has('ls');
      },
      bravo: `Tu sais maintenant où tu es (pwd) et ce qui t'entoure (ls).\nCe sont les deux réflexes de base de tout utilisateur Linux !`,
    },

    /* ---------------- MISSION 2 ---------------- */
    {
      id: 2,
      titre: 'Se déplacer dans l\'arborescence',
      fichier: `${H}/missions/mission_02.txt`,
      texte: box('MISSION 2 — SE DÉPLACER DANS L\'ARBORESCENCE', `Ton dossier « cours » contient tes ressources de MMI.
On raconte qu'un enseignant de culture numérique a caché le mot
de passe du labo multimédia dans un fichier... invisible !

Sous Linux, les fichiers dont le nom commence par un point « . »
sont cachés : un simple listage ne les montre pas.

  OBJECTIFS :
  1. Déplace-toi dans le dossier cours/culture_numerique
  2. Liste TOUS les fichiers, y compris les fichiers cachés
  3. Affiche le contenu du fichier caché que tu découvres
  4. Reviens dans ton dossier personnel (~)

  💡 Le raccourci « ~ » désigne toujours ton dossier personnel.`),
      indices: [
        `Il te faut trois commandes : une pour changer de dossier, une pour lister (avec une option), une pour afficher un fichier. Cherche-les dans « aide ».`,
        `Pour changer de dossier, tu peux descendre de deux niveaux d'un coup en séparant les dossiers par un « / ». Les fichiers cachés s'affichent grâce à une option de la commande qui liste : lis son manuel avec « man ».`,
        `L'option qui montre les fichiers cachés est une lettre précédée d'un tiret : la première de l'alphabet (« all »). Recopie ensuite le nom exact du fichier caché, point du début compris. Pour rentrer, la commande de déplacement accepte le raccourci « ~ », ou même rien du tout.`,
      ],
      setup() {},
      check(ctx) {
        return ctx.state.catted.has(`${H}/cours/culture_numerique/.acces_labo.txt`)
          && ctx.cwd === H;
      },
      bravo: `Fichier caché déniché ! Retiens : cd pour se déplacer,\nls -a pour tout voir, cat pour lire. Le trio gagnant.`,
    },

    /* ---------------- MISSION 3 ---------------- */
    {
      id: 3,
      titre: 'Créer son espace de projet (SAÉ 105)',
      fichier: `${H}/missions/mission_03.txt`,
      texte: box('MISSION 3 — CRÉER SON ESPACE DE PROJET', `La SAÉ 105 démarre : tu dois produire un site web pour un
client fictif. Un bon projet commence par une bonne organisation
des dossiers !

  OBJECTIFS — dans ton dossier personnel, crée :
  1. Un dossier nommé          sae105
  2. Dedans, deux sous-dossiers :  maquettes   et   contenus
  3. Toujours dans sae105, un fichier vide nommé   notes.txt

  Arborescence attendue :
    ~/sae105
    ├── maquettes/
    ├── contenus/
    └── notes.txt

  💡 Vérifie ton travail en listant le contenu de sae105.`),
      indices: [
        `Il te faut une commande qui crée des dossiers et une autre qui crée un fichier vide : cherche-les dans « aide ».`,
        `Le nom de la commande qui crée un dossier vient de l'anglais « make directory ». Tu peux tout faire depuis ~ sans te déplacer, en donnant des chemins comme sae105/maquettes.`,
        `Il te faut 3 créations de dossiers et 1 création de fichier, en indiquant à chaque fois le chemin qui part de sae105. Astuce : la commande qui crée les dossiers accepte plusieurs noms d'un coup. Compare ensuite le contenu de sae105 avec l'arborescence attendue.`,
      ],
      setup() {},
      check(ctx) {
        const { fs } = ctx;
        return fs.isDir(`${H}/sae105`)
          && fs.isDir(`${H}/sae105/maquettes`)
          && fs.isDir(`${H}/sae105/contenus`)
          && fs.isFile(`${H}/sae105/notes.txt`);
      },
      bravo: `Projet bien structuré ! mkdir et touch n'ont plus de secret.\nUn dossier clair = un projet qui démarre bien.`,
    },

    /* ---------------- MISSION 4 ---------------- */
    {
      id: 4,
      titre: 'Ranger ses fichiers (copier / déplacer)',
      fichier: `${H}/missions/mission_04.txt`,
      texte: box('MISSION 4 — RANGER SES FICHIERS', `Ton binôme t'a envoyé des ressources : elles sont en vrac dans
le dossier ~/telechargements. À toi de les ranger dans le projet !

  OBJECTIFS :
  1. DÉPLACE les deux images (logo.png et banniere.jpg)
     dans   ~/sae105/maquettes
  2. DÉPLACE article.txt dans ~/sae105/contenus en le RENOMMANT
     au passage en   article_v1.txt
  3. COPIE interview.mp3 dans ~/sae105/contenus
     (garde l'original dans telechargements : c'est une copie !)

  💡 Déplacer et renommer, c'est la même opération :
     tout dépend du chemin de destination.`),
      indices: [
        `Deux commandes : l'une déplace (ou renomme), l'autre copie. Cherche-les dans « aide ». Elles s'utilisent de la même façon : d'abord la source, puis la destination.`,
        `Leurs noms sont les abréviations en 2 lettres de « move » et de « copy ». Si la destination est un dossier, le fichier va dedans ; si c'est un nouveau nom, le fichier est renommé.`,
        `Il te faut 4 commandes : deux déplacements pour les images, un déplacement dont la destination se termine par le nouveau nom pour l'article, et une copie pour le mp3. Vérifie ensuite le contenu de sae105/contenus et de telechargements.`,
      ],
      setup(ctx) {
        const { fs } = ctx;
        fs.mkdir(`${H}/telechargements`, 'etudiant', true);
        fs.writeFile(`${H}/telechargements/logo.png`, '[image PNG simulée — logo du client]\n', 'etudiant');
        fs.writeFile(`${H}/telechargements/banniere.jpg`, '[image JPG simulée — bannière du site]\n', 'etudiant');
        fs.writeFile(`${H}/telechargements/article.txt`, 'Brouillon de l\'article de présentation du client...\n', 'etudiant');
        fs.writeFile(`${H}/telechargements/interview.mp3`, '[audio MP3 simulé — interview du client]\n', 'etudiant');
      },
      check(ctx) {
        const { fs } = ctx;
        return fs.isFile(`${H}/sae105/maquettes/logo.png`)
          && fs.isFile(`${H}/sae105/maquettes/banniere.jpg`)
          && fs.isFile(`${H}/sae105/contenus/article_v1.txt`)
          && fs.isFile(`${H}/sae105/contenus/interview.mp3`)
          && !fs.exists(`${H}/telechargements/logo.png`)
          && !fs.exists(`${H}/telechargements/banniere.jpg`)
          && !fs.exists(`${H}/telechargements/article.txt`)
          && fs.exists(`${H}/telechargements/interview.mp3`);
      },
      bravo: `Rangement impeccable ! Tu maîtrises la différence entre\nmv (déplacer/renommer) et cp (copier en gardant l'original).`,
    },

    /* ---------------- MISSION 5 ---------------- */
    {
      id: 5,
      titre: 'Faire le ménage (supprimer)',
      fichier: `${H}/missions/mission_05.txt`,
      texte: box('MISSION 5 — FAIRE LE MÉNAGE', `Ton dossier personnel s'encombre de vieux fichiers. Un serveur
propre, c'est un serveur sain — mais ATTENTION : sous Linux,
il n'y a PAS de corbeille. Supprimé = perdu pour toujours !

  OBJECTIFS — supprime de ton dossier personnel (~) :
  1. Le fichier      rapport_old.txt
  2. Le fichier      capture_temp.tmp
  3. Le dossier VIDE  archives_vides
  4. Le dossier       ancien_projet   (et tout son contenu)

  ⚠️  Réfléchis toujours à deux fois avant une suppression
     récursive !`),
      indices: [
        `Il existe une commande qui supprime des fichiers, et une autre réservée aux dossiers VIDES : cherche-les dans « aide ».`,
        `Leurs noms viennent de l'anglais « remove » et « remove directory ». Pour un dossier plein, la commande qui supprime les fichiers a besoin d'une option « récursive » : lis son manuel avec « man ».`,
        `4 suppressions : une pour chacun des deux fichiers, une pour le dossier vide, puis une avec l'option récursive (la lettre par laquelle commence « récursif ») pour le dossier plein. Vérifie ensuite le résultat en listant ton dossier personnel.`,
      ],
      setup(ctx) {
        const { fs } = ctx;
        fs.writeFile(`${H}/rapport_old.txt`, 'Vieux rapport de stage de 2023, plus utile.\n', 'etudiant');
        fs.writeFile(`${H}/capture_temp.tmp`, '[fichier temporaire]\n', 'etudiant');
        fs.mkdir(`${H}/archives_vides`, 'etudiant', true);
        fs.mkdir(`${H}/ancien_projet`, 'etudiant', true);
        fs.writeFile(`${H}/ancien_projet/index.html`, '<h1>Vieux site abandonné</h1>\n', 'etudiant');
        fs.writeFile(`${H}/ancien_projet/style.css`, 'body { color: beige; }\n', 'etudiant');
      },
      check(ctx) {
        const { fs } = ctx;
        return !fs.exists(`${H}/rapport_old.txt`)
          && !fs.exists(`${H}/capture_temp.tmp`)
          && !fs.exists(`${H}/archives_vides`)
          && !fs.exists(`${H}/ancien_projet`);
      },
      bravo: `Grand ménage réussi ! Retiens la prudence : rm -r est puissant\net irréversible. Les pros vérifient toujours le chemin avant Entrée.`,
    },

    /* ---------------- MISSION 6 ---------------- */
    {
      id: 6,
      titre: 'Écrire dans des fichiers (redirections)',
      fichier: `${H}/missions/mission_06.txt`,
      texte: box('MISSION 6 — ÉCRIRE DANS DES FICHIERS', `Le client veut un slogan pour son site. Tu vas l'écrire sans
éditeur, directement depuis le terminal, grâce aux redirections :

    >   envoie le texte dans un fichier (ÉCRASE le contenu)
    >>  AJOUTE le texte à la fin du fichier

  OBJECTIFS :
  1. Crée le fichier  ~/sae105/contenus/slogan.txt  contenant
     une première ligne de slogan de ton invention
     (avec la redirection >)
  2. AJOUTE ensuite une deuxième ligne avec >>
  3. Vérifie le résultat : le fichier doit contenir
     au moins 2 lignes.

  ⚠️  Attention : un > de trop et tu écrases tout !`),
      indices: [
        `Il te faut la commande qui « affiche un texte » (cherche-la dans « aide »). Suivie de > et d'un nom de fichier, son texte part dans le fichier au lieu de l'écran.`,
        `Pour la première ligne, envoie ton slogan (entre guillemets) dans sae105/contenus/slogan.txt avec >. Pour la deuxième, même principe mais avec >> pour ajouter sans écraser.`,
        `Si ton fichier ne contient qu'une ligne, c'est que tu as utilisé > deux fois (il écrase). Recommence : d'abord >, puis >>. La mission ne se valide qu'une fois le contenu du fichier affiché dans le terminal.`,
      ],
      setup() {},
      check(ctx) {
        const node = ctx.fs.get(`${H}/sae105/contenus/slogan.txt`);
        if (!node || node.type !== 'file') return false;
        const lines = node.content.split('\n').filter(l => l.trim() !== '');
        return lines.length >= 2 && ctx.state.usedAppend
          && vu(ctx, 'cat', `${H}/sae105/contenus/slogan.txt`) === node.content;
      },
      bravo: `Les redirections sont dans la poche ! > pour écrire,\n>> pour ajouter. Un outil que tu utiliseras sans arrêt.`,
    },

    /* ---------------- MISSION 7 ---------------- */
    {
      id: 7,
      titre: 'Chercher une aiguille dans une botte de fichiers',
      fichier: `${H}/missions/mission_07.txt`,
      texte: box('MISSION 7 — CHERCHER DANS LES FICHIERS', `Panique ! L'administrateur a caché le code d'activation du
serveur web quelque part dans tes fichiers de cours. Impossible
d'ouvrir chaque fichier un par un... heureusement, Linux sait
chercher À L'INTÉRIEUR des fichiers.

  OBJECTIFS :
  1. Cherche dans quel fichier du dossier ~/cours se trouve le
     mot   CODE   (cherche récursivement dans tous les fichiers)
  2. Affiche le fichier trouvé pour lire le code d'activation
  3. Enregistre le code (et seulement le code) dans le fichier
     ~/sae105/code_serveur.txt   (avec une redirection,
     comme à la mission 6)`),
      indices: [
        `Il te faut la commande qui « cherche un texte DANS le contenu des fichiers » (voir « aide »). On lui donne d'abord le motif cherché, puis l'endroit où chercher.`,
        `Pour fouiller tout un dossier et ses sous-dossiers, elle a besoin de la même option récursive qu'à la mission 5 (son manuel la décrit). Cherche le mot CODE dans le dossier cours : la réponse t'indiquera le fichier qui le contient.`,
        `Affiche ce fichier pour lire le code : il ressemble à XXXXXX-XX. Enregistre-le dans sae105/code_serveur.txt de la même façon que le slogan de la mission 6 (recopie exactement le code, tirets compris).`,
      ],
      setup(ctx) {
        const { fs } = ctx;
        fs.writeFile(`${H}/cours/dev_web/js_bases.txt`,
          'JavaScript rend les pages interactives.\nconsole.log("Hello MMI");\n', 'etudiant');
        fs.writeFile(`${H}/cours/audiovisuel/montage.txt`,
          'Le montage : cut, fondu, jump cut, raccord regard.\n', 'etudiant');
        fs.writeFile(`${H}/cours/culture_numerique/serveurs.txt`,
          `Un serveur web répond aux requêtes HTTP des navigateurs.\n\nNote de l'admin : CODE d'activation du serveur : ${SECRET_CODE}\nGarde-le précieusement.\n`, 'etudiant');
      },
      check(ctx) {
        const node = ctx.fs.get(`${H}/sae105/code_serveur.txt`);
        return !!node && node.type === 'file' && node.content.includes(SECRET_CODE);
      },
      bravo: `Code retrouvé grâce à grep ! C'est LA commande des détectives :\nelle fouille le contenu de centaines de fichiers en un instant.`,
    },

    /* ---------------- MISSION 8 ---------------- */
    {
      id: 8,
      titre: 'Droits et exécution de scripts',
      fichier: `${H}/missions/mission_08.txt`,
      texte: box('MISSION 8 — DROITS ET EXÉCUTION', `L'admin t'a laissé un script de préparation du serveur dans
~/scripts. Problème : impossible de le lancer ! Sous Linux,
un fichier ne s'exécute que s'il a le droit « x » (exécution).

Dans une liste détaillée, les droits se lisent ainsi :
  -rw-r--r--  →  lecture/écriture, mais PAS exécutable
  -rwxr-xr-x  →  exécutable ✔

  OBJECTIFS :
  1. Regarde les droits actuels de scripts/preparation.sh
  2. Rends ce script exécutable
  3. Exécute ce script`),
      indices: [
        `Il te faut la commande qui « modifie les droits d'un fichier » (voir « aide »). Pour regarder les droits, la commande qui liste a une option « format long » : lis son manuel.`,
        `Pour AJOUTER le droit d'exécution, on écrit le signe + suivi de la lettre du droit d'exécution, puis le chemin du script. Vérifie ensuite : un « x » doit apparaître dans les droits.`,
        `Pour lancer le script, tape simplement son chemin, précédé de « ./ » (« ici, dans le dossier courant »).`,
      ],
      setup(ctx) {
        const { fs } = ctx;
        fs.mkdir(`${H}/scripts`, 'etudiant', true);
        fs.writeFile(`${H}/scripts/preparation.sh`,
          `#!/bin/bash
# Script de préparation du serveur — IUT MMI
echo "Vérification du système............ OK"
echo "Vérification du code serveur....... OK"
echo "Préparation de l'environnement..... OK"
echo ""
echo ">>> Serveur prêt pour l'installation d'Apache ! <<<"
#@flag:prepScriptDone
`, 'etudiant');
        fs.chmod(`${H}/scripts/preparation.sh`, '644', 'etudiant');
      },
      check(ctx) {
        return !!ctx.state.flags.prepScriptDone;
      },
      bravo: `Le script s'est lancé ! Tu viens de toucher au cœur de la\nsécurité Linux : les droits (lecture r, écriture w, exécution x).`,
    },

    /* ---------------- MISSION 9 ---------------- */
    {
      id: 9,
      titre: 'Devenir super-utilisateur',
      fichier: `${H}/missions/mission_09.txt`,
      texte: box('MISSION 9 — INSTALLER UN LOGICIEL', `Il est temps d'installer le serveur web Apache pour héberger
ton site de SAÉ. Mais installer un logiciel modifie le système :
il faut les droits d'administrateur !

Sous Linux, un préfixe spécial placé devant une commande
permet de l'exécuter en tant qu'administrateur. Sous Ubuntu,
les logiciels (les « paquets ») s'installent avec un
gestionnaire de paquets.

  OBJECTIFS :
  1. Mets à jour la liste des paquets disponibles
     (en administrateur)
  2. Installe le paquet   apache2
     (en administrateur)

  ⚠️  Sans les droits d'administrateur, le système refusera :
     c'est normal, essaie !`),
      indices: [
        `Deux commandes à combiner : celle qui « exécute une commande en tant qu'administrateur » et le « gestionnaire de paquets ». Cherche-les dans « aide ».`,
        `Le manuel du gestionnaire de paquets (man) décrit ses deux actions : l'une met à jour la liste, l'autre installe un paquet. Le préfixe administrateur se place devant CHAQUE commande, sinon : permission refusée.`,
        `L'ordre des mots compte : d'abord le préfixe administrateur, puis le gestionnaire de paquets, puis l'action (et pour l'installation, le nom exact du paquet : apache2). Mets à jour la liste avant d'installer.`,
      ],
      setup() {},
      check(ctx) {
        return ctx.state.flags.aptUpdated && ctx.state.flags.apacheInstalled;
      },
      bravo: `Apache est installé ! sudo + apt : c'est ainsi qu'on administre\nun vrai serveur Ubuntu/Debian. Tu gères.`,
    },

    /* ---------------- MISSION 10 ---------------- */
    {
      id: 10,
      titre: 'Démarrer et tester le serveur web',
      fichier: `${H}/missions/mission_10.txt`,
      texte: box('MISSION 10 — DÉMARRER LE SERVEUR WEB', `Apache est installé, mais un serveur installé n'est pas
forcément DÉMARRÉ. Les services système se pilotent avec
une commande dédiée.

  OBJECTIFS :
  1. Démarre le service   apache2   (en administrateur)
  2. Vérifie qu'il est bien actif : son état doit afficher
     « active (running) »
  3. Teste le serveur en récupérant sa page d'accueil depuis
     le terminal, à l'adresse   localhost : c'est bien la page
     d'Apache qui doit répondre

  ⚠️  Un ancien stagiaire a fait des essais sur ce serveur...
     sans forcément tout ranger derrière lui.
  💡 localhost = « cette machine » (127.0.0.1).`),
      indices: [
        `Il te faut la commande qui « pilote les services système » (voir « aide »). Si le démarrage échoue, affiche l'état détaillé du service : ses dernières lignes expliquent pourquoi.`,
        `« Address already in use » : le port 80 est déjà occupé par un autre programme. Interroge localhost depuis le terminal : la page qui répond te dira QUI occupe la place.`,
        `Un autre serveur web tourne déjà (son nom est dans la page qui répond). Arrête-le avec la même commande de pilotage des services, en administrateur, puis redémarre apache2, vérifie son état et interroge à nouveau localhost.`,
      ],
      setup(ctx) {
        // Le serveur nginx laissé par le stagiaire occupe déjà le port 80
        if (ctx.state.services.nginx === undefined) ctx.state.services.nginx = 'running';
      },
      check(ctx) {
        return ctx.state.services.apache2 === 'running'
          && !!ctx.state.flags.apacheStatusOk
          && vu(ctx, 'curl', '/var/www/html/index.html') !== undefined;
      },
      bravo: `Panne diagnostiquée et réparée ! Un port ne peut servir qu'à un seul\nserveur à la fois. Lire l'état d'un service, arrêter le fautif,\nredémarrer le bon : le quotidien de l'administrateur système.`,
    },

    /* ---------------- MISSION 11 ---------------- */
    {
      id: 11,
      titre: 'Publier sa page web',
      fichier: `${H}/missions/mission_11.txt`,
      texte: box('MISSION 11 — PUBLIER SA PAGE WEB', `La page par défaut d'Apache, c'est joli, mais le client attend
SA page ! Apache sert les fichiers du dossier /var/www/html —
qui appartient à root : il faudra les droits d'administrateur
pour y écrire.

  OBJECTIFS :
  1. Ouvre /var/www/html/index.html dans l'éditeur de texte
     du terminal, en administrateur
  2. Remplace le contenu par ta propre page HTML. Elle doit
     contenir au moins :
        - un titre principal  <h1> ... </h1>
        - le mot   MMI   quelque part
  3. Enregistre, quitte l'éditeur, puis interroge à nouveau ton
     serveur (localhost) pour vérifier qu'il renvoie TA page

  💡 Dans l'éditeur : Ctrl+O (ou bouton) = enregistrer,
     Ctrl+X = quitter.
  💡 Exemple de page minimale :
     <h1>Portfolio MMI</h1>`),
      indices: [
        `Il te faut la commande qui « ouvre un fichier dans l'éditeur de texte » (voir « aide »). Le fichier appartient à root : sans le préfixe administrateur de la mission 9, l'éditeur refusera d'enregistrer.`,
        `Dans l'éditeur, écris une vraie petite page : au minimum une balise <h1> avec un titre, et le mot MMI dans le texte. Puis Ctrl+O pour enregistrer et Ctrl+X pour sortir.`,
        `Après l'enregistrement, interroge de nouveau localhost comme à la mission 10 : tu dois voir TON code HTML (avec ton <h1>) et non plus la page par défaut d'Apache.`,
      ],
      setup() {},
      check(ctx) {
        const node = ctx.fs.get('/var/www/html/index.html');
        if (!node || node.type !== 'file') return false;
        const c = node.content;
        return /<h1[\s>]/i.test(c) && /mmi/i.test(c)
          && !c.includes('Apache2 Ubuntu Default Page')
          && vu(ctx, 'curl', '/var/www/html/index.html') === c;
      },
      bravo: `TA page est en ligne (sur ton serveur d'entraînement) !\nÉditer des fichiers système avec sudo nano : un grand classique.`,
    },

    /* ---------------- MISSION 12 ---------------- */
    {
      id: 12,
      titre: 'Analyser des fichiers',
      fichier: `${H}/missions/mission_12.txt`,
      texte: box('MISSION 12 — ANALYSER DES FICHIERS', `Ton site de SAÉ attire du monde ! L'admin t'a déposé le relevé
de fréquentation dans ~/sae105/stats_visites.txt. Le fichier est
long : inutile de tout afficher, Linux sait extraire
juste ce qu'il faut.

  OBJECTIFS :
  1. Affiche les 5 PREMIÈRES lignes du fichier de statistiques
  2. Affiche les 3 DERNIÈRES lignes (les jours les plus récents)
  3. Compte le nombre de lignes du fichier

  💡 Bonus : le pipe « | » envoie le résultat d'une commande
     à la commande suivante.`),
      indices: [
        `Trois commandes : une qui « affiche les premières lignes », une qui « affiche les dernières lignes » et une qui « compte les lignes, mots et caractères ». Cherche-les dans « aide ».`,
        `Leurs noms anglais évoquent la tête, la queue et le comptage de mots (« word count »). Chacune prend le chemin du fichier en argument.`,
        `Le fichier est sae105/stats_visites.txt. Les manuels (man) donnent l'option qui règle le nombre de lignes affichées, et celle qui ne compte que les lignes : à chaque fois une lettre précédée d'un tiret.`,
      ],
      setup(ctx) {
        const { fs } = ctx;
        const jours = [];
        for (let j = 1; j <= 14; j++) {
          jours.push(`2026-06-${String(j).padStart(2, '0')} ; ${100 + j * 7} visites ; ${30 + j * 2} pages vues`);
        }
        fs.writeFile(`${H}/sae105/stats_visites.txt`,
          `date ; visites ; pages\n${jours.join('\n')}\n`, 'etudiant');
      },
      check(ctx) {
        return ctx.state.used.has('head') && ctx.state.used.has('tail') && ctx.state.used.has('wc');
      },
      bravo: `head, tail, wc : le trio d'analyse rapide ! Sur un vrai serveur,\nc'est comme ça qu'on inspecte les logs sans noyer le terminal.`,
    },

    /* ---------------- MISSION 13 ---------------- */
    {
      id: 13,
      titre: 'Retrouver ses fichiers',
      fichier: `${H}/missions/mission_13.txt`,
      texte: box('MISSION 13 — RETROUVER SES FICHIERS', `Catastrophe : ton binôme a livré le dossier ~/projet_v2 tout en
vrac, avec des sous-dossiers partout. Quelque part là-dedans se
cache le logo définitif du client : logo_final.png.

Tu as déjà cherché DANS le contenu des fichiers (mission 7).
Cette fois il faut chercher des fichiers PAR LEUR NOM : c'est
le travail d'une autre commande.

  OBJECTIFS :
  1. Liste tous les fichiers .png cachés dans ~/projet_v2
     (les jokers fonctionnent :  "*.png")
  2. Déplace logo_final.png dans   ~/sae105/maquettes

  💡 Le résultat de la recherche te donne le chemin complet :
     parfait pour le réutiliser ensuite !`),
      indices: [
        `Il te faut la commande qui « cherche des fichiers par leur NOM » (voir « aide ») : elle explore un dossier ET tous ses sous-dossiers.`,
        `Son manuel indique l'ordre : d'abord le dossier de départ (projet_v2), puis l'option qui précise le nom, suivie du motif entre guillemets : "*.png".`,
        `Parmi les résultats, repère le chemin complet de logo_final.png, puis déplace le fichier comme à la mission 4, avec sae105/maquettes comme destination.`,
      ],
      setup(ctx) {
        const { fs } = ctx;
        fs.mkdir(`${H}/projet_v2/ebauches`, 'etudiant', true);
        fs.mkdir(`${H}/projet_v2/exports/hd`, 'etudiant', true);
        fs.mkdir(`${H}/projet_v2/archives`, 'etudiant', true);
        fs.writeFile(`${H}/projet_v2/ebauches/croquis.png`, '[esquisse au crayon scannée]\n', 'etudiant');
        fs.writeFile(`${H}/projet_v2/ebauches/palette.txt`, 'Couleurs : #7b5cff, #57d364, #ffd166\n', 'etudiant');
        fs.writeFile(`${H}/projet_v2/exports/hd/logo_final.png`, '[logo définitif haute définition]\n', 'etudiant');
        fs.writeFile(`${H}/projet_v2/exports/notes_export.txt`, 'Export du 12/06 en 300dpi.\n', 'etudiant');
        fs.writeFile(`${H}/projet_v2/archives/vieux_logo.png`, '[ancienne version du logo]\n', 'etudiant');
      },
      check(ctx) {
        return ctx.fs.isFile(`${H}/sae105/maquettes/logo_final.png`) && ctx.state.used.has('find');
      },
      bravo: `find pour les NOMS de fichiers, grep pour leur CONTENU :\ntu as maintenant les deux radars du terminal.`,
    },

    /* ---------------- MISSION 14 ---------------- */
    {
      id: 14,
      titre: 'Rédiger avec l\'éditeur de texte',
      fichier: `${H}/missions/mission_14.txt`,
      texte: box('MISSION 14 — RÉDIGER AVEC L\'ÉDITEUR', `Le site du client aura une page « À propos ». Écris ta biographie
de créateur/créatrice ! Les redirections, c'est bien pour une
ligne, mais pour un vrai texte, on ouvre un éditeur (celui de
la mission 11).

  OBJECTIFS :
  1. Ouvre le fichier  ~/sae105/contenus/bio.txt  dans l'éditeur
  2. Rédige ta mini-biographie :
       - AU MOINS 3 lignes de texte
       - elle doit mentionner   MMI   quelque part
  3. Enregistre (Ctrl+O ou bouton) et quitte (Ctrl+X)
  4. Affiche ton œuvre dans le terminal pour la vérifier

  💡 L'éditeur crée le fichier s'il n'existe pas encore.`),
      indices: [
        `C'est le même éditeur qu'à la mission 11 (voir « aide » si tu as oublié son nom), mais cette fois sans préfixe administrateur : le fichier est dans ton dossier personnel.`,
        `Donne-lui le chemin du fichier en partant de ton dossier personnel (sae105/contenus/...). Écris au moins 3 lignes (Entrée pour changer de ligne) avec le mot MMI, puis bouton « Enregistrer » et « Quitter ».`,
        `La mission ne se valide qu'une fois ton texte affiché dans le terminal, avec la commande qui « affiche le contenu d'un fichier » (mission 2). S'il manque quelque chose (3 lignes non vides, le mot MMI), rouvre le fichier dans l'éditeur, complète-le, puis affiche-le de nouveau.`,
      ],
      setup() {},
      check(ctx) {
        if (!ctx.state.used.has('nano')) return false;
        const node = ctx.fs.get(`${H}/sae105/contenus/bio.txt`);
        if (!node || node.type !== 'file') return false;
        const lines = node.content.split('\n').filter(l => l.trim() !== '');
        return lines.length >= 3 && /mmi/i.test(node.content)
          && vu(ctx, 'cat', `${H}/sae105/contenus/bio.txt`) === node.content;
      },
      bravo: `Belle plume ! nano est l'éditeur passe-partout des serveurs :\ntu le retrouveras sur toutes les machines Linux.`,
    },

    /* ---------------- MISSION 15 ---------------- */
    {
      id: 15,
      titre: 'Les droits en notation numérique',
      fichier: `${H}/missions/mission_15.txt`,
      texte: box('MISSION 15 — DROITS EN NOTATION NUMÉRIQUE', `Tu sais déjà rendre un fichier exécutable (mission 8). Les pros
utilisent aussi la notation NUMÉRIQUE : 3 chiffres pour propriétaire / groupe / autres.

    r = 4    w = 2    x = 1    (on additionne)
    7 = rwx    6 = rw-    5 = r-x    4 = r--    0 = ---

  Deux fichiers t'attendent :
  - ~/sae105/notes_jury.txt   → CONFIDENTIEL : toi seul(e) dois
    pouvoir le lire et l'écrire, rien pour les autres
  - ~/scripts/partage.sh      → script à partager : tout le monde
    peut le lire et l'exécuter, toi seul(e) peux l'écrire

  OBJECTIFS :
  1. Applique les bons droits numériques à ces deux fichiers
  2. Contrôle le résultat en affichant les droits des fichiers`),
      indices: [
        `Additionne pour chaque catégorie : lecture+écriture = 4+2 = 6 ; lecture+exécution = 4+1 = 5 ; tout = 7 ; rien = 0.`,
        `C'est la même commande qu'à la mission 8, mais avec 3 chiffres à la place du signe + : son manuel décrit la notation numérique.`,
        `Donne d'abord les 3 chiffres, puis le chemin du fichier : 600 pour les notes du jury, 755 pour le script de partage. La mission ne se valide qu'une fois les droits des deux fichiers affichés (liste détaillée, comme à la mission 8) : -rw------- et -rwxr-xr-x.`,
      ],
      setup(ctx) {
        const { fs } = ctx;
        fs.writeFile(`${H}/sae105/notes_jury.txt`,
          'Notes personnelles pour la soutenance : parler du choix des couleurs...\n', 'etudiant');
        fs.writeFile(`${H}/scripts/partage.sh`,
          '#!/bin/bash\necho "Envoi du dossier sae105 au serveur de rendu... OK"\n', 'etudiant');
        fs.chmod(`${H}/sae105/notes_jury.txt`, '644', 'etudiant');
        fs.chmod(`${H}/scripts/partage.sh`, '644', 'etudiant');
      },
      check(ctx) {
        const a = ctx.fs.get(`${H}/sae105/notes_jury.txt`);
        const b = ctx.fs.get(`${H}/scripts/partage.sh`);
        return !!a && !!b && a.perms === '600' && b.perms === '755'
          && vu(ctx, 'perms', `${H}/sae105/notes_jury.txt`) === '600'
          && vu(ctx, 'perms', `${H}/scripts/partage.sh`) === '755';
      },
      bravo: `600, 644, 755 : ces trois nombres vont te suivre toute ta vie\nde webmaster — ce sont les réglages types d'un serveur web !`,
    },

    /* ---------------- MISSION 16 ---------------- */
    {
      id: 16,
      titre: 'Explorer la configuration du serveur',
      fichier: `${H}/missions/mission_16.txt`,
      texte: box('MISSION 16 — LA CONFIGURATION D\'APACHE', `D'où sort cette page quand on interroge localhost ? Apache lit sa
configuration dans /etc/apache2/apache2.conf. On y trouve
notamment la directive DocumentRoot : le dossier que le serveur
publie sur le web.

  OBJECTIFS :
  1. Cherche la ligne   DocumentRoot   dans le fichier de
     configuration d'Apache (inutile de tout afficher !)
  2. Enregistre le CHEMIN trouvé (et seulement le chemin) dans
     ~/sae105/docroot.txt   (avec une redirection)

  💡 Les fichiers de /etc appartiennent à root, mais ils sont
     LISIBLES par tout le monde : pas besoin d'être
     administrateur pour les lire.`),
      indices: [
        `C'est la même commande de recherche dans le contenu qu'à la mission 7, mais sur un seul fichier : pas besoin de l'option récursive. Ici le motif est DocumentRoot et le fichier /etc/apache2/apache2.conf.`,
        `La ligne trouvée ressemble à « DocumentRoot /chemin/vers/dossier » : c'est ce chemin qu'il faut recopier.`,
        `Enregistre ce chemin dans sae105/docroot.txt de la même façon que le code de la mission 7. Le chemin commence par /var/...`,
      ],
      setup() {},
      check(ctx) {
        const node = ctx.fs.get(`${H}/sae105/docroot.txt`);
        return !!node && node.type === 'file' && node.content.includes('/var/www/html')
          && ctx.state.used.has('grep');
      },
      bravo: `Tu sais maintenant OÙ Apache va chercher les pages web :\nDocumentRoot = /var/www/html. Tout s'explique !`,
    },

    /* ---------------- MISSION 17 ---------------- */
    {
      id: 17,
      titre: 'Publier une deuxième page web',
      fichier: `${H}/missions/mission_17.txt`,
      texte: box('MISSION 17 — LA PAGE ÉQUIPE', `Le client veut une page « équipe » en plus de l'accueil. Tu sais
désormais que tout fichier posé dans /var/www/html devient une
page web : /var/www/html/equipe.html sera servie à l'adresse
localhost/equipe.html !

  OBJECTIFS :
  1. Crée la page   /var/www/html/equipe.html
     Elle doit contenir au moins un sous-titre <h2> ... </h2>
  2. Vérifie qu'elle est bien en ligne à l'adresse
     localhost/equipe.html

  💡 Rappel : /var/www/html appartient à root...
  💡 Exemple minimal :  <h2>L'équipe MMI</h2>`),
      indices: [
        `Comme pour l'accueil (mission 11) : le dossier appartient à root, donc l'éditeur doit être ouvert avec le préfixe administrateur.`,
        `Ouvre /var/www/html/equipe.html dans l'éditeur (en administrateur), écris ta page avec une balise <h2>, enregistre, quitte.`,
        `Pour le test final, interroge l'adresse localhost/equipe.html comme à la mission 10 : tu dois voir TON code HTML. Si « 404 Not Found » : vérifie le nom exact du fichier en listant /var/www/html.`,
      ],
      setup() {},
      check(ctx) {
        const node = ctx.fs.get('/var/www/html/equipe.html');
        if (!node || node.type !== 'file') return false;
        return /<h2[\s>]/i.test(node.content)
          && vu(ctx, 'curl', '/var/www/html/equipe.html') === node.content;
      },
      bravo: `Un site multi-pages ! Tu viens de comprendre le lien direct\nentre les fichiers du serveur et les URL du navigateur.`,
    },

    /* ---------------- MISSION 18 ---------------- */
    {
      id: 18,
      titre: 'Validation finale',
      fichier: `${H}/missions/mission_18.txt`,
      texte: box('MISSION 18 — VALIDATION FINALE', `Dernière ligne droite ! L'admin a déposé un script de
validation dans ~/scripts : il contrôle tout ton travail et
délivre le certificat officiel « MMI Linux Quest ».

Comme il touche à la configuration du serveur, il doit être
lancé en administrateur... et devine quoi : il n'est pas
exécutable. Un dernier défi à la hauteur de tes nouveaux talents.

  OBJECTIFS :
  1. Rends exécutable   ~/scripts/validation_finale.sh
  2. Exécute-le en tant qu'administrateur

  💡 Tout ce qu'il faut savoir, tu l'as déjà appris.
     (Missions 8 et 9, si un doute persiste...)`),
      indices: [
        `Deux étapes, déjà vues : d'abord donner le droit d'exécution au script (mission 8), ensuite le lancer avec les droits administrateur (mission 9).`,
        `Donne d'abord le droit d'exécution au script comme à la mission 8, puis exécute-le avec le préfixe administrateur ET le « ./ » devant le chemin.`,
        `Pour le lancer : le préfixe administrateur, une espace, puis le chemin du script précédé de « ./ ». Si « Permission non accordée » : le droit d'exécution n'a pas été donné ; si « commande introuvable » : il manque le ./`,
      ],
      setup(ctx) {
        const { fs } = ctx;
        fs.writeFile(`${H}/scripts/validation_finale.sh`,
          `#!/bin/bash
# Validation finale — MMI Linux Quest
echo "Contrôle de l'arborescence sae105........ OK"
echo "Contrôle du serveur Apache............... OK"
echo "Contrôle de la page web personnalisée.... OK"
echo "Génération du certificat................."
#@flag:finalScriptDone
`, 'etudiant');
        fs.chmod(`${H}/scripts/validation_finale.sh`, '644', 'etudiant');
      },
      check(ctx) {
        return !!ctx.state.flags.finalScriptDone;
      },
      bravo: `Toutes les vérifications sont au vert !`,
    },
  ];

  return { missions, SECRET_CODE };
})();

if (typeof module !== 'undefined') module.exports = MISSIONS;
