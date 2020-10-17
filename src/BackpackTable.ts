import {timeSince} from "./utils";
import Table from "tty-table";
import {Item} from "./entities/Item";

export default class BackpackTable {
    private files: Array<Item>;

    constructor(files: Array<Item>) {
        this.files = files;
    }

    render() {
        const rows: Array<Array<any>> = [];
        this.files.forEach((f, i) => {
            const index = this.files.length - i;
            rows.push([index, timeSince(f.ctime), f.ctime]);
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
        // @ts-ignore
        const table = Table(header, rows, {
            borderStyle: 'none',
            compact: true,
            truncate: '...',
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
}