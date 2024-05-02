let dataProducto; // Variable global para almacenar la instancia de dataProducto
let page;

let data;
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

        //let btnLogout = this.get('#btnLogout');
        //btnLogout.addEventListener('click', this.logout);
    }

    loadDataUser() {
        let profileName = document.getElementById('nombreUser');

        window.ipcRender.invoke('getUserData').then((result) => {
            if (result.permissions == 'admin') {
                data = result
                if (result.productos && result.productos.length > 0) {
                    const dataSet = [];

                    result.productos.forEach((producto, index) => {

                        // Formatear el monto con separador de miles y símbolo de moneda
                        const montoFormateado = new Intl.NumberFormat('es-ES', {
                            style: 'currency',
                            currency: 'CLP'
                        }).format(producto.precio);

                        dataSet.push([
                            producto.nombre,
                            montoFormateado,
                            producto.codigo_barra,
                            producto.categoria
                        ]);
                    });

                    // Verificar si ya existe una instancia de dataProducto
                    if (!dataProducto) {
                        // Inicializar dataProductos con el conjunto de datos construido
                        dataProducto = new DataTable('#productos', {
                            language: {
                                "decimal": "",
                                "emptyTable": "No hay Productos Registrados",
                                "info": "Mostrando _START_ a _END_ de _TOTAL_ Entradas",
                                "infoEmpty": "Mostrando 0 to 0 of 0 Entradas",
                                "infoFiltered": "(Filtrado de _MAX_ total entradas)",
                                "infoPostFix": "",
                                "thousands": ",",
                                "lengthMenu": "Mostrar _MENU_ Entradas",
                                "loadingRecords": "Cargando...",
                                "processing": "Procesando...",
                                "search": "Buscar:",
                                "zeroRecords": "Sin resultados encontrados",
                                "paginate": {
                                    "first": "Primero",
                                    "last": "Ultimo",
                                    "next": "Siguiente",
                                    "previous": "Anterior"
                                }
                            },
                            columns: [
                                { title: 'Nombre' },
                                { title: 'Precio' },
                                { title: 'Código de Barra' },
                                { title: 'Categoría' },
                            ],
                            data: dataSet
                        });
                    } else {
                        // Si ya existe una instancia de dataProducto, simplemente actualiza los datos
                        dataProducto.clear().rows.add(dataSet).draw();
                    }
                }
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
}
