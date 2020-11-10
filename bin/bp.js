#!/usr/bin/env node
import {program} from "commander";
import {
    deleteIndex,
    exportFile,
    exportToStdout,
    getStoredFiles,
    importFile,
    importFromStdin,
    initializeBackpackDir,
    listFiles
} from "../src/backpack.js";

program.version('0.0.1');
program.option('-l, --list', 'list items in backpack');
program.option('-i, --import <filename>', 'put in backpack');
program.option('-e, --export <filename>', 'get from backpack');
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
});

program.parse();

const backpackDir = initializeBackpackDir();
const args = process.argv.slice(2);
if (program.import && args.length === 2) {
    importFile(program.import, backpackDir);
} else if (program.export && args.length === 2) {
    exportFile(program.export, backpackDir);
} else if (program.list && args.length === 1) {
    listFiles(backpackDir);
} else if (program.delete && args.length === 2 && !isNaN(program.delete)) {
    const index = parseInt(program.delete);
    deleteIndex(index, backpackDir);
} else if (args.length === 1 && !isNaN(args[0])) {
    (async () => {
        const index = parseInt(args[0]);
        const files = await getStoredFiles(backpackDir);
        const filename = files[files.length - index].name;
        exportToStdout(filename, backpackDir);
    })();
} else if (!process.stdin.isTTY) {
    importFromStdin(backpackDir);
} else {
    listFiles(backpackDir);
}