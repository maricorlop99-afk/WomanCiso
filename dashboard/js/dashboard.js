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