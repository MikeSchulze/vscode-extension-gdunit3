import * as cp from "child_process";
import { debug, OutputChannel, Uri, window, workspace, WorkspaceConfiguration, WorkspaceFolder } from 'vscode';
import { CommandHandler } from './commandHandler';
import { GdUnitSettings } from './gdUnitSettings';
import { TestRunnerConfiguration } from './testRunnerConfiguration';
import console = require('console');
import util = require('util');
const exec = util.promisify(require('child_process').exec);

export class TestRunner {
    private _workspaceFolder: WorkspaceFolder | undefined = undefined;
    private readonly projectUri: Uri;
    private _buildProcess: cp.ChildProcess | undefined;
    private _runnerProcess: cp.ChildProcess | undefined;
    private _console: OutputChannel;


    constructor(public readonly config: WorkspaceConfiguration) {
        let folders = workspace.workspaceFolders;
        this.projectUri = folders ? folders[0].uri : Uri.file("invalid");
        this._workspaceFolder = folders ? folders[0] : undefined;
        this._console = window.createOutputChannel("gdUnit3 Console");
        // if (folder == undefined) {
        //     console.error("Undefined workspace folder, can't save runner configuration.")
        //     return;
        // }
    }

    public async run(config: TestRunnerConfiguration): Promise<void> {
        var configPath = config.save(this.projectUri);
        await this.buildProject("Release")
            .then(() => this.runCommand());
    }

    public async reRun(): Promise<void> {
        await this.buildProject("Release")
            .then(() => this.runCommand());
    }

    public async debug(config: TestRunnerConfiguration): Promise<void> {
        var configPath = config.save(this.projectUri);

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



    private async runCommand(debug: boolean = false): Promise<any> {
        if (!GdUnitSettings.verifySettings(this._console)) {
            CommandHandler.setStateRunning(false);
            return;
        }
        let args = [
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

    private async buildProject_(target: string): Promise<any> {
        this._console.appendLine(``);
        this._console.appendLine(`Build ...`);
        let args = [
            "--path",
            `${this._workspaceFolder?.uri.fsPath}`,
            `--build-solutions`,
            `--no-window`,
            `-q`,
            `--quiet`];
        let process = cp.spawn(GdUnitSettings.godotExecutable(), args);
        process.stdout?.on('data', (stream) => this._console.append(`${stream}`));
        process.stderr?.on('data', (stream) => this._console.append(`ERR: ${stream}`));
        await new Promise((resolve) => {
            process.on('close', resolve)
        })
        this._console.appendLine(``);
    }

    private async buildProject(target: string): Promise<any> {
        this._console.appendLine(`Build ...`);
        let projectFile = await this.findProject();
        let fullCommand = `dotnet msbuild ${projectFile} -verbosity:m`; // -p:Configuration=${target}
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
        let projectFile = await workspace.fs
            .readDirectory(this.projectUri)
            .then<string | undefined>(entries =>
                entries.filter(entry => entry[0].endsWith('.csproj')).map(e => e[0]).shift()
            );
        return `${this.projectUri.fsPath}\\${projectFile}`;
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
