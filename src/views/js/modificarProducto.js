let dataProducto; // Variable global para almacenar la instancia de dataProducto
let page;
let data;
let buscar = false;

document.addEventListener('DOMContentLoaded', function () {
    page = new Page(window);
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    const productNameInput = document.getElementById('productNameInput');
    const productPriceInput = document.getElementById('productPriceInput');
    const productBarcodeInput = document.getElementById('productBarcodeInput');
    const productCategorySelect = document.getElementById('productCategorySelect');
    const productImageInput = document.getElementById('productImageInput');
    const productImagePreview = document.getElementById('productImagePreview');

    productNameInput.value = urlParams.get('nombre');
    productPriceInput.value = urlParams.get('precio');
    productBarcodeInput.value = urlParams.get('codigo_barra');
    productCategorySelect.value = urlParams.get('categoria');
    productImageInput.value = urlParams.get('img');

    // Obtener la URL de la imagen del input
    const imageUrl = productImageInput.value;

    // Cuando la imagen se cargue correctamente, asignar la URL al atributo src
    productImagePreview.onload = function() {
        productImagePreview.setAttribute('src', imageUrl);
    };

    // Manejar errores de carga de imagen
    productImagePreview.onerror = function() {
        console.error('Error al cargar la imagen.');
        // Aquí puedes mostrar un mensaje de error o cargar una imagen de respaldo
    };

    // Asignar la URL de la imagen al atributo src de la vista previa de la imagen
    productImagePreview.setAttribute('src', imageUrl);
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

        let addProducto = this.get('#addProducto')
        addProducto.addEventListener('click', this.agregarProducto);
    }

    loadDataUser() {
        window.ipcRender.invoke('getUserData').then((result) => {
            data = result
            if (result.permissions == 'admin') {
                if (result.categorias && result.categorias.length > 0) {
                    const categorySelect = document.getElementById('productCategorySelect');
                    categorySelect.innerHTML = ''; // Limpiar opciones existentes

                    result.categorias.forEach(categoria => {
                        const option = document.createElement('option');
                        option.value = categoria.nombre; // Asignar el nombre de la categoría como valor
                        option.textContent = categoria.nombre; // Asignar el nombre de la categoría como texto visible
                        categorySelect.appendChild(option);
                    });
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
    
    agregarProducto() {
        let agregar = false;
        const productName = document.getElementById('productNameInput').value;
        const productPrice = document.getElementById('productPriceInput').value;
        const productBarcode = document.getElementById('productBarcodeInput').value;
        const productCategory = document.getElementById('productCategorySelect').value;
        const productImg = document.getElementById('productImageInput').value;

        if (productName == ''){
            swal("Algo hiciste mal :(", "No has ingresado un nombre al producto", "error");
            return;
        }
    
        // Verificar que el precio sea numérico
        if (productPrice == '') {
            swal("Algo hiciste mal :(", "No has ingresado un precio", "error");
            return;
        }else if(isNaN(productPrice)){
            swal("Algo hiciste mal :(", "No has ingresado un valor numérico", "error");
            return;
        }
    
        if (productBarcode == ''){
            swal("Algo hiciste mal :(", "No has ingresado un código de barra para el producto", "error");
            return;
        }
    
        // Verificar que la categoría del producto coincida con alguna de las categorías obtenidas del invoke
        const categoriasObtenidas = data.categorias.map(categoria => categoria.nombre); // Obtener solo los nombres de categoría
        console.log(categoriasObtenidas);
        if (!categoriasObtenidas.includes(productCategory)) {
            swal("Algo hiciste mal :(", "La categoría del producto no es válida.", "error");
            return;
        }
    
        data.productos.forEach((producto, index) => {
            if (producto.codigo_barra == productBarcode) {
                agregar = true;
            }
        });


        if (agregar) {
            // Si pasa todas las validaciones, puedes añadir el producto
            // Aquí debes agregar el código para añadir el producto a tu base de datos o hacer cualquier otra operación necesaria
            const newProduct = {
                nombre: productName,
                precio: productPrice,
                codigo_barra: productBarcode,
                categoria: productCategory,
                img: productImg
            };

            window.ipcRender.send('updateProducto', newProduct)

            // También puedes restablecer los campos del formulario después de añadir el producto
            document.getElementById('productNameInput').value = '';
            document.getElementById('productPriceInput').value = '';
            document.getElementById('productBarcodeInput').value = '';
            document.getElementById('productCategorySelect').value = '';
            document.getElementById('productImageInput').value = '';
            document.getElementById('productImagePreview').setAttribute('src', '');

            swal('¡Exitoso! :D', 'Modificaste el producto con éxito', 'success')
        }else{
            swal("Algo hiciste mal :(", "El producto que intentas modificar no existe al parecer.", "error");
        }
    }
}