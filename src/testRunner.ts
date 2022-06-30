import * as cp from "child_process";
import { debug, Position, Range, Uri, ViewColumn, window, workspace, WorkspaceConfiguration, WorkspaceFolder } from 'vscode';
import { CommandHandler } from './commandHandler';
import { GdUnitSettings } from './gdUnitSettings';
import { TestRunnerConfiguration } from './testRunnerConfiguration';
import path = require("path");
import { Logger } from "./extension";


export class TestRunner {
    private _workspaceFolder: WorkspaceFolder | undefined = undefined;
    private readonly projectUri: Uri;
    private _buildProcess: cp.ChildProcess | undefined;
    private _runnerProcess: cp.ChildProcess | undefined;

    constructor(public readonly config: WorkspaceConfiguration) {
        const folders = workspace.workspaceFolders;
        this.projectUri = folders ? folders[0].uri : Uri.file("invalid");
        this._workspaceFolder = folders ? folders[0] : undefined;
        // if (folder == undefined) {
        //     Logger.error("Undefined workspace folder, can't save runner configuration.")
        //     return;
        // }
    }

    public async run(config: TestRunnerConfiguration): Promise<void> {
        config.save(this.projectUri);
        await this.buildProject("Release")
            .then(() => this.runCommand())
            .catch(e => Logger.error(e));
    }

    public async reRun(): Promise<void> {
        await this.buildProject("Release")
            .then(() => this.runCommand())
            .catch(e => Logger.error(e));
    }

    public async debug(config: TestRunnerConfiguration): Promise<void> {
        config.save(this.projectUri);
        await this.buildProject("Debug")
            .then(() => debug.startDebugging(this._workspaceFolder, this.debugConfig()), e => Logger.error(e))
            .then(() => this.runCommand(true))
            .catch(e => Logger.error(e));
    }

    public async reRunDebug(): Promise<void> {
        await this.buildProject("Debug")
            .then(() => debug.startDebugging(this._workspaceFolder, this.debugConfig()), e => Logger.error(e))
            .then(() => this.runCommand(true))
            .catch(e => Logger.error(e));
    }

    public async stop(): Promise<void> {
        CommandHandler.setStateRunning(false);
        this._buildProcess?.kill();
        this._runnerProcess?.kill();
    }

    private async runCommand(debug = false): Promise<void> {
        if (!GdUnitSettings.verifySettings()) {
            CommandHandler.setStateRunning(false);
            return;
        }
        const args = [
            "--path",
            `${this._workspaceFolder?.uri.fsPath}`,
            `res://addons/gdUnit3/src/core/GdUnitRunner.tscn`];
        if (debug) {
            args.splice(2, 0, '-d');
        }
        else {
            args.push(`--no-window`);
        }
        Logger.info(`Run Test's ...`);
        this._runnerProcess = cp.spawn(GdUnitSettings.godotExecutable(), args);
        if (this._runnerProcess) {
            this._runnerProcess.stdout?.on('data', stream => Logger.append(`${stream}`));
            this._runnerProcess.stderr?.on('data', stream => Logger.append(`ERR: ${stream}`));
            this._runnerProcess.on('close', (code, signal) => {
                Logger.info(`Run Test's finished.`);
                Logger.debug(`Process ends with: ${code}, signal: ${signal}`);
            })
        }
    }

    public async addTestCase(fileName: string, position: Position): Promise<void> {
        await this.buildProject("Release")
            .then((exitCode) => {
                if (exitCode == 0) this.createTestCase(fileName, position);
                else Logger.error(`Can't generate Test Case, build failed by exit code ${exitCode}`);
            });
    }

    private async createTestCase(fileName: string, position: Position): Promise<void> {
        const args = [
            "--path",
            `${this._workspaceFolder?.uri.fsPath}`,
            `--no-window`,
            `-s`, `res://addons/gdUnit3/bin/GdUnitBuildTool.gd`,
            `-scp`, fileName,
            `-scl`, position.line.toString()
        ];
        const process = cp.spawn(GdUnitSettings.godotExecutable(), args);
        await new Promise(() => {
            const rExp = new RegExp('^(JSON_RESULT:)({.*[}]$)', 'gms');
            let result: string | undefined;
            Logger.show();
            Logger.info(`Generate Test Case ...`);

            if (process) {
                process.stdout?.on('data', (stream) => {
                    const line = `${stream}`;
                    if (line.includes('JSON_RESULT:')) {
                        try {
                            const r = rExp.exec(line) as RegExpExecArray;
                            result = r[2];
                        }
                        catch (err) {
                            Logger.error(err);
                        }
                    }
                });
                process.stderr?.on('data', stream => Logger.error(`${stream}`));
                process.on('close', async (code) => {
                    if (code == 0 && result != undefined) {
                        type Test = { line: number; path: string; }
                        type Response = { TestCases: Array<Test>; }
                        const response: Response = JSON.parse(result);
                        response.TestCases.forEach(async testCase => {
                            Logger.info(`Added Test Case ${testCase.path}:${testCase.line}`);
                            await workspace.openTextDocument(Uri.file(testCase.path))
                                .then(document => window.showTextDocument(document, { viewColumn: ViewColumn.Beside, selection: new Range(testCase.line, 0, testCase.line, 0) }));
                        });
                    } else {
                        Logger.error(`Can't generate test case! Error Code: ${code}\nMessage: ${result}`);
                    }
                });
            }
        })
    }

    private async buildProject(target: string): Promise<number | null> {
        Logger.info(`Building ... ${target}`);
        const projectFile = await this.findProject();
        const fullCommand = `dotnet build ${projectFile} -verbosity:m`; // -p:Configuration=${target}
        this._buildProcess = cp.exec(fullCommand, err => Logger.error(err));
        this._buildProcess.stdout?.on('data', stream => Logger.append(`${stream}`));
        this._buildProcess.stderr?.on('data', e => Logger.error(e));
        await new Promise((resolve) => {
            this._buildProcess?.on('close', resolve)
        })
        return this._buildProcess.exitCode
    }

    private async findProject(): Promise<string> {
        const projectFile = await workspace.fs
            .readDirectory(this.projectUri)
            .then<string | undefined>(entries =>
                entries.filter(entry => entry[0].endsWith('.csproj')).map(e => e[0]).shift()
            );
        return path.join(this.projectUri.fsPath, projectFile ? projectFile : '');
    }

    private debugConfig() {
        return {
            "name": "Attach",
            "type": "mono",
            "request": "attach",
            "address": "localhost",
            "port": GdUnitSettings.debugPort()
        };
    }

}
