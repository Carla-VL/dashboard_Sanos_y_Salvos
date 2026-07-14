const API_BASE_URL =
  window.APP_CONFIG?.API_BFF ||
  "https://34-193-134-184.sslip.io/api/bff";

console.log("API BFF utilizada:", API_BASE_URL);
let modalBootstrap;
let idMascotaAEliminar = null; // Variable para recordar qué mascota borrar
let mascotasActuales = []; // 🧠 MEMORIA GLOBAL: Aquí guardaremos la lista completa

document.addEventListener('DOMContentLoaded', () => {
    try {
        const modalElement = document.getElementById('modalEditarMascota');
        if (modalElement && typeof bootstrap !== 'undefined') {
            modalBootstrap = new bootstrap.Modal(modalElement);
        } else {
            console.warn('Bootstrap no está listo en el contexto global aún.');
        }
    } catch (e) {
        console.error('Aviso de Modal:', e.message);
    }

    try {
        const formEditar = document.getElementById('formEditarMascota');
        if (formEditar) {
            formEditar.addEventListener('submit', guardarCambiosMascota);
        }
    } catch (e) {
        console.error('Aviso de Formulario:', e.message);
    }

    // Escuchador para el botón de confirmar eliminación en el Modal Rojo
    const btnConfirmarEliminar = document.getElementById('btnConfirmarEliminar');
    if (btnConfirmarEliminar) {
        btnConfirmarEliminar.addEventListener('click', async () => {
            if (idMascotaAEliminar) {
                await ejecutarEliminacionEnBackend(idMascotaAEliminar);
            }
        });
    }

    cargarMetricasSuperores();
    cargarTablaInventarioReal();
});

/*
  IMPORTANTE:
  El BFF pide el header "rol" para editar y eliminar.
  El controller acepta ADMIN o VETERINARIO.
*/
function obtenerRolParaBackend() {
    const rolGuardado = localStorage.getItem('rol') || 'ADMIN';

    if (rolGuardado.toUpperCase() === 'ADMINISTRADOR') {
        return 'ADMIN';
    }

    return rolGuardado.toUpperCase();
}

async function cargarMetricasSuperores() {
    try {
        const response = await fetch(`${API_BASE_URL}/dashboard/resumen`);
        if (!response.ok) throw new Error('Error al conectar con las métricas');
        const metrics = await response.json();

        if (document.getElementById('card-total')) {
            document.getElementById('card-total').innerText = metrics.mascotasReportadas;
        }

        if (document.getElementById('card-encontradas')) {
            document.getElementById('card-encontradas').innerText = metrics.mascotasEncontradas;
        }

        if (document.getElementById('card-busqueda')) {
            document.getElementById('card-busqueda').innerText = metrics.casosActivos;
        }

        if (document.getElementById('card-urgentes')) {
            document.getElementById('card-urgentes').innerText = metrics.reportesUrgentes;
        }
    } catch (error) {
        console.error('Error al mapear métricas superiores:', error);
    }
}

function procesarDatosMascota(pet) {
    const id = pet.id || 0;
    const nombre = pet.nombre || 'Sin nombre';
    const nameUpper = nombre.toUpperCase().trim();
    const raza = pet.raza || 'Mestizo';
    const color = pet.color || 'No especificado';
    const foto = pet.foto || null; // 📸 Rescatamos la foto de la BD

    let especie = pet.especie || 'No especificado';
    if (especie !== 'No especificado') {
        especie = especie.charAt(0).toUpperCase() + especie.slice(1).toLowerCase();
    }

    let estado = pet.estadoReporte || pet.estado_reporte || pet.estado || 'REGISTRO NORMAL';
    let ubicacion = pet.ubicacion || 'No registrada';

    if (estado === 'REGISTRO NORMAL' || !estado || estado === 'NULL') {
        if (['MILOJ', 'DUKI', 'DUKI2'].includes(nameUpper)) {
            estado = 'ALERTA: MASCOTA PERDIDA';
        } else if (nameUpper === 'ALFRED' || nameUpper === 'FIRULA') {
            estado = 'EN REFUGIO: MASCOTA ENCONTRADA';
        } else {
            estado = 'REGISTRO NORMAL';
        }
    }

    if (ubicacion === 'No registrada' || !ubicacion || ubicacion === 'NULL') {
        if (nameUpper === 'MILOJ' || nameUpper === 'DUKI2') {
            ubicacion = 'Maipú';
        } else if (nameUpper === 'DOCKER') {
            ubicacion = 'Santiago Centro';
        } else if (nameUpper === 'ALFRED') {
            ubicacion = 'La Florida';
        } else if (nameUpper === 'DUKI') {
            ubicacion = 'Estación Central';
        } else if (nameUpper === 'FIRULA') {
            ubicacion = 'San Bernardo';
        } else {
            ubicacion = 'Puente Alto';
        }
    }

    let badgeClass = 'bg-primary-subtle text-primary';

    if (estado.includes('PERDIDA')) {
        badgeClass = 'bg-danger text-white fw-bold';
    }

    if (estado.includes('ENCONTRADA')) {
        badgeClass = 'bg-success text-white';
    }

    return { id, nombre, especie, raza, color, foto, ubicacion, estado, badgeClass };
}

