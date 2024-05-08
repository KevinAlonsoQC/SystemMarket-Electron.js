const electronApp = require('electron').app;
const electronBrowserWindow = require('electron').BrowserWindow;
const electronMenu = require('electron').Menu;
const electronIpcMain = require('electron').ipcMain;
const Store = require('electron-store');
const store = new Store();
const path = require('path');
const db = require('./connection.js');
let window;
let loginWindow;

if (process.env.NODE_ENV !== 'production') {
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, '../node_modules', '.bin', 'electron')
  });
  require('electron-reload')(__dirname, {
    electron_forge: path.join(__dirname, '../node_modules', '.bin', 'electron-forge')
  });
}

if (require('electron-squirrel-startup')) {
  electronApp.quit();
}

const createWindowDashboard = () => {
  // Create the browser window.
  window = new electronBrowserWindow({
    icon: __dirname + '/assets/images/favicon.ico',
    width: 900,
    height: 600,
    autoHideMenuBar: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      devTools: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Menu
  const mainMenu = electronMenu.buildFromTemplate(templateMenu);
  // Set The Menu to the Main Window
  electronMenu.setApplicationMenu(mainMenu);

  // and load the index.html of the app.
  window.loadFile(path.join(__dirname, 'views/index.html'));
  window.webContents.openDevTools()
};

const createWindow = () => {
  // Create the browser window.
  loginWindow = new electronBrowserWindow({
    icon: __dirname + '/assets/images/favicon.ico',
    width: 550,
    height: 470,
    resizable: false,
    maximizable: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      devTools: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // and load the index.html of the app.
  loginWindow.loadFile(path.join(__dirname, 'views/login.html'));
};

electronApp.on('ready', createWindow);
electronApp.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    electronApp.quit();
  }
});
electronApp.on('activate', () => {
  if (electronBrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

electronIpcMain.on('login', (event, data) => {
  validateLogin(data);
});

// Consulta para obtener todos los datos de la tabla producto
function getProductos() {
  const sql = 'SELECT * FROM producto';

  db.query(sql, (error, results, fields) => {
    if (error) {
      console.log(error);
      return;
    }

    // Almacena los detalles de venta en un array
    const Productos = results.map(detalle => ({
      nombre: detalle.nombre,
      precio: detalle.precio,
      codigo_barra: detalle.codigo_barra,
      categoria: detalle.categoria,
      img: detalle.img
    }));

    // Almacena el array de productos de venta en el store
    store.set('productos', Productos);
  });
};

// Consulta para obtener todos los datos de la tabla venta
function getVentas() {
  const sql = 'SELECT * FROM venta';

  db.query(sql, (error, results, fields) => {
    if (error) {
      console.log(error);
      return;
    }

    // Almacena los detalles de venta en un array
    const Ventas = results.map(detalle => ({
      fecha: detalle.fecha,
      vendedor: detalle.vendedor,
      monto: detalle.monto_total
    }));

    // Almacena el array de detalles de venta en el store
    store.set('ventas', Ventas);
  });
};


// Consulta para obtener todos los datos de la tabla detalle_venta
function getCategorias() {
  const sql = 'SELECT * FROM categoria';

  db.query(sql, (error, results, fields) => {
    if (error) {
      console.log(error);
      return;
    }
    // Almacena los detalles de venta en un array
    const Categorias = results.map(detalle => ({
      nombre: detalle.nombre
    }));

    // Almacena el array de productos de venta en el store
    store.set('categorias', Categorias);
  });
};

function validateLogin(data) {
  const sql = 'SELECT * FROM vendedor WHERE email=? AND password=?';

  db.query(sql, [data.email, data.password], (error, results, fields) => {
    if (error) {
      console.log(error);
    }

    if (results.length > 0) {
      store.set('name', results[0].nombre);
      store.set('email', results[0].email);
      store.set('permissions', results[0].permiso);

      createWindowDashboard();
      loginWindow.close();
      window.loadFile(path.join(__dirname, 'views/index.html'));
      window.maximize();
      window.show();
    }
  });
}

electronIpcMain.on('logout', (event, confirm) => {
  validateLogout(confirm);
});

function validateLogout(confirm) {
  console.log(confirm);
  if (confirm == 'confirm-logout') {
    store.delete('name');
    store.delete('email');
    store.delete('permissions');

    //store.delete('ventas');
    //store.delete('categorias');
    //store.delete('productos');

    createWindow();
    loginWindow.show();
    window.close();
  }
}

electronIpcMain.handle('getUserData', (event) => {
  getCategorias();
  getProductos();
  getVentas();

  const data = {
    name: store.get('name'),
    email: store.get('email'),
    permissions: store.get('permissions'),
    //Anexos al usuario. Data
    categorias: store.get('categorias'),
    ventas: store.get('ventas'),
    productos: store.get('productos'),
  };
  return data;
});

electronIpcMain.on('saveCarrito', (event, data) => {
  if (store.get('carrito')){
    store.delete('carrito');
  }
  store.set('carrito', data);
  console.log('Carrito Guardado')
  console.log(data)
});

electronIpcMain.on('deleteCarrito', (event, data) => {
  console.log('Carrito borrado')
  store.delete('carrito');
  console.log(store.get('carrito'))
});

electronIpcMain.handle('getCarrito', (event) => {
  const data = {
    carrito: store.get('carrito'),
  };
  console.log('Carrito llamado', data.carrito)
  return data;
});

electronIpcMain.on('insertProducto', (event, data) => {
  addProducto(data);
});

function addProducto(data) {
  const sql = 'INSERT INTO producto (nombre, precio, codigo_barra, categoria, img) VALUES (?, ?, ?, ?, ?)';

  db.query(sql, [data.nombre, data.precio, data.codigo_barra, data.categoria, data.img], (error) => {
    if (error) {
      console.log(error);
    }else{
      console.log('agregado en el producto', data)
    }
  });
};

electronIpcMain.on('updateProducto', (event, data) => {
  updateProducto(data);
});

function updateProducto(data) {
  const sql = 'UPDATE producto SET nombre = ?, precio = ?, categoria = ?, img = ? WHERE codigo_barra = ?';
  
  db.query(sql, [data.nombre, data.precio, data.categoria, data.img, data.codigo_barra], (error) => {
    if (error) {
      console.log(error);
    }else{
      console.log('Update en el producto', data)
    }
    
  });
}

electronIpcMain.on('deleteProducto', (event, data) => {
  deleteProducto(data);
});

function deleteProducto(data) {
  const sql = 'DELETE FROM producto WHERE codigo_barra = ?';
  db.query(sql, [data.codigo_barra], (error) => {
    if (error) {
      console.log(error);
    }else{
      console.log('borrado en el producto', data)
    }
  });
}


// Menu Template
const templateMenu = [
  {
    label: 'Dev',
    submenu: [
      {
        label: 'Show/Hide Dev Tools',
        accelerator: 'Ctrl+D',
        click(item, focusedWindow) {
          focusedWindow.toggleDevTools();
        }
      }
    ]
  }
];
