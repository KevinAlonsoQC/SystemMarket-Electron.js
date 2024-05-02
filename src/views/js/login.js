let email = document.querySelector('#correoLogin');
let password = document.querySelector('#passwordLogin');
let textErrorElement = document.getElementById('text-error');


const login = () => {
    if (!(email.value == '' && password.value == '')) {
        const data = { email: email.value, password: password.value };

        window.ipcRender.send('login', data);

        setTimeout(errorLogin, 300);
    }
}

const errorLogin = () => {
    
    textErrorElement.innerText = 'Credenciales erróneas. Vuelve a Intentarlo.';
    // Cambiar las propiedades de estilo de la letra
    textErrorElement.style.color = 'red !important';

    email.value = '';
    password.value = '';
    email.focus();
}