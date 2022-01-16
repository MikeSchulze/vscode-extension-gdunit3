import { TreeItem, TreeItemCollapsibleState, ThemeIcon, Uri } from 'vscode';
import { v4 as uuid } from 'uuid';
import * as path from 'path';
import { TestSuite } from '../../testSuite';
import { TestCase } from '../../testCase';
import { GdUnitEvent, GdUnitReport } from '../../gdUnitEvent';

enum TestNodeIcon {
    testSuite = "test_suite.svg",
    testCase = "test_case.svg",
    success = "test_case_success.svg",
    failed = "test_case_failed.svg",
    error = "test_case_error.svg",
    spinner = "spinner.svg",
}

export enum STATE {
    INITIAL,
    RUNNING,
    SUCCESS,
    WARNING,
    FAILED,
    ERROR,
    SKIPPED
}

export class TreeNode extends TreeItem {

    children: TreeNode[];
    status: STATE = STATE.INITIAL;
    lineNumber: number | undefined;

    constructor(public resourcPath: string, public readonly name: string, public readonly collapsed: TreeItemCollapsibleState = TreeItemCollapsibleState.Collapsed) {
        super(name, collapsed);
        this.id = uuid();
        this.parent = null;
        this.children = [];
        this.command = { title: "open doc by double click", command: 'cmd-gdUnit3.document.open', arguments: [this] };
    }

    protected setIcon(icon: TestNodeIcon) {
        this.iconPath = path.join(__filename, '../../../../resources/treenodes', icon);
    }

    public setChildren(children: TreeNode[]) {
        this.children = children;
    }

    public parent?: TreeNode | null;

    public reports: GdUnitReport[] | undefined = undefined;

    private collaps() {
        if (this.collapsibleState != TreeItemCollapsibleState.None) {
            this.collapsibleState = TreeItemCollapsibleState.Collapsed;
        }
    }

    private expand() {
        if (this.collapsibleState != TreeItemCollapsibleState.None) {
            this.collapsibleState = TreeItemCollapsibleState.Expanded;
        }
    }

    public setElapsedTime(time: number): void {
        const ts = this.elapsed(time);
        this.label = `${this.name} (${ts})`;
    }

    static readonly SECONDS_PER_MINUTE: number = 60;
    static readonly MINUTES_PER_HOUR: number = 60;
    static readonly HOURS_PER_DAY: number = 24;
    static readonly MILLIS_PER_SECOND: number = 1000;
    static readonly MILLIS_PER_MINUTE: number = this.MILLIS_PER_SECOND * this.SECONDS_PER_MINUTE;
    static readonly MILLIS_PER_HOUR: number = this.MILLIS_PER_MINUTE * this.MINUTES_PER_HOUR;

    protected elapsed(time: number) {
        const hour = Math.floor(time / TreeNode.MILLIS_PER_HOUR) % 24;
        const minute = Math.floor(time / TreeNode.MILLIS_PER_MINUTE) % 60;
        const second = Math.floor(time / TreeNode.MILLIS_PER_SECOND) % 60;
        const millisecond = time % 1000;

        if (hour > 0)
            return `${hour}h ${minute}min ${second}s ${millisecond}ms`;
        if (minute > 0)
            return `${minute}min ${second}s ${millisecond}ms`;
        if (second > 0)
            return `${second}s ${millisecond}ms`;
        return `${millisecond}ms`;
    }

    public setStateArborted(): void {
        this.status = STATE.ERROR;
        this.setIcon(TestNodeIcon.error);
        this.label = `${this.name} (aborted)`;
        this.expand();
    }

    public setStateRunning(): void {
        this.status = STATE.RUNNING;
        this.setIcon(TestNodeIcon.spinner);
        this.iconPath = new ThemeIcon(`sync~spin`);
        this.expand();
    }

    private setStateSucceded(): void {
        // item.set_custom_color(0, Color.green)
        this.status = STATE.SUCCESS;
        this.setIcon(TestNodeIcon.success);
        this.collaps();
    }
    private setStateWarning(): void {
        //item.set_custom_color(0, Color.lightblue)
        this.status = STATE.WARNING;
        this.setIcon(TestNodeIcon.success);
        this.expand();
    }

    private setStateFailed(): void {
        //item.set_custom_color(0, Color.lightblue)
        this.status = STATE.FAILED;
        this.setIcon(TestNodeIcon.failed);
        this.expand();
    }

    private setStateError(): void {
        //item.set_custom_color(0, Color.lightblue)
        this.status = STATE.ERROR;
        this.setIcon(TestNodeIcon.error);
        this.expand();
    }

    private setStateSkipped(): void {
        //item.set_custom_color(0, Color.lightblue)
        this.status = STATE.SKIPPED;
        this.setIcon(TestNodeIcon.success);
        this.label = `${this.name} (skipped)`;
        this.expand();
    }

    public updateState(event: GdUnitEvent): void {
        if (event.isSuccess()) {
            this.setStateSucceded();
        } else if (event.isSkipped()) {
            this.setStateSkipped();
        } else if (event.isWarning()) {
            this.setStateWarning();
        } else if (event.isFailed()) {
            this.setStateFailed();
        } else if (event.isError()) {
            this.setStateError();
        }
    }
}

export class TreeNodeTestSuite extends TreeNode {

    private successfullyCompleted: number = 0;

    constructor(readonly testSuite: TestSuite) {
        super(testSuite.resource_path, testSuite.name);
        this.resourceUri = Uri.parse(path.join(__filename, '../../../../resources/treenodes', TestNodeIcon.testSuite));
        this.setIcon(TestNodeIcon.testSuite);
        testSuite.test_cases.forEach(testCase => this.children.push(new TreeNodeTestCase(this, testCase)));
    }

    public setElapsedTime(time: number): void {
        const ts = this.elapsed(time);
        this.label = `(${this.successfullyCompleted}/${this.children.length}) ${this.name} (${ts})`;
    }

    public updateSuccessfulCase(): void {
        this.successfullyCompleted += 1;
        this.label = `(${this.successfullyCompleted}/${this.children.length}) ${this.name}`;
    }
}

export class TreeNodeTestCase extends TreeNode {

    constructor(readonly parent: TreeNodeTestSuite, readonly testCase: TestCase) {
        super(parent.resourcPath, testCase.name, TreeItemCollapsibleState.None);
        this.parent = parent;
        this.lineNumber = testCase.line_number;
        this.setIcon(TestNodeIcon.testCase);
    }
}