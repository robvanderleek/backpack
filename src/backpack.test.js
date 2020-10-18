import {deleteFile, deleteIndex, getStoredFiles} from "./backpack";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {afterEach, beforeEach, test} from "@jest/globals";
import {removeFolder} from "./test-utils";

let backpackFolder;

beforeEach(() => {
    backpackFolder = fs.mkdtempSync(path.join(os.tmpdir(), 'backpack-'));
})

afterEach(() => {
    if (backpackFolder && backpackFolder.startsWith(os.tmpdir())) {
        removeFolder(backpackFolder);
    }
})

function createFile(filename, content = '') {
    fs.writeFileSync(path.join(backpackFolder, filename), content);
}

function createStdinFile(content) {
    const filename = `stdin-${new Date().toISOString()}`;
    createFile(filename, content);
}

test('get stored files, empty backpack', async () => {
    const result = await getStoredFiles(backpackFolder);

    expect(result).toHaveLength(0);
});

test('get stored files, single file in backpack', async () => {
    createFile('noot.txt');

    const result = await getStoredFiles(backpackFolder);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('noot.txt');
});

test('delete file by name', async () => {
    createFile('noot.txt');

    let result = await getStoredFiles(backpackFolder);

    expect(result).toHaveLength(1);

    deleteFile('noot.txt', backpackFolder);

    result = await getStoredFiles(backpackFolder);

    expect(result).toHaveLength(0);
});

test('delete file by index', async () => {
    createFile('noot.txt');

    await deleteIndex(1, backpackFolder);

    const result = await getStoredFiles(backpackFolder);

    expect(result).toHaveLength(0);
});

test('delete stdin file by index', async () => {
    createStdinFile('Hello world');

    await deleteIndex(1, backpackFolder);

    const result = await getStoredFiles(backpackFolder);

    expect(result).toHaveLength(0);
});