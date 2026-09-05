<<<<<<< HEAD
// =====================================================
// CENTINELA-X · DASHBOARD (versión final mejorada)
// =====================================================

const API_BASE = '';
const POLL_INTERVAL = 3000;    // cada 3 segundos para eventos y estado

// Elementos DOM
const totalAlertasEl = document.getElementById('totalAlertas');
const totalArmasEl = document.getElementById('totalArmas');
const ultimaActualizacionEl = document.getElementById('ultimaActualizacion');
const estadoSistemaEl = document.getElementById('estadoSistema');
const statusDetailEl = document.getElementById('statusDetail');
const eventList = document.getElementById('event-list');
const searchInput = document.getElementById('searchInput');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');
const registrosMostrados = document.getElementById('registrosMostrados');
const ultimaAlertaDiv = document.getElementById('ultima-alerta');

// Elementos de salud del sistema
const healthIa = document.getElementById('health-ia');
const healthCamera = document.getElementById('health-camera');
const healthApi = document.getElementById('health-api');
const healthDb = document.getElementById('health-db');
const healthTelegram = document.getElementById('health-telegram');
const yoloFps = document.getElementById('yolo-fps');
const yoloGpu = document.getElementById('yolo-gpu');

// Estado
let todosEventos = [];
let eventosFiltrados = [];
let paginaActual = 1;
const ITEMS_POR_PAGINA = 10;
let chart = null;
let ultimoEventoId = null;

// ========== UTILIDADES ==========
function obtenerNombreArchivo(ruta) {
    if (!ruta) return '';
    return ruta.replace(/^.*[\\\/]/, '');
}

// ========== OBTENER EVENTOS ==========
async function obtenerEventos() {
    try {
        const resp = await fetch('/eventos');
        if (!resp.ok) throw new Error('Error en la red');
        return await resp.json();
    } catch (error) {
        console.error('❌ Error obteniendo eventos:', error);
        if (estadoSistemaEl) {
            estadoSistemaEl.textContent = 'OFFLINE';
            statusDetailEl.textContent = 'Error de conexión';
        }
        return [];
    }
}

