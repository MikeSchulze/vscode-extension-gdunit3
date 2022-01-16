import * as path from 'path';
import {
    Uri
} from 'vscode';
import { GdUnitSettings } from './gdUnitSettings';

let fs = require('fs');

export class TestRunnerConfiguration {
    readonly CONFIG_VERSION = '2.0';
    readonly EXIT_FAIL_FAST = 'exit_on_first_fail';
    readonly CONFIG_FILE = 'GdUnitRunner.cfg';

    private _included: Map<string, Array<string>> = new Map();

    public clear(): TestRunnerConfiguration {
        this._included.clear();
        return this;
    }

    public addTestCase(resourcePath: string, test_name: string): TestRunnerConfiguration {
        if (!this._included.has(resourcePath)) {
            this._included.set(resourcePath, [test_name]);
        } else {
            this._included.get(resourcePath)?.concat(test_name);
        }
        return this;
    }

    public addTestCases(resourcePath: string, testNames: string[]): TestRunnerConfiguration {
        this._included.set(resourcePath, testNames);
        return this;
    }

    private toGodotResourcePath(folder: Uri, resourcePath: string): string {
        var base = resourcePath.replace(folder.fsPath + "\\", "res://");
        return base.split(path.sep).join(path.posix.sep);
    }

    private toJson(folder: Uri): string {
        var included = Array.from(this._included.entries())
            .reduce((acc, [key, value]) => ({ ...acc, [this.toGodotResourcePath(folder, key)]: value }), {});

        var config = {
            version: `${this.CONFIG_VERSION}`,
            // a set of directories or testsuite paths as key and a optional set of testcases as values
            included: included,
            // a set of skipped directories or testsuite paths
            skipped: {},
            // the port of running test server for this session
            server_port: GdUnitSettings.serverPort()
        };
        return JSON.stringify(config, null, "\t");
    }

    public save(folder: Uri) {
        var jsonData = this.toJson(folder);
        var outputPath = path.resolve(folder.fsPath, this.CONFIG_FILE);
        fs.writeFile(outputPath, jsonData, function (err: String) {
            if (err) {
                return console.log(err);
            }
        });
        return outputPath;
    }

}