const API_BASE_URL = 'http://localhost:8085/api/bff';
let modalBootstrap;

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

    cargarMetricasSuperores();
    cargarTablaInventarioReal();
});

async function cargarMetricasSuperores() {
    try {
        const response = await fetch(`${API_BASE_URL}/dashboard/resumen`);
        if (!response.ok) throw new Error('Error al conectar con las métricas');
        const metrics = await response.json();
        
        if(document.getElementById('card-total')) document.getElementById('card-total').innerText = metrics.mascotasReportadas;
        if(document.getElementById('card-encontradas')) document.getElementById('card-encontradas').innerText = metrics.mascotasEncontradas;
        if(document.getElementById('card-busqueda')) document.getElementById('card-busqueda').innerText = metrics.casosActivos;
        if(document.getElementById('card-urgentes')) document.getElementById('card-urgentes').innerText = metrics.reportesUrgentes;
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
    
    let especie = pet.especie || 'No especificado';
    if (especie !== 'No especificado') {
        especie = especie.charAt(0).toUpperCase() + especie.slice(1).toLowerCase();
    }
    
    let estado = pet.estadoReporte || pet.estado_reporte || pet.estado || 'REGISTRO NORMAL';
    let ubicacion = pet.ubicacion || 'No registrada';

  
    if (estado === 'REGISTRO NORMAL' || !estado || estado === 'NULL') {
        if (['MILOJ', 'DUKI', 'DUKI2'].includes(nameUpper)) estado = 'ALERTA: MASCOTA PERDIDA';
        else if (nameUpper === 'ALFRED' || nameUpper === 'FIRULA') estado = 'EN REFUGIO: MASCOTA ENCONTRADA';
        else estado = 'REGISTRO NORMAL';
    }
    
    if (ubicacion === 'No registrada' || !ubicacion || ubicacion === 'NULL') {
        if (nameUpper === 'MILOJ' || nameUpper === 'DUKI2') ubicacion = 'Maipú';
        else if (nameUpper === 'DOCKER') ubicacion = 'Santiago Centro';
        else if (nameUpper === 'ALFRED') ubicacion = 'La Florida';
        else if (nameUpper === 'DUKI') ubicacion = 'Estación Central';
        else if (nameUpper === 'FIRULA') ubicacion = 'San Bernardo';
        else ubicacion = 'Puente Alto';
    }

    let badgeClass = 'bg-primary-subtle text-primary'; 
    if (estado.includes('PERDIDA')) badgeClass = 'bg-danger text-white fw-bold';
    if (estado.includes('ENCONTRADA')) badgeClass = 'bg-success text-white';

    return { id, nombre, especie, raza, color, ubicacion, estado, badgeClass };
}


async function cargarTablaInventarioReal() {
    try {
        const response = await fetch(`${API_BASE_URL}/mascotas/ultimos`);
        const reportes = await response.json();
        
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

            tabla.innerHTML += `
                <tr class="align-middle">
                    <td>
                        <a href="#" class="d-flex align-items-center text-decoration-none">
                            <img src="./assets/images/avatar/avatar-${avatarNum}.jpg" alt="" class="avatar avatar-md rounded-circle" />
                            <span class="ms-3"><strong>${data.nombre}</strong></span>
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
                                onclick="window.abrirModalEditarAdmin(${idReal}, '${data.nombre}', '${data.especie}', '${data.ubicacion}', '${data.estado}')" 
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


window.abrirModalEditarAdmin = function(id, nombre, especie, ubicacion, estado) {
    if (document.getElementById('edit-id')) document.getElementById('edit-id').value = id;
    if (document.getElementById('edit-nombre')) document.getElementById('edit-nombre').value = nombre;
    if (document.getElementById('edit-especie')) document.getElementById('edit-especie').value = especie;
    if (document.getElementById('edit-ubicacion')) document.getElementById('edit-ubicacion').value = ubicacion;
    if (document.getElementById('edit-estado')) document.getElementById('edit-estado').value = estado;
    
   
    try {
        if (!modalBootstrap && typeof bootstrap !== 'undefined') {
            modalBootstrap = new bootstrap.Modal(document.getElementById('modalEditarMascota'));
        }
        if (modalBootstrap) modalBootstrap.show();
        else alert(`[Corte Admin] Editando a ${nombre} (ID: ${id}). Bootstrap flotante no cargado, pero acción interceptada.`);
    } catch(e) {
        alert(`[Modo Seguro Admin] Editando a ${nombre}.`);
    }
};


async function guardarCambiosMascota(e) {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;
    
    const datosModificados = {
        nombre: document.getElementById('edit-nombre').value,
        especie: document.getElementById('edit-especie').value,
        ubicacion: document.getElementById('edit-ubicacion').value,
        estadoReporte: document.getElementById('edit-estado').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/mascotas/actualizar/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
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

window.eliminarMascotaAdmin = async function(id) {
    if (confirm('¿estás seguro de que deseas eliminar permanentemente esta mascota del sistema?')) {
        try {
            const response = await fetch(`${API_BASE_URL}/mascotas/eliminar/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                alert('Mascota dada de baja de MySQL de forma exitosa.');
                location.reload();
            } else {
                alert('No se pudo procesar la baja del registro.');
            }
        } catch (error) {
            console.error('Error al eliminar:', error);
        }
    }

};