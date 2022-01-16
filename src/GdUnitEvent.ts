import { Disposable } from "vscode";

export enum EVENT_TYPE {
    INIT,
    STOP,
    TESTSUITE_BEFORE,
    TESTSUITE_AFTER,
    TESTCASE_BEFORE,
    TESTCASE_AFTER
};

export class GdUnitReport {
    constructor(
        public readonly line_number: number,
        public readonly message: string,
        public readonly type: number
    ) { }
}

export class GdUnitEvent implements Disposable {

    readonly _type = 'GdUnitEvent';

    static readonly WARNINGS = "warnings"
    static readonly FAILED = "failed"
    static readonly ERRORS = "errors"
    static readonly SKIPPED = "skipped"
    static readonly ELAPSED_TIME = "elapsed_time"
    static readonly ORPHAN_NODES = "orphan_nodes"
    static readonly ERROR_COUNT = "error_count"
    static readonly FAILED_COUNT = "failed_count"
    static readonly SKIPPED_COUNT = "skipped_count"

    constructor(
        public readonly type: EVENT_TYPE,
        public readonly resource_path: String,
        public readonly suite_name: String,
        public readonly test_name: String,
        public readonly total_count: number = 0,
        public readonly statistics: {
            elapsed_time: number,
            error_count: number,
            errors: boolean,
            failed: boolean,
            failed_count: number,
            orphan_nodes: number,
            skipped: boolean,
            skipped_count: number,
            warnings: boolean
        } | undefined,
        public readonly reports: GdUnitReport[] | undefined) {
    }

    public static STOP(): GdUnitEvent {
        return new GdUnitEvent(EVENT_TYPE.STOP, "", "", "", 0, undefined, undefined);
    }

    public elapsedTime(): number {
        return this.statistics?.elapsed_time ?? -1;
    }

    public isSuccess(): boolean {
        return !this.isWarning() && !this.isFailed() && !this.isError() && !this.isSkipped();
    }

    public isWarning(): boolean {
        return this.statistics?.warnings ?? false;
    }

    public isFailed(): boolean {
        return this.statistics?.failed ?? false;
    }

    public isError(): boolean {
        return this.statistics?.errors ?? false;
    }

    public isSkipped(): boolean {
        return this.statistics?.skipped ?? false;
    }

    dispose() {
    }
}
