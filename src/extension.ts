
import { commands, ExtensionContext, window } from 'vscode';
import { CommandHandler } from './commandHandler';
import { GdUnitEvent } from './gdUnitEvent';
import { TestEventServer } from "./network/testEventServer";
import { ReportView } from "./ui/parts/reportView";
import { TestTreeExplorer } from "./ui/treeExplorer";
import { verifyGdUnit3PluginVersion } from './GdUnit3Version';
import { GdUnit3Logger } from './Logger';

export const Logger = new GdUnit3Logger();

export async function activate(context: ExtensionContext) {
	Logger.show();
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
	await verifyGdUnit3PluginVersion()
		.then(version => {
			commands.executeCommand('setContext', 'cmd-gdUnit3:is-ready', true);
			Logger.info(`GdUnit3 plugin ${version} found.`)
			Logger.appendLine(`GdUnit3 Test Explorer v${context.extension.packageJSON.version} is now active!`);
		})
		.catch(error => {
			commands.executeCommand('setContext', 'cmd-gdUnit3:is-ready', false);
			window.showErrorMessage(`Activating of gdUnit explorer failed!:\n ${error}`, { modal: true });
			Logger.error(`Activating of gdUnit explorer failed!:\n ${error}`);
		});
}

export function deactivate(): void {
	Logger.info('GdUnit3 Test Explorer is now deactived!');
}
