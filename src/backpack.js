import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import BackpackTable from "./BackpackTable.js";
import FileType from "file-type";
import readChunk from "read-chunk";

export function getBackpackFolder() {
    const homeDir = os.homedir();
    if (!homeDir) {
        console.error('Could not resolve home directory!');
        process.exit(1);
    }
    const result = path.join(homeDir, '.local', 'share', 'backpack');
    initializeBackpackFolder(result);
    return result;
}

function initializeBackpackFolder(backpackFolder) {
    if (!fs.existsSync(backpackFolder)) {
        fs.mkdirSync(backpackFolder, {recursive: true});
        console.log(`Created backpack folder: ${backpackFolder}`);
    }
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


async function getContent(fullPath) {
    const chunk = readChunk.sync(fullPath, 0, 60);
    const type = await FileType.fromBuffer(chunk);
    if (type) {
        return type.mime;
    } else {
        return new Buffer.from(chunk).toString('utf-8');
    }
}

async function readContentForStdinFiles(files, backpackDir) {
    const result = await Promise.all(files.map(async f => {
        if (f.name.startsWith('stdin-')) {
            const fullPath = path.join(backpackDir, f.name);
            let content = await getContent(fullPath);
            content = content.replace(/(?:\r\n|\r|\n)/g, ' ');
            content = content.substring(0, 60);
            if (content.length === 0) {
                content = '<empty>';
            } else {
                content = '"' + content + '"';
            }
            return {...f, content: content};
        } else {
            return {...f, content: f.name};
        }
    }));
    return result;
}

export async function getFilename(i, backpackFolder) {
    const index = parseInt(i);
    const files = await getStoredFiles(backpackFolder);
    return files[files.length - index].name;
}

export async function getStoredFiles(backpackDir) {
    const files = fs.readdirSync(backpackDir);
    const filesWithTimestamp = files.map(f => ({
        name: f,
        ctime: fs.statSync(path.join(backpackDir, f)).ctime.getTime()
    }));
    filesWithTimestamp.sort((a, b) => b.ctime - a.ctime);
    return filesWithTimestamp;
}

export async function listFiles(backpackDir) {
    const files = await getStoredFiles(backpackDir);
    const filesWithContent = await readContentForStdinFiles(files, backpackDir)
    new BackpackTable(filesWithContent).render();
}

export function deleteFile(filename, backpackDir) {
    fs.unlinkSync(path.join(backpackDir, filename));
}

export async function deleteIndex(index, backpackDir) {
    const files = await getStoredFiles(backpackDir);
    const filename = files[files.length - index].name;
    deleteFile(filename, backpackDir);
}