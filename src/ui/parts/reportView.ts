import { CancellationToken, Disposable, ExtensionContext, WebviewView, WebviewViewProvider, WebviewViewResolveContext, window } from 'vscode';
import { GdUnitReport } from '../../gdUnitEvent';

class ReportViewProvider implements WebviewViewProvider {

    private _view?: WebviewView;

    public resolveWebviewView(webviewView: WebviewView, context: WebviewViewResolveContext, token: CancellationToken) {
        this._view = webviewView;
        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,
        };

        this.updateText("");
        webviewView.show(true);
    }

    public updateText(text: String) {
        if (this._view != null)
            this._view.webview.html = `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="report-view" content="width=device-width, initial-scale=1.0">
                <title>GdUnit ReportView</title>
            </head>
            <body>
                ${text}
            </body>
            </html>`;
    }
}

export class ReportView implements Disposable {

    private readonly colorTag = /(\[color=(#[a-zA-Z0-9]+)\])(.*?(?=\[\/color))(\[\/color\])/gms;
    private readonly colorTagReplace = `<span style="color:$2";>$3</span>`;
    private readonly lineEndTag = /$/gm;
    private readonly lineEndTagReplace = '<br>';
    private readonly spaceTag = / {2,}/gm;
    private readonly spaceTagReplace = '&nbsp;';
    private readonly bracketOpenTag = /[\<]/gm;
    private readonly bracketOpenReplace = '&lt;';
    private readonly bracketCloseTag = /[\>]/gm;
    private readonly bracketCloseReplace = '&gt;';

    private _provider: ReportViewProvider;

    constructor(context: ExtensionContext) {

        this._provider = new ReportViewProvider();

        const panel = window.registerWebviewViewProvider(
            'gdUnitTestReports',
            this._provider
        );
        context.subscriptions.push(panel);
    }

    public clear(): void {
        this._provider.updateText("");
    }

    public update(reports: GdUnitReport[] | undefined) {
        if (reports) {
            const message: string = reports[0].message;
            const lineNumber = reports[0].line_number;
            const fullMessage = `[color=#00b306]line [/color][color=#20bfe3]${lineNumber}:[/color] ${message}`;
            this._provider.updateText(this.convertToHtml(fullMessage));
        } else {
            this._provider.updateText("");
        }
    }

    private convertToHtml(message: string): string {
        try {
            return message
                .replace(this.bracketOpenTag, this.bracketOpenReplace)
                .replace(this.bracketCloseTag, this.bracketCloseReplace)
                .replace(this.colorTag, this.colorTagReplace)
                .replace(this.lineEndTag, this.lineEndTagReplace)
                .replace(this.spaceTag, this.spaceTagReplace);
        } catch (error) {
            console.error(error);
            return message;
        }
    }

    dispose() {
    }
}
