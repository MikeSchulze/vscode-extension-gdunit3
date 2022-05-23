import { commands, Disposable, ExtensionContext, Range, TreeView, TreeViewSelectionChangeEvent, Uri, window, workspace } from "vscode";
import { CommandHandler } from "../commandHandler";
import { EVENT_TYPE, GdUnitEvent } from "../gdUnitEvent";
import { ReportView } from "./parts/reportView";
import { TreeNode } from "./parts/treeNode";
import { TreeProvider } from "./parts/treeProvider";


export class TestTreeExplorer implements Disposable {
    private readonly _tree: TreeView<TreeNode>;
    private readonly _treeProvider: TreeProvider;

    constructor(context: ExtensionContext, private reportView: ReportView) {
        let revealQueue = Promise.resolve();
        this._treeProvider = new TreeProvider();
        this._treeProvider.onDidChangeTreeData(this.clearReport);
        this._treeProvider.onDidChangeSelection(node => {
            if (node) {
                revealQueue = revealQueue.then(() => this._tree.reveal(node, { select: true, focus: true }));
            } else {
                this._tree.selection.map(async node => {
                    revealQueue = revealQueue.then(() => this._tree.reveal(node, { select: false }));
                });
            }
        });
        this._tree = window.createTreeView('gdUnit3TestExplorer', { treeDataProvider: this._treeProvider });
        this._tree.onDidChangeSelection(e => this.updateReport(e));
        //this._tree.onDidCollapseElement(n => console.log("onDidCollapseElement", n.element.name));
        //this._tree.onDidExpandElement(n => console.log("onDidExpandElement", n.element.name));

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
        if (event.type == EVENT_TYPE.STOP) {
            CommandHandler.setStateRunning(false);
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