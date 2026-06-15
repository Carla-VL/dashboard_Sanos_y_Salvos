const API_BASE_URL = 'http://localhost:8085/api/bff';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

console.log("Token Mapbox cargado:", MAPBOX_TOKEN ? "Sí llegó" : "No llegó");

document.addEventListener('DOMContentLoaded', () => {
    const formulario = document.getElementById('lostPetForm');

    inicializarBuscadorDireccion();

    if (formulario) {
        formulario.addEventListener('submit', registrarMascotaEnBaseDeDatos);
    }
});

function inicializarBuscadorDireccion() {
    const inputDireccion = document.getElementById('commune');
    const contenedorSugerencias = document.getElementById('addressSuggestions');

    console.log("Input dirección:", inputDireccion ? "Existe" : "No existe");
    console.log("Contenedor sugerencias:", contenedorSugerencias ? "Existe" : "No existe");

    if (!inputDireccion || !contenedorSugerencias) return;

    let temporizadorBusqueda;

    inputDireccion.addEventListener('input', () => {
        const texto = inputDireccion.value.trim();

        clearTimeout(temporizadorBusqueda);

        if (texto.length < 3) {
            contenedorSugerencias.innerHTML = '';
            contenedorSugerencias.style.display = 'none';
            return;
        }

        contenedorSugerencias.innerHTML = `
            <div class="list-group-item text-muted">
                Buscando direcciones...
            </div>
        `;
        contenedorSugerencias.style.display = 'block';

        temporizadorBusqueda = setTimeout(() => {
            buscarDirecciones(texto, contenedorSugerencias, inputDireccion);
        }, 400);
    });

    document.addEventListener('click', (evento) => {
        if (
            !inputDireccion.contains(evento.target) &&
            !contenedorSugerencias.contains(evento.target)
        ) {
            contenedorSugerencias.style.display = 'none';
        }
    });
}

async function buscarDirecciones(texto, contenedorSugerencias, inputDireccion) {
    try {
        if (!MAPBOX_TOKEN || MAPBOX_TOKEN === '') {
            console.warn('Falta configurar el token de Mapbox.');

            contenedorSugerencias.innerHTML = `
                <div class="list-group-item text-danger">
                    Falta configurar el token de Mapbox.
                </div>
            `;
            contenedorSugerencias.style.display = 'block';
            return;
        }

        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            texto
        )}.json?access_token=${MAPBOX_TOKEN}&country=cl&language=es&limit=5&types=address,place,locality,neighborhood,poi`;

        console.log("Buscando en Mapbox:", texto);

        const response = await fetch(url);
        const data = await response.json();

        console.log("Respuesta Mapbox:", data);

        contenedorSugerencias.innerHTML = '';

        if (!response.ok) {
            contenedorSugerencias.innerHTML = `
                <div class="list-group-item text-danger">
                    Mapbox rechazó la consulta. Revisa el token.
                </div>
            `;
            contenedorSugerencias.style.display = 'block';
            return;
        }

        if (!data.features || data.features.length === 0) {
            contenedorSugerencias.innerHTML = `
                <div class="list-group-item text-muted">
                    No se encontraron direcciones para "${texto}".
                </div>
            `;
            contenedorSugerencias.style.display = 'block';
            return;
        }

        data.features.forEach((lugar) => {
            const boton = document.createElement('button');

            boton.type = 'button';
            boton.className = 'list-group-item list-group-item-action';
            boton.textContent = lugar.place_name;

            boton.addEventListener('click', () => {
                inputDireccion.value = lugar.place_name;
                contenedorSugerencias.innerHTML = '';
                contenedorSugerencias.style.display = 'none';
            });

            contenedorSugerencias.appendChild(boton);
        });

        contenedorSugerencias.style.display = 'block';
    } catch (error) {
        console.error('Error buscando direcciones:', error);

        contenedorSugerencias.innerHTML = `
            <div class="list-group-item text-danger">
                Error de conexión con Mapbox.
            </div>
        `;
        contenedorSugerencias.style.display = 'block';
    }
}

async function registrarMascotaEnBaseDeDatos(e) {
    e.preventDefault(); 

    const nombreInput = document.getElementById('petName').value;
    const tipoSelect = document.getElementById('petType').value;
    const razaInput = document.getElementById('breed').value || 'Mestizo';
    const colorInput = document.getElementById('color').value || 'No especificado';
    const edadInput = parseInt(document.getElementById('age').value) || 0;
    const contactoInput = document.getElementById('phone').value || 'Sin teléfono';
    const comunaSelect = document.getElementById('commune').value;
    const estadoSelect = document.getElementById('status').value;
    const descripcionInput = document.getElementById('description').value || 'Sin descripción';

    const fotoFile = document.getElementById('petPhoto').files[0];
    let fotoBase64 = ""; 

    if (fotoFile) {
        fotoBase64 = await convertirImagenABase64(fotoFile);
    }

    const especieFormateada = tipoSelect.charAt(0).toUpperCase() + tipoSelect.slice(1);

    let estadoRealMySQL = "REGISTRO NORMAL";

    if (estadoSelect === 'perdida' || estadoSelect === 'busqueda') {
        estadoRealMySQL = "ALERTA: MASCOTA PERDIDA";
    } else if (estadoSelect === 'encontrada') {
        estadoRealMySQL = "EN REFUGIO: MASCOTA ENCONTRADA";
    }

    const nuevaMascotaPayload = {
        nombre: nombreInput,
        especie: especieFormateada,
        raza: razaInput,
        color: colorInput,
        edad: edadInput,
        contacto: contactoInput,
        ubicacion: comunaSelect, 
        estadoReporte: estadoRealMySQL,
        descripcion: descripcionInput,
        reproductivo: "No especificado",
        foto: fotoBase64 
    };

    console.log("🚀 [Admin] Enviando configuración a MySQL a través del BFF:", nuevaMascotaPayload);

    try {
        const response = await fetch(`${API_BASE_URL}/mascotas/crear-admin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(nuevaMascotaPayload)
        });

        if (response.ok) {
            alert(`¡Excelente máquina! ${nombreInput} ha sido insertado correctamente con su foto en la base de datos.`);
            window.location.href = 'inventory.html'; 
        } else {
            const errBody = await response.text();
            console.error(" Rechazo interno del microservicio:", errBody);
            alert('Error operativo: El backend rechazó la estructura de datos. Revisa la consola.');
        }
    } catch (error) {
        console.error('Error de red:', error);
        alert('Error de conexión: No se pudo contactar con la API Gateway.');
    }
}

function convertirImagenABase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.readAsDataURL(file);

        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}