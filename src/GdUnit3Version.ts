import path = require("path");
import { Uri, workspace } from "vscode";

export class GdUnit3Version {
    private _major: number;
    private _minor: number;
    private _patch: number;

    constructor(major: number, minor: number, patch: number) {
        this._major = major;
        this._minor = minor;
        this._patch = patch;
    }

    public static parse(version: string): GdUnit3Version {
        const parts = version.trim().replace(/"/g, '').split('.');
        return new GdUnit3Version(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]));
    }

    public isLessThan(other: GdUnit3Version | undefined): boolean {
        if (other == undefined) {
            return false;
        }
        const v1 = [this._major, this._minor, this._patch];
        const v2 = [other._major, other._minor, other._patch];
        for (let i = 0; i < v1.length; i++) {
            if (v1[i] > v2[i]) {
                return true;
            }
            if (v1[i] < v2[i]) {
                return false;
            }
        }
        return false;
    }

    public toString(): string {
        return `v${this._major}.${this._minor}.${this._patch}`;
    }
}

export async function getGdUnit3Version(): Promise<GdUnit3Version | undefined> {
    console.log('Scanning GdUnit plugin version.');
    const folders = workspace.workspaceFolders;
    const projectUri = folders ? folders[0].uri : Uri.file("invalid");
    const pluginConf = path.resolve(projectUri.fsPath, 'addons/gdUnit3/plugin.cfg');
    return await workspace.openTextDocument(Uri.file(pluginConf))
        .then(document => {
            for (let i = 0; i < document.lineCount; i++) {
                const text = document.lineAt(i).text
                if (text.startsWith("version")) {
                    const version = text.split('=')[1];
                    return GdUnit3Version.parse(version);
                }
            }
            return undefined;
        });
}