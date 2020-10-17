import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import BackpackTable from "./BackpackTable";
import FileType from "file-type";
import readChunk from "read-chunk";
import {Item} from "./entities/Item";

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

export function importFile(filename: string, backpackDir: string) {
    fs.renameSync(filename, path.join(backpackDir, filename));
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
    fs.createReadStream(path.join(backpackDir, filename)).pipe(process.stdout);
}

async function getContent(fullPath: string) {
    const chunk = readChunk.sync(fullPath, 0, 60);
    const type = await FileType.fromBuffer(chunk);
    if (type) {
        return type.mime;
    } else {
        // @ts-ignore
        return new Buffer.from(chunk).toString('utf-8');
    }
}

async function readContentForStdinFiles(items: Array<Item>, backpackDir: string) {
    const result = await Promise.all(items.map(async i => {
        if (i.name.startsWith('stdin-')) {
            const fullPath = path.join(backpackDir, i.name);
            let content = await getContent(fullPath);
            content = content.replace(/(?:\r\n|\r|\n)/g, ' ');
            content = content.substring(0, 60);
            if (content.length === 0) {
                content = '<empty>';
            } else {
                content = '"' + content + '"';
            }
            i.content = content;
        } else {
            i.content = i.name;
        }
        return i;
    }));
    return result;
}

export async function getStoredFilesWithTimestamp(backpackDir: string): Promise<Array<Item>> {
    const files = fs.readdirSync(backpackDir);
    const filesWithTimestamp: Array<Item> = files.map(f => ({
        name: f,
        ctime: fs.statSync(path.join(backpackDir, f)).ctime.getTime()
    }));
    filesWithTimestamp.sort((a, b) => b.ctime - a.ctime);
    return await readContentForStdinFiles(filesWithTimestamp, backpackDir);
}

export async function listFiles(backpackDir: string) {
    const files = await getStoredFilesWithTimestamp(backpackDir);
    new BackpackTable(files).render();
}

export function deleteFile(filename: string, backpackDir: string) {
    fs.unlinkSync(path.join(backpackDir, filename));
}

export async function deleteIndex(index: number, backpackDir: string) {
    const files = await getStoredFilesWithTimestamp(backpackDir);
    const filename = files[files.length - index].name;
    deleteFile(filename, backpackDir);
}