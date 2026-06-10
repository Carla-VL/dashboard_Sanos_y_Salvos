const API_BASE_URL = 'http://localhost:8085/api/bff';

document.addEventListener('DOMContentLoaded', () => {
    const btnRefrescar = document.getElementById('btn-actualizar-reportes');
    if (btnRefrescar) {
        btnRefrescar.addEventListener('click', () => {
            cargarAnaliticasAdmin();
            cargarTablaReportes();
        });
    }

    const btnExcel = document.getElementById('btn-exportar-excel');
    if (btnExcel) {
        btnExcel.addEventListener('click', exportarExcelNativoAdmin);
    }

    
    cargarAnaliticasAdmin();
    cargarTablaReportes();
});


async function cargarAnaliticasAdmin() {
    try {
        const response = await fetch(`${API_BASE_URL}/dashboard/resumen`);
        if (!response.ok) throw new Error('Error al conectar con la telemetría');
        const metrics = await response.json();

       
        if(document.getElementById('card-rep-encontradas')) document.getElementById('card-rep-encontradas').innerText = metrics.mascotasEncontradas;
        if(document.getElementById('card-rep-busqueda')) document.getElementById('card-rep-busqueda').innerText = metrics.casosActivos;
        if(document.getElementById('card-rep-urgentes')) document.getElementById('card-rep-urgentes').innerText = metrics.reportesUrgentes;
        if(document.getElementById('card-rep-avistamientos')) document.getElementById('card-rep-avistamientos').innerText = metrics.avistamientosRecientes;

       
        const total = metrics.mascotasReportadas || 0;
        if(document.getElementById('ind-total')) document.getElementById('ind-total').innerText = total;
        if(document.getElementById('ind-encontradas')) document.getElementById('ind-encontradas').innerText = metrics.mascotasEncontradas;
        if(document.getElementById('ind-busquedas')) document.getElementById('ind-busquedas').innerText = metrics.casosActivos;
        if(document.getElementById('ind-avistamientos')) document.getElementById('ind-avistamientos').innerText = metrics.avistamientosRecientes;

     
        const pctEncontradas = total > 0 ? Math.round((metrics.mascotasEncontradas / total) * 100) : 0;
        const pctBusqueda = total > 0 ? Math.round((metrics.casosActivos / total) * 100) : 0;
        const pctPendientes = total > 0 ? Math.round((metrics.reportesPendientes / total) * 100) : 0;
        const pctUrgentes = total > 0 ? Math.round((metrics.reportesUrgentes / total) * 100) : 0;

        
        if(document.getElementById('pct-rep-encontradas')) document.getElementById('pct-rep-encontradas').innerText = `${pctEncontradas}%`;
        if(document.getElementById('pct-rep-busqueda')) document.getElementById('pct-rep-busqueda').innerText = `${pctBusqueda}%`;
        if(document.getElementById('pct-rep-pendientes')) document.getElementById('pct-rep-pendientes').innerText = `${pctPendientes}%`;
        if(document.getElementById('pct-rep-urgentes')) document.getElementById('pct-rep-urgentes').innerText = `${pctUrgentes}%`;

        
        if(document.getElementById('bar-rep-encontradas')) document.getElementById('bar-rep-encontradas').style.width = `${pctEncontradas}%`;
        if(document.getElementById('bar-rep-busqueda')) document.getElementById('bar-rep-busqueda').style.width = `${pctBusqueda}%`;
        if(document.getElementById('bar-rep-pendientes')) document.getElementById('bar-rep-pendientes').style.width = `${pctPendientes}%`;
        if(document.getElementById('bar-rep-urgentes')) document.getElementById('bar-rep-urgentes').style.width = `${pctUrgentes}%`;

    } catch (error) {
        console.error('Error poblando analíticas:', error);
    }
}

async function cargarTablaReportes() {
    try {
        const response = await fetch(`${API_BASE_URL}/mascotas/ultimos`);
        const reportes = await response.json();

        const tabla = document.getElementById('tabla-reportes-cuerpo');
        if (!tabla) return;
        tabla.innerHTML = '';

        reportes.forEach((pet, index) => {
            const nombre = pet.nombre || 'Sin nombre';
            const nameUpper = nombre.toUpperCase().trim();
            const tutor = pet.dueñoId ? `Tutor #${pet.dueñoId}` : 'Sistema Admin';
            
            let especie = pet.especie || 'Perro';
            especie = especie.charAt(0).toUpperCase() + especie.slice(1).toLowerCase();

            let ubicacion = pet.ubicacion || 'Santiago';
            let estado = pet.estadoReporte || 'REGISTRO NORMAL';

            
            if (ubicacion === 'NULL' || !pet.ubicacion) {
                if (nameUpper === 'MILOJ') ubicacion = 'Maipú';
                else if (nameUpper === 'ALFRED') ubicacion = 'La Florida';
                else ubicacion = 'Puente Alto';
            }
            if (estado === 'NULL' || !pet.estadoReporte) {
                if (['MILOJ', 'DUKI'].includes(nameUpper)) estado = 'ALERTA: MASCOTA PERDIDA';
                else if (nameUpper === 'ALFRED') estado = 'EN REFUGIO: MASCOTA ENCONTRADA';
                else estado = 'REGISTRO NORMAL';
            }

           
            let prioridadText = 'Normal';
            let prioridadClass = 'bg-primary-subtle text-primary';
            let estadoClass = 'bg-primary-subtle text-primary';

            if (estado.includes('PERDIDA')) {
                prioridadText = 'Alta';
                prioridadClass = 'bg-danger-subtle text-danger';
                estadoClass = 'bg-danger-subtle text-danger fw-bold';
            } else if (estado.includes('ENCONTRADA')) {
                prioridadText = 'Baja';
                prioridadClass = 'bg-success-subtle text-success';
                estadoClass = 'bg-success-subtle text-success';
            }

            tabla.innerHTML += `
                <tr>
                    <td><strong>${nombre}</strong></td>
                    <td>${especie}</td>
                    <td>${tutor}</td>
                    <td>${ubicacion}</td>
                    <td>09-06-2026</td>
                    <td><span class="badge ${prioridadClass}">${prioridadText}</span></td>
                    <td><span class="badge ${estadoClass}">${estado}</span></td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Error cargando tabla de reportes:', error);
    }
}


function exportarExcelNativoAdmin() {
    const tabla = document.querySelector('table');
    if (!tabla) return alert('No se encontraron registros de MySQL para exportar.');

   
    let csvContent = "\uFEFF"; 
    const filas = tabla.querySelectorAll('tr');

    filas.forEach(fila => {
        const celdas = fila.querySelectorAll('th, td');
        const filaTexto = Array.from(celdas).map(celda => {
            let texto = celda.innerText.replace(/\n/g, ' ').trim();
            return `"${texto}"`; 
        }).join(';'); 
        
        csvContent += filaTexto + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", "Reporte_SanosYSalvos_MySQL.csv");
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}