// ========== ACTUALIZAR ESTADÍSTICAS ==========
function actualizarEstadisticas(eventos) {
    const total = eventos.length;
    const armas = eventos.filter(e => e.tipo && e.tipo.toLowerCase() === 'pistol').length;
    if (totalAlertasEl) totalAlertasEl.textContent = String(total).padStart(2, '0');
    if (totalArmasEl) totalArmasEl.textContent = String(armas).padStart(2, '0');
    const now = new Date();
    if (ultimaActualizacionEl) {
        ultimaActualizacionEl.textContent = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    if (estadoSistemaEl) {
        estadoSistemaEl.textContent = 'ACTIVO';
        statusDetailEl.textContent = 'Conectado';
    }
}

// ========== MOSTRAR ÚLTIMA ALERTA ==========
function mostrarUltimaAlerta(eventos) {
    if (!ultimaAlertaDiv) return;
    if (!eventos || eventos.length === 0) {
        ultimaAlertaDiv.innerHTML = `
            <div class="alert-empty">
                <i class="fa-solid fa-shield-halved"></i>
                <h3>Sin alertas recientes</h3>
                <p>Las alertas generadas por el sistema aparecerán aquí.</p>
            </div>
        `;
        return;
    }
    const ultimo = eventos[0];
    const nombreArchivo = obtenerNombreArchivo(ultimo.imagen);
    const imagenUrl = nombreArchivo ? `/evidence/${nombreArchivo}` : null;

    ultimaAlertaDiv.innerHTML = `
        <div class="alerta-contenido">
            <div class="alerta-imagen">
                ${imagenUrl ? `<img src="${imagenUrl}" alt="Evidencia" onerror="this.style.display='none'">` : '<i class="fa-solid fa-image" style="font-size:2rem; color:#475569; display:flex; align-items:center; justify-content:center; height:100%;"></i>'}
            </div>
            <div class="alerta-info">
                <h3>${ultimo.tipo || 'Desconocido'}</h3>
                <div class="confianza">${(ultimo.confianza * 100).toFixed(1)}%</div>
                <div class="fecha">${ultimo.fecha}</div>
            </div>
        </div>
    `;
}

// ========== RENDERIZAR HISTORIAL (con atributos data-* para el modal) ==========
function renderizarHistorial() {
    if (!eventList) return;
    const busqueda = searchInput ? searchInput.value.toLowerCase().trim() : '';
    let filtrados = todosEventos;
    if (busqueda) {
        filtrados = todosEventos.filter(e => e.tipo && e.tipo.toLowerCase().includes(busqueda));
    }
    eventosFiltrados = filtrados;
    const totalItems = filtrados.length;
    const totalPaginas = Math.ceil(totalItems / ITEMS_POR_PAGINA) || 1;
    if (paginaActual > totalPaginas) paginaActual = totalPaginas;
    const inicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
    const fin = Math.min(inicio + ITEMS_POR_PAGINA, totalItems);
    const paginaItems = filtrados.slice(inicio, fin);

    if (paginaItems.length === 0) {
        eventList.innerHTML = `<div class="empty-event"><i class="fa-solid fa-clock-rotate-left"></i><span>No hay eventos que coincidan con la búsqueda.</span></div>`;
    } else {
        let html = '';
        paginaItems.forEach(e => {
            const conf = (e.confianza * 100).toFixed(1);
            let badge = 'baja';
            if (e.confianza > 0.7) badge = 'alta';
            else if (e.confianza > 0.4) badge = 'media';
            const nombreImagen = obtenerNombreArchivo(e.imagen);
            html += `
                <div class="event-item"
                     data-tipo="${e.tipo || 'N/A'}"
                     data-confianza="${e.confianza}"
                     data-fecha="${e.fecha}"
                     data-imagen="${nombreImagen}">
                    <div class="event-info">
                        <strong>${e.tipo || 'N/A'}</strong>
                        <span>${e.fecha}</span>
                    </div>
                    <div>
                        <span class="confianza-badge ${badge}">${conf}%</span>
                        ${nombreImagen ? `<span title="${nombreImagen}">📷</span>` : ''}
                    </div>
                </div>
            `;
        });
        eventList.innerHTML = html;
    }

    if (registrosMostrados) registrosMostrados.textContent = `Mostrando ${totalItems} registros`;
    if (pageInfo) pageInfo.textContent = `Página ${paginaActual} de ${totalPaginas}`;
    if (prevPageBtn) prevPageBtn.disabled = (paginaActual <= 1);
    if (nextPageBtn) nextPageBtn.disabled = (paginaActual >= totalPaginas);
}

// ========== ACTUALIZAR GRÁFICO ==========
function actualizarGrafico(eventos) {
    const ctx = document.getElementById('activityChart');
    if (!ctx) return;

    const hoy = new Date();
    const dias = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(hoy);
        d.setDate(d.getDate() - i);
        dias.push(d.toISOString().split('T')[0]);
    }
    const conteo = dias.map(dia =>
        eventos.filter(e => e.fecha && e.fecha.startsWith(dia)).length
    );

    if (chart) {
        chart.data.datasets[0].data = conteo;
        chart.update();
    } else {
        chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: dias.map(d => {
                    const partes = d.split('-');
                    return `${partes[2]}/${partes[1]}`;
                }),
                datasets: [{
                    label: 'Alertas',
                    data: conteo,
                    backgroundColor: 'rgba(25,167,216,0.6)',
                    borderColor: '#19a7d8',
                    borderWidth: 1,
                    borderRadius: 4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1, color: '#8fa4b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                    x: { ticks: { color: '#8fa4b8' } }
                }
            }
        });
    }
}

// ========== ACTUALIZAR SALUD DEL SISTEMA Y CENTRO IA ==========
async function actualizarSalud() {
    try {
        const resp = await fetch('/status');
        if (!resp.ok) throw new Error('Error en /status');
        const data = await resp.json();

        // Actualizar LEDs de salud
        const leds = [
            { id: healthIa, ok: data.detector_activo },
            { id: healthCamera, ok: data.camera },
            { id: healthApi, ok: data.api },
            { id: healthDb, ok: data.db },
            { id: healthTelegram, ok: data.telegram_configured } // <--- CAMBIO AQUÍ
        ];
        leds.forEach(({ id, ok }) => {
            if (id) {
                id.className = 'health-led ' + (ok ? 'online' : 'offline');
                const parent = id.closest('.health-card');
                if (parent) {
                    const span = parent.querySelector('div span');
                    if (span) span.textContent = ok ? 'OPERATIVO' : 'OFFLINE';
                }
            }
        });

        // Actualizar FPS y GPU en Centro de IA
        if (yoloFps) yoloFps.textContent = data.fps ? data.fps.toFixed(1) : '--';
        if (yoloGpu) yoloGpu.textContent = data.gpu ? 'GPU' : 'CPU';

    } catch (error) {
        console.warn('⚠️ Error al obtener /status:', error);
        // Poner todos los LEDs en offline en caso de error
        document.querySelectorAll('.health-led').forEach(el => {
            el.className = 'health-led offline';
            const parent = el.closest('.health-card');
            if (parent) {
                const span = parent.querySelector('div span');
                if (span) span.textContent = 'OFFLINE';
            }
        });
    }
}

