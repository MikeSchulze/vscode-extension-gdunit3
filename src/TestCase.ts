import { Diagnostic, Disposable } from "vscode";

export class TestCase implements Disposable {

    constructor(
        public readonly name: string,
        public readonly resource_path: string,
        public readonly line_number: number) {
    }

    dispose() {
    }
}
