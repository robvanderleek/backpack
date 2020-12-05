import {deleteFile, deleteIndex, getFileType, getStoredFiles, importFile} from "../src/backpack.js";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {afterEach, beforeEach, test} from "@jest/globals";
import {removeFolder} from "./test-utils.js";
import readChunk from "read-chunk";
import tmp from "tmp";

let backpackFolder;

beforeEach(() => {
    backpackFolder = fs.mkdtempSync(path.join(os.tmpdir(), 'backpack-'));
})

afterEach(() => {
    if (backpackFolder && backpackFolder.startsWith(os.tmpdir())) {
        removeFolder(backpackFolder);
    }
})

function createFileInBackpack(filename, content = '') {
    fs.writeFileSync(path.join(backpackFolder, filename), content);
}

function createStdinFileInBackpack(content) {
    const filename = `stdin-${new Date().toISOString()}`;
    createFileInBackpack(filename, content);
}

function createTempFile(content) {
    const tmpObj = tmp.fileSync();
    fs.writeFileSync(tmpObj.name, content);
    return tmpObj.name;
}

test('get stored files, empty backpack', async () => {
    const result = await getStoredFiles(backpackFolder);

    expect(result).toHaveLength(0);
});

test('get stored files, single file in backpack', async () => {
    createFileInBackpack('noot.txt');

    const result = await getStoredFiles(backpackFolder);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('noot.txt');
});

test('delete file by name', async () => {
    createFileInBackpack('noot.txt');

    let result = await getStoredFiles(backpackFolder);

    expect(result).toHaveLength(1);

    deleteFile('noot.txt', backpackFolder);

    result = await getStoredFiles(backpackFolder);

    expect(result).toHaveLength(0);
});

test('delete file by index', async () => {
    createFileInBackpack('noot.txt');

    await deleteIndex(1, backpackFolder);

    const result = await getStoredFiles(backpackFolder);

    expect(result).toHaveLength(0);
});

test('delete stdin file by index', async () => {
    createStdinFileInBackpack('Hello world');

    await deleteIndex(1, backpackFolder);

    const result = await getStoredFiles(backpackFolder);

    expect(result).toHaveLength(0);
});

test('get file-type from file chunk', async () => {
    let result = await getFileType(Buffer.from('Hello world', 'utf8'));

    expect(result).toBe('text/plain');

    const chunk = readChunk.sync(path.join(__dirname, 'respect.gif'), 0, 60);

    result = await getFileType(chunk);

    expect(result).toBe('image/gif');
});

test('import file into backpack',async () => {
    const tmpFile = createTempFile('Hello world');

    importFile(tmpFile, backpackFolder);

    const result = await getStoredFiles(backpackFolder);

    expect(result).toHaveLength(1);
});

test('import file into backpack, file does not exist',async () => {
    importFile('thisfiledoesnotexist', backpackFolder);

    const result = await getStoredFiles(backpackFolder);

    expect(result).toHaveLength(0);
});