#!/usr/bin/env node
const fs = require('fs');
const os = require('os');
const path = require('path');

function usage() {
    console.log(
        'Backpack usage:\n' +
        '  List files in backpack: bp -l\n' +
        '  Put in backpack: bp -i <filename>\n' +
        '  Get from backpack: bp -e <filename>\n' +
        '  Stream to backpack: bp < some-file.xyz\n' +
        '  Stream from backpack: bp <index>\n');
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

function importFromStdin(backpackDir) {
    const filename = `stdin-${new Date().toISOString()}`;
    const file = path.join(backpackDir, filename);
    process.stdin.pipe(fs.createWriteStream(file));
}

function exportFile(filename, backpackDir) {
    fs.renameSync(path.join(backpackDir, filename), filename);
}

function exportToStdout(filename, backpackDir) {
    fs.createReadStream(path.join(backpackDir, filename)).pipe(process.stdout);
}

function getStoredFiles(backpackDir) {
    const files = fs.readdirSync(backpackDir);
    files.sort((a, b) => fs.statSync(path.join(backpackDir, b)).ctime.getTime() -
        fs.statSync(path.join(backpackDir, a)).ctime.getTime()
    );
    return files;
}

function listFiles(backpackDir) {
    const files = getStoredFiles(backpackDir);
    files.forEach((f, i) => {
        const index = files.length - i;
        console.log(`${index}: ${f}`);
    });
}

const backpackDir = initializeBackpackDir();
const args = process.argv.slice(2);
if (args.length === 2 && args[0] === '-i') {
    importFile(args[1], backpackDir);
} else if (args.length === 2 && args[0] === '-e') {
    exportFile(args[1], backpackDir);
} else if (args.length === 1 && args[0] === '-l') {
    listFiles(backpackDir);
} else if (args.length === 1 && !isNaN(args[0])) {
    const index = parseInt(args[0]);
    const files = getStoredFiles(backpackDir);
    const filename = files[files.length - index];
    exportToStdout(filename, backpackDir);
} else if (!process.stdin.isTTY) {
    importFromStdin(backpackDir);
} else {
    usage();
}
