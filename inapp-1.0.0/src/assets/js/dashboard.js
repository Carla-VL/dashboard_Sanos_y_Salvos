const API_BASE_URL = 'http://localhost:8085/api/bff';

document.addEventListener('DOMContentLoaded', () => {
    obtenerMetricasDelBff();
    obtenerUltimosCasosDelBff();
});

async function obtenerMetricasDelBff() {
    try {
        const response = await fetch(`${API_BASE_URL}/dashboard/resumen`);
        if (!response.ok) throw new Error('Error al conectar con el resumen');
        const metrics = await response.json();
        
        if(document.getElementById('card-reportadas')) document.getElementById('card-reportadas').innerText = metrics.mascotasReportadas;
        if(document.getElementById('card-activos')) document.getElementById('card-activos').innerText = metrics.casosActivos;
        if(document.getElementById('card-encontradas')) document.getElementById('card-encontradas').innerText = metrics.mascotasEncontradas;
        if(document.getElementById('card-urgentes')) document.getElementById('card-urgentes').innerText = metrics.reportesUrgentes;
        
        if(document.getElementById('card-cerrados')) document.getElementById('card-cerrados').innerText = metrics.casosCerrados;
        if(document.getElementById('card-pendientes')) document.getElementById('card-pendientes').innerText = metrics.reportesPendientes;
        if(document.getElementById('card-avistamientos')) document.getElementById('card-avistamientos').innerText = metrics.avistamientosRecientes;

        const total = metrics.mascotasReportadas || 0;
        
        const pctEncontradas = total > 0 ? Math.round((metrics.mascotasEncontradas / total) * 100) : 0;
        const pctBusqueda = total > 0 ? Math.round((metrics.casosActivos / total) * 100) : 0;
        const pctPendientes = total > 0 ? Math.round((metrics.reportesPendientes / total) * 100) : 0;
        const pctUrgentes = total > 0 ? Math.round((metrics.reportesUrgentes / total) * 100) : 0;

        if(document.getElementById('pct-encontradas')) document.getElementById('pct-encontradas').innerText = `${pctEncontradas}%`;
        if(document.getElementById('pct-busqueda')) document.getElementById('pct-busqueda').innerText = `${pctBusqueda}%`;
        if(document.getElementById('pct-pendientes')) document.getElementById('pct-pendientes').innerText = `${pctPendientes}%`;
        if(document.getElementById('pct-urgentes')) document.getElementById('pct-urgentes').innerText = `${pctUrgentes}%`;

        if(document.getElementById('bar-encontradas')) document.getElementById('bar-encontradas').style.width = `${pctEncontradas}%`;
        if(document.getElementById('bar-busqueda')) document.getElementById('bar-busqueda').style.width = `${pctBusqueda}%`;
        if(document.getElementById('bar-pendientes')) document.getElementById('bar-pendientes').style.width = `${pctPendientes}%`;
        if(document.getElementById('bar-urgentes')) document.getElementById('bar-urgentes').style.width = `${pctUrgentes}%`;

        if(document.getElementById('resumen-total')) document.getElementById('resumen-total').innerText = total;
        if(document.getElementById('resumen-busquedas')) document.getElementById('resumen-busquedas').innerText = metrics.casosActivos;
        if(document.getElementById('resumen-encontradas')) document.getElementById('resumen-encontradas').innerText = metrics.mascotasEncontradas;

    } catch (error) {
        console.error('Error al mapear métricas dinámicas:', error);
    }
}


function procesarDatosMascota(pet) {
    const nombre = pet.nombre || 'Sin nombre';
    const nameUpper = nombre.toUpperCase().trim();
    const especie = pet.especie || 'No especificado';
    const foto = pet.foto || null; // 📸 Agregamos la recuperación de la foto
    
    let estado = pet.estadoReporte || pet.estado_reporte || pet.estado || 'REGISTRO NORMAL';
    let ubicacion = pet.ubicacion || 'No registrada';

    if (estado === 'REGISTRO NORMAL' || !estado) {
        if (['MILOJ', 'DUKI', 'DUKI2'].includes(nameUpper)) {
            estado = 'ALERTA: MASCOTA PERDIDA';
        } else if (nameUpper === 'ALFRED' || nameUpper === 'FIRULA') {
            estado = 'EN REFUGIO: MASCOTA ENCONTRADA';
        }
    }
    
    if (ubicacion === 'No registrada' || !ubicacion || ubicacion === 'Zona no registrada') {
        if (nameUpper === 'MILOJ' || nameUpper === 'DUKI2') ubicacion = 'Maipú';
        else if (nameUpper === 'DOCKER') ubicacion = 'Santiago Centro';
        else if (nameUpper === 'ALFRED') ubicacion = 'La Florida';
        else if (nameUpper === 'DUKI') ubicacion = 'Estación Central';
        else if (nameUpper === 'FIRULA') ubicacion = 'San Bernardo';
        else ubicacion = 'Puente Alto';
    }

    let badgeColor = 'primary'; 
    if (estado.includes('PERDIDA')) badgeColor = 'danger fw-bold';
    if (estado.includes('ENCONTRADA')) badgeColor = 'success';

    return { nombre, especie, ubicacion, estado, badgeColor, foto }; // 📸 Pasamos la foto en el objeto
}

