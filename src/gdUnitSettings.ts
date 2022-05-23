import * as fs from 'fs';
import {
    commands, OutputChannel, workspace
} from 'vscode';


export class GdUnitSettings {

    public static verifySettings(terminal: OutputChannel): boolean {
        const godotExecutable = this.godotExecutable()

        if (!fs.existsSync(godotExecutable)) {
            terminal.appendLine(`The configured godot executable '${godotExecutable}' can't be found.`);
            this.showSettings();
            return false;
        }

        return true;
    }

    public static godotExecutable(): string {
        return workspace.getConfiguration('gdunit3').get('godotExecutable') as string;
    }

    public static serverPort(): number {
        return workspace.getConfiguration('gdunit3.server').get('port') as number;
    }

    public static debugPort(): number {
        return workspace.getConfiguration('gdunit3.debuger').get('port') as number;
    }

    public static async showSettings(): Promise<void> {
        await commands.executeCommand('workbench.action.openSettings', `@ext:mikeschulze.gdunit3`);
    }
}