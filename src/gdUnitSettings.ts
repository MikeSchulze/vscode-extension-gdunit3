import * as fs from 'fs';
import {
    commands, workspace
} from 'vscode';
import { Logger } from './extension';
import { LogLevel } from './Logger';


export class GdUnitSettings {

    public static verifySettings(): boolean {
        const godotExecutable = this.godotExecutable()

        if (!fs.existsSync(godotExecutable)) {
            Logger.warn(`The configured godot executable '${godotExecutable}' can't be found.`);
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

    public static logLevel(): LogLevel {
        const level = workspace.getConfiguration('gdunit3').get('logLevel') as keyof typeof LogLevel;
        return LogLevel[level];
    }

    public static async showSettings(): Promise<void> {
        await commands.executeCommand('workbench.action.openSettings', `@ext:mikeschulze.gdunit3`);
    }
}