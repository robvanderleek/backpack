#!/usr/bin/env node
import {program} from "commander";
import {
    deleteIndex,
    exportFile,
    exportToStdout,
    FILE_TYPE_TEXT_PLAIN,
    getBackpackFolder,
    getFilename,
    getFileType,
    getStoredFiles,
    importFile,
    importFromStdin,
    listFiles
} from "../src/backpack.js";
import {isNumber} from "../src/utils.js";
import path from "path";
import open from 'open';

const backpackFolder = getBackpackFolder();

program.version('0.0.1');
program.option('-l, --list', 'list items in backpack');
program.option('-i, --import <filename>', 'put in backpack');
program.option('-e, --export <index>', 'get from backpack');
program.option('-d, --delete <index>', 'delete from backpack');
program.arguments('[index]');
program.on('--help', () => {
    console.log('');
    console.log('Without arguments all files in your backpack will be listed:');
    console.log('  $ bp');
    console.log('');
    console.log('Select items from your backpack by index:');
    console.log('  $ bp 10');
    console.log('');
    console.log('You can also stream data to your backpack:');
    console.log('  $ bp < some-file.xyz');
    console.log('');
    console.log(`Your backpack folder is: ${backpackFolder}`);
});

program.parse();
const args = process.argv.slice(2);

async function run(program, args) {
    if (program.import && args.length === 2) {
        importFile(program.import, backpackFolder);
    } else if (isNumber(program.export) && args.length === 2) {
        const filename = await getFilename(program.export, backpackFolder);
        exportFile(filename, backpackFolder);
    } else if (program.list && args.length === 1) {
        await listFiles(backpackFolder);
    } else if (isNumber(program.delete) && args.length === 2) {
        const index = parseInt(program.delete);
        await deleteIndex(index, backpackFolder);
    } else if (args.length === 1 && !isNaN(args[0])) {
        const index = parseInt(args[0]);
        const files = await getStoredFiles(backpackFolder);
        const file = files[files.length - index];
        const filename = file.name;
        const fileType = await getFileType(filename, backpackFolder);
        if (fileType === FILE_TYPE_TEXT_PLAIN) {
            exportToStdout(filename, backpackFolder);
        } else {
            await open(path.join(backpackFolder, filename));
        }
    } else if (!process.stdin.isTTY) {
        importFromStdin(backpackFolder);
    } else {
        await listFiles(backpackFolder);
    }
}

(async () => {
    await run(program, args);
})();