import * as cp from "child_process";
import { debug, OutputChannel, Position, Range, Uri, ViewColumn, window, workspace, WorkspaceConfiguration, WorkspaceFolder } from 'vscode';
import { CommandHandler } from './commandHandler';
import { GdUnitSettings } from './gdUnitSettings';
import { TestRunnerConfiguration } from './testRunnerConfiguration';
import path = require("path");

export class TestRunner {
    private _workspaceFolder: WorkspaceFolder | undefined = undefined;
    private readonly projectUri: Uri;
    private _buildProcess: cp.ChildProcess | undefined;
    private _runnerProcess: cp.ChildProcess | undefined;
    private _console: OutputChannel;


    constructor(public readonly config: WorkspaceConfiguration) {
        const folders = workspace.workspaceFolders;
        this.projectUri = folders ? folders[0].uri : Uri.file("invalid");
        this._workspaceFolder = folders ? folders[0] : undefined;
        this._console = window.createOutputChannel("gdUnit3 Console");
        // if (folder == undefined) {
        //     console.error("Undefined workspace folder, can't save runner configuration.")
        //     return;
        // }
    }

    public async run(config: TestRunnerConfiguration): Promise<void> {
        config.save(this.projectUri);
        await this.buildProject("Release")
            .then(() => this.runCommand());
    }

    public async reRun(): Promise<void> {
        await this.buildProject("Release")
            .then(() => this.runCommand());
    }

    public async debug(config: TestRunnerConfiguration): Promise<void> {
        config.save(this.projectUri);
        await this.buildProject("Debug")
            .then(() => debug.startDebugging(this._workspaceFolder, this.debugConfig()))
            .then(() => this.runCommand(true));
    }

    public async reRunDebug(): Promise<void> {
        await this.buildProject("Debug")
            .then(() => debug.startDebugging(this._workspaceFolder, this.debugConfig()))
            .then(() => this.runCommand(true));
    }

    public async stop(): Promise<void> {
        CommandHandler.setStateRunning(false);
        this._buildProcess?.kill();
        this._runnerProcess?.kill();
    }

    private async runCommand(debug = false): Promise<void> {
        if (!GdUnitSettings.verifySettings(this._console)) {
            CommandHandler.setStateRunning(false);
            return;
        }
        const args = [
            "--path",
            `${this._workspaceFolder?.uri.fsPath}`,
            `res://addons/gdUnit3/src/core/GdUnitRunner.tscn`];//,
        //`--no-window`];
        if (debug) {
            args.splice(2, 0, '-d');
        }
        this._console.show();
        this._console.appendLine(`Run Test's ...`);
        this._runnerProcess = cp.spawn(GdUnitSettings.godotExecutable(), args);
        if (this._runnerProcess) {
            this._runnerProcess.stdout?.on('data', (stream) => this._console.append(`${stream}`));
            this._runnerProcess.stderr?.on('data', (stream) => this._console.append(`ERR: ${stream}`));
            this._runnerProcess.on('close', (code, signal) => this._console.append(`Process ends with: ${code}, signal: ${signal} `));
        }
    }

    public async createTestCase(fileName: string, position: Position): Promise<void> {
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
            this._console.show();
            this._console.appendLine(`Generate Test Case ...`);

            if (process) {
                process.stdout?.on('data', (stream) => {
                    const line = `${stream}`;
                    if (line.startsWith('JSON_RESULT:')) {
                        result = rExp.exec(line)?.at(2);
                    }
                });
                process.stderr?.on('data', (stream) => console.debug(`ERR: ${stream}`));
                process.on('close', async (code, signal) => {
                    if (code == 0 && result != undefined) {
                        type Test = { line: number; path: string; }
                        type Response = { TestCases: Array<Test>; }
                        const response: Response = JSON.parse(result);
                        response.TestCases.forEach(async testCase => {
                            this._console.appendLine(`Added Test Case ${testCase.path}:${testCase.line}`);
                            await workspace.openTextDocument(Uri.file(testCase.path))
                                .then(document => window.showTextDocument(document, { viewColumn: ViewColumn.Beside, selection: new Range(testCase.line, 0, testCase.line, 0) }));
                        });
                    } else {
                        this._console.appendLine(`Can't generate test case! ${code} ${signal}`);
                    }
                });
            }
        })
    }

    private async buildProject(target: string): Promise<void> {
        this._console.appendLine(`Build ...${target}`);
        const projectFile = await this.findProject();
        const fullCommand = `dotnet build ${projectFile} -verbosity:m`; // -p:Configuration=${target}
        this._buildProcess = cp.exec(fullCommand, (err) => {
            if (err) {
                this._console.append(`ERROR: ${err}`);
            }
        });
        this._buildProcess.stdout?.on('data', (stream) => this._console.append(`${stream}`));
        this._buildProcess.stderr?.on('data', (stream) => this._console.append(`ERR: ${stream}`));
        await new Promise((resolve) => {
            this._buildProcess?.on('close', resolve)
        })
        this._console.appendLine(``);
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
