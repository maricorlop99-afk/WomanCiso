let ultimaAlerta = "";

async function cargarEventos() {

    try{

        const res = await fetch("http://127.0.0.1:8000/eventos");

        const datos = await res.json();

        const tabla = document.getElementById("tabla");

        tabla.innerHTML="";

        document.getElementById("total").innerHTML=datos.length;

        document.getElementById("armas").innerHTML=datos.length;

        // Estado del sistema
        document.getElementById("estadoIA").innerHTML="ONLINE";

        if(datos.length>0){

            const ultimo=datos[0];

            // Mostrar VIDEO o WEBCAM
            document.getElementById("fuente").innerHTML="VIDEO";

            // Última alerta
            document.getElementById("ultima").innerHTML=`

                <h2>${ultimo.tipo}</h2>

                <h3>${(ultimo.confianza*100).toFixed(1)}%</h3>

                <p>${ultimo.fecha}</p>

            `;

            // Animación cuando llega una nueva alerta
            if(ultimaAlerta!==ultimo.fecha){

                ultimaAlerta=ultimo.fecha;

                document.querySelector(".panel").classList.add("flash");

                setTimeout(()=>{

                    document.querySelector(".panel").classList.remove("flash");

                },1200);

            }

        }

        datos.forEach(evento=>{

            tabla.innerHTML+=`

                <tr>

                    <td>${evento.fecha}</td>

                    <td>

                        <span class="badge">

                            ${evento.tipo}

                        </span>

                    </td>

                    <td>

                        ${(evento.confianza*100).toFixed(1)}%

                    </td>

                </tr>

            `;

        });

    }

    catch(error){

        console.log(error);

    }

}

setInterval(cargarEventos,1000);

cargarEventos();
