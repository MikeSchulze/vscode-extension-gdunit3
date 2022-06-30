import { EventEmitter as EventListener } from 'events';
import { Event, EventEmitter, TreeDataProvider, TreeItem, TreeView } from "vscode";
import { Logger } from '../../extension';
import { EVENT_TYPE, GdUnitEvent } from "../../gdUnitEvent";
import { TestSuite } from "../../testSuite";
import { STATE, TreeNode, TreeNodeTestCase, TreeNodeTestSuite } from "./treeNode";

export class TreeProvider extends EventListener implements TreeDataProvider<TreeNode> {

    private _onDidChangeTreeData: EventEmitter<TreeNode | void> = new EventEmitter<TreeNode | void>();
    readonly onDidChangeTreeData: Event<TreeNode | void> = this._onDidChangeTreeData.event;

    private _onDidChangeSelection: EventEmitter<TreeNode | void> = new EventEmitter<TreeNode | void>();
    readonly onDidChangeSelection: Event<TreeNode | void> = this._onDidChangeSelection.event;

    private _nodes: TreeNode[] = [];

    constructor() {
        super();
        this.initTreeData();
    }

    private initTreeData(): void {
        this._nodes = [];
        this._onDidChangeTreeData.fire();
    }

    public getTreeItem(element: TreeNode): TreeItem {
        return element;
    }

    public getParent?(element: TreeNode): TreeNode | null | undefined {
        return element.parent;
    }

    public getChildren(element?: TreeNode): TreeNode[] | Thenable<TreeNode[]> {
        if (!element) {
            return Promise.resolve(this._nodes);
        }
        return Promise.resolve(element.children);
    }

    public listen(data: GdUnitEvent | TestSuite | string): void {
        if (data instanceof GdUnitEvent) {
            this.onGdUnitEvent(data as GdUnitEvent);
        } else if (data instanceof TestSuite) {
            this.onAddTestSuite(data);
        } else {
            Logger.log(`Message: ${data}`);
        }
    }

    private fireUpdateNode(node: TreeNode | undefined = undefined): void {
        if (node === undefined) {
            this._onDidChangeTreeData.fire();
        } else {
            this._onDidChangeTreeData.fire(node);
        }
    }

    private fireSelectNode(node: TreeNode | undefined): void {
        this._onDidChangeSelection.fire(node);
    }

    private findTestCase(resourcePath: string, name: string): TreeNodeTestCase | undefined {
        return this._nodes
            .find(node => node.resourcPath === resourcePath)?.children
            .find(node => node.label === name) as TreeNodeTestCase;
    }

    private findTestSuite(resourcePath: string): TreeNodeTestSuite | undefined {
        return this._nodes
            .find(node => node.resourcPath === resourcePath) as TreeNodeTestSuite;
    }

    private findFirstFailure(): TreeNode | undefined {
        return this._nodes
            .find(node => node.status == STATE.FAILED || node.status == STATE.ERROR)?.children
            .find(node => node.status == STATE.FAILED || node.status == STATE.ERROR);
    }

    private abortRunning(): void {
        const testSuite = this._nodes.find(node => node.status == STATE.RUNNING);
        if (testSuite) {
            testSuite.setStateArborted();
            const node = testSuite.children.find(node => node.status == STATE.RUNNING);
            if (node) {
                node.setStateArborted();
                this.fireUpdateNode(node);
            }
            this.fireUpdateNode(testSuite);
        }
    }

    private updateTestSuite(event: GdUnitEvent): void {
        const node = this.findTestSuite(event.resource_path);
        if (node === undefined) {
            return;
        }
        if (event.type == EVENT_TYPE.TESTSUITE_BEFORE) {
            node.setStateRunning();
            this.fireSelectNode(node);
        } else if (event.type == EVENT_TYPE.TESTSUITE_AFTER) {
            node.setElapsedTime(event.elapsedTime());
            node.updateState(event);
        }
        this.fireUpdateNode(node);
    }

    private updateTestCase(event: GdUnitEvent): void {
        const node = this.findTestCase(event.resource_path, event.test_name);
        if (node === undefined) {
            return;
        }
        if (event.type == EVENT_TYPE.TESTCASE_BEFORE) {
            node.setStateRunning();
            this.fireSelectNode(node);
        } else if (event.type == EVENT_TYPE.TESTCASE_AFTER) {
            if (event.isSuccess()) {
                node.parent.updateSuccessfulCase();
            } else {
                node.reports = event.reports;
            }
            node.setElapsedTime(event.elapsedTime());
            node.updateState(event);
        }
        this.fireUpdateNode(node);
    }

    private selectFirstFailure(): void {
        this.fireSelectNode(this.findFirstFailure());
    }

    private onAddTestSuite(testSuite: TestSuite): void {
        this._nodes.push(new TreeNodeTestSuite(testSuite));
        this.refresh();
    }

    private onGdUnitEvent(event: GdUnitEvent): void {
        switch (event.type) {
            case EVENT_TYPE.INIT:
                this.initTreeData();
                return;
            case EVENT_TYPE.STOP:
                this.abortRunning();
                this.selectFirstFailure();
                return;
            case EVENT_TYPE.TESTSUITE_BEFORE:
                this.updateTestSuite(event);
                return;
            case EVENT_TYPE.TESTSUITE_AFTER:
                this.updateTestSuite(event);
                return;
            case EVENT_TYPE.TESTCASE_BEFORE:
                this.updateTestCase(event);
                return;
            case EVENT_TYPE.TESTCASE_AFTER:
                this.updateTestCase(event);
                return;
        }
    }

    refresh(): void {
        this.fireUpdateNode();
    }
}
