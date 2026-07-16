/* ============================================================
 * MMI Linux Quest — Test de jouabilité complet (Node.js)
 * Simule une partie entière : vérifie que chaque mission se
 * valide avec les bonnes commandes, et que les erreurs
 * pédagogiques s'affichent quand il le faut.
 *
 * Lancer :  node tests/playthrough.js
 * ============================================================ */

const Game = require('../js/game.js');

let outputLog = [];
let editorRequest = null;
let certModalOpened = 0;

const game = new Game.GameEngine({
  print: (text, cls) => outputLog.push(String(text)),
  clear: () => {},
  openEditor: (path, content, writable, user) => { editorRequest = { path, content, writable, user }; },
  onStateChange: () => {},
  onGameFinished: () => { certModalOpened++; },
});

let failures = 0;
let checks = 0;

function assert(cond, label) {
  checks++;
  if (cond) console.log(`  ✔ ${label}`);
  else { failures++; console.error(`  ✘ ÉCHEC : ${label}`); }
}

function run(line) {
  outputLog = [];
  game.execute(line);
  return outputLog.join('');
}

function atMission(n, label) {
  const idx = game.finished ? 19 : game.state.missionIndex + 1;
  assert(idx === n, `${label} (mission courante attendue : ${n}, obtenue : ${idx})`);
}

console.log('— Démarrage du jeu (session nominative) —');
const resumed0 = game.startForPlayer('Nicolas', 'Maurin');
assert(resumed0 === false, 'Première connexion : nouvelle partie (pas de reprise)');
atMission(1, 'Le jeu démarre à la mission 1');
assert(game.listPlayers().length === 1 && game.listPlayers()[0].prenom === 'Nicolas',
  'L\'étudiant est enregistré dans l\'annuaire du poste');

console.log('\n— Mission 1 : premiers pas —');
let out = run('certificat');
assert(out.includes('NON TERMINÉ'), 'certificat avant la fin : mention « Non terminé » annoncée');
assert(certModalOpened === 1, 'certificat avant la fin : la pop-up s\'ouvre quand même');
let s0 = game.getStats();
assert(s0.finished === false && s0.missionsDone === 0, 'getStats avant la fin : statut non terminé, 0 mission');
out = run('cat README.txt');
assert(out.includes('mission_01.txt'), 'README oriente vers la mission 1');
out = run('cat missions/mission_01.txt');
assert(out.includes('MISSION 1'), 'La mission 1 se lit avec cat');
run('pwd');
atMission(1, 'pwd seul ne suffit pas');
run('ls');
atMission(2, 'pwd + ls valident la mission 1');

console.log('\n— Mission 2 : navigation et fichier caché —');
run('cat missions/mission_02.txt');
out = run('cd cours/culture_numerique && pwd');
out = run('cd cours/culture_numerique');
assert(game.cwd === '/home/etudiant/cours/culture_numerique', 'cd descend de deux niveaux');
out = run('ls');
assert(!out.includes('.acces_labo.txt'), 'ls simple ne montre pas le fichier caché');
out = run('ls -a');
assert(out.includes('.acces_labo.txt'), 'ls -a révèle le fichier caché');
out = run('cat .acces_labo.txt');
assert(out.includes('MMI-R101'), 'Le fichier caché se lit');
atMission(2, 'Il faut encore revenir au home');
run('cd');
atMission(3, 'Retour au home : mission 2 validée');

console.log('\n— Mission 3 : création de l\'arborescence projet —');
run('cat missions/mission_03.txt');
run('mkdir sae105');
run('mkdir sae105/maquettes sae105/contenus');
atMission(3, 'Dossiers seuls : pas encore validé');
run('touch sae105/notes.txt');
atMission(4, 'Arborescence complète : mission 3 validée');

console.log('\n— Mission 4 : mv / cp —');
run('cat missions/mission_04.txt');
run('mv telechargements/logo.png sae105/maquettes');
run('mv telechargements/banniere.jpg sae105/maquettes/');
run('mv telechargements/article.txt sae105/contenus/article_v1.txt');
atMission(4, 'Sans la copie du mp3 : pas encore validé');
run('cp telechargements/interview.mp3 sae105/contenus');
atMission(5, 'Rangement terminé : mission 4 validée');