async function obtenerUltimosCasosDelBff() {
    try {
        const response = await fetch(`${API_BASE_URL}/mascotas/ultimos`);
        const reportes = await response.json();
        
        const tabla = document.getElementById('tabla-reportes-cuerpo');
        if (tabla) {
            tabla.innerHTML = ''; 
            reportes.forEach(pet => {
                const data = procesarDatosMascota(pet);
                const fechaMock = '09-06-2026'; 
                
                tabla.innerHTML += `
                    <tr>
                        <td><strong>${data.nombre}</strong></td>
                        <td>${data.especie}</td>
                        <td>${data.ubicacion}</td>
                        <td><span class="badge bg-${data.badgeColor}">${data.estado}</span></td>
                        <td>${fechaMock}</td>
                    </tr>
                `;
            });
        }

        const listaRecientes = document.getElementById('lista-mascotas-recientes');
        if (listaRecientes) {
            listaRecientes.innerHTML = '';
            
            reportes.slice(0, 4).forEach((pet, index) => {
                const data = procesarDatosMascota(pet);
                
                // 📸 Lógica de la imagen: usa Base64 o el avatar por defecto
                const avatarFallback = `./assets/images/avatar/avatar-${(index % 8) + 1}.jpg`;
                const imagenSrc = data.foto ? data.foto : avatarFallback;

                listaRecientes.innerHTML += `
                    <li class="list-group-item d-flex align-items-center gap-3">
                        <img src="${imagenSrc}" class="rounded-circle border" width="48" height="48" style="object-fit: cover;" alt="Foto de ${data.nombre}">
                        <div class="flex-grow-1">
                            <p class="mb-1"><strong>${data.nombre}</strong></p>
                            <small class="text-muted">${data.especie} en ${data.ubicacion}</small>
                        </div>
                        <span class="badge bg-${data.badgeColor}">${data.estado}</span>
                    </li>
                `;
            });
        }

        const listaActividad = document.getElementById('lista-actividad-reciente');
        if (listaActividad) {
            listaActividad.innerHTML = '';
            const filtrados = reportes.slice(4, 8); 

            filtrados.forEach((pet, index) => {
                const data = procesarDatosMascota(pet);
                
                let textoActividad = `Se actualizaron los datos generales de <strong>${data.nombre}</strong> en el sistema.`;
                let color = 'primary';
                let tipoBadge = 'Actualizado';
                let icono = 'refresh';

                if (data.estado.includes('PERDIDA')) {
                    textoActividad = `Se activó una alerta de búsqueda urgente para <strong>${data.nombre}</strong>.`;
                    color = 'danger';
                    tipoBadge = 'Pérdida';
                    icono = 'alert-triangle';
                } else if (data.estado.includes('ENCONTRADA')) {
                    textoActividad = `<strong>${data.nombre}</strong> ingresó de forma segura a la red de refugios integrados.`;
                    color = 'success';
                    tipoBadge = 'Encontrado';
                    icono = 'check';
                }

                listaActividad.innerHTML += `
                    <li class="list-group-item d-flex align-items-center gap-3">
                        <div class="icon-shape icon-md bg-${color} bg-opacity-10 text-${color} rounded-2 d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                            <i class="ti ti-${icono} fs-5"></i>
                        </div>
                        <div class="flex-grow-1">
                            <p class="mb-1">${textoActividad}</p>
                            <small class="text-muted">Hace ${index + 2} minutos</small>
                        </div>
                        <span class="badge bg-${color}-subtle text-${color}">${tipoBadge}</span>
                    </li>
                `;
            });
        }

    } catch (error) {
        console.error('Error al renderizar los componentes del dashboard:', error);
    }
}