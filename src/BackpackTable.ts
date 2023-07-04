import {timeSince} from "./utils.js";
import Table from "tty-table";
import {BackpackFile} from "./backpack.js";

export default class BackpackTable {
    private files: Array<BackpackFile>;

    constructor(files: Array<BackpackFile>) {
        this.files = files;
    }

    render() {
        const rows: any[] = [];
        this.files.forEach((f, i) => {
            const index = this.files.length - i;
            rows.push([index, timeSince(f.birthTime), f.content]);
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
            truncate: '...',
        });
        const output = table.render().substring(1);
        process.stdout.write(output);
    }
}