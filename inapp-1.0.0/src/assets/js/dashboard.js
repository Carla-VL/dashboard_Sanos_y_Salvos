const API_BASE_URL = 'http://localhost:8085/api/bff';

document.addEventListener('DOMContentLoaded', () => {
    obtenerMetricasDelBff();
    obtenerUltimosCasosDelBff();
});

async function obtenerMetricasDelBff() {
    try {
        const response = await fetch(`${API_BASE_URL}/dashboard/resumen`);
        if (!response.ok) throw new Error('Error al conectar con el servidor API');
        const metrics = await response.json();
        
        // Seteamos los números reales que vienen del backend
        document.getElementById('card-reportadas').innerText = metrics.mascotasReportadas;
        document.getElementById('card-activos').innerText = metrics.casosActivos;
        document.getElementById('card-encontradas').innerText = metrics.mascotasEncontradas;
        document.getElementById('card-urgentes').innerText = metrics.reportesUrgentes;
    } catch (error) {
        console.error('Error al mapear métricas:', error);
    }
}

async function obtenerUltimosCasosDelBff() {
    try {
        const response = await fetch(`${API_BASE_URL}/mascotas/ultimos`);
        const reportes = await response.json();
        
        const tabla = document.getElementById('tabla-reportes-cuerpo');
        tabla.innerHTML = ''; // Limpiamos la maqueta fija
        
        reportes.forEach(pet => {
            tabla.innerHTML += `
                <tr>
                    <td><strong>${pet.nombre}</strong></td>
                    <td>${pet.tipo}</td>
                    <td>${pet.zona}</td>
                    <td><span class="badge bg-${definirBadge(pet.estado)}">${pet.estado}</span></td>
                    <td>${pet.fecha}</td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Error al cargar la tabla de reportes:', error);
    }
}

function definirBadge(estado) {
    switch(estado.toLowerCase()) {
        case 'perdida': return 'warning text-dark';
        case 'en búsqueda': return 'danger';
        case 'encontrado': return 'success';
        case 'urgente': return 'danger fw-bold';
        default: return 'secondary';
    }
}