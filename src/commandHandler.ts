import {
    commands, Disposable, Event, EventEmitter, ExtensionContext, FileType, TextEditor, Uri, workspace
} from 'vscode';
import { GdUnitEvent } from './gdUnitEvent';
import { GdUnitSettings } from './gdUnitSettings';
import { TestRunner } from './testRunner';
import { TestRunnerConfiguration } from './testRunnerConfiguration';
import { TestScanner } from './testScanner';


export class CommandHandler implements Disposable {

    private _onGdUnitEvent: EventEmitter<GdUnitEvent> = new EventEmitter<GdUnitEvent>();
    readonly onGdUnitEvent: Event<GdUnitEvent> = this._onGdUnitEvent.event;

    private readonly testScanner: TestScanner;
    private readonly testRunner: TestRunner;

    constructor(context: ExtensionContext) {
        this.testScanner = new TestScanner();
        this.testRunner = new TestRunner(workspace.getConfiguration("gdunit-test-explorer"));
        context.subscriptions.push(this.testScanner);
        this.registerCommnads(context);
    }

    public async registerCommnads(context: ExtensionContext) {
        context.subscriptions.push(
            // document commants
            commands.registerTextEditorCommand("cmd-gdUnit3.document.run", async (editor: TextEditor) => await this.run(editor)),
            commands.registerTextEditorCommand("cmd-gdUnit3.document.runAll", async (editor: TextEditor) => await this.runAll(editor)),
            commands.registerTextEditorCommand("cmd-gdUnit3.document.debug", async (editor: TextEditor) => await this.debug(editor)),
            commands.registerTextEditorCommand("cmd-gdUnit3.document.debugAll", async (editor: TextEditor) => await this.debugAll(editor)),
            commands.registerTextEditorCommand("cmd-gdUnit3.document.addTestCase", async (editor: TextEditor) => await this.addTestCase(editor)),
            // explorer commands
            commands.registerCommand("cmd-gdUnit3.explorer.run", async (uri: Uri) => await this.runSelected(uri)),
            commands.registerCommand("cmd-gdUnit3.explorer.debug", async (uri: Uri) => await this.debugSelected(uri)),
            // toolbar            
            commands.registerCommand('cmd-gdUnit3.help', () => this.showHelp()),
            commands.registerCommand('cmd-gdUnit3.settings', () => GdUnitSettings.showSettings()),
            commands.registerCommand('cmd-gdUnit3.reRun', async () => await this.reRun()),
            commands.registerCommand('cmd-gdUnit3.reRunDebug', async () => await this.reRunDebug()),
            commands.registerCommand('cmd-gdUnit3.stop', () => this.stopRunning())
        );
        // activate context menues
        commands.executeCommand('setContext', 'cmd-gdUnit3:is-ready', true);
    }

    public static setStateRunning(isRunning: boolean): void {
        commands.executeCommand('setContext', 'cmd-gdUnit3:is-running', isRunning);
    }

    private stopRunning() {
        this._onGdUnitEvent.fire(GdUnitEvent.STOP());
        this.testRunner.stop()
    }

    private async run(editor: TextEditor): Promise<void> {
        CommandHandler.setStateRunning(true);
        await this.testScanner.scanDocument(new TestRunnerConfiguration(), editor.document, editor.selection.start)
            .then(async config => await this.testRunner.run(config))
            .catch(console.error);
    }

    private async reRun(): Promise<void> {
        CommandHandler.setStateRunning(true);
        await this.testRunner.reRun();
    }

    private async runAll(editor: TextEditor): Promise<void> {
        CommandHandler.setStateRunning(true);
        await this.testScanner.scanDocument(new TestRunnerConfiguration(), editor.document)
            .then(async config => await this.testRunner.run(config))
            .catch(console.error);
    }

    private async reRunDebug(): Promise<void> {
        CommandHandler.setStateRunning(true);
        await this.testRunner.reRunDebug();
    }

    private async debug(editor: TextEditor): Promise<void> {
        CommandHandler.setStateRunning(true);
        await this.testScanner.scanDocument(new TestRunnerConfiguration(), editor.document, editor.selection.start)
            .then(async config => await this.testRunner.debug(config))
            .catch(console.error);
    }

    private async debugAll(editor: TextEditor): Promise<void> {
        CommandHandler.setStateRunning(true);
        await this.testScanner.scanDocument(new TestRunnerConfiguration(), editor.document)
            .then(async config => await this.testRunner.debug(config))
            .catch(console.error);
    }

    private async runSelected(uri: Uri): Promise<void> {
        CommandHandler.setStateRunning(true);
        const isDirectory = (await workspace.fs.stat(uri)).type == FileType.Directory;
        if (isDirectory) {
            await this.testScanner.scanDirectory(new TestRunnerConfiguration(), uri)
                .then(async config => await this.testRunner.run(config))
                .catch(console.error);
        } else {
            await workspace.openTextDocument(uri)
                .then(async document => await this.testScanner.scanDocument(new TestRunnerConfiguration(), document))
                .then(async config => await this.testRunner.run(config));
        }
    }

    private async debugSelected(uri: Uri): Promise<void> {
        CommandHandler.setStateRunning(true);
        const isDirectory = (await workspace.fs.stat(uri)).type == FileType.Directory;
        if (isDirectory) {
            await this.testScanner.scanDirectory(new TestRunnerConfiguration(), uri)
                .then(async config => await this.testRunner.debug(config))
                .catch(console.error);
        } else {
            await workspace.openTextDocument(uri)
                .then(async document => await this.testScanner.scanDocument(new TestRunnerConfiguration(), document))
                .then(async config => await this.testRunner.debug(config));
        }
    }

    private async addTestCase(editor: TextEditor): Promise<void> {
        await this.testRunner.createTestCase(editor.document.fileName, editor.selection.start);
        return Promise.resolve();
    }

    private showHelp(): void {
        commands.executeCommand('vscode.open', Uri.parse('https://mikeschulze.github.io/gdUnit3/'));
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    dispose() {
    }
}
