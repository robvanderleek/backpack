#!/usr/bin/env node

import {
    deleteIndex,
    exportFile,
    exportToStdout,
    getStoredFilesWithTimestamp,
    importFile,
    importFromStdin,
    initializeBackpackDir,
    listFiles
} from "../src/backpack.js";

function usage() {
    console.log(
        'Backpack usage:\n' +
        '  List files in backpack: bp or bp -l\n' +
        '  Put in backpack: bp -i <filename>\n' +
        '  Get from backpack: bp -e <filename>\n' +
        '  Stream to backpack: bp < some-file.xyz\n' +
        '  Stream from backpack: bp <index>\n' +
        '  Delete from backpack: bp -d <index>\n' +
        '  Show this help: bp -h');
}

const backpackDir = initializeBackpackDir();
const args = process.argv.slice(2);
if (args.length === 2 && args[0] === '-i') {
    importFile(args[1], backpackDir);
} else if (args.length === 2 && args[0] === '-e') {
    exportFile(args[1], backpackDir);
} else if (args.length === 1 && args[0] === '-l') {
    listFiles(backpackDir);
} else if (args.length === 2 && args[0] === '-d' && !isNaN(args[1])) {
    const index = parseInt(args[1]);
    deleteIndex(index, backpackDir);
} else if (args.length === 1 && !isNaN(args[0])) {
    const index = parseInt(args[0]);
    const files = getStoredFilesWithTimestamp(backpackDir);
    const filename = files[files.length - index][0];
    exportToStdout(filename, backpackDir);
} else if (args.length === 1 && args[0] === '-h') {
    usage();
} else if (!process.stdin.isTTY) {
    importFromStdin(backpackDir);
} else {
    listFiles(backpackDir);
}