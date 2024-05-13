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

        let btnLogout = this.get('#btnLogout');
        btnLogout.addEventListener('click', this.logout);

    }

    loadDataUser() {
        window.ipcRender.invoke('getUserData').then((result) => {
            if (result.permissions == 'admin') {
                data = result
                if (result.ventas && result.ventas.length > 0) {
                    const dataSet = [];

                    result.ventas.forEach((venta, index) => {

                        const fechaFormateada = new Date(venta.fecha).toLocaleString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        });

                        const montoFormateado = new Intl.NumberFormat('es-ES', {
                            style: 'currency',
                            currency: 'CLP'
                        }).format(venta.monto);

                        dataSet.push([
                            fechaFormateada,
                            venta.vendedor,
                            montoFormateado,
                            '<button onclick="detalle_venta(\'' + venta.id + '\')" type="button" class="btn btn-success">Detalle</button>'
                        ]);
                    });

                    // Verificar si ya existe una instancia de dataProducto
                    if (!dataProducto) {
                        // Inicializar dataProductos con el conjunto de datos construido
                        dataProducto = new DataTable('#ventas_registradas', {
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
                                { title: 'Fecha' },
                                { title: 'Vendedor' },
                                { title: 'Monto Total' },
                                { title: 'Opción' },

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
        swal({
            title: "Cerrar Sesión",
            text: "¿Estás seguro de cerrar sesión?",
            icon: "warning",
            buttons: true,
            dangerMode: true,
            buttons: ["Si, cerrar sesión", "No y Volver"],
        }).then((willDelete) => {
            if (willDelete) {
                swal("Continúa con la sesión", {
                    icon: "success",
                });
            } else {
                window.ipcRender.send('logout', 'confirm-logout');
            }
        });
    }

    eliminarProducto(codigo_barra) {
        window.ipcRender.send('deleteProducto', codigo_barra);
    }

    viewPageDetalle(id){
        console.log('Obtener boleta',id)
        window.ipcRender.send('viewBoleta', id);
    }
}

function detalle_venta(id){
    page.viewPageDetalle(id);
}