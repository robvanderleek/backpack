import {deleteFile, getStoredFilesWithTimestamp} from "../src/backpack";
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

function createFile(filename) {
    fs.writeFileSync(path.join(backpackFolder, filename), '');
}

test('get stored files, empty backpack', () => {
    const result = getStoredFilesWithTimestamp(backpackFolder);

    expect(result).toHaveLength(0);
});

test('get stored files, single file in backpack', () => {
    createFile('noot.txt');

    const result = getStoredFilesWithTimestamp(backpackFolder);

    expect(result).toHaveLength(1);
});

test('delete file', () => {
    createFile('noot.txt');

    let result = getStoredFilesWithTimestamp(backpackFolder);

    expect(result).toHaveLength(1);

    deleteFile('noot.txt', backpackFolder);

    result = getStoredFilesWithTimestamp(backpackFolder);

    expect(result).toHaveLength(0);
});



