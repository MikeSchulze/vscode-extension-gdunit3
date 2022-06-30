import { window, workspace } from "vscode";
import { GdUnitSettings } from "./gdUnitSettings";

export enum LogLevel {
    NONE = 0,
    INFO = 1,
    WARNING = 2,
    ERROR = 3,
    DEBUG = 4,
    TRACE = 5,
    ALL = 6
}

export class GdUnit3Logger {
    private _log = window.createOutputChannel("GdUnit3 Explorer Console");
    private _level = LogLevel.ERROR;

    constructor() {
        this.setLevel(GdUnitSettings.logLevel());
        workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('gdunit3.logLevel')) {
                this.setLevel(GdUnitSettings.logLevel());
            }
        });
    }

    public setLevel(level: LogLevel): void {
        this._level = level;
    }

    public log(msg: string | null | unknown) {
        if (this._level > LogLevel.NONE && msg)
            this._log.appendLine(`${msg}`);
    }

    public error(msg?: string | null | unknown | Error) {
        if (this.isLevel(LogLevel.ERROR) && msg)
            if (msg instanceof Error) {
                this._log.appendLine(`[EXCEPTION]: ${msg.message}`);
                this._log.appendLine(`${msg.stack}`);
            }
            else
                this._log.appendLine(`[ERROR]: ${msg}`);
    }

    public warn(msg: string | null | unknown) {
        if (this.isLevel(LogLevel.WARNING) && msg)
            this._log.appendLine(`[WARN]: ${msg}`);
    }

    public info(msg: string | null | unknown) {
        if (this.isLevel(LogLevel.INFO) && msg)
            this._log.appendLine(`[INFO]: ${msg}`);
    }

    public debug(msg: string | null | unknown) {
        if (this.isLevel(LogLevel.DEBUG) && msg)
            this._log.appendLine(`[DEBUG]: ${msg}`);
    }

    public trace(msg: string | null | unknown) {
        if (this.isLevel(LogLevel.TRACE) && msg)
            this._log.appendLine(`[TRACE]: ${msg}`);
    }

    public show(): void {
        this._log.show();
    }

    public appendLine(msg: string): void {
        if (this._level > LogLevel.NONE && msg)
            this._log.appendLine(msg);
    }

    public append(msg: string): void {
        if (this._level > LogLevel.NONE && msg)
            this._log.append(msg);
    }

    isLevel(level: LogLevel): boolean {
        return level <= this._level;
    }
}