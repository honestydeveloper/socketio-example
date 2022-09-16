import feathers from '@feathersjs/client';
import socketio from '@feathersjs/socketio-client';
import io from 'socket.io-client';

const socket = io('http://localhost:3030');
const FeatherClient = feathers();

FeatherClient.configure(socketio(socket));
FeatherClient.configure(
    feathers.authentication({
        storage: window.localStorage,
    })
);

export {
    FeatherClient,
    socket
};