import { Progress, ProgressLocation, window } from "vscode";

export class ProgressBar {
    private _index: number;
    private _counter: number;
    private _increment: number;
    private progress: Progress<{ message: string, increment?: number }> | null = null;
    private resolve!: ((nothing: boolean) => void);

    constructor() {
        this._counter = 0;
        this._increment = 0;
        this._index = 0;
    }

    startProgress(count: number) {
        this._index = 0;
        this._counter = count;
        this._increment = 100 / count;

        if (this.progress != null)
            this.endProgress();

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        window.withProgress({ title: "GdUnit3", location: ProgressLocation.Notification }, progress => new Promise((resolve, _reject) => {
            this.progress = progress;
            this.resolve = resolve;
        }));
    }

    reportProgress(message: string) {
        this._index += 1;
        this.progress?.report({ message: `Execute test case: ${this._index}:${this._counter} (${message})`, increment: this._increment })
    }

    endProgress() {
        if (this.progress != null) {
            this.resolve(true);
            this.progress = null;
        }
    }
}