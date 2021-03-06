import { plainToInstance } from 'class-transformer';
import { EventEmitter } from 'events';
import * as net from 'net';
import { AddressInfo, Server } from 'net';
import { Disposable } from 'vscode';
import { Logger } from '../extension';
import { GdUnitEvent } from '../gdUnitEvent';
import { GdUnitSettings } from '../gdUnitSettings';
import { TestSuite } from '../testSuite';

export class TestEventServer extends EventEmitter implements Disposable {

    readonly JSON_RESPONSE_DELIMITER = '<<JRD>>'
    readonly HOST = 'localhost';
    private _server: Server;

    public constructor() {
        super();
        const port = GdUnitSettings.serverPort();
        const server = net.createServer()
            .listen(port, this.HOST, function () {
                const addressInfo = server.address() as AddressInfo;
                Logger.info(`Server listening on ${addressInfo.address}:${addressInfo.port}`);
            })
            .on('connection', socket => {
                Logger.info(`New Client connection from ${socket.remoteAddress}:${socket.remotePort}`);

                // rebuild Godot Object serialisation
                const rpcClientConnected = {
                    "@subpath": "",
                    "@path": "res://addons/gdUnit3/src/network/rpc/RPCClientConnect.gd",
                    "_client_id": port
                }

                const data = JSON.stringify(rpcClientConnected);
                socket.write(data);
                socket
                    .on('data', (buffer) => {
                        buffer.toString().split(this.JSON_RESPONSE_DELIMITER)
                            .filter(e => e != null && e != '')
                            .forEach(json => {
                                const rpc = JSON.parse(json);
                                const path = rpc['@path'] as string;
                                if (path?.endsWith('RPCMessage.gd')) {
                                    const message = rpc['_message'] as string;
                                    this.emit('message', message);
                                } else if (path?.endsWith('RPCGdUnitEvent.gd')) {
                                    const data = rpc['_event'] as object;
                                    const event = plainToInstance<GdUnitEvent, object>(GdUnitEvent, data);
                                    this.emit('event', event);

                                } else if (path?.endsWith('RPCGdUnitTestSuite.gd')) {
                                    const data = rpc['_data'] as object;
                                    const testSuite = plainToInstance<TestSuite, object>(TestSuite, data);
                                    this.emit('test_suite', testSuite);
                                }
                            });
                    })
                    .on('close', () => socket.end());
            })
            .on('close', () => Logger.info(`close connection`))
            .on('error', e => Logger.error(e));
        this._server = server;
    }

    dispose() {
        this._server.close();
    }
}