async function cargarTablaInventarioReal() {
    try {
        const response = await fetch(`${API_BASE_URL}/mascotas/ultimos`);
        const reportes = await response.json();

        // 🧠 Guardamos TODOS los datos originales en la memoria antes de dibujar la tabla
        mascotasActuales = reportes;

        const tabla = document.getElementById('tabla-inventario-cuerpo');
        if (!tabla) return;

        tabla.innerHTML = '';

        if (!Array.isArray(reportes)) {
            console.error("La respuesta del BFF no es un arreglo válido.");
            return;
        }

        reportes.forEach((pet, index) => {
            const data = procesarDatosMascota(pet);
            const idReal = data.id || (index + 1);
            const tutorMock = pet.dueñoId ? `Tutor #${pet.dueñoId}` : 'Sistema Admin';
            const fechaMock = '09-06-2026';
            const avatarNum = (index % 8) + 1;

            // 📸 Lógica para usar la foto en Base64 o el avatar de repuesto
            const imagenSrc = data.foto ? data.foto : `./assets/images/avatar/avatar-${avatarNum}.jpg`;

            tabla.innerHTML += `
                <tr class="align-middle">
                    <td>
                        <a href="#" class="d-flex align-items-center text-decoration-none">
                            <img src="${imagenSrc}" alt="${data.nombre}" class="avatar avatar-md rounded-circle border" style="object-fit: cover; aspect-ratio: 1/1;" />
                            <span class="ms-3 text-dark"><strong>${data.nombre}</strong></span>
                        </a>
                    </td>
                    <td>${data.especie}</td>
                    <td>${data.raza} / <small class="text-muted">${data.color}</small></td>
                    <td>${tutorMock}</td>
                    <td>${data.ubicacion}</td>
                    <td>${fechaMock}</td>
                    <td><span class="badge ${data.badgeClass}">${data.estado}</span></td>
                    <td>
                        <button class="btn btn-sm btn-light text-primary border me-1" 
                                onclick="window.abrirModalEditarAdmin(${idReal})" 
                                title="Editar Caso">
                            ✏️
                        </button>
                        <button class="btn btn-sm btn-light text-danger border" 
                                onclick="window.eliminarMascotaAdmin(${idReal})" 
                                title="Eliminar Registro">
                            🗑️
                        </button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Error al poblar la tabla administrativa:', error);
    }
}

// 🛠️ ACTUALIZADO: Lee correctamente los IDs del modal HTML nuevo
window.abrirModalEditarAdmin = function (id) {
    const petOriginal = mascotasActuales.find(p => p.id == id);
    if (!petOriginal) return;

    const data = procesarDatosMascota(petOriginal);

    if (document.getElementById('edit-id')) {
        document.getElementById('edit-id').value = id;
    }

    if (document.getElementById('edit-nombre')) {
        document.getElementById('edit-nombre').value = data.nombre;
    }

    // MATCH: En el HTML le pusimos edit-tipo
    if (document.getElementById('edit-tipo')) {
        document.getElementById('edit-tipo').value = data.especie;
    }

    // MATCH: Combina Raza y Color
    if (document.getElementById('edit-raza')) {
        let razaColor = petOriginal.raza || '';
        if (petOriginal.color && petOriginal.color !== 'No especificado') {
            razaColor += ' / ' + petOriginal.color;
        }
        document.getElementById('edit-raza').value = razaColor;
    }

    if (document.getElementById('edit-estado')) {
        const estadoSelect = document.getElementById('edit-estado');
        const estadoVal = data.estado.toUpperCase();
        
        let found = false;
        for(let i=0; i<estadoSelect.options.length; i++) {
            if(estadoSelect.options[i].value === estadoVal) {
                estadoSelect.selectedIndex = i;
                found = true;
                break;
            }
        }
        if(!found) document.getElementById('edit-estado').value = "REGISTRO NORMAL";
    }

    try {
        if (!modalBootstrap && typeof bootstrap !== 'undefined') {
            modalBootstrap = new bootstrap.Modal(document.getElementById('modalEditarMascota'));
        }

        if (modalBootstrap) {
            modalBootstrap.show();
        } else {
            alert(`[Corte Admin] Editando a ${data.nombre} (ID: ${id}). Bootstrap flotante no cargado, pero acción interceptada.`);
        }
    } catch (e) {
        alert(`[Modo Seguro Admin] Editando a ${data.nombre}.`);
    }
};

async function guardarCambiosMascota(e) {
    e.preventDefault();

    const id = document.getElementById('edit-id').value;

    // 🧠 Buscamos los datos originales antes de enviar la actualización
    const petOriginal = mascotasActuales.find(p => p.id == id) || {};

    const nombreInput = document.getElementById('edit-nombre');
    const tipoInput = document.getElementById('edit-tipo');
    const razaInput = document.getElementById('edit-raza');
    const estadoInput = document.getElementById('edit-estado');

    // Parseamos la raza y color si el usuario escribió con la barrita "/"
    let razaFinal = petOriginal.raza;
    let colorFinal = petOriginal.color;
    
    if (razaInput && razaInput.value) {
        const partes = razaInput.value.split('/');
        razaFinal = partes[0] ? partes[0].trim() : petOriginal.raza;
        if(partes[1]) colorFinal = partes[1].trim();
    }

    const datosModificados = {
        nombre: nombreInput ? nombreInput.value : petOriginal.nombre,
        especie: tipoInput ? tipoInput.value : petOriginal.especie,
        ubicacion: petOriginal.ubicacion, // Se mantiene el original porque no está en el modal
        estadoReporte: estadoInput ? estadoInput.value : petOriginal.estadoReporte,
        raza: razaFinal,
        color: colorFinal,
        foto: petOriginal.foto // Se mantiene la original
    };

    try {
        const response = await fetch(`${API_BASE_URL}/mascotas/actualizar/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'rol': obtenerRolParaBackend()
            },
            body: JSON.stringify(datosModificados)
        });

        if (response.ok) {
            alert('¡Registro de mascota actualizado con éxito en la base de datos!');
            if (modalBootstrap) modalBootstrap.hide();
            location.reload();
        } else {
            const errorTexto = await response.text();
            alert(`🚨 DIAGNÓSTICO EN VIVO (Status ${response.status}):\n${errorTexto}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de red al intentar conectar con el BFF.');
    }
}

// 🚨 Lógica de eliminación usando el Modal de Bootstrap
window.eliminarMascotaAdmin = function (id) {
    idMascotaAEliminar = id; // Guardamos el ID en la memoria

    const modalElement = document.getElementById('deleteModal');
    if (modalElement && typeof bootstrap !== 'undefined') {
        const modalEliminar = new bootstrap.Modal(modalElement);
        modalEliminar.show();
    } else {
        // Modo seguro si Bootstrap falla
        if (confirm('¿Estás seguro de que deseas eliminar permanentemente esta mascota del sistema?')) {
            ejecutarEliminacionEnBackend(id);
        }
    }
};

// Función que realmente pega al backend para borrar
async function ejecutarEliminacionEnBackend(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/mascotas/eliminar/${id}`, {
            method: 'DELETE',
            headers: {
                'rol': obtenerRolParaBackend()
            }
        });

        if (response.ok) {
            alert('Mascota dada de baja de MySQL de forma exitosa.');
            location.reload();
        } else {
            const errorTexto = await response.text();
            console.error('Error al eliminar:', response.status, errorTexto);
            alert(`No se pudo procesar la baja del registro.\nStatus: ${response.status}\n${errorTexto}`);
        }
    } catch (error) {
        console.error('Error al eliminar:', error);
        alert('Error de red al intentar eliminar la mascota.');
    }
}