console.log('\n— Mission 5 : suppressions —');
run('cat missions/mission_05.txt');
out = run('rmdir ancien_projet');
assert(out.includes('pas vide'), 'rmdir refuse un dossier plein');
out = run('rm ancien_projet');
assert(out.includes('dossier'), 'rm sans -r refuse un dossier');
run('rm rapport_old.txt');
run('rm capture_temp.tmp');
run('rmdir archives_vides');
run('rm -r ancien_projet');
atMission(6, 'Ménage complet : mission 5 validée');

console.log('\n— Mission 6 : redirections —');
run('cat missions/mission_06.txt');
run('echo "Le multimedia autrement" > sae105/contenus/slogan.txt');
run('echo "Slogan bis" > sae105/contenus/slogan.txt');
atMission(6, 'Deux fois > (écrasement) : pas validé');
run('echo "Creatif et connecte" >> sae105/contenus/slogan.txt');
atMission(7, '> puis >> : mission 6 validée');
out = run('cat sae105/contenus/slogan.txt');
assert(out.includes('Slogan bis') && out.includes('Creatif'), 'Le fichier contient bien les 2 lignes');

console.log('\n— Mission 7 : grep —');
run('cat missions/mission_07.txt');
out = run('grep -r CODE cours');
assert(out.includes('serveurs.txt') && out.includes('KERNEL-42'), 'grep -r trouve le fichier au code');
out = run('cat cours/culture_numerique/serveurs.txt');
assert(out.includes('KERNEL-42'), 'Le code se lit dans le fichier');
run('echo "KERNEL-42" > sae105/code_serveur.txt');
atMission(8, 'Code enregistré : mission 7 validée');

console.log('\n— Mission 8 : droits et exécution —');
run('cat missions/mission_08.txt');
out = run('./scripts/preparation.sh');
assert(out.includes('Permission non accordée'), 'Script non exécutable : refus');
out = run('ls -l scripts');
assert(out.includes('-rw-r--r--'), 'ls -l montre les droits 644');
run('chmod +x scripts/preparation.sh');
out = run('ls -l scripts');
assert(out.includes('-rwxr-xr-x'), 'chmod +x visible dans ls -l');
out = run('./scripts/preparation.sh');
assert(out.includes('Serveur prêt'), 'Le script s\'exécute');
atMission(9, 'Script exécuté : mission 8 validée');

console.log('\n— Mission 9 : sudo & apt —');
run('cat missions/mission_09.txt');
out = run('apt update');
assert(out.includes('Permission non accordée'), 'apt sans sudo : refus pédagogique');
out = run('sudo apt install apache2');
assert(out.includes('périmée') || out.includes('update'), 'install avant update : message d\'aide');
run('sudo apt update');
atMission(9, 'update seul : pas encore validé');
out = run('sudo apt install apache2');
assert(out.includes('installé avec succès'), 'apache2 s\'installe');
atMission(10, 'Apache installé : mission 9 validée');

console.log('\n— Mission 10 : systemctl & curl —');
run('cat missions/mission_10.txt');
out = run('curl localhost');
assert(out.includes('Connexion refusée'), 'curl avant démarrage : connexion refusée');
out = run('systemctl start apache2');
assert(out.includes('Access denied'), 'systemctl start sans sudo : refus');
run('sudo systemctl start apache2');
out = run('systemctl status apache2');
assert(out.includes('active (running)'), 'status : service actif');
out = run('curl localhost');
assert(out.includes('Apache2 Ubuntu Default Page'), 'curl renvoie la page par défaut');
atMission(11, 'Serveur testé : mission 10 validée');

console.log('\n— Mission 11 : page web perso —');
run('cat missions/mission_11.txt');
run('nano /var/www/html/index.html');
assert(editorRequest && editorRequest.writable === false, 'nano sans sudo : lecture seule');
assert(game.saveFromEditor('/var/www/html/index.html', '<h1>pirate</h1> MMI', 'etudiant') === false,
  'Enregistrement sans droits : refusé');
