import * as assert from 'assert';
import { OutputChannel, window } from 'vscode';
// import { mock, instance } from 'ts-mockito'
import * as TypeMoq from "typemoq";
import { Logger } from '../../extension';
import { GdUnit3Logger, LogLevel } from '../../Logger';

suite('GdUnitLogger Test Suite', () => {
	window.showInformationMessage('Start GdUnitLogger tests.');

	test('setLevel ALL', () => {
		Logger.setLevel(LogLevel.ALL);

		Object.keys(LogLevel).filter((v) => !isNaN(Number(v))).map(v => Number(v)).forEach(
			value => {
				assert.equal(Logger.isLevel(value), true);
			}
		)
	});

	test('setLevel TRACE', () => {
		Logger.setLevel(LogLevel.TRACE);

		assert.equal(Logger.isLevel(LogLevel.NONE), true);
		assert.equal(Logger.isLevel(LogLevel.INFO), true);
		assert.equal(Logger.isLevel(LogLevel.WARNING), true);
		assert.equal(Logger.isLevel(LogLevel.ERROR), true);
		assert.equal(Logger.isLevel(LogLevel.DEBUG), true);
		assert.equal(Logger.isLevel(LogLevel.TRACE), true);
		assert.equal(Logger.isLevel(LogLevel.ALL), false);
	});

	test('setLevel DEBUG', () => {
		Logger.setLevel(LogLevel.DEBUG);

		assert.equal(Logger.isLevel(LogLevel.NONE), true);
		assert.equal(Logger.isLevel(LogLevel.INFO), true);
		assert.equal(Logger.isLevel(LogLevel.WARNING), true);
		assert.equal(Logger.isLevel(LogLevel.ERROR), true);
		assert.equal(Logger.isLevel(LogLevel.DEBUG), true);
		assert.equal(Logger.isLevel(LogLevel.TRACE), false);
		assert.equal(Logger.isLevel(LogLevel.ALL), false);
	});

	test('setLevel ERROR', () => {
		Logger.setLevel(LogLevel.ERROR);

		assert.equal(Logger.isLevel(LogLevel.NONE), true);
		assert.equal(Logger.isLevel(LogLevel.INFO), true);
		assert.equal(Logger.isLevel(LogLevel.WARNING), true);
		assert.equal(Logger.isLevel(LogLevel.ERROR), true);
		assert.equal(Logger.isLevel(LogLevel.DEBUG), false);
		assert.equal(Logger.isLevel(LogLevel.TRACE), false);
		assert.equal(Logger.isLevel(LogLevel.ALL), false);
	});

	test('setLevel WARNING', () => {
		Logger.setLevel(LogLevel.WARNING);

		assert.equal(Logger.isLevel(LogLevel.NONE), true);
		assert.equal(Logger.isLevel(LogLevel.INFO), true);
		assert.equal(Logger.isLevel(LogLevel.WARNING), true);
		assert.equal(Logger.isLevel(LogLevel.ERROR), false);
		assert.equal(Logger.isLevel(LogLevel.DEBUG), false);
		assert.equal(Logger.isLevel(LogLevel.TRACE), false);
		assert.equal(Logger.isLevel(LogLevel.ALL), false);
	});

	test('setLevel INFO', () => {
		Logger.setLevel(LogLevel.INFO);

		assert.equal(Logger.isLevel(LogLevel.NONE), true);
		assert.equal(Logger.isLevel(LogLevel.INFO), true);
		assert.equal(Logger.isLevel(LogLevel.WARNING), false);
		assert.equal(Logger.isLevel(LogLevel.ERROR), false);
		assert.equal(Logger.isLevel(LogLevel.DEBUG), false);
		assert.equal(Logger.isLevel(LogLevel.TRACE), false);
		assert.equal(Logger.isLevel(LogLevel.ALL), false);
	});

	test('setLevel NONE', () => {
		Logger.setLevel(LogLevel.NONE);

		assert.equal(Logger.isLevel(LogLevel.NONE), true);
		assert.equal(Logger.isLevel(LogLevel.INFO), false);
		assert.equal(Logger.isLevel(LogLevel.WARNING), false);
		assert.equal(Logger.isLevel(LogLevel.ERROR), false);
		assert.equal(Logger.isLevel(LogLevel.DEBUG), false);
		assert.equal(Logger.isLevel(LogLevel.TRACE), false);
		assert.equal(Logger.isLevel(LogLevel.ALL), false);
	});

	test('log error', () => {
		const logger = new GdUnit3Logger();
		const mockChannel = TypeMoq.Mock.ofType<OutputChannel>();
		logger['_log'] = mockChannel.object;

		logger.setLevel(LogLevel.ERROR);
		logger.error('This is a test message');
		mockChannel.verify(m => m.appendLine('[ERROR]: This is a test message'), TypeMoq.Times.once());

		mockChannel.reset();
		logger.setLevel(LogLevel.ALL);
		logger.error('This is a test message');
		mockChannel.verify(m => m.appendLine('[ERROR]: This is a test message'), TypeMoq.Times.once());

		// no error messages allowd to log
		mockChannel.reset();
		logger.setLevel(LogLevel.WARNING);
		logger.error('This is a test message');
		mockChannel.verify(m => m.appendLine(TypeMoq.It.isAny()), TypeMoq.Times.never());
	})

	test('log warrning', () => {
		const logger = new GdUnit3Logger();
		const mockChannel = TypeMoq.Mock.ofType<OutputChannel>();
		logger['_log'] = mockChannel.object;

		logger.setLevel(LogLevel.WARNING);
		logger.warn('This is a test message');
		mockChannel.verify(m => m.appendLine('[WARN]: This is a test message'), TypeMoq.Times.once());

		mockChannel.reset();
		logger.setLevel(LogLevel.ALL);
		logger.warn('This is a test message');
		mockChannel.verify(m => m.appendLine('[WARN]: This is a test message'), TypeMoq.Times.once());

		// no error messages allowd to log
		mockChannel.reset();
		logger.setLevel(LogLevel.INFO);
		logger.warn('This is a test message');
		mockChannel.verify(m => m.appendLine(TypeMoq.It.isAny()), TypeMoq.Times.never());
	})

	test('log debug', () => {
		const logger = new GdUnit3Logger();
		const mockChannel = TypeMoq.Mock.ofType<OutputChannel>();
		logger['_log'] = mockChannel.object;

		logger.setLevel(LogLevel.DEBUG);
		logger.debug('This is a test message');
		mockChannel.verify(m => m.appendLine('[DEBUG]: This is a test message'), TypeMoq.Times.once());

		mockChannel.reset();
		logger.setLevel(LogLevel.ALL);
		logger.debug('This is a test message');
		mockChannel.verify(m => m.appendLine('[DEBUG]: This is a test message'), TypeMoq.Times.once());

		// no error messages allowd to log
		mockChannel.reset();
		logger.setLevel(LogLevel.INFO);
		logger.debug('This is a test message');
		mockChannel.verify(m => m.appendLine(TypeMoq.It.isAny()), TypeMoq.Times.never());
	})

});
