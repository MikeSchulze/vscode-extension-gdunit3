import { commands, Disposable, ExtensionContext, Range, TreeView, TreeViewSelectionChangeEvent, Uri, window, workspace } from "vscode";
import { CommandHandler } from "../commandHandler";
import { EVENT_TYPE, GdUnitEvent } from "../gdUnitEvent";
import { ProgressBar } from "./parts/progressBar";
import { ReportView } from "./parts/reportView";
import { TreeNode } from "./parts/treeNode";
import { TreeProvider } from "./parts/treeProvider";


export class TestTreeExplorer implements Disposable {
    private readonly _tree: TreeView<TreeNode>;
    private readonly _treeProvider: TreeProvider;
    private readonly _progressBar: ProgressBar;

    constructor(context: ExtensionContext, private reportView: ReportView) {
        let revealQueue = Promise.resolve();
        this._treeProvider = new TreeProvider();
        this._treeProvider.onDidChangeTreeData(this.clearReport);
        this._treeProvider.onDidChangeSelection(async node => {
            if (node) {
                try {
                    revealQueue = revealQueue.then(() => this._tree.reveal(node, { select: true, focus: true }));
                    //await this._tree.reveal(node, { select: true, focus: true });
                }
                catch (e) {
                    // ignore this exception, the reveal throws already registered items and should be executed via `Promise` but this slow downs the tree update
                }
            } else {
                this._tree.selection.map(async node => {
                    revealQueue = revealQueue.then(() => this._tree.reveal(node, { select: false }));
                });
            }
        });
        this._tree = window.createTreeView('gdUnit3TestExplorer', { treeDataProvider: this._treeProvider });
        this._tree.onDidChangeSelection(e => this.updateReport(e));
        //this._tree.onDidCollapseElement(n => console.log("onDidCollapseElement", n.element.name));
        //this._tree.onDidExpandElement(n => console.log("onDidExpandElement", n.element.name, n.element.collapsibleState));
        this._progressBar = new ProgressBar();

        context.subscriptions.push(
            commands.registerCommand("cmd-gdUnit3.document.open", (node: TreeNode) =>
                this.isDoubleClicked()?.then(() => this.openDocument(node))
            )
        );
    }

    private clearReport() {
        this.reportView.clear();
    }

    private updateReport(event: TreeViewSelectionChangeEvent<TreeNode>): void {
        this.reportView.update(event.selection[0].reports);
    }

    public listen(event: GdUnitEvent): void {
        this._treeProvider.listen(event);
        if (event.type == EVENT_TYPE.TESTCASE_BEFORE) {
            this._progressBar.reportProgress(event.test_name);
        }
        else if (event.type == EVENT_TYPE.INIT) {
            this._progressBar.startProgress(event.total_count);
        }
        else if (event.type == EVENT_TYPE.STOP) {
            CommandHandler.setStateRunning(false);
            this._progressBar.endProgress();
        }
    }

    private previousSelectionTime: number = Date.now();
    private doubleClickTime = 200;

    private isDoubleClicked(): Promise<boolean> | undefined {
        const currentTime = Date.now();
        const isDoubleClicked: boolean = currentTime - this.previousSelectionTime <= this.doubleClickTime;
        this.previousSelectionTime = currentTime;
        return isDoubleClicked ? Promise.resolve(isDoubleClicked) : undefined;
    }

    private openDocument(node: TreeNode) {
        const lineNumber = node.reports ? node.reports[0].line_number - 1 : node.lineNumber;
        workspace.openTextDocument(Uri.file(node.resourcPath))
            .then(document => window.showTextDocument(document, { preview: true, selection: new Range(lineNumber ?? 0, 0, lineNumber ?? 0, 0) }));
    }

    dispose() {
        this._tree.dispose();
    }
}