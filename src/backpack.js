import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import BackpackTable from "./BackpackTable.js";
import FileType from "file-type";
import readChunk from "read-chunk";
import emoji from "node-emoji";

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
    if (fs.existsSync(filename)) {
        fs.renameSync(filename, path.join(backpackDir, path.basename(filename)));
    } else {
        console.error('Could not open file: ' + filename);
    }
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

export async function getFileType(chunk) {
    const type = await FileType.fromBuffer(chunk);
    if (type) {
        return type.mime;
    } else {
        return 'text/plain';
    }
}

function getContent(chunk) {
    let result = new Buffer.from(chunk).toString('utf-8');
    result = result.replace(/(?:\r\n|\r|\n)/g, ' ');
    result = result.substring(0, 60).trim();
    if (result.length === 0) {
        result = '<empty>';
    } else {
        result = '"' + result + '"';
    }
    return result;
}

async function readContentForStdinFiles(files, backpackDir) {
    const result = await Promise.all(files.map(async f => {
        const fullPath = path.join(backpackDir, f.name);
        if (fs.lstatSync(fullPath).isDirectory()) {
            return {...f, type: 'directory', content: f.name};
        } else {
            const chunk = readChunk.sync(fullPath, 0, 60);
            const fileType = await getFileType(chunk);
            let content;
            if (f.name.startsWith('stdin-') && fileType === 'text/plain') {
                content = getContent(chunk);
            } else {
                content = f.name;
            }
            return {...f, type: fileType, content: content};
        }
    }));
    return result;
}

function addFileTypeEmojis(files) {
    return files.map(f => {
        if (f.type === 'directory') {
            return {...f, content: emoji.get('file_folder') + ' ' + f.content};
        } else if (f.type === 'text/plain') {
            return {...f, content: emoji.get('notebook') + ' ' + f.content};
        } else if (f.type.startsWith('image/')) {
            return {...f, content: emoji.get('camera') + ' ' + f.content};
        } else {
            return f;
        }
    });
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
    let files = await getStoredFiles(backpackDir);
    files = await readContentForStdinFiles(files, backpackDir);
    files = addFileTypeEmojis(files);
    new BackpackTable(files).render();
}

export function deleteFile(filename, backpackDir) {
    fs.unlinkSync(path.join(backpackDir, filename));
}

export async function deleteIndex(index, backpackDir) {
    const files = await getStoredFiles(backpackDir);
    const filename = files[files.length - index].name;
    deleteFile(filename, backpackDir);
}