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

  💡 Commandes utiles : pwd, ls
  💡 Pour de l'aide sur une commande : man <commande>
  💡 Bloqué(e) ? Tape : indice`),
      indices: [
        `Deux commandes suffisent. La première affiche le chemin du dossier courant : son nom vient de l'anglais « print working directory ».`,
        `La seconde commande liste le contenu d'un dossier : c'est l'abréviation de « list » en 2 lettres.`,
        `Tape la commande de 3 lettres commençant par « pw », valide avec Entrée, puis la commande de 2 lettres commençant par « l ».`,
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
sont cachés : un simple ls ne les montre pas.

  OBJECTIFS :
  1. Déplace-toi dans le dossier cours/culture_numerique
  2. Liste TOUS les fichiers, y compris les fichiers cachés
  3. Affiche le contenu du fichier caché que tu découvres
  4. Reviens dans ton dossier personnel (~)

  💡 Commandes utiles : cd, ls (avec une option), cat
  💡 « cd » tout seul (ou « cd ~ ») ramène toujours à la maison.`),
      indices: [
        `Pour changer de dossier : cd <chemin>. Tu peux descendre de deux niveaux d'un coup en séparant les dossiers par un « / ».`,
        `Les fichiers cachés s'affichent avec une option de ls : une lettre précédée d'un tiret, la première de l'alphabet.`,
        `Une fois le fichier caché repéré avec « ls -a », affiche-le avec « cat <nom_du_fichier> » (n'oublie pas le point au début du nom), puis tape « cd » tout seul pour rentrer.`,
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

  💡 Commandes utiles : mkdir, touch
  💡 Vérifie ton travail avec : ls sae105`),
      indices: [
        `« mkdir » (make directory) crée un dossier ; « touch » crée un fichier vide. Tu peux les lancer depuis ~ sans te déplacer, en donnant des chemins comme sae105/maquettes.`,
        `Crée d'abord sae105, puis les sous-dossiers : mkdir <dossier>/<sous_dossier>. Astuce : mkdir accepte plusieurs noms d'un coup, et l'option -p crée toute la profondeur.`,
        `Il te faut 3 créations de dossiers (mkdir) et 1 création de fichier (touch sae105/<nom_du_fichier>). Compare ensuite avec l'arborescence attendue via « ls sae105 ».`,
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

  💡 Commandes utiles : mv (déplacer/renommer), cp (copier)
  💡 mv sert aussi bien à déplacer qu'à renommer :
     tout dépend du chemin de destination.`),
      indices: [
        `La syntaxe est toujours : commande <source> <destination>. Si la destination est un dossier, le fichier va dedans ; si c'est un nouveau nom, le fichier est renommé.`,
        `Pour déplacer ET renommer en une seule commande : mv telechargements/article.txt sae105/contenus/<nouveau_nom>. Pour la copie, remplace mv par cp.`,
        `Il te faut 4 commandes : deux mv pour les images, un mv avec le nouveau nom complet pour l'article, et un cp pour le mp3. Vérifie avec ls sae105/contenus et ls telechargements.`,
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

  💡 Commandes utiles : rm, rmdir, et une option de rm
     pour les dossiers pleins.
  ⚠️  Réfléchis toujours à deux fois avant un rm récursif !`),
      indices: [
        `rm supprime un fichier. rmdir ne supprime que les dossiers VIDES. Pour un dossier plein, rm a besoin d'une option qui veut dire « récursif ».`,
        `L'option récursive de rm est une lettre précédée d'un tiret, la même que dans « récursif ». Elle supprime le dossier ET tout ce qu'il contient.`,
        `4 commandes : rm <fichier> (deux fois), rmdir <dossier_vide>, puis rm -r <dossier_plein>. Vérifie le résultat avec ls.`,
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
     (utilise echo et la redirection >)
  2. AJOUTE ensuite une deuxième ligne avec >>
  3. Vérifie le résultat avec cat : le fichier doit contenir
     au moins 2 lignes.

  💡 Exemple de forme : echo "mon texte" > chemin/fichier.txt
  ⚠️  Attention : un > de trop et tu écrases tout !`),
      indices: [
        `echo "..." affiche un texte. Suivi de > <fichier>, le texte part dans le fichier au lieu de l'écran.`,
        `Première ligne : echo "<ton slogan>" > sae105/contenus/slogan.txt — Deuxième ligne : même commande mais avec >> pour ajouter sans écraser.`,
        `Si ton fichier ne contient qu'une ligne, c'est que tu as utilisé > deux fois (il écrase). Recommence : d'abord >, puis >>. Contrôle avec cat sae105/contenus/slogan.txt.`,
      ],
      setup() {},
      check(ctx) {
        const node = ctx.fs.get(`${H}/sae105/contenus/slogan.txt`);
        if (!node || node.type !== 'file') return false;
        const lines = node.content.split('\n').filter(l => l.trim() !== '');
        return lines.length >= 2 && ctx.state.usedAppend;
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
     ~/sae105/code_serveur.txt   (avec echo et >)

  💡 Commandes utiles : grep (avec une option récursive), cat, echo
  💡 find cherche des NOMS de fichiers ;
     grep cherche DANS le CONTENU des fichiers.`),
      indices: [
        `grep <motif> <cible> cherche un texte dans des fichiers. Pour fouiller tout un dossier et ses sous-dossiers, ajoute la même option récursive que rm.`,
        `Essaie : grep -r CODE cours — la réponse t'indiquera le fichier fautif. Il ne restera qu'à le lire avec cat.`,
        `Le code trouvé ressemble à XXXXXX-XX. Enregistre-le : echo "<le_code>" > sae105/code_serveur.txt (recopie exactement le code, tirets compris).`,
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

Observe les droits avec :   ls -l scripts
  -rw-r--r--  →  lecture/écriture, mais PAS exécutable
  -rwxr-xr-x  →  exécutable ✔

  OBJECTIFS :
  1. Regarde les droits actuels de scripts/preparation.sh
  2. Rends ce script exécutable
  3. Exécute-le :   ./scripts/preparation.sh

  💡 Commandes utiles : ls -l, chmod
  💡 chmod accepte +x, ou une notation numérique comme 755.`),
      indices: [
        `chmod modifie les droits. Pour AJOUTER le droit d'exécution, on utilise le signe + suivi de la lettre du droit d'exécution.`,
        `chmod +x <fichier> rend le fichier exécutable. Vérifie ensuite avec ls -l : un « x » doit apparaître dans les droits.`,
        `Après le chmod, lance le script en préfixant son chemin par « ./ » s'il est dans le dossier courant : ./scripts/preparation.sh (ou déplace-toi d'abord dans scripts).`,
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
      titre: 'Devenir super-utilisateur (sudo & apt)',
      fichier: `${H}/missions/mission_09.txt`,
      texte: box('MISSION 9 — INSTALLER UN LOGICIEL', `Il est temps d'installer le serveur web Apache pour héberger
ton site de SAÉ. Mais installer un logiciel modifie le système :
il faut les droits d'administrateur !

Sous Linux, on préfixe la commande par « sudo »
(Super User DO) pour l'exécuter en tant qu'administrateur.

  OBJECTIFS :
  1. Mets à jour la liste des paquets disponibles
     (commande apt, action « update », avec sudo)
  2. Installe le paquet   apache2
     (commande apt, action « install », avec sudo)

  💡 Forme générale : sudo apt <action> [paquet]
  ⚠️  Sans sudo, le système refusera : c'est normal, essaie !`),
      indices: [
        `apt est le gestionnaire de paquets de Debian/Ubuntu. Deux actions t'intéressent : « update » (rafraîchir la liste) puis « install <nom_du_paquet> ».`,
        `N'oublie pas le préfixe sudo devant CHAQUE commande apt, sinon : permission refusée.`,
        `Première commande : sudo apt update — puis la même structure avec install suivi du nom exact du paquet : apache2.`,
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
la commande systemctl.

  OBJECTIFS :
  1. Démarre le service   apache2   (action « start », avec sudo)
  2. Vérifie son état     (action « status », sudo inutile ici)
  3. Teste le serveur en récupérant la page d'accueil :
     la commande curl permet d'interroger une URL —
     essaie sur   localhost

  💡 Forme générale : sudo systemctl <action> <service>
  💡 localhost = « cette machine » (127.0.0.1).`),
      indices: [
        `systemctl pilote les services : start pour démarrer, status pour l'état. Démarrer un service demande les droits admin (sudo).`,
        `Après « sudo systemctl start apache2 », contrôle avec « systemctl status apache2 » : le service doit être « active (running) ».`,
        `Pour le test final : curl localhost — si tout va bien, le HTML de la page par défaut d'Apache s'affiche dans le terminal.`,
      ],
      setup() {},
      check(ctx) {
        return ctx.state.services.apache2 === 'running' && ctx.state.flags.curledLocalhost;
      },
      bravo: `Ton serveur web tourne et répond ! systemctl start/status/stop :\nle quotidien de l'administrateur système.`,
    },

    /* ---------------- MISSION 11 ---------------- */
    {
      id: 11,
      titre: 'Publier sa page web',
      fichier: `${H}/missions/mission_11.txt`,
      texte: box('MISSION 11 — PUBLIER SA PAGE WEB', `La page par défaut d'Apache, c'est joli, mais le client attend
SA page ! Apache sert les fichiers du dossier /var/www/html —
qui appartient à root : il faudra sudo pour y écrire.

  OBJECTIFS :
  1. Ouvre /var/www/html/index.html dans l'éditeur nano
     (avec sudo !) :   sudo nano /var/www/html/index.html
  2. Remplace le contenu par ta propre page HTML. Elle doit
     contenir au moins :
        - un titre principal  <h1> ... </h1>
        - le mot   MMI   quelque part
  3. Enregistre, quitte nano, puis vérifie avec curl localhost

  💡 Dans nano : Ctrl+O (ou bouton) = enregistrer,
     Ctrl+X = quitter.
  💡 Exemple de page minimale :
     <h1>Portfolio MMI</h1>`),
      indices: [
        `Le fichier appartient à root : sans sudo, nano refusera d'enregistrer. Préfixe bien la commande.`,
        `Dans nano, écris une vraie petite page : au minimum une balise <h1> avec un titre, et le mot MMI dans le texte. Puis Ctrl+O pour enregistrer et Ctrl+X pour sortir.`,
        `Après l'enregistrement, tape « curl localhost » : tu dois voir TON code HTML (avec ton <h1>) et non plus la page par défaut d'Apache.`,
      ],
      setup() {},
      check(ctx) {
        const node = ctx.fs.get('/var/www/html/index.html');
        if (!node || node.type !== 'file') return false;
        const c = node.content;
        return /<h1[\s>]/i.test(c) && /mmi/i.test(c)
          && !c.includes('Apache2 Ubuntu Default Page')
          && ctx.state.flags.curledCustomPage;
      },
      bravo: `TA page est en ligne (sur ton serveur d'entraînement) !\nÉditer des fichiers système avec sudo nano : un grand classique.`,
    },

    /* ---------------- MISSION 12 ---------------- */
    {
      id: 12,
      titre: 'Analyser des fichiers (head, tail, wc)',
      fichier: `${H}/missions/mission_12.txt`,
      texte: box('MISSION 12 — ANALYSER DES FICHIERS', `Ton site de SAÉ attire du monde ! L'admin t'a déposé le relevé
de fréquentation dans ~/sae105/stats_visites.txt. Le fichier est
long : inutile de tout afficher avec cat, Linux sait extraire
juste ce qu'il faut.

  OBJECTIFS :
  1. Affiche les 5 PREMIÈRES lignes du fichier de statistiques
  2. Affiche les 3 DERNIÈRES lignes (les jours les plus récents)
  3. Compte le nombre de lignes du fichier

  💡 Commandes utiles : head, tail, wc (avec leurs options -n / -l)
  💡 Bonus : les pipes enchaînent les commandes,
     ex :  cat fichier | wc -l`),
      indices: [
        `Trois commandes : « head » affiche le début d'un fichier, « tail » la fin, « wc » compte (word count). Chacune prend le chemin du fichier en argument.`,
        `L'option -n règle le nombre de lignes de head et tail : head -n 5 <fichier>. Pour ne compter que les lignes avec wc, utilise l'option -l.`,
        `Les trois commandes à lancer ont la forme : head -n 5 sae105/<fichier>, tail -n 3 sae105/<fichier>, wc -l sae105/<fichier>.`,
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
      titre: 'Retrouver ses fichiers (find)',
      fichier: `${H}/missions/mission_13.txt`,
      texte: box('MISSION 13 — RETROUVER SES FICHIERS', `Catastrophe : ton binôme a livré le dossier ~/projet_v2 tout en
vrac, avec des sous-dossiers partout. Quelque part là-dedans se
cache le logo définitif du client : logo_final.png.

Tu as déjà utilisé grep pour chercher DANS les fichiers.
Cette fois il faut chercher des fichiers PAR LEUR NOM : c'est
le travail de la commande find.

  OBJECTIFS :
  1. Liste tous les fichiers .png cachés dans ~/projet_v2
     (find accepte les jokers :  "*.png")
  2. Déplace logo_final.png dans   ~/sae105/maquettes

  💡 Forme générale : find <dossier> -name "motif"
  💡 Le résultat de find te donne le chemin complet : parfait
     pour le réutiliser dans ton mv !`),
      indices: [
        `find <dossier> -name "*.png" explore le dossier ET tous ses sous-dossiers. Les guillemets autour du motif sont importants.`,
        `Lance : find projet_v2 -name "*.png" — parmi les résultats, repère le chemin complet de logo_final.png.`,
        `Recopie le chemin donné par find comme source de ton mv : mv projet_v2/<sous_dossier>/logo_final.png sae105/maquettes`,
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
      titre: 'Rédiger avec l\'éditeur nano',
      fichier: `${H}/missions/mission_14.txt`,
      texte: box('MISSION 14 — RÉDIGER AVEC NANO', `Le site du client aura une page « À propos ». Écris ta biographie
de créateur/créatrice ! Les redirections echo c'est bien pour une
ligne, mais pour un vrai texte, on ouvre un éditeur : nano.

  OBJECTIFS :
  1. Ouvre le fichier  ~/sae105/contenus/bio.txt  dans nano
  2. Rédige ta mini-biographie :
       - AU MOINS 3 lignes de texte
       - elle doit mentionner   MMI   quelque part
  3. Enregistre (Ctrl+O ou bouton) et quitte (Ctrl+X)
  4. Vérifie ton œuvre avec cat

  💡 nano <chemin/fichier> crée le fichier s'il n'existe pas.`),
      indices: [
        `La commande a la forme : nano sae105/contenus/<nom_du_fichier>. Une fenêtre d'édition s'ouvre par-dessus le terminal.`,
        `Écris au moins 3 lignes (appuie sur Entrée pour changer de ligne) et glisse le mot MMI dans ton texte, puis bouton « Enregistrer » et « Quitter ».`,
        `Si la mission ne se valide pas : vérifie avec cat que le fichier contient bien 3 lignes non vides ET le mot MMI, puis rouvre-le avec nano pour compléter.`,
      ],
      setup() {},
      check(ctx) {
        if (!ctx.state.used.has('nano')) return false;
        const node = ctx.fs.get(`${H}/sae105/contenus/bio.txt`);
        if (!node || node.type !== 'file') return false;
        const lines = node.content.split('\n').filter(l => l.trim() !== '');
        return lines.length >= 3 && /mmi/i.test(node.content);
      },
      bravo: `Belle plume ! nano est l'éditeur passe-partout des serveurs :\ntu le retrouveras sur toutes les machines Linux.`,
    },

    /* ---------------- MISSION 15 ---------------- */
    {
      id: 15,
      titre: 'Les droits en notation numérique',
      fichier: `${H}/missions/mission_15.txt`,
      texte: box('MISSION 15 — DROITS EN NOTATION NUMÉRIQUE', `Tu connais chmod +x. Les pros utilisent aussi la notation
NUMÉRIQUE : 3 chiffres pour propriétaire / groupe / autres.

    r = 4    w = 2    x = 1    (on additionne)
    7 = rwx    6 = rw-    5 = r-x    4 = r--    0 = ---

  Deux fichiers t'attendent :
  - ~/sae105/notes_jury.txt   → CONFIDENTIEL : toi seul(e) dois
    pouvoir le lire et l'écrire, rien pour les autres  (6-0-0)
  - ~/scripts/partage.sh      → script à partager : tout le monde
    peut le lire et l'exécuter, toi seul(e) peux l'écrire (7-5-5)

  OBJECTIFS :
  1. Applique les bons droits numériques à ces deux fichiers
  2. Contrôle le résultat avec ls -l

  💡 Forme : chmod <3 chiffres> <fichier>`),
      indices: [
        `Additionne pour chaque catégorie : lecture+écriture = 4+2 = 6 ; lecture+exécution = 4+1 = 5 ; tout = 7 ; rien = 0.`,
        `Le fichier confidentiel doit finir en -rw------- et le script en -rwxr-xr-x (vérifie avec ls -l sae105 et ls -l scripts).`,
        `Les deux commandes : chmod 600 sae105/notes_jury.txt puis chmod 755 scripts/partage.sh`,
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
        return !!a && !!b && a.perms === '600' && b.perms === '755';
      },
      bravo: `600, 644, 755 : ces trois nombres vont te suivre toute ta vie\nde webmaster — ce sont les réglages types d'un serveur web !`,
    },

    /* ---------------- MISSION 16 ---------------- */
    {
      id: 16,
      titre: 'Explorer la configuration du serveur',
      fichier: `${H}/missions/mission_16.txt`,
      texte: box('MISSION 16 — LA CONFIGURATION D\'APACHE', `D'où sort cette page quand on tape curl localhost ? Apache lit sa
configuration dans /etc/apache2/apache2.conf. On y trouve
notamment la directive DocumentRoot : le dossier que le serveur
publie sur le web.

  OBJECTIFS :
  1. Cherche la ligne   DocumentRoot   dans le fichier de
     configuration d'Apache (inutile de tout lire : grep !)
  2. Enregistre le CHEMIN trouvé (et seulement le chemin) dans
     ~/sae105/docroot.txt   (avec echo et >)

  💡 Les fichiers de /etc appartiennent à root, mais ils sont
     LISIBLES par tout le monde : pas besoin de sudo pour lire.`),
      indices: [
        `grep <motif> <fichier> affiche les lignes contenant le motif. Ici le motif est DocumentRoot et le fichier est /etc/apache2/apache2.conf.`,
        `La ligne trouvée ressemble à « DocumentRoot /chemin/vers/dossier » : c'est ce chemin qu'il faut recopier.`,
        `Termine avec : echo "<le_chemin_trouvé>" > sae105/docroot.txt — le chemin commence par /var/...`,
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
  1. Crée la page   /var/www/html/equipe.html   (sudo nano !)
     Elle doit contenir au moins un sous-titre <h2> ... </h2>
  2. Vérifie qu'elle est bien en ligne :
     curl localhost/equipe.html

  💡 Rappel : /var/www/html appartient à root...
  💡 Exemple minimal :  <h2>L'équipe MMI</h2>`),
      indices: [
        `Comme pour l'accueil (mission 11) : le dossier appartient à root, donc l'éditeur doit être ouvert avec le préfixe administrateur.`,
        `sudo nano /var/www/html/equipe.html — écris ta page avec une balise <h2>, enregistre, quitte.`,
        `Le test final : curl localhost/equipe.html — tu dois voir TON code HTML. Si « 404 Not Found » : vérifie le nom exact du fichier avec ls /var/www/html.`,
      ],
      setup() {},
      check(ctx) {
        const node = ctx.fs.get('/var/www/html/equipe.html');
        if (!node || node.type !== 'file') return false;
        return /<h2[\s>]/i.test(node.content) && ctx.state.flags.curledEquipePage;
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
  2. Exécute-le en tant qu'administrateur :
     sudo ./scripts/validation_finale.sh

  💡 Tout ce qu'il faut savoir, tu l'as déjà appris.
     (Missions 8 et 9, si un doute persiste...)`),
      indices: [
        `Deux étapes, déjà vues : d'abord donner le droit d'exécution au script (mission 8), ensuite le lancer avec les droits admin (mission 9).`,
        `chmod +x scripts/validation_finale.sh — puis exécute-le avec le préfixe sudo ET le « ./ » devant le chemin.`,
        `La commande finale complète a cette forme : sudo ./scripts/<nom_du_script>. Si « Permission non accordée » : le chmod n'a pas été fait ; si « commande introuvable » : il manque le ./`,
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