// ========== CARGAR DATOS PRINCIPALES ==========
async function cargarDatos() {
    const eventos = await obtenerEventos();
    if (eventos) {
        todosEventos = eventos;
        actualizarEstadisticas(eventos);
        mostrarUltimaAlerta(eventos);
        renderizarHistorial();
        actualizarGrafico(eventos);
    }
}

// ========== ACTUALIZAR RELOJ ==========
function actualizarReloj() {
    const el = document.getElementById('last-update');
    if (el) {
        const ahora = new Date();
        el.textContent = ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
}

// ========== MODAL DE EVIDENCIA ==========
function initModal() {
    const modal = document.getElementById('modal-evidencia');
    const closeBtn = document.querySelector('.modal-close');

    // Delegación de eventos en el historial
    if (eventList) {
        eventList.addEventListener('click', function (e) {
            const row = e.target.closest('.event-item');
            if (!row) return;
            const imagen = row.dataset.imagen;
            if (!imagen) return;

            const tipo = row.dataset.tipo || 'N/A';
            const confianza = parseFloat(row.dataset.confianza) || 0;
            const fecha = row.dataset.fecha || '';

            document.getElementById('modal-img').src = `/evidence/${imagen}`;
            document.getElementById('modal-tipo').textContent = tipo;
            document.getElementById('modal-confianza').textContent = (confianza * 100).toFixed(1);
            document.getElementById('modal-fecha').textContent = fecha;

            modal.style.display = 'flex';
        });
    }

    // Cerrar con botón
    if (closeBtn) {
        closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    }
    // Cerrar haciendo clic fuera del contenido
    modal.addEventListener('click', function (e) {
        if (e.target === this) this.style.display = 'none';
    });
    // Cerrar con Escape
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            modal.style.display = 'none';
        }
    });
}

// ========== INICIALIZACIÓN ==========
function init() {
    // El video ahora usa /video_feed en el src (no hace falta JS para actualizarlo)
    // Solo aseguramos que el img tenga el src correcto (ya está en HTML)
    // Podríamos forzar recarga si se desea, pero con MJPEG no es necesario.

    actualizarReloj();
    setInterval(actualizarReloj, 1000);

    cargarDatos();
    setInterval(cargarDatos, POLL_INTERVAL);

    // Salud del sistema y Centro IA
    actualizarSalud();
    setInterval(actualizarSalud, POLL_INTERVAL); // misma frecuencia

    // Búsqueda
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            paginaActual = 1;
            renderizarHistorial();
        });
    }

    // Paginación
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (paginaActual > 1) {
                paginaActual--;
                renderizarHistorial();
            }
        });
    }
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            const totalPaginas = Math.ceil(eventosFiltrados.length / ITEMS_POR_PAGINA);
            if (paginaActual < totalPaginas) {
                paginaActual++;
                renderizarHistorial();
            }
        });
    }

    // Navegación sidebar (resaltar)
    document.querySelectorAll('.sidebar-nav a').forEach(enlace => {
        enlace.addEventListener('click', (e) => {
            document.querySelectorAll('.sidebar-nav a').forEach(l => l.classList.remove('active'));
            enlace.classList.add('active');
        });
    });

    // Inicializar modal
    initModal();
}

// Ejecutar al cargar DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
=======
/* =====================================================
   CENTINELA-X
   DASHBOARD
===================================================== */


/* =====================================================
   CONFIGURACIÓN API
===================================================== */

const API_URL = "http://127.0.0.1:8000";


/* =====================================================
   RELOJ / ÚLTIMA ACTUALIZACIÓN
===================================================== */

function actualizarHora() {

    const elemento = document.getElementById("last-update");

    if (!elemento) return;

    const ahora = new Date();

    elemento.textContent =
        ahora.toLocaleTimeString("es-MX", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });

}

actualizarHora();

