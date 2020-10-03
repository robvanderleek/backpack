import * as fs from "fs";
import * as os from "os";
import * as path from "path";

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

export function getStoredFiles(backpackDir) {
    const files = fs.readdirSync(backpackDir);
    files.sort((a, b) => fs.statSync(path.join(backpackDir, b)).ctime.getTime() -
        fs.statSync(path.join(backpackDir, a)).ctime.getTime()
    );
    return files;
}

export function listFiles(backpackDir) {
    const files = getStoredFiles(backpackDir);
    files.forEach((f, i) => {
        const index = files.length - i;
        console.log(`${index}: ${f}`);
    });
}

export function deleteFile(filename, backpackDir) {
    fs.unlinkSync(path.join(backpackDir, filename));
}