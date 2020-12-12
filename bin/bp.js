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
import {AuthenticationDetails, CognitoUserPool, CognitoUser} from 'amazon-cognito-identity-js';
import AWS from 'aws-sdk';

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

// (async () => {
//     program.parse();
//     const args = process.argv.slice(2);
//     await run(program, args);
// })();

function errorHandler(err) {
    console.log('Failure: ' + err.message);
}

function showAttributes(user) {
    user.getUserAttributes(function (err, result) {
        if (err) {
            errorHandler(err);
            return;
        }
        for (let i = 0; i < result.length; i++) {
            console.log(
                'attribute ' + result[i].getName() + ' has value ' + result[i].getValue()
            );
        }
    });
}

function getCognitoUser() {
    const authData = {Username: 'robvanderleek', Password: 'H3lloW0rld'};
    const authDetails = new AuthenticationDetails(authData);
    const poolData = {UserPoolId: 'eu-central-1_EWy5b91uF', ClientId: '2879vcvlmajpsacm2vipefkl6n'};
    const userPool = new CognitoUserPool(poolData);
    const userData = {Username: 'robvanderleek', Pool: userPool};
    const user = new CognitoUser(userData);
    return [user, authDetails];
}

function getCognitoCredentials(authenticatedUser) {
    const awsConfig = AWS.config;
    awsConfig.update({region: 'eu-central-1'});
    const cognitoCredentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: 'eu-central-1:f4a41ad4-45d6-436a-9435-255e0888a555',
        Logins: {
            'cognito-idp.eu-central-1.amazonaws.com/eu-central-1_EWy5b91uF': authenticatedUser.getIdToken().getJwtToken(),
        },
    });
    awsConfig.update({credentials: cognitoCredentials});
    return cognitoCredentials;
}

const [user, authDetails] = getCognitoUser();
user.authenticateUser(authDetails, {
    onSuccess: (result) => {
        const cognitoCredentials = getCognitoCredentials(result);
        cognitoCredentials.refresh(error => {
            if (error) {
                errorHandler(error);
            } else {
                // Instantiate aws sdk service objects now that the credentials have been updated.
                // example: var s3 = new AWS.S3();
                console.log('Successfully gained AWS credentials!');
                const identityId = cognitoCredentials.data.IdentityId;
                // const identityId = '92d4c7bd-d1cd-44ee-9a50-64eeebb5cbb9';
                // const identityId = 'fc17322d-695e-4ce5-bfe1-58fa21d2d39d';
                console.log(identityId);
                const s3 = new AWS.S3();
                const params = {
                    Bucket: "backpack.app",
                    Key: `cognito/backpack/${identityId}/test.json`,
                    Body: '{"hello": "world"}',
                    ContentType: "application/json"
                };
                s3.putObject(params, (err) => {
                    if (err) {
                        errorHandler(err);
                    } else {
                        console.log('Object stored on S3!');
                    }
                });
            }
        });
    }, onFailure: errorHandler, newPasswordRequired: (userAttributes) => {
        delete userAttributes.email_verified;
        user.completeNewPasswordChallenge('H3lloW0rld', userAttributes, {
            onFailure: errorHandler
        });
        console.log('DONE!');
    }
});
