import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import BackpackTable from "./BackpackTable.js";
import readChunk from "read-chunk";
import FileType from 'file-type';


export const FILE_TYPE_TEXT_PLAIN = 'text/plain';
export const FILE_TYPE_DIRECTORY = 'inode/directory';

export interface BackpackFile {
    name: string;
    birthTime: number;
    type?: string;
    content?: string;
}

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

function initializeBackpackFolder(backpackFolder: string) {
    if (!fs.existsSync(backpackFolder)) {
        fs.mkdirSync(backpackFolder, {recursive: true});
        console.log(`Created backpack folder: ${backpackFolder}`);
    }
}

export function importFile(filename: string, backpackDir: string) {
    if (fs.existsSync(filename)) {
        fs.renameSync(filename, path.join(backpackDir, path.basename(filename)));
    } else {
        console.error('Could not open file: ' + filename);
    }
}

export function importFromStdin(backpackDir: string) {
    const filename = `stdin-${new Date().toISOString()}`;
    const file = path.join(backpackDir, filename);
    process.stdin.pipe(fs.createWriteStream(file));
}

export function exportFile(filename: string, backpackDir: string) {
    fs.renameSync(path.join(backpackDir, filename), filename);
}

export function exportToStdout(filename: string, backpackDir: string) {
    const fullPath = path.join(backpackDir, filename);
    fs.createReadStream(fullPath).pipe(process.stdout);
}

export async function getFileType(filename: string, backpackDir: string) {
    const fullPath = path.join(backpackDir, filename);
    if (fs.lstatSync(fullPath).isDirectory()) {
        return FILE_TYPE_DIRECTORY;
    } else {
        const chunk = readChunk.sync(fullPath, 0, 60);
        return await getFileTypeFromChunk(chunk);
    }
}

export async function getFileTypeFromChunk(chunk: Buffer) {
    const type = await FileType.fromBuffer(chunk);
    if (type) {
        return type.mime;
    } else {
        return FILE_TYPE_TEXT_PLAIN;
    }
}

function getContent(chunk: Buffer) {
    let result = Buffer.from(chunk).toString('utf-8');
    result = result.replace(/(?:\r\n|\r|\n)/g, ' ');
    result = result.substring(0, 60).trim();
    if (result.length === 0) {
        result = '<empty>';
    } else {
        result = '"' + result + '"';
    }
    return result;
}

async function readContentForStdinFiles(files: Array<BackpackFile>, backpackDir: string): Promise<Array<BackpackFile>> {
    return await Promise.all(files.map(async f => {
        const fullPath = path.join(backpackDir, f.name);
        if (fs.lstatSync(fullPath).isDirectory()) {
            return {...f, type: 'directory', content: f.name};
        } else {
            const chunk = readChunk.sync(fullPath, 0, 60);
            const fileType = await getFileTypeFromChunk(chunk);
            let content;
            if (f.name.startsWith('stdin-') && fileType === FILE_TYPE_TEXT_PLAIN) {
                content = getContent(chunk);
            } else {
                content = f.name;
            }
            return {...f, type: fileType, content: content};
        }
    }));
}

function addFileTypeEmojis(files: Array<BackpackFile>) {
    return files.map(f => {
        if (f.type === 'directory') {
            return {...f, content: '📁 ' + f.content};
        } else if (f.type === FILE_TYPE_TEXT_PLAIN) {
            return {...f, content: '📒 ' + f.content};
        } else if (f.type && f.type.startsWith('image/')) {
            return {...f, content: '📷 ' + f.content};
        } else {
            return f;
        }
    });
}

export async function getFilename(i: any, backpackFolder: string) {
    const index = parseInt(i);
    const files = await getStoredFiles(backpackFolder);
    return files[files.length - index].name;
}

export async function getStoredFiles(backpackDir: string) {
    let files = fs.readdirSync(backpackDir);
    let backpackFiles: Array<BackpackFile> = files.map(f => ({
        name: f,
        birthTime: fs.statSync(path.join(backpackDir, f)).birthtime.getTime()
    }));
    backpackFiles.sort((a, b) => b.birthTime - a.birthTime);
    return backpackFiles;
}

export async function listFiles(backpackDir: string) {
    let files = await getStoredFiles(backpackDir);
    files = await readContentForStdinFiles(files, backpackDir);
    files = addFileTypeEmojis(files);
    new BackpackTable(files).render();
}

export function deleteFile(filename: string, backpackDir: string) {
    fs.unlinkSync(path.join(backpackDir, filename));
}

export async function deleteIndex(index: number, backpackDir: string) {
    const files = await getStoredFiles(backpackDir);
    const filename = files[files.length - index].name;
    deleteFile(filename, backpackDir);
}