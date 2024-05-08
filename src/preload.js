const contextBridge = require('electron').contextBridge;
const ipcRender = require('electron').ipcRenderer;

const ipc = {
    'render': {
        'send': [ //Esto me envía datos a mi electron.js
            'login',
            'logout',
            'insertProducto',
            'updateProducto',
            'deleteProducto',
            'saveCarrito',
            'deleteCarrito',
        ],
        'sendReceive': [ //Esto me trae datos a mi HTML
            'getUserData',
            'getCarrito',
        ]
    }
};

contextBridge.exposeInMainWorld(
    'ipcRender', {
    send: (channel, args) => {
        let validChannels = ipc.render.send;

        if (validChannels.includes(channel)) {
            ipcRender.send(channel, args);
        }
    },
    invoke: (channel, args) => {
        let validChannels = ipc.render.sendReceive;

        if (validChannels.includes(channel)) {
            return ipcRender.invoke(channel, args);
        }
    }
});