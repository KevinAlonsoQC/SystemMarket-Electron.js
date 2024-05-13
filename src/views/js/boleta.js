let page;
let data;
let monto_total = 0;
document.addEventListener('DOMContentLoaded', function () {
    page = new Page(window);
});

class Page {
    constructor() {
        this.loadDataUser();
    }

    get(id) {
        return document.querySelector(id);
    }

    loadDataUser() {
        let id_boleta; // Variable para almacenar el resultado de getBoleta
        let profileName = document.getElementById('vendedor');
        let fecha = document.getElementById('fecha');
        let nro_boleta = document.getElementById('nro_boleta');

        // Invoca getBoleta y almacena el resultado en id_boleta
        window.ipcRender.invoke('getBoleta').then((result) => {
            id_boleta = parseInt(result.boleta, 10); // Convierte el ID de la boleta en un número entero
            // Una vez que getBoleta haya completado, invoca getUserData
            window.ipcRender.invoke('getUserData').then((result) => {
                if (result.permissions === 'admin') {
                    data = result;

                    // Filtra la venta que coincide con id_boleta
                    const ventaEncontrada = data.ventas.find(venta => venta.id === id_boleta);

                    if (ventaEncontrada) {
                        const productos_boleta = this.get('#productos_boleta');
                        const monto_boleta = this.get('#monto_boleta');
                        nro_boleta.innerHTML = ventaEncontrada.id;
                        profileName.innerHTML = ventaEncontrada.vendedor;

                        const fechaFormateada = new Date(ventaEncontrada.fecha).toLocaleString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                        fecha.innerHTML = fechaFormateada;

                        let detalle_boleta = ventaEncontrada.detalles;
                        if (typeof detalle_boleta === 'string') {
                            try {
                                console.log('Convertido en matriz')
                                detalle_boleta = JSON.parse(detalle_boleta);
                            } catch (error) {
                                console.error('Error al convertir el detalle de la boleta a matriz:', error);
                            }
                        }
                        productos_boleta.innerHTML = '';

                        // Verifica si detalle_boleta es una matriz
                        if (Array.isArray(detalle_boleta)) {
                            detalle_boleta.forEach(detalle => {
                                const nombreProducto = detalle[0]; // Nombre del producto
                                const montoProducto = detalle[1]; // Monto del producto
                                console.log(montoProducto)

                                monto_total = monto_total + montoProducto; // Actualiza el monto total

                                // Formatear el monto con separador de miles y símbolo de moneda
                                const montoFormateado = new Intl.NumberFormat('es-ES', {
                                    style: 'currency',
                                    currency: 'CLP'
                                }).format(montoProducto);

                                // Crear una nueva fila
                                const newRow = document.createElement('tr');
                                const cell1 = document.createElement('td');

                                cell1.textContent = nombreProducto; // Agrega el nombre del producto a la celda
                                newRow.appendChild(cell1);

                                const cell2 = document.createElement('td');
                                cell2.textContent = montoFormateado; // Agrega el monto formateado a la celda
                                newRow.appendChild(cell2);

                                // Agregar la fila al cuerpo de la tabla
                                productos_boleta.appendChild(newRow);
                            });
                        } else {
                            console.error('El detalle de la boleta no es una matriz.');
                        }

                        // Formatear el monto con separador de miles y símbolo de moneda
                        const monto_Formateado = new Intl.NumberFormat('es-ES', {
                            style: 'currency',
                            currency: 'CLP'
                        }).format(monto_total);
                        monto_boleta.innerHTML = monto_Formateado;
                    } else {
                        console.error('No se encontró ninguna venta con el ID de boleta:', id_boleta);
                    }
                }
            }).catch(error => {
                console.error('Error al obtener los datos del usuario:', error);
            });
        }).catch(error => {
            console.error('Error al obtener la boleta:', error);
        });
    }

}