let dataTable; // Variable global para almacenar la instancia de DataTable
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
        profileName.innerHTML = result.name;
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

            // Formatear el monto con separador de miles y símbolo de moneda
            const montoFormateado = new Intl.NumberFormat('es-ES', {
              style: 'currency',
              currency: 'CLP'
            }).format(venta.monto);

            // Agregar fila al conjunto de datos
            dataSet.push([
              fechaFormateada,
              venta.vendedor,
              montoFormateado
            ]);
          });

          // Verificar si ya existe una instancia de DataTable
          if (!dataTable) {
            // Inicializar DataTables con el conjunto de datos construido
            dataTable = new DataTable('#ventas', {
              language: {
                "decimal": "",
                "emptyTable": "No hay información",
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
              ],
              data: dataSet
            });
          } else {
            // Si ya existe una instancia de DataTable, simplemente actualiza los datos
            dataTable.clear().rows.add(dataSet).draw();
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
