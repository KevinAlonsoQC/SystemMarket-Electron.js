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
                if (result.productos && result.productos.length > 0) {
                    const dataSet = [];

                    result.productos.forEach((producto, index) => {

                        // Formatear el monto con separador de miles y símbolo de moneda
                        const montoFormateado = new Intl.NumberFormat('es-ES', {
                            style: 'currency',
                            currency: 'CLP'
                        }).format(producto.precio);

                        if (producto.img == '' || producto.img == null || producto.img == undefined) {
                            producto.img = './img/box.png';
                        };

                        console.log(producto.img, producto.nombre)
                        console.log('Producto insertado', producto.codigo_barra)
                        dataSet.push([
                            producto.nombre,
                            montoFormateado,
                            producto.codigo_barra,
                            producto.categoria,
                            '<img style="width:75px; height:75px;" src="' + producto.img + '">',
                            '<button type="button" class="btn btn-primary" onclick="modificarProducto(\'' + producto.nombre + '\', \'' + producto.precio + '\', \'' + producto.codigo_barra + '\', \'' + producto.categoria + '\', \'' + producto.img + '\')">Modificar</button>' +
                            '<br> <br>' +
                            '<button type="button" class="btn btn-warning" onclick="eliminarProducto(\'' + producto.codigo_barra + '\')">Eliminar</button>'
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
                                { title: 'Imagen' },
                                { title: 'Opciones' },


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

    eliminarProducto(codigo_barra){
        window.ipcRender.send('deleteProducto', codigo_barra);
    }
}

function modificarProducto(nombre, precio, codigo_barra, categoria, img) {
    const queryString = `?nombre=${nombre}&precio=${precio}&codigo_barra=${codigo_barra}&categoria=${categoria}&img=${img}`;
    window.location.href = `modificarProducto.html${queryString}`;
}

function eliminarProducto(codigo_barra) {
    const data = {
      codigo_barra: codigo_barra
    }
    console.log('Eliminado',codigo_barra)
    page.eliminarProducto(data);
    page.loadDataUser();
    window.location.href = `ProductoMenu.html`;
    swal("Eliminaste el producto", "Si no ves los cambios, refresca la pestaña para ver los cambios", "success");

}