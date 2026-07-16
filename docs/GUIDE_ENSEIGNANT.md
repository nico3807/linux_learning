# 👩‍🏫 Guide enseignant — MMI Linux Quest

> ⚠️ **Document réservé à l'encadrement** : il contient les solutions
> complètes des 18 missions. Ne pas le diffuser aux étudiants.
> (Un étudiant curieux peut toujours lire le code source du jeu — c'est
> d'ailleurs un excellent signe : le code est ouvert et commenté.)

## Vue d'ensemble

- **Public** : BUT MMI 1re année (aucun prérequis Linux).
- **Durée** : 3 à 4 h — découpable en 2 séances de 2 h (voir ci-dessous).
- **Matériel** : un navigateur par étudiant. Rien à installer.
- **Sauvegarde** : automatique dans le navigateur (`localStorage`). La
  partie reprend au même endroit **sur le même poste et le même
  navigateur**. En salle machine avec profils réinitialisés, prévoir de
  finir sur le même poste, ou faire éditer l'attestation en fin de séance.
- **Traçabilité** : à tout moment, le bouton « 📜 certificat » (barre du
  bas) génère un PDF : « Attestation de parcours — NON TERMINÉ » en cours
  de jeu, « Certificat de réussite » après la mission 18. Le PDF liste
  **toutes les commandes saisies** : très utile pour évaluer la démarche
  de l'étudiant (essais, erreurs, autonomie).

### Découpage conseillé en 2 séances

| Séance | Missions | Contenu |
|--------|----------|---------|
| 1 (2 h) | 1 → 8 | navigation, fichiers, redirections, recherche, droits |
| 2 (2 h) | 9 → 18 | sudo, apt, Apache, pages web, approfondissements |

En fin de séance 1 : faire générer l'attestation « Non terminé » et
ramasser les PDF (dépôt Moodle par exemple).

### Aides intégrées (à rappeler aux étudiants)

`aide` (liste des commandes) · `mission` (rappel des consignes) ·
`indice` (3 niveaux, jamais la réponse) · `progression` · `man <cmd>` ·
Tab (complétion) · ↑↓ (historique) · `reset --confirm` (tout recommencer).

---

## Solutions mission par mission

Les chemins sont donnés depuis `~` (le jeu accepte les variantes :
chemins absolus, `cd` préalable, etc.).

### Mission 1 — Premiers pas
```bash
cat missions/mission_01.txt
pwd
ls
```
Validation : `pwd` **et** `ls` utilisés.

### Mission 2 — Se déplacer / fichier caché
```bash
cd cours/culture_numerique
ls -a                      # révèle .acces_labo.txt
cat .acces_labo.txt
cd                         # ou cd ~
```
Validation : lecture du fichier caché **et** retour dans `~`.
Blocage fréquent : oubli du `.` au début du nom du fichier.

### Mission 3 — Créer l'espace projet
```bash
mkdir sae105
mkdir sae105/maquettes sae105/contenus
touch sae105/notes.txt
```
(Variante acceptée : `mkdir -p sae105/maquettes` etc.)

### Mission 4 — Ranger (mv / cp)
```bash
mv telechargements/logo.png sae105/maquettes
mv telechargements/banniere.jpg sae105/maquettes
mv telechargements/article.txt sae105/contenus/article_v1.txt
cp telechargements/interview.mp3 sae105/contenus
```
Piège pédagogique : le mp3 doit être **copié** (l'original doit rester).

### Mission 5 — Supprimer
```bash
rm rapport_old.txt
rm capture_temp.tmp
rmdir archives_vides
rm -r ancien_projet
```
`rmdir` sur `ancien_projet` échoue (non vide) : c'est voulu, pour amener
l'option `-r`.

### Mission 6 — Redirections
```bash
echo "Mon slogan" > sae105/contenus/slogan.txt
echo "Deuxième ligne" >> sae105/contenus/slogan.txt
```
Validation : fichier d'au moins 2 lignes **et** usage réel de `>>`
(deux `>` successifs écrasent : le jeu ne valide pas, c'est le piège).

### Mission 7 — grep
```bash
grep -r CODE cours          # → cours/culture_numerique/serveurs.txt
cat cours/culture_numerique/serveurs.txt
echo "KERNEL-42" > sae105/code_serveur.txt
```
Le code à retrouver est `KERNEL-42` (défini dans `js/missions.js`).

### Mission 8 — Droits et exécution
```bash
ls -l scripts
chmod +x scripts/preparation.sh
./scripts/preparation.sh
```

### Mission 9 — sudo & apt
```bash
sudo apt update
sudo apt install apache2
```
Sans `sudo` : refus. `install` avant `update` : refus (liste périmée).

### Mission 10 — Démarrer le serveur
```bash
sudo systemctl start apache2
systemctl status apache2
curl localhost
```

### Mission 11 — Page web personnelle
```bash
sudo nano /var/www/html/index.html
# → remplacer le contenu, avec au minimum : <h1>Portfolio MMI</h1>
# → Enregistrer (Ctrl+O), Quitter (Ctrl+X)
curl localhost
```
Validation : la page contient `<h1>` et « MMI », n'est plus la page par
défaut, et a été re-testée avec `curl`. `nano` sans `sudo` ouvre en
lecture seule : c'est le piège.

### Mission 12 — head, tail, wc
```bash
head -n 5 sae105/stats_visites.txt
tail -n 3 sae105/stats_visites.txt
wc -l sae105/stats_visites.txt
```
Validation : usage des trois commandes. Bonus à montrer :
`cat sae105/stats_visites.txt | wc -l`.

### Mission 13 — find
```bash
find projet_v2 -name "*.png"
mv projet_v2/exports/hd/logo_final.png sae105/maquettes
```

### Mission 14 — nano (local)
```bash
nano sae105/contenus/bio.txt
# → au moins 3 lignes non vides, dont le mot MMI quelque part
```

### Mission 15 — Droits numériques
```bash
chmod 600 sae105/notes_jury.txt
chmod 755 scripts/partage.sh
ls -l sae105 scripts
```

### Mission 16 — Configuration Apache
```bash
grep DocumentRoot /etc/apache2/apache2.conf
echo "/var/www/html" > sae105/docroot.txt
```

### Mission 17 — Page équipe
```bash
sudo nano /var/www/html/equipe.html
# → au minimum : <h2>L'équipe MMI</h2>
curl localhost/equipe.html
```
`curl` sur un nom de fichier erroné renvoie une 404 pédagogique.

### Mission 18 — Validation finale (révision)
```bash
chmod +x scripts/validation_finale.sh
sudo ./scripts/validation_finale.sh
```
→ certificat dans le terminal + pop-up du certificat PDF.

---

## Points de vigilance en salle

- **Rien ne sort du navigateur** : aucune vraie commande n'est exécutée,
  aucun risque pour les postes.
- Un étudiant bloqué doit épuiser ses 3 `indice` avant d'appeler :
  le 3ᵉ indice donne la syntaxe avec des « trous ».
- Les messages d'erreur contiennent souvent un 💡 : apprendre aux
  étudiants à LIRE les erreurs, c'est l'objectif caché du jeu.
- Le nombre d'indices utilisés figure sur le certificat : il peut servir
  de critère d'autonomie (sans le pénaliser trop — demander de l'aide est
  aussi une compétence).
- `reset --confirm` efface tout : à connaître, à ne pas laisser traîner
  sur l'écran d'un voisin farceur.

## Personnalisation rapide

- **Logos du certificat** : remplacer `assets/logo_UM_hack26.png`
  (gauche) et `assets/logo_mmi.jpg` (droite) — mêmes noms de fichiers,
  aucun code à modifier.
- **Code secret de la mission 7** : constante `SECRET_CODE` en tête de
  `js/missions.js`.
- **Ajouter/modifier des missions** : voir la section « Ajouter une
  mission » du `README.md`.
- Après toute modification : `node tests/playthrough.js` doit rester
  100 % vert (le déploiement GitHub Pages est bloqué sinon).