setInterval(actualizarHora, 1000);


/* =====================================================
   NAVEGACIÓN DEL SIDEBAR
===================================================== */

const enlaces =
    document.querySelectorAll(".sidebar-nav a");

enlaces.forEach(enlace => {

    enlace.addEventListener("click", () => {

        enlaces.forEach(item => {
            item.classList.remove("active");
        });

        enlace.classList.add("active");

    });

});


/* =====================================================
   CARGAR EVENTOS DESDE LA API
===================================================== */

async function cargarEventos() {

    try {

        const respuesta =
            await fetch(`${API_URL}/eventos`);

        if (!respuesta.ok) {

            throw new Error(
                `Error HTTP: ${respuesta.status}`
            );

        }

        const eventos = await respuesta.json();

        console.log("Eventos recibidos:", eventos);

        mostrarEventos(eventos);

    } catch (error) {

        console.error(
            "No se pudieron cargar los eventos:",
            error
        );

    }

}


/* =====================================================
   MOSTRAR HISTORIAL DE EVENTOS
===================================================== */

function mostrarEventos(eventos) {

    const lista =
        document.getElementById("event-list");

    if (!lista) return;


    /* =========================================
       SIN EVENTOS
    ========================================= */

    if (!eventos || eventos.length === 0) {

        lista.innerHTML = `
            <div class="empty-event">

                <i class="fa-solid fa-clock-rotate-left"></i>

                <span>
                    No hay eventos registrados.
                </span>

            </div>
        `;

        return;
    }


    /* =========================================
       HISTORIAL
    ========================================= */

    lista.innerHTML = eventos.map(evento => {

        const confianza =
            (evento.confianza * 100).toFixed(1);

        return `
            <div class="event-item">

                <div>
                    <strong>
                        ${evento.tipo}
                    </strong>

                    <span>
                        ${evento.fecha}
                    </span>
                </div>

                <div>
                    <span>
                        Confianza
                    </span>

                    <strong>
                        ${confianza}%
                    </strong>
                </div>

            </div>
        `;

    }).join("");


    /* =========================================
       ÚLTIMA ALERTA
    ========================================= */

    mostrarUltimaAlerta(eventos[0]);

}

function mostrarUltimaAlerta(evento) {

    const contenedor =
        document.querySelector(".latest-alert");

    if (!contenedor || !evento) return;


    const confianza =
        (evento.confianza * 100).toFixed(1);


    contenedor.innerHTML = `

        <div class="alert-header">

            <span>
                ÚLTIMA ALERTA
            </span>

            <i class="fa-solid fa-bell"></i>

        </div>


        <div class="alert-content">

            <div class="alert-icon">

                <i class="fa-solid fa-triangle-exclamation"></i>

            </div>


            <h3>
                ${evento.tipo}
            </h3>


            <p>
                Detección registrada por el sistema
            </p>


            <div class="alert-data">

                <span>
                    CONFIDENCIA
                </span>

                <strong>
                    ${confianza}%
                </strong>

            </div>


            <div class="alert-data">

                <span>
                    FECHA
                </span>

                <strong>
                    ${evento.fecha}
                </strong>

            </div>

        </div>

    `;
}

/* =====================================================
   ACTUALIZAR MÉTRICAS
===================================================== */

function actualizarMetricas(eventos) {

    const eventosTotal =
        document.getElementById("events-total");

    const alertasTotal =
        document.getElementById("alerts-total");


    if (eventosTotal) {

        eventosTotal.textContent =
            String(eventos.length).padStart(2, "0");

    }


    if (alertasTotal) {

        alertasTotal.textContent =
            String(eventos.length).padStart(2, "0");

    }

}


/* =====================================================
   CARGAR DATOS DEL DASHBOARD
===================================================== */

async function cargarDashboard() {

    try {

        const respuesta =
            await fetch(`${API_URL}/eventos`);

        if (!respuesta.ok) {

            throw new Error(
                `Error HTTP: ${respuesta.status}`
            );

        }

        const eventos =
            await respuesta.json();


        console.log(
            "Dashboard cargado:",
            eventos
        );


        mostrarEventos(eventos);

        actualizarMetricas(eventos);


    } catch (error) {

        console.error(
            "Error cargando dashboard:",
            error
        );

    }

}


/* =====================================================
   INICIAR DASHBOARD
===================================================== */

cargarDashboard();
>>>>>>> e68499e60b8247eade71171f953165b5194f4e62
