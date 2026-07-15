/* ============================================================
 * MMI Linux Quest — Système de fichiers virtuel (VFS)
 * Simule une arborescence Linux en mémoire (aucun accès réel).
 * ============================================================ */

const VFS = (() => {

  /** Crée un nœud répertoire. */
  function dir(perms = '755', owner = 'etudiant') {
    return { type: 'dir', children: {}, perms, owner };
  }

  /** Crée un nœud fichier. */
  function file(content = '', perms = '644', owner = 'etudiant') {
    return { type: 'file', content, perms, owner };
  }

  const HOME = '/home/etudiant';

  /**
   * Normalise un chemin (gère ~, ., .., chemins relatifs).
   * Retourne toujours un chemin absolu sans slash final (sauf racine).
   */
  function normalize(path, cwd) {
    if (!path || path === '') path = '.';
    if (path === '~') path = HOME;
    else if (path.startsWith('~/')) path = HOME + path.slice(1);
    if (!path.startsWith('/')) path = cwd + '/' + path;

    const parts = path.split('/');
    const stack = [];
    for (const p of parts) {
      if (p === '' || p === '.') continue;
      if (p === '..') { stack.pop(); continue; }
      stack.push(p);
    }
    return '/' + stack.join('/');
  }

  /** Affiche un chemin en abrégeant le home par ~. */
  function pretty(absPath) {
    if (absPath === HOME) return '~';
    if (absPath.startsWith(HOME + '/')) return '~' + absPath.slice(HOME.length);
    return absPath;
  }

  class FileSystem {
    constructor() {
      this.root = dir('755', 'root');
    }

    /** Retourne le nœud au chemin absolu donné, ou null. */
    get(absPath) {
      if (absPath === '/') return this.root;
      const parts = absPath.split('/').filter(Boolean);
      let node = this.root;
      for (const p of parts) {
        if (!node || node.type !== 'dir') return null;
        node = node.children[p];
      }
      return node || null;
    }

    /** Retourne [nœudParent, nomDeBase] pour un chemin absolu. */
    parentOf(absPath) {
      const parts = absPath.split('/').filter(Boolean);
      const name = parts.pop();
      const parent = parts.length ? this.get('/' + parts.join('/')) : this.root;
      return [parent, name];
    }

    exists(absPath) { return this.get(absPath) !== null; }

    isDir(absPath) {
      const n = this.get(absPath);
      return !!n && n.type === 'dir';
    }

    isFile(absPath) {
      const n = this.get(absPath);
      return !!n && n.type === 'file';
    }

    /**
     * Crée un répertoire. withParents = mkdir -p.
     * Retourne { ok } ou { error }.
     */
    mkdir(absPath, user, withParents = false) {
      if (this.exists(absPath)) {
        return withParents ? { ok: true }
          : { error: `mkdir: impossible de créer le répertoire '${pretty(absPath)}': Le fichier existe` };
      }
      const [parent, name] = this.parentOf(absPath);
      if (!parent || parent.type !== 'dir') {
        if (withParents) {
          const up = absPath.slice(0, absPath.lastIndexOf('/')) || '/';
          const r = this.mkdir(up, user, true);
          if (r.error) return r;
          return this.mkdir(absPath, user, false);
        }
        return { error: `mkdir: impossible de créer le répertoire '${pretty(absPath)}': Aucun fichier ou dossier de ce type` };
      }
      if (!this.canWrite(parent, user)) {
        return { error: `mkdir: impossible de créer le répertoire '${pretty(absPath)}': Permission non accordée` };
      }
      parent.children[name] = dir('755', user);
      return { ok: true };
    }

    /** Écrit un fichier (création ou remplacement). append = >> */
    writeFile(absPath, content, user, append = false) {
      const existing = this.get(absPath);
      if (existing) {
        if (existing.type === 'dir') return { error: `${pretty(absPath)}: Est un dossier` };
        if (!this.canWrite(existing, user)) return { error: `${pretty(absPath)}: Permission non accordée` };
        existing.content = append ? existing.content + content : content;
        return { ok: true };
      }
      const [parent, name] = this.parentOf(absPath);
      if (!parent || parent.type !== 'dir') {
        return { error: `${pretty(absPath)}: Aucun fichier ou dossier de ce type` };
      }
      if (!this.canWrite(parent, user)) {
        return { error: `${pretty(absPath)}: Permission non accordée` };
      }
      parent.children[name] = file(content, '644', user);
      return { ok: true };
    }

    /** touch : crée un fichier vide s'il n'existe pas. */
    touch(absPath, user) {
      if (this.exists(absPath)) return { ok: true };
      return this.writeFile(absPath, '', user);
    }

    /** Supprime un nœud. recursive = rm -r */
    remove(absPath, user, recursive = false) {
      const node = this.get(absPath);
      if (!node) return { error: `rm: impossible de supprimer '${pretty(absPath)}': Aucun fichier ou dossier de ce type` };
      if (node.type === 'dir' && !recursive) {
        return { error: `rm: impossible de supprimer '${pretty(absPath)}': est un dossier (essaie l'option récursive)` };
      }
      const [parent, name] = this.parentOf(absPath);
      if (!this.canWrite(parent, user) || !this.canWrite(node, user)) {
        return { error: `rm: impossible de supprimer '${pretty(absPath)}': Permission non accordée` };
      }
      delete parent.children[name];
      return { ok: true };
    }

    /** rmdir : supprime un répertoire vide uniquement. */
    rmdir(absPath, user) {
      const node = this.get(absPath);
      if (!node) return { error: `rmdir: échec de suppression de '${pretty(absPath)}': Aucun fichier ou dossier de ce type` };
      if (node.type !== 'dir') return { error: `rmdir: échec de suppression de '${pretty(absPath)}': N'est pas un dossier` };
      if (Object.keys(node.children).length > 0) {
        return { error: `rmdir: échec de suppression de '${pretty(absPath)}': Le dossier n'est pas vide` };
      }
      const [parent, name] = this.parentOf(absPath);
      if (!this.canWrite(parent, user)) {
        return { error: `rmdir: échec de suppression de '${pretty(absPath)}': Permission non accordée` };
      }
      delete parent.children[name];
      return { ok: true };
    }

    /** Copie profonde d'un nœud. */
    cloneNode(node) {
      if (node.type === 'file') return file(node.content, node.perms, node.owner);
      const d = dir(node.perms, node.owner);
      for (const [k, v] of Object.entries(node.children)) d.children[k] = this.cloneNode(v);
      return d;
    }

    /**
     * cp src -> dest. Si dest est un dossier existant, copie dedans.
     */
    copy(srcAbs, destAbs, user, recursive = false) {
      const src = this.get(srcAbs);
      if (!src) return { error: `cp: impossible d'évaluer '${pretty(srcAbs)}': Aucun fichier ou dossier de ce type` };
      if (src.type === 'dir' && !recursive) {
        return { error: `cp: -r non spécifié ; omission du dossier '${pretty(srcAbs)}'` };
      }
      let target = destAbs;
      const destNode = this.get(destAbs);
      if (destNode && destNode.type === 'dir') {
        target = destAbs + '/' + srcAbs.split('/').pop();
      }
      const [parent, name] = this.parentOf(target);
      if (!parent || parent.type !== 'dir') {
        return { error: `cp: impossible de créer '${pretty(target)}': Aucun fichier ou dossier de ce type` };
      }
      if (!this.canWrite(parent, user)) {
        return { error: `cp: impossible de créer '${pretty(target)}': Permission non accordée` };
      }
      parent.children[name] = this.cloneNode(src);
      return { ok: true, target };
    }

    /** mv src -> dest (déplacement ou renommage). */
    move(srcAbs, destAbs, user) {
      const src = this.get(srcAbs);
      if (!src) return { error: `mv: impossible d'évaluer '${pretty(srcAbs)}': Aucun fichier ou dossier de ce type` };
      let target = destAbs;
      const destNode = this.get(destAbs);
      if (destNode && destNode.type === 'dir') {
        target = destAbs + '/' + srcAbs.split('/').pop();
      }
      if (target === srcAbs) return { ok: true, target };
      if (target.startsWith(srcAbs + '/')) {
        return { error: `mv: impossible de déplacer '${pretty(srcAbs)}' vers un sous-dossier de lui-même` };
      }
      const [dParent, dName] = this.parentOf(target);
      if (!dParent || dParent.type !== 'dir') {
        return { error: `mv: impossible de déplacer vers '${pretty(target)}': Aucun fichier ou dossier de ce type` };
      }
      const [sParent, sName] = this.parentOf(srcAbs);
      if (!this.canWrite(dParent, user) || !this.canWrite(sParent, user)) {
        return { error: `mv: '${pretty(target)}': Permission non accordée` };
      }
      dParent.children[dName] = src;
      delete sParent.children[sName];
      return { ok: true, target };
    }

    /** Droit d'écriture : root peut tout, sinon il faut être propriétaire. */
    canWrite(node, user) {
      if (!node) return false;
      if (user === 'root') return true;
      return node.owner !== 'root';
    }

    /** Le fichier est-il exécutable (bit x, n'importe quelle classe) ? */
    isExecutable(node) {
      if (!node || node.type !== 'file') return false;
      return node.perms.split('').some(d => (parseInt(d, 8) & 1) === 1);
    }

    /** chmod : mode numérique (ex 755) ou symbolique simple (ex +x, u+x, go-w). */
    chmod(absPath, mode, user) {
      const node = this.get(absPath);
      if (!node) return { error: `chmod: impossible d'accéder à '${pretty(absPath)}': Aucun fichier ou dossier de ce type` };
      if (user !== 'root' && node.owner !== user) {
        return { error: `chmod: modification des permissions de '${pretty(absPath)}': Opération non permise` };
      }
      if (/^[0-7]{3}$/.test(mode)) {
        node.perms = mode;
        return { ok: true };
      }
      const m = mode.match(/^([ugoa]*)([+-])([rwx]+)$/);
      if (!m) return { error: `chmod: mode invalide : '${mode}'` };
      const who = m[1] === '' || m[1].includes('a') ? 'ugo' : m[1];
      const op = m[2];
      let bits = 0;
      if (m[3].includes('r')) bits |= 4;
      if (m[3].includes('w')) bits |= 2;
      if (m[3].includes('x')) bits |= 1;
      const digits = node.perms.split('').map(d => parseInt(d, 8));
      const idx = { u: 0, g: 1, o: 2 };
      for (const w of who) {
        if (op === '+') digits[idx[w]] |= bits;
        else digits[idx[w]] &= ~bits;
      }
      node.perms = digits.join('');
      return { ok: true };
    }

    /** Permissions façon ls -l : '755' + dir -> 'drwxr-xr-x'. */
    permString(node) {
      const map = ['---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx'];
      const p = node.perms.split('').map(d => map[parseInt(d, 8)]).join('');
      return (node.type === 'dir' ? 'd' : '-') + p;
    }

    /** Sérialisation pour la sauvegarde. */
    toJSON() { return this.root; }

    static fromJSON(data) {
      const fs = new FileSystem();
      fs.root = data;
      return fs;
    }
  }

  return { FileSystem, dir, file, normalize, pretty, HOME };
})();

if (typeof module !== 'undefined') module.exports = VFS;
