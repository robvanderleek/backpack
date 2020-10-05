import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import BackpackTable from "./BackpackTable.js";

export function initializeBackpackDir() {
    const homeDir = os.homedir();
    if (!homeDir) {
        console.log('Could not resolve home directory');
        process.exit(1);
    }
    const backpackDir = path.join(homeDir, '.local', 'share', 'backpack');
    fs.mkdirSync(backpackDir, {recursive: true});
    return backpackDir;
}

export function importFile(filename, backpackDir) {
    fs.renameSync(filename, path.join(backpackDir, filename));
}

export function importFromStdin(backpackDir) {
    const filename = `stdin-${new Date().toISOString()}`;
    const file = path.join(backpackDir, filename);
    process.stdin.pipe(fs.createWriteStream(file));
}

export function exportFile(filename, backpackDir) {
    fs.renameSync(path.join(backpackDir, filename), filename);
}

export function exportToStdout(filename, backpackDir) {
    fs.createReadStream(path.join(backpackDir, filename)).pipe(process.stdout);
}

function readContentForStdinFiles(files, backpackDir) {
    return files.map(f => {
       if (f[0].startsWith('stdin-')) {
           let content = fs.readFileSync(path.join(backpackDir, f[0]), 'utf-8');
           content = content.replace(/(?:\r\n|\r|\n)/g, ' ');
           content = content.substring(0, 60);
           if (content.length === 0) {
               content = '<empty>';
           } else {
               content = '"' + content + '"';
           }
           return [...f, content];
       } else {
           return [...f, f[0]];
       }
    });
}

export function getStoredFilesWithTimestamp(backpackDir) {
    const files = fs.readdirSync(backpackDir);
    const filesWithTimestamp = files.map(f => [f, fs.statSync(path.join(backpackDir, f)).ctime.getTime()]);
    filesWithTimestamp.sort((a, b) => b[1] - a[1]);
    return readContentForStdinFiles(filesWithTimestamp, backpackDir);
}

export function listFiles(backpackDir) {
    const files = getStoredFilesWithTimestamp(backpackDir);
    new BackpackTable(files).render();
}

export function deleteFile(filename, backpackDir) {
    fs.unlinkSync(path.join(backpackDir, filename));
}

export function deleteIndex(index, backpackDir) {
    const files = getStoredFilesWithTimestamp(backpackDir);
    const filename = files[files.length - index][0];
    deleteFile(filename, backpackDir);
}