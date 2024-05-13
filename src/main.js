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
let windowBoleta;

//Default Process
//Default Process
//Default Process
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

//Windows Create
//Windows Create
//Windows Create
const createWindowDashboard = () => {
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

  const mainMenu = electronMenu.buildFromTemplate(templateMenu);
  electronMenu.setApplicationMenu(mainMenu);

  window.loadFile(path.join(__dirname, 'views/index.html'));
  window.webContents.openDevTools()
};

const createWindow = () => {
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

const createWindowBoleta = () => {
  windowBoleta = new electronBrowserWindow({
    icon: __dirname + '/assets/images/favicon.ico',
    width: 500,
    height: 700,
    autoHideMenuBar: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      devTools: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  windowBoleta.loadFile(path.join(__dirname, 'views/boleta.html'));
  windowBoleta.webContents.openDevTools()

  windowBoleta.show();
};


//Querys/Consult SQL
//Querys/Consult SQL
//Querys/Consult SQL 
function getProductos() {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM producto';

    db.query(sql, (error, results, fields) => {
      if (error) {
        reject(error);
        return;
      }

      const Productos = results.map(detalle => ({
        nombre: detalle.nombre,
        precio: detalle.precio,
        codigo_barra: detalle.codigo_barra,
        categoria: detalle.categoria,
        img: detalle.img
      }));

      store.set('productos', Productos);
      resolve();
    });
  });
};

function getVentas() {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM venta';

    db.query(sql, (error, results, fields) => {
      if (error) {
        reject(error);
        return;
      }

      const Ventas = results.map(detalle => ({
        id: detalle.id,
        fecha: detalle.fecha,
        vendedor: detalle.vendedor,
        monto: detalle.monto_total,
        detalles: detalle.detalles
      }));

      store.set('ventas', Ventas);
      resolve();
    });
  });
};

function getCategorias() {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM categoria';

    db.query(sql, (error, results, fields) => {
      if (error) {
        reject(error);
        return;
      }

      const Categorias = results.map(detalle => ({
        nombre: detalle.nombre
      }));

      store.set('categorias', Categorias);
      resolve();
    });
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

function addBoleta(data) {
  const detallesJSON = JSON.stringify(data.detalles);
  const fechaFormateada = convertirFecha(data.fecha);
  const sql = 'INSERT INTO venta (fecha, vendedor, monto_total, detalles) VALUES (?, ?, ?, ?)';
  db.query(sql, [fechaFormateada, data.vendedor, data.monto_total, detallesJSON], (error) => {
    if (error) {
      console.log(error);
    }else{
      store.delete('carrito');
    }
  });
};

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

//Electron Functions
//Electron Functions
//Electron Functions
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

electronIpcMain.on('login', (event, data) => {
  validateLogin(data);
});

electronIpcMain.on('logout', (event, confirm) => {
  validateLogout(confirm);
});


//Electron Functions callback back -> front
//Electron Functions callback back -> front
//Electron Functions callback back -> front
electronIpcMain.handle('getUserData', async (event) => {
  try {
    const categoriasPromise = getCategorias();
    const productosPromise = getProductos();
    const ventasPromise = getVentas();

    // Espera a que todas las consultas se completen y los datos se almacenen en el store
    await Promise.all([categoriasPromise, productosPromise, ventasPromise]);

    // Obtiene los datos del store y los devuelve
    const data = {
      name: store.get('name'),
      email: store.get('email'),
      permissions: store.get('permissions'),
      categorias: store.get('categorias'),
      ventas: store.get('ventas'),
      productos: store.get('productos'),
    };

    return data;
  } catch (error) {
    console.error('Error al obtener los datos del usuario:', error);
    throw error;
  }
});

electronIpcMain.handle('getCarrito', (event) => {
  const data = {
    carrito: store.get('carrito'),
  };
  return data;
});

electronIpcMain.handle('getBoleta', (event) => {
  const data = {
    boleta: store.get('boleta'),
  };
  console.log(data)
  return data;
});

//Electron Functions Send front -> back
//Electron Functions Send front -> back
//Electron Functions Send front -> back
electronIpcMain.on('viewBoleta', (event, data) => {
  console.log('Ver Boleta', data)
  store.set('boleta', data)
  viewBoleta();
});

electronIpcMain.on('generarBoleta', (event, data) => {
  addBoleta(data);
});

electronIpcMain.on('insertProducto', (event, data) => {
  addProducto(data);
});

electronIpcMain.on('updateProducto', (event, data) => {
  updateProducto(data);
});

electronIpcMain.on('deleteProducto', (event, data) => {
  deleteProducto(data);
});

electronIpcMain.on('saveCarrito', (event, data) => {
  if (store.get('carrito')){
    store.delete('carrito');
  }
  store.set('carrito', data);
});

electronIpcMain.on('deleteCarrito', (event, data) => {
  store.delete('carrito');
});


//Templates Menu
//Templates Menu
//Templates Menu
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


//Any Functions
//Any Functions
//Any Functions
function validateLogout(confirm) {
  if (confirm == 'confirm-logout') {
    store.delete('name');
    store.delete('email');
    store.delete('permissions');

    createWindow();
    loginWindow.show();
    window.close();
  }
}

function viewBoleta() {
  if (windowBoleta && !windowBoleta.isDestroyed()) {
    windowBoleta.close();
  }
  createWindowBoleta();
}

function convertirFecha(fecha) {
  // Dividir la fecha en horas y fecha
  const partes = fecha.split(' ');
  const hora = partes[0];
  const fechaParte = partes[1];

  // Dividir la fecha en día, mes y año
  const fechaPartes = fechaParte.split('/');
  const dia = fechaPartes[0];
  const mes = fechaPartes[1];
  const año = fechaPartes[2];

  // Formatear la fecha como 'YYYY-MM-DD HH:MM:SS'
  const fechaFormateada = `${año}-${mes}-${dia} ${hora}:00`;

  return fechaFormateada;
}