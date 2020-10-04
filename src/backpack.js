import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import Table from "tty-table";
import {timeSince} from "./utils.js";

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

export function importFile(filename, backpackDir) {
    fs.renameSync(filename, path.join(backpackDir, filename));
}

export function importFromStdin(backpackDir) {
    const filename = `stdin-${new Date().toISOString()}`;
    const file = path.join(backpackDir, filename);
    process.stdin.pipe(fs.createWriteStream(file));
}

export function exportFile(filename, backpackDir) {
    fs.renameSync(path.join(backpackDir, filename), filename);
}

export function exportToStdout(filename, backpackDir) {
    fs.createReadStream(path.join(backpackDir, filename)).pipe(process.stdout);
}

export function getStoredFilesWithTimestamp(backpackDir) {
    const files = fs.readdirSync(backpackDir);
    const filesWithTimestamp = files.map(f => [f, fs.statSync(path.join(backpackDir, f)).ctime.getTime()]);
    filesWithTimestamp.sort((a, b) => b[1] - a[1]);
    return filesWithTimestamp;
}

export function listFiles(backpackDir) {
    const rows = [];
    const files = getStoredFilesWithTimestamp(backpackDir);
    files.forEach((f, i) => {
        const index = files.length - i;
        rows.push([index, timeSince(f[1]), f[0]]);
    });
    const header = [{
        value: '#',
        align: 'right',
        headerAlign: 'right',
        headerColor: 'bold'
    }, {
        value: 'Age',
        align: 'left',
        headerAlign: 'left',
        headerColor: 'bold',
    }, {
        value: 'Content',
        align: 'left',
        headerAlign: 'left',
        headerColor: 'bold',
    }];
    const table = Table(header, rows, {
        borderStyle: 'none',
        compact: true,
        align: 'left',
        paddingTop: 0,
        // paddingLeft: 0,
        paddingBottom: 0,
        paddingRight: 0,
        marginTop: 0,
        marginLeft: 0,
        marginBottom: 0,
        marginRight: 0
    });
    const output = table.render().substring(1);
    process.stdout.write(output);
}

export function deleteFile(filename, backpackDir) {
    fs.unlinkSync(path.join(backpackDir, filename));
}