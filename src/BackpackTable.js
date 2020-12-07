import {timeSince} from "./utils.js";
import Table from "tty-table";

export default class BackpackTable {
    constructor(files) {
        this.files = files;
    }

    render() {
        const rows = [];
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