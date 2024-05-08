let page;
let data;
let dataCarrito = [];
let monto_total = 0;
const barcodeInput = document.getElementById('barcodeInput');

document.addEventListener('DOMContentLoaded', function () {
    page = new Page(window);
});

class Page {
    constructor() {
        this.attachEvents();
        this.loadDataUser();
    }

    get(id) {
        return document.querySelector(id);
    }

    attachEvents() {
        // Agrega un evento de clic al botón de actualización si tienes uno
        const refreshButton = this.get('#refreshButton');
        if (refreshButton) {
            refreshButton.addEventListener('click', this.refresh.bind(this));
        }
    }

    loadDataUser() {
        window.ipcRender.invoke('getUserData').then((result) => {
            data = result;
            let profileName = document.getElementById('vendedor');
            let fecha = document.getElementById('fecha');
            let nro_boleta = document.getElementById('nro_boleta');

            if (result.permissions == 'admin') {
                data = result
                profileName.innerHTML = result.name;
                if (result.ventas.length == 0) {
                    nro_boleta.innerHTML = 1;
                } else {
                    nro_boleta.innerHTML = result.ventas.length + 1;
                }
                const now = new Date();

                // Obtener horas, minutos, día, mes y año
                const hours = now.getHours().toString().padStart(2, '0'); // Asegura dos dígitos
                const minutes = now.getMinutes().toString().padStart(2, '0'); // Asegura dos dígitos
                const day = now.getDate().toString().padStart(2, '0'); // Asegura dos dígitos
                const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Asegura dos dígitos (los meses son base 0)
                const year = now.getFullYear();

                // Crear una cadena de fecha y hora en el formato deseado
                const formattedDateTime = `${hours}:${minutes} ${day}/${month}/${year}`;
                fecha.innerHTML = formattedDateTime;
            }
        });

        window.ipcRender.invoke('getCarrito').then((result) => {
            if (result.carrito.length > 0) {
                const productos_boleta = this.get('#productos_boleta');
                const monto_boleta = this.get('#monto_total');

                dataCarrito = result.carrito
                productos_boleta.innerHTML = '';

                // Iterar sobre los datos del carrito y crear filas de tabla
                dataCarrito.forEach(producto => {
                    monto_total = monto_total + producto[1]
                    // Formatear el monto con separador de miles y símbolo de moneda
                    const montoFormateado = new Intl.NumberFormat('es-ES', {
                        style: 'currency',
                        currency: 'CLP'
                    }).format(producto[1]);

                    // Crear una nueva fila
                    const newRow = document.createElement('tr');
                    const cell1 = document.createElement('td');

                    cell1.textContent = producto[0]; // Aquí iría el nombre del producto
                    newRow.appendChild(cell1);

                    const cell2 = document.createElement('td');
                    cell2.textContent = montoFormateado; // Aquí iría el precio
                    newRow.appendChild(cell2);

                    // Agregar la fila al cuerpo de la tabla
                    productos_boleta.appendChild(newRow);
                });

                monto_boleta.innerHTML = monto_total;
            } else {
                console.log('Boleta sin datos')
            }
        });

    }
    refresh() {
        // Vuelve a cargar los datos del usuario
        this.loadDataUser();
    }

    logout() {
        window.ipcRender.send('logout', 'confirm-logout');
    }

    async guardarCarrito(dataCarrito) {
        const responde = await window.ipcRender.send('saveCarrito', dataCarrito);
        if (response) {
            console.log('Respuesta')
        } else {
            console.log('Sin respuesta')
        }
    }

    async borrarCarrito() {
        const response = await window.ipcRender.send('deleteCarrito', {});
        if (response) {
            dataCarrito = []
            console.log('Respuesta')
        } else {
            console.log('Sin respuesta')
        }
    }

}

// Mantén el foco en el input incluso cuando se hace clic en otro lugar de la página
document.addEventListener('click', function () {
    barcodeInput.focus();
});

barcodeInput.addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        // Capturar el dato ingresado
        const inputValue = barcodeInput.value;
        buscarProducto(inputValue)
        // También puedes resetear el input después de capturar el dato si lo deseas
        barcodeInput.value = '';
        // Evitar el comportamiento predeterminado de la tecla "Enter" que sería enviar un formulario
        event.preventDefault();
    }
});

async function buscarProducto(inputValue) {
    const monto_boleta = document.getElementById('monto_total');
    const tbody = document.getElementById('productos_boleta');
    const barcode = inputValue;
    const scannedProduct = data.productos.find(producto => producto.codigo_barra === barcode);

    if (scannedProduct) {
        // Formatear el monto con separador de miles y símbolo de moneda
        const montoFormateado = new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'CLP'
        }).format(scannedProduct.precio);

        // Crear una nueva fila
        const newRow = document.createElement('tr');
        const cell1 = document.createElement('td');

        cell1.textContent = scannedProduct.nombre; // Aquí iría el nombre del producto
        newRow.appendChild(cell1);

        const cell2 = document.createElement('td');
        cell2.textContent = montoFormateado; // Aquí iría el precio
        newRow.appendChild(cell2);

        // Agregar la fila al cuerpo de la tabla
        tbody.appendChild(newRow);

        dataCarrito.push([
            scannedProduct.nombre,
            scannedProduct.precio
        ]);

        // Limpiar el input después de agregar el producto
        barcodeInput.value = '';
        monto_total = monto_total + scannedProduct.precio;
        monto_boleta.innerHTML = monto_total;
    } else {
        await swal({
            title: "El producto escaneado no fue encontrado :(",
            text: "¿Quieres Agregarlo y luego continuar con la venta? ¿O quieres no agregarlo y continuar con la venta?",
            icon: "warning",
            buttons: true,
            dangerMode: true,
            buttons: ["Añadir y continuar venta luego", "No añadir y continuar venta"],
        }).then((willDelete) => {
            if (willDelete) {
                swal("Continúa con la venta", {
                    icon: "success",
                });
            } else {
                page.guardarCarrito(dataCarrito);
                window.location.href = `agregarProducto.html`;
            }
        });
    }
}

async function goToPage(pageName) {
    if (dataCarrito.length > 0 ? dataCarrito.length : false) {
        await swal({
            title: "Carrito Sin Guardar",
            text: "Tienes una boleta sin guardar. ¿Deseas borrar los cambios?",
            icon: "warning",
            buttons: true,
            dangerMode: true,
            buttons: ["Guardar Cambios", "Borrar y Salir"],
        }).then((willDelete) => {
            if (willDelete) {
                page.borrarCarrito();
                window.location.href = `${pageName}.html`;
            } else {
                page.guardarCarrito(dataCarrito);
                window.location.href = `${pageName}.html`;
            }
        });
    } else {
        window.location.href = `${pageName}.html`;
    }
}