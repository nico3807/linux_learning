# 🐧 MMI Linux Quest

Un jeu sérieux pour apprendre les commandes principales de **Linux** dans un
**terminal virtuel**, sur le thème du **BUT MMI** (Métiers du Multimédia et de
l'Internet).

L'étudiant incarne un étudiant de première année qui découvre le serveur Linux
de son IUT pour réaliser sa **SAÉ 105 — Produire un site web** : navigation
dans l'arborescence, manipulation de fichiers, droits, `sudo`, installation
d'un serveur web Apache, mise en ligne d'une page HTML...

## 🎮 Jouer

Le jeu est 100 % statique (HTML/CSS/JavaScript, sans framework ni build) :

- **En ligne** : via GitHub Pages (voir « Mise en production » ci-dessous)
- **En local** : ouvrir simplement `index.html` dans un navigateur

## 📖 Principe du jeu

- Les **consignes sont des fichiers texte** dans le terminal virtuel : le
  joueur les affiche avec `cat` (par exemple `cat missions/mission_01.txt`)
  puis tape les commandes correspondantes.
- **18 missions progressives** (~3 à 4 heures de jeu au total) :

| # | Mission | Notions |
|---|---------|---------|
| 1 | Premiers pas | `pwd`, `ls` |
| 2 | Se déplacer | `cd`, `ls -a`, `cat`, fichiers cachés |
| 3 | Créer son espace projet | `mkdir`, `touch` |
| 4 | Ranger ses fichiers | `mv`, `cp`, renommage |
| 5 | Faire le ménage | `rm`, `rmdir`, `rm -r` |
| 6 | Écrire dans des fichiers | `echo`, redirections `>` et `>>` |
| 7 | Chercher dans les contenus | `grep -r` |
| 8 | Droits et exécution | `ls -l`, `chmod +x`, `./script.sh` |
| 9 | Devenir administrateur | `sudo`, `apt update`, `apt install` |
| 10 | Serveur web | `systemctl start/status`, `curl` |
| 11 | Publier sa page | `sudo nano`, HTML dans `/var/www/html` |
| 12 | Analyser des fichiers | `head`, `tail`, `wc`, pipes `\|` |
| 13 | Retrouver ses fichiers | `find -name`, jokers `*` |
| 14 | Rédiger avec l'éditeur | `nano` (création et édition) |
| 15 | Droits numériques | `chmod 600/644/755`, lecture de `ls -l` |
| 16 | Configuration du serveur | `grep` dans `/etc/apache2/apache2.conf`, DocumentRoot |
| 17 | Site multi-pages | seconde page dans `/var/www/html`, `curl localhost/...` |
| 18 | Validation finale | révision : `chmod` + `sudo` + exécution |

- **Jamais la réponse, toujours de l'aide** : la commande `indice` donne
  jusqu'à 3 indices progressifs par mission, les messages d'erreur orientent
  le joueur, `man <commande>` explique chaque commande — mais la solution
  exacte n'est jamais donnée.
- **Identification en début de session** : l'étudiant saisit son prénom et
  son nom au démarrage. Sa partie est **enregistrée à son nom** dans le
  navigateur (`localStorage`) : **plusieurs étudiants peuvent se succéder
  sur le même poste**, chacun retrouve sa propre progression. L'écran
  d'accueil liste les parties déjà présentes sur le poste (reprise en un
  clic), et le bouton « 👤 changer d'étudiant » (ou les commandes `exit` /
  `logout` / `deconnexion`) sauvegarde la session et rend la main à
  l'étudiant suivant. `reset --confirm` réinitialise uniquement la partie
  de l'étudiant connecté.
- À la fin : un certificat s'affiche dans le terminal, puis une pop-up
  propose de générer un **certificat PDF téléchargeable au nom de
  l'étudiant identifié** (généré côté navigateur avec jsPDF, embarqué dans
  le dépôt). Première page : le certificat avec les logos de part et d'autre
  du titre, la date, la durée du parcours et les indices utilisés — suivi de
  **l'historique complet des commandes saisies** pendant la partie. La
  commande `certificat` permet de le régénérer à tout moment après la fin.
- **Séance finie avant la fin du jeu ?** Le certificat peut être édité **à
  tout moment** via le bouton « 📜 certificat » de la barre du bas (ou la
  commande `certificat`) : le document devient une « Attestation de
  parcours » portant la mention **« NON TERMINÉ »** (filigrane + statut),
  avec le nombre de missions réussies (ex. 7/18) et l'historique des
  commandes déjà saisies. L'étudiant garde ainsi une trace de sa séance et
  pourra reprendre sa partie plus tard (sauvegarde automatique).

