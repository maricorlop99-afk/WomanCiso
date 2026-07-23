async function cargarEventos(){

const res = await fetch("http://127.0.0.1:8000/eventos");

const datos = await res.json();

const tabla = document.getElementById("tabla");

tabla.innerHTML="";

document.getElementById("total").innerHTML=datos.length;

document.getElementById("armas").innerHTML=datos.length;

if(datos.length>0){

const ultimo=datos[0];

document.getElementById("ultima").innerHTML=`

<h2>${ultimo.tipo}</h2>

<h3>${(ultimo.confianza*100).toFixed(1)}%</h3>

<p>${ultimo.fecha}</p>

`;

}

datos.forEach(evento=>{

tabla.innerHTML+=`

<tr>

<td>${evento.fecha}</td>

<td>${evento.tipo}</td>

<td>${evento.confianza}</td>

</tr>

`;

});

}

setInterval(cargarEventos,1000);

cargarEventos();