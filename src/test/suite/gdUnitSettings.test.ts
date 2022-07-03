import assert = require("assert");
import { window, workspace } from "vscode";
import { GdUnitSettings } from "../../gdUnitSettings";
import { LogLevel } from "../../Logger";

suite('gdUnitSettings Test Suite', () => {
    window.showInformationMessage('Start GdUnitLogger tests.');

    test('is logLevel info', () => {
        workspace.getConfiguration('gdunit3').update('logLevel', "INFO").then(() => {
            const level = GdUnitSettings.logLevel();
            assert.equal(level, LogLevel.INFO);
        });
    });

    test('is logLevel warning', () => {
        workspace.getConfiguration('gdunit3').update('logLevel', "WARNING").then(() => {
            const level = GdUnitSettings.logLevel();
            assert.equal(level, LogLevel.WARNING);
        });
    });

    test('is logLevel error', () => {
        workspace.getConfiguration('gdunit3').update('logLevel', "ERROR").then(() => {
            const level = GdUnitSettings.logLevel();
            assert.equal(level, LogLevel.ERROR);
        });
    });

    test('is logLevel debug', () => {
        workspace.getConfiguration('gdunit3').update('logLevel', "DEBUG").then(() => {
            const level = GdUnitSettings.logLevel();
            assert.equal(level, LogLevel.DEBUG);
        });
    });


})
