import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
export declare let io: SocketServer;
export declare function initializeGateway(httpServer: HttpServer): SocketServer<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
//# sourceMappingURL=socket.d.ts.map