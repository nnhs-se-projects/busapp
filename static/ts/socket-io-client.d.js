// How we get socket.io to work on the client

import {io, Socket} from "socket.io-client";
export {};

declare global {
    interface Window {
        io: typeof io;
    }
}