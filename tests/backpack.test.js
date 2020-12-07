import {
    deleteFile,
    deleteIndex,
    FILE_TYPE_DIRECTORY,
    FILE_TYPE_TEXT_PLAIN,
    getFileType,
    getFileTypeFromChunk,
    getStoredFiles,
    importFile
} from "../src/backpack.js";
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

function createTempDir() {
    return tmp.dirSync().name;
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
    let result = await getFileTypeFromChunk(Buffer.from('Hello world', 'utf8'));

    expect(result).toBe('text/plain');

    const chunk = readChunk.sync(path.join(__dirname, 'respect.gif'), 0, 60);

    result = await getFileTypeFromChunk(chunk);

    expect(result).toBe('image/gif');
});

test('get file type from path', async () => {
    let fullPath = path.join(__dirname, 'respect.gif');
    let data = fs.readFileSync(fullPath);
    createFileInBackpack('respect.gif', data);

    let result = await getFileType('respect.gif', backpackFolder);

    expect(result).toBe('image/gif');

    fullPath = path.join(__dirname, 'sample.txt');
    data = fs.readFileSync(fullPath);
    createFileInBackpack('sample.txt', data);

    result = await getFileType('sample.txt', backpackFolder);

    expect(result).toBe(FILE_TYPE_TEXT_PLAIN);
});

test('get file type from directory', async () => {
    const tmpDir = createTempDir();
    const dirName = path.basename(tmpDir);

    importFile(tmpDir, backpackFolder);

    const result = await getFileType(dirName, backpackFolder);

    expect(result).toBe(FILE_TYPE_DIRECTORY);
});

test('import file into backpack', async () => {
    const tmpFile = createTempFile('Hello world');

    importFile(tmpFile, backpackFolder);

    const result = await getStoredFiles(backpackFolder);

    expect(result).toHaveLength(1);
});

test('import file into backpack, file does not exist', async () => {
    importFile('thisfiledoesnotexist', backpackFolder);

    const result = await getStoredFiles(backpackFolder);

    expect(result).toHaveLength(0);
});