editorRequest = null;
run('sudo nano /var/www/html/index.html');
assert(editorRequest && editorRequest.writable === true, 'sudo nano : écriture possible');
game.saveFromEditor(editorRequest.path, '<html><body><h1>Portfolio MMI</h1><p>Bienvenue !</p></body></html>\n', editorRequest.user);
atMission(11, 'Page créée mais pas encore testée avec curl');
out = run('curl localhost');
assert(out.includes('Portfolio MMI'), 'curl affiche la page personnalisée');
atMission(12, 'Page vérifiée : mission 11 validée');

console.log('\n— Mission 12 : head, tail, wc —');
run('cat missions/mission_12.txt');
out = run('head -n 5 sae105/stats_visites.txt');
assert(out.includes('date ; visites') && out.includes('2026-06-04'), 'head -n 5 affiche le début du fichier');
out = run('tail -n 3 sae105/stats_visites.txt');
assert(out.includes('2026-06-14') && !out.includes('2026-06-01 '), 'tail -n 3 affiche la fin du fichier');
atMission(12, 'head + tail : pas encore validé');
out = run('wc -l sae105/stats_visites.txt');
assert(out.trim().startsWith('15'), 'wc -l compte les 15 lignes');
atMission(13, 'head + tail + wc : mission 12 validée');
out = run('cat sae105/stats_visites.txt | wc -l');
assert(out.trim() === '15', 'Le pipe cat | wc -l fonctionne aussi');

console.log('\n— Mission 13 : find —');
run('cat missions/mission_13.txt');
out = run('find projet_v2 -name "*.png"');
assert(out.includes('logo_final.png') && out.includes('vieux_logo.png'), 'find liste les .png de tous les sous-dossiers');
run('mv projet_v2/exports/hd/logo_final.png sae105/maquettes');
atMission(14, 'Logo retrouvé et rangé : mission 13 validée');

console.log('\n— Mission 14 : nano —');
run('cat missions/mission_14.txt');
editorRequest = null;
run('nano sae105/contenus/bio.txt');
assert(editorRequest && editorRequest.writable === true, 'nano ouvre l\'éditeur sur bio.txt');
game.saveFromEditor(editorRequest.path, 'Etudiante en 1re annee de BUT MMI.\nPassionnee de web design.\nFuture integratrice.\n', editorRequest.user);
atMission(15, 'Bio de 3 lignes avec MMI : mission 14 validée');

console.log('\n— Mission 15 : droits numériques —');
run('cat missions/mission_15.txt');
run('chmod 600 sae105/notes_jury.txt');
atMission(15, 'Un seul chmod : pas encore validé');
run('chmod 755 scripts/partage.sh');
atMission(16, 'chmod 600 + 755 : mission 15 validée');
out = run('ls -l sae105');
assert(out.includes('-rw-------'), 'ls -l montre bien -rw------- (600)');
out = run('ls -l scripts');
assert(out.includes('-rwxr-xr-x'), 'ls -l montre bien -rwxr-xr-x (755)');

console.log('\n— Mission 16 : configuration Apache —');
run('cat missions/mission_16.txt');
out = run('grep DocumentRoot /etc/apache2/apache2.conf');
assert(out.includes('/var/www/html'), 'grep trouve la directive DocumentRoot');
run('echo "/var/www/html" > sae105/docroot.txt');
atMission(17, 'DocumentRoot enregistré : mission 16 validée');

console.log('\n— Mission 17 : page équipe —');
run('cat missions/mission_17.txt');
out = run('curl localhost/equipe.html');
assert(out.includes('404'), 'curl sur une page inexistante : 404');
run('sudo nano /var/www/html/equipe.html');
assert(editorRequest && editorRequest.path === '/var/www/html/equipe.html' && editorRequest.writable === true,
  'sudo nano ouvre la page équipe en écriture');
game.saveFromEditor(editorRequest.path, '<html><body><h2>L\'equipe MMI</h2><p>Camille & Nico</p></body></html>\n', editorRequest.user);
atMission(17, 'Page créée mais pas encore testée avec curl');
out = run('curl localhost/equipe.html');
assert(out.includes('equipe MMI'), 'curl localhost/equipe.html sert la nouvelle page');
atMission(18, 'Page équipe en ligne : mission 17 validée');
out = run('curl localhost');
assert(out.includes('Portfolio MMI'), 'curl localhost sert toujours l\'accueil');

