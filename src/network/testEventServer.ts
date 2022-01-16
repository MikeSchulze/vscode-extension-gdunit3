import { plainToClass } from 'class-transformer';
import { EventEmitter } from 'events';
import * as net from 'net';
import { AddressInfo, Server } from 'net';
import { Disposable } from 'vscode';
import { GdUnitEvent } from '../gdUnitEvent';
import { GdUnitSettings } from '../gdUnitSettings';
import { TestSuite } from '../testSuite';

export class TestEventServer extends EventEmitter implements Disposable {

    readonly HOST = 'localhost';
    private _server: Server;

    public constructor() {
        super();
        let port = GdUnitSettings.serverPort();
        var server = net.createServer()
            .listen(port, this.HOST, function () {
                var addressInfo = server.address() as AddressInfo;
                console.log(`Server listening on ${addressInfo.address}:${addressInfo.port}`);
            })
            .on('connection', socket => {
                console.log(`New Client connection from ${socket.remoteAddress}:${socket.remotePort}`);

                // rebuild Godot Object serialisation
                var rpcClientConnected = {
                    "@subpath": "",
                    "@path": "res://addons/gdUnit3/src/network/rpc/RPCClientConnect.gd",
                    "_client_id": port
                }

                var data = JSON.stringify(rpcClientConnected);
                socket.write(data);
                socket
                    .on('data', (buffer) => {
                        buffer.toString().split("|")
                            .filter(e => e != null && e != '')
                            .map(json => JSON.parse(json))
                            .forEach(rpc_data => this.emitEvent(rpc_data, this));
                    })
                    .on('close', () => socket.end());
            })
            .on('close', () => console.log(`close connection`))
            .on('error', (error) => console.log(`Error: ${error}`));
        this._server = server;
    }

    dispose() {
        this._server.close();
    }

    private emitEvent(rpc_data: any, emitter: EventEmitter): boolean {
        const clazzPath = rpc_data["@path"];
        const matches = clazzPath?.match("(RPC.+)\\.gd");
        const clazzName = matches?.pop();
        switch (clazzName) {
            case "RPCMessage":
                const message: String = rpc_data["_message"] as String;
                return emitter.emit('message', message);
            case "RPCGdUnitEvent":
                const event = plainToClass<GdUnitEvent, object>(GdUnitEvent, rpc_data["_event"]);
                return emitter.emit('event', event);
            case "RPCGdUnitTestSuite":
                const testSuite = plainToClass<TestSuite, object>(TestSuite, rpc_data["_data"]);
                return emitter.emit('test_suite', testSuite);
            default:
                throw new Error(`Invalid RPC type ${clazzName}`);
        }
    }
}
