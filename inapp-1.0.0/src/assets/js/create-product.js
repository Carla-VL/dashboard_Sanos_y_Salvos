const API_BASE_URL = 'http://localhost:8085/api/bff';

document.addEventListener('DOMContentLoaded', () => {
    const formulario = document.getElementById('lostPetForm');
    if (formulario) {
        formulario.addEventListener('submit', registrarMascotaEnBaseDeDatos);
    }
});

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