### Commandes du jeu (hors Linux)

| Commande | Effet |
|----------|-------|
| `aide` / `help` | liste des commandes disponibles |
| `mission` | rappelle la mission en cours |
| `indice` | un coup de pouce (progressif, jamais la réponse) |
| `progression` | avancement, temps de jeu, indices utilisés |
| `certificat` | télécharge le certificat PDF (mention « Non terminé » avant la fin) |
| `exit` / `logout` / `deconnexion` | sauvegarde la session et change d'étudiant |
| `reset --confirm` | recommence la partie de l'étudiant connecté |

Le terminal gère aussi : **historique** (flèches ↑↓), **complétion Tab**
(commandes et chemins), `Ctrl+L` (effacer), les **pipes** (`cat x | wc -l`)
et les **redirections** (`>`, `>>`).

## 🚀 Mise en production sur GitHub Pages

Aucune compilation nécessaire. Deux options :

1. **Via GitHub Actions** (recommandé, déjà configuré) : dans
   *Settings → Pages*, choisir **Source : GitHub Actions**. Le workflow
   `.github/workflows/deploy-pages.yml` publie le site à chaque push sur
   `main`.
2. **Depuis une branche** : dans *Settings → Pages*, choisir
   **Deploy from a branch** → `main` → `/ (root)`.

## 🧪 Tests

Un test automatique rejoue une partie complète (les 18 missions, plus les cas
d'erreur pédagogiques) :

```bash
node tests/playthrough.js
```

## 🏗️ Architecture (pour faire évoluer le jeu)

```
index.html          page unique du jeu
css/style.css       thème « terminal rétro »
assets/             logos utilisés sur le certificat PDF
js/vfs.js           système de fichiers virtuel (arborescence, droits, propriétaires)
js/commands.js      interpréteur : parsing, pipes, redirections, sudo + toutes les commandes
js/missions.js      ⭐ les 18 missions : consignes, indices, validation
js/game.js          moteur : cycle des missions, sauvegarde, certificat
js/terminal.js      interface navigateur : saisie, historique, Tab, éditeur nano
js/certificate.js   génération du certificat PDF (logos + historique des commandes)
js/vendor/          jsPDF (bibliothèque embarquée, licence MIT)
tests/playthrough.js  partie complète automatisée (Node.js)
docs/GUIDE_ENSEIGNANT.md  déroulé conseillé + solutions (à ne pas diffuser !)
```

### Logos du certificat

Le certificat PDF utilise deux images placées de part et d'autre du titre :

- `assets/logo_UM_hack26.png` (gauche) — **à remplacer par le logo officiel
  Université de Montpellier / IUT Béziers** : il suffit d'écraser ce fichier
  (même nom) dans le dépôt, aucun changement de code n'est nécessaire.
- `assets/logo_mmi.jpg` (droite) — logo MMI Béziers.

### Ajouter une mission

Le jeu est conçu pour être évolutif : tout se passe dans `js/missions.js`.
Ajouter un objet dans le tableau `missions` avec :

- `titre`, `fichier` (chemin du fichier de consignes dans le jeu), `texte`
  (les consignes affichées par `cat`) ;
- `indices` : 3 indices progressifs (guider sans donner la réponse !) ;
- `setup(ctx)` : prépare les fichiers nécessaires (`ctx.fs`) au démarrage de
  la mission ;
- `check(ctx)` : retourne `true` quand la mission est réussie (appelée après
  chaque commande — `ctx.fs`, `ctx.state`, `ctx.cwd` disponibles) ;
- `bravo` : message de félicitations.

### Ajouter une commande Linux

Dans `js/commands.js`, ajouter une entrée à `COMMANDS` :

```js
ma_commande: {
  desc: 'description courte (affichée par « aide »)',
  usage: 'ma_commande <argument>',
  man: 'texte détaillé pour « man ma_commande »',
  run(ctx, args) { ctx.sink.line('résultat'); },
},
```

Puis compléter `tests/playthrough.js` et vérifier que tout reste vert.

## 📚 Contexte pédagogique

Jeu conçu pour la ressource « Système d'information » / culture numérique du
**BUT MMI** : il couvre les commandes essentielles attendues d'un étudiant
(navigation, fichiers, droits, paquets, services) en les mettant en scène
dans un scénario de production web réaliste, du premier `pwd` jusqu'au
déploiement d'une page sur Apache.
