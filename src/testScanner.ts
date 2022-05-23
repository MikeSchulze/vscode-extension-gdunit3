import {
    commands, Disposable, DocumentSymbol, FileType, Position, Range, SymbolKind, TextDocument, Uri, workspace
} from 'vscode';
import { TestRunnerConfiguration } from "./testRunnerConfiguration";

export class TestScanner implements Disposable {

    private async findAllTestCases(document: TextDocument): Promise<DocumentSymbol[]> {
        return await commands.executeCommand<DocumentSymbol[]>(
            'vscode.executeDocumentSymbolProvider',
            document.uri
        ).then(async symbol => {
            if (symbol == undefined || symbol.length == 0) {
                console.log(`no tests found on ${document.fileName}`)
                return [];
            }

            const clazzSymbols = symbol[0]?.children;
            const methods = clazzSymbols[0]?.children;
            const isClass = clazzSymbols[0]?.kind == SymbolKind.Class;
            if (!isClass) {
                return [];
            }

            const start = clazzSymbols[0]?.range.start;
            if (!document.lineAt(start)?.text.includes("[TestSuite")) {
                console.debug(`exclude ${document.fileName}, is not a testsuite`);
                return [];
            }
            return methods
                .filter(entry => entry.kind == SymbolKind.Method)
                .filter(entry => {
                    const start = entry.range.start;
                    return document.lineAt(start)?.text.includes("[TestCase");
                });
        }).then(undefined, err => {
            console.error("scan error", err);
            return [];
        });
    }

    private findTestCaseOnSelection(symbls: DocumentSymbol[], position: Position): Promise<string> {
        const index = symbls.findIndex(symbol => symbol.range.intersection(new Range(position, position)))
        if (index == -1) {
            return Promise.reject();
        }
        return Promise.resolve(this.testCaseName(symbls[index]));
    }

    private testCaseName(symbol: DocumentSymbol): string {
        return symbol?.name.replace(/\(.*\)$/, "") ?? "";
    }

    public async scanDocument(config: TestRunnerConfiguration, doc: TextDocument, position?: Position | undefined): Promise<TestRunnerConfiguration> {
        console.log(`Scan file: ${doc.fileName}`);
        await this.findAllTestCases(doc)
            .then(methods => {
                if (position != null) {
                    this.findTestCaseOnSelection(methods, position)
                        .then(testCase => config.addTestCase(doc.fileName, testCase));
                } else {
                    config.addTestCases(doc.fileName, methods.map(this.testCaseName));
                }
            })
            .then(undefined, console.error);
        return config;
    }

    public async scanDirectory(config: TestRunnerConfiguration, folder: Uri): Promise<TestRunnerConfiguration> {
        console.debug(`Scan directory: ${folder.path}`);
        await workspace.fs
            .readDirectory(folder)
            .then(async entries =>
                await Promise.all(entries.map(async entry => {
                    const next = Uri.file(folder.path + '/' + entry[0]);
                    if (entry[1] == FileType.File) {
                        if (entry[0].endsWith(".cs")) {
                            await workspace.openTextDocument(next)
                                .then(async document => await this.scanDocument(config, document));
                        }
                    } else {
                        await this.scanDirectory(config, next);
                    }
                })))
            .then(undefined, console.error);
        return config;
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    dispose() {
    }
}

