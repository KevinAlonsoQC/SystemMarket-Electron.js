let dataProducto; // Variable global para almacenar la instancia de dataProducto
let page;
let data;
let buscar = false;

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
        const agregar = true;
        const productName = document.getElementById('productNameInput').value;
        const productPrice = document.getElementById('productPriceInput').value;
        const productBarcode = document.getElementById('productBarcodeInput').value;
        const productCategory = document.getElementById('productCategorySelect').value;
        const productImg = document.getElementById('productImageInput').value;

        if (productName == '') {
            swal("Algo hiciste mal :(", "No has ingresado un nombre al producto", "error");
            return;
        }

        // Verificar que el precio sea numérico
        if (productPrice == '') {
            swal("Algo hiciste mal :(", "No has ingresado un precio", "error");
            return;
        } else if (isNaN(productPrice)) {
            swal("Algo hiciste mal :(", "No has ingresado un valor numérico", "error");
            return;
        }

        if (productBarcode == '') {
            swal("Algo hiciste mal :(", "No has ingresado un código de barra para el producto", "error");
            return;
        }

        // Verificar que la categoría del producto coincida con alguna de las categorías obtenidas del invoke
        const categoriasObtenidas = data.categorias.map(categoria => categoria.nombre); // Obtener solo los nombres de categoría
        console.log(categoriasObtenidas);
        if (!categoriasObtenidas.includes(productCategory)) {
            alert('La categoría del producto no es válida.');
            return;
        }

        data.productos.forEach((producto, index) => {
            if (producto.codigo_barra == productBarcode) {
                swal("Algo hiciste mal :(", "Este código de barras ya está registrado en la base de datos.", "error");
                agregar = false;
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

            window.ipcRender.send('insertProducto', newProduct)

            // También puedes restablecer los campos del formulario después de añadir el producto
            document.getElementById('productNameInput').value = '';
            document.getElementById('productPriceInput').value = '';
            document.getElementById('productBarcodeInput').value = '';
            document.getElementById('productCategorySelect').value = '';
            document.getElementById('productImageInput').value = '';
            document.getElementById('productImagePreview').setAttribute('src', '');

            swal('¡Exitoso! :D', 'Añadiste el producto con éxito', 'success')
        }
    }
}

async function buscarProducto() {
    const barcode = document.getElementById('barcodeInput').value;
    const url = `https://go-upc.com/search?q=${barcode}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            swal("No encontramos información :(", "El producto no tiene información. Ingresalo manualmente...", "error");
            throw new Error(`La solicitud a ${url} falló con estado ${response.status}`);
        }

        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const productNameElement = doc.querySelector('h1.product-name');
        const imageElement = doc.querySelector('figure.product-image.mobile img');
        const barcodeTableElement = doc.querySelector('table.table.table-striped td.metadata-label');

        if (productNameElement) {
            const productName = productNameElement.textContent.trim();
            document.getElementById('productNameInput').value = productName;
        } else {
            swal("No encontramos información :(", "El producto no tiene información. Ingresalo manualmente", "error");
            throw new Error('No se encontró el elemento .product-name en la respuesta HTML');
        }

        if (imageElement) {
            const imageUrl = imageElement.getAttribute('src');
            const imageUrlInput = imageElement.getAttribute('src');
            document.getElementById('productImageInput').value = imageUrlInput;
            document.getElementById('productImagePreview').setAttribute('src', imageUrl);
        } else {
            throw new Error('No se encontró el elemento de imagen en la respuesta HTML');
        }

        if (barcodeTableElement && barcodeTableElement.textContent.trim() === 'EAN') {
            const barcodeNumber = barcodeTableElement.nextElementSibling.textContent.trim();
            document.getElementById('productBarcodeInput').value = barcodeNumber;
        } else {
            throw new Error('No se encontró el número de código de barras en la respuesta HTML');
        }

        // Habilitar los inputs después de obtener la información del producto
        document.getElementById('productNameInput').disabled = false;
        document.getElementById('productPriceInput').disabled = false;
        //document.getElementById('productBarcodeInput').disabled = false;
        document.getElementById('productCategorySelect').disabled = false;
        document.getElementById('productImageInput').disabled = false;
    } catch (error) {
        console.error('Ha ocurrido un error:', error);
    }
}

async function sinBuscar() {
    const buscar = document.getElementById('buscar');
    const nobuscar = document.getElementById('nobuscar');

    const barcodeInput = document.getElementById('barcodeInput');
    const productNameInput = document.getElementById('productNameInput');
    const productPriceInput = document.getElementById('productPriceInput');
    const productBarcodeInput = document.getElementById('productBarcodeInput');
    const productCategorySelect = document.getElementById('productCategorySelect');
    const productImageInput = document.getElementById('productImageInput');

    if (buscar.textContent === '-') {
        // Restaurar el estado para continuar con el escaneo
        barcodeInput.disabled = false;
        buscar.disabled = false;

        productNameInput.disabled = true;
        productPriceInput.disabled = true;
        productBarcodeInput.disabled = true;
        productCategorySelect.disabled = true;
        productImageInput.disabled = true;

        // Restaurar el texto y el evento del botón
        buscar.textContent = 'Buscar Producto';
        nobuscar.textContent = 'Ingresar Manualmente'
        buscar.onclick = buscarProducto; // Restablecer el evento de búsqueda
    } else {
        // Deshabilitar la entrada de código de barras y el botón de búsqueda
        barcodeInput.disabled = true;
        buscar.disabled = true;

        // Habilitar los campos de entrada de nombre, precio, código de barras, categoría e imagen
        productNameInput.disabled = false;
        productPriceInput.disabled = false;
        productBarcodeInput.disabled = false;
        productCategorySelect.disabled = false;
        productImageInput.disabled = false;

        // Cambiar el texto y el evento del botón para continuar con el escaneo
        buscar.textContent = '-';
        nobuscar.textContent = 'Ingresar Automáticamente'
        buscar.onclick = sinBuscar;
    }
}