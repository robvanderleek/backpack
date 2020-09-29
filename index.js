#!/usr/bin/env node
const fs = require('fs');
const os = require('os');
const path = require('path');

function usage() {
    console.log(
        'Backpack usage:\n' +
        '  Put in backpack: bp -i <filename>\n' +
        '  Get from backpack: bp -e <filename>\n')
}

function initializeBackpackDir() {
    const homeDir = os.homedir();
    if (!homeDir) {
        console.log('Could not resolve home directory');
        process.exit(1);
    }
    const backpackDir = path.join(homeDir, '.local', 'share', 'backpack');
    fs.mkdirSync(backpackDir, {recursive: true});
    return backpackDir;
}

function importFile(filename, backpackDir) {
    fs.renameSync(filename, path.join(backpackDir, filename));
}

function exportFile(filename, backpackDir) {
    fs.renameSync(path.join(backpackDir, filename), filename);
}

const backpackDir = initializeBackpackDir();
const args = process.argv.slice(2);
if (args.length === 2 && args[0] === '-i') {
    importFile(args[1], backpackDir);
} else if (args.length === 2 && args[0] === '-e') {
    exportFile(args[1], backpackDir);
} else {
    usage();
}
