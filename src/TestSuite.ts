import {  Disposable } from "vscode";
import { TestCase } from "./testCase";

export class TestSuite implements Disposable {

    constructor(
        public readonly name: string,
        public readonly resource_path: string,
        public readonly test_cases: Array<TestCase>) {
    }

    dispose() {
    }
}