console.log('\n— Mission 18 : validation finale —');
run('cat missions/mission_18.txt');
out = run('sudo ./scripts/validation_finale.sh');
assert(out.includes('Permission non accordée'), 'Script final non exécutable : refus');
run('chmod +x scripts/validation_finale.sh');
out = run('./scripts/validation_finale.sh');
assert(out.includes('administrateur'), 'Script final sans sudo : refus');
outputLog = [];
run('sudo ./scripts/validation_finale.sh');
out = outputLog.join('');
assert(out.includes('CERTIFICAT MMI LINUX QUEST'), 'Le certificat final s\'affiche');
assert(game.finished, 'Le jeu est marqué comme terminé');
assert(certModalOpened === 2, 'La pop-up du certificat s\'ouvre à la fin du jeu');
run('certificat');
assert(certModalOpened === 3, 'La commande « certificat » rouvre la pop-up');
const stats = game.getStats();
assert(stats.missionsTotal === 18 && typeof stats.duree === 'string' && stats.date.length > 5,
  'getStats fournit durée, date et total de missions');
assert(stats.finished === true && stats.missionsDone === 18, 'getStats après la fin : terminé, 18/18');
assert(game.state.history.includes('sudo apt update'), 'L\'historique complet est disponible pour le PDF');

console.log('\n— Commandes transverses —');
out = run('indice');
assert(out.includes('terminé'), 'indice après la fin : message adapté');
out = run('progression');
assert(out.includes('18/18'), 'progression : 18/18');
out = run('tree sae105');
assert(out.includes('maquettes') && out.includes('└──'), 'tree fonctionne');
out = run('grep -i portfolio /var/www/html/index.html');
assert(out.includes('Portfolio'), 'grep -i insensible à la casse');
out = run('cat sae105/contenus/slogan.txt | wc -l');
assert(out.trim() === '2', 'pipe cat | wc -l fonctionne');
out = run('lls');
assert(out.includes('introuvable') && out.includes('ls'), 'Commande inconnue : suggestion proposée');
out = run('man chmod');
assert(out.includes('Change Mode'), 'man affiche le manuel');
out = run('history');
assert(out.includes('sudo apt update'), 'history retrace les commandes');

/* Sessions multi-étudiants sur le même poste */
console.log('\n— Sessions multi-étudiants —');
out = run('deconnexion');
assert(out.includes('sauvegardée'), 'deconnexion : la session est sauvegardée');

const stubs = { print: () => {}, clear: () => {}, openEditor: () => {}, onStateChange: () => {}, storage: game.storage };
const game2 = new Game.GameEngine(stubs);
const resumed2 = game2.startForPlayer('Camille', 'Dupont');
assert(resumed2 === false && game2.finished === false && game2.state.missionIndex === 0,
  'Un 2e étudiant sur le même poste démarre une partie vierge');
game2.execute('pwd');
game2.execute('ls');
assert(game2.state.missionIndex === 1, 'La partie du 2e étudiant progresse indépendamment');

const game3 = new Game.GameEngine(stubs);
const resumed3 = game3.startForPlayer('Nicolas', 'Maurin');
assert(resumed3 === true && game3.finished === true, 'Le 1er étudiant retrouve sa partie terminée');
assert(game3.fs.isFile('/var/www/html/index.html'), 'La sauvegarde restaure le système de fichiers');
assert(game3.player.prenom === 'Nicolas' && game3.player.nom === 'Maurin', 'L\'identité est restaurée avec la partie');

const game4 = new Game.GameEngine(stubs);
const resumed4 = game4.startForPlayer('  camille ', 'DUPONT');
assert(resumed4 === true && game4.state.missionIndex === 1,
  'La reprise tolère casse et espaces (camille/DUPONT = Camille Dupont)');

const registry = game4.listPlayers();
assert(registry.length === 2, 'L\'annuaire du poste liste bien les 2 étudiants');
assert(registry.some(p => p.finished) && registry.some(p => !p.finished),
  'L\'annuaire distingue parties terminées et en cours');

console.log(`\n════════════════════════════════════════`);
if (failures === 0) {
  console.log(`✅ ${checks}/${checks} vérifications réussies — le jeu est finissable de bout en bout !`);
} else {
  console.error(`❌ ${failures} échec(s) sur ${checks} vérifications`);
  process.exit(1);
}
