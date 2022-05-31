
import { ExtensionContext, window } from 'vscode';
import { CommandHandler } from './commandHandler';
import { GdUnitEvent } from './gdUnitEvent';
import { TestEventServer } from "./network/testEventServer";
import { ReportView } from "./ui/parts/reportView";
import { TestTreeExplorer } from "./ui/treeExplorer";
import { getGdUnit3Version, GdUnit3Version } from './GdUnit3Version';


const MIN_REQUIRED_GDUNIT_VERSION = new GdUnit3Version(2, 2, 3);

export async function activate(context: ExtensionContext) {

	await getGdUnit3Version().then(version => {
		if (MIN_REQUIRED_GDUNIT_VERSION.isLessThan(version)) {
			window.showErrorMessage(`This extension requires GdUnit3 minimum version ${MIN_REQUIRED_GDUNIT_VERSION} but found ${version}.`);
			throw new Error('Invalid GdUnit3 Version found!');
		}
		console.info(`GdUnit3 ${version} found.`)
	});

	const reportView = new ReportView(context);
	const treeExplorer = new TestTreeExplorer(context, reportView);
	const commandHandler = new CommandHandler(context);
	const testEventServer = new TestEventServer()
		.on('message', (message) => treeExplorer.listen(message))
		.on('event', (event) => treeExplorer.listen(event))
		.on('test_suite', (testSuite) => treeExplorer.listen(testSuite))

	commandHandler.onGdUnitEvent((event: GdUnitEvent) => {
		treeExplorer.listen(event);
	});

	context.subscriptions.push(
		commandHandler,
		testEventServer,
		treeExplorer,
		reportView
	);
	console.log('"GdUnit3 Test Explorer" is now active!');
}

export function deactivate(): void {
	console.log('"GdUnit3 Test Explorer" is now deactived!');
	// TODO hide from activiy bar
	//commands.executeCommand('editor.action.addCommentLine');
}
