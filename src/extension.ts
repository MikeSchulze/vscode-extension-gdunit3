
import { ExtensionContext } from 'vscode';
import { CommandHandler } from './commandHandler';
import { GdUnitEvent } from './gdUnitEvent';
import { TestEventServer } from "./network/testEventServer";
import { ReportView } from "./ui/parts/reportView";
import { TestTreeExplorer } from "./ui/treeExplorer";

export function activate(context: ExtensionContext) {

	const reportView = new ReportView(context);
	const treeExplorer = new TestTreeExplorer(context, reportView);
	const commandHandler = new CommandHandler(context);

	commandHandler.onGdUnitEvent((event: GdUnitEvent) => {
		treeExplorer.listen(event);
	});

	context.subscriptions.push(
		commandHandler,
		new TestEventServer()
			.on('message', (message) => treeExplorer.listen(message))
			.on('event', (event) => treeExplorer.listen(event))
			.on('test_suite', (testSuite) => treeExplorer.listen(testSuite)),
		treeExplorer,
		reportView
	);
	console.log('"GdUnit3 Test Explorer" is now active!');
}

export function deactivate() { }
