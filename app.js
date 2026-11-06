
var registros = [];
var editando = null;      
var visibles = {};        
var CLAVE = "expedientes_v1";
var $ = function(id){ return document.getElementById(id); };


var MIN = "abcdefghijklmnñopqrstuvwxyz";
var MAY = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";
function posicion(abc, ch){
  for (var i = 0; i < abc.length; i++) if (abc[i] === ch) return i;
  return -1;
}
function cesar(texto, k){
  var n = MIN.length, salida = "";
  k = ((k % n) + n) % n;
  for (var i = 0; i < texto.length; i++){
    var ch = texto[i], p = posicion(MIN, ch);
    if (p >= 0) { salida += MIN[(p + k) % n]; continue; }
    p = posicion(MAY, ch);
    if (p >= 0) { salida += MAY[(p + k) % n]; continue; }
    salida += ch; 
  }
  return salida;
}
function cifrar(t){ return cesar(t, desplazamiento()); }
function descifrar(t){ return cesar(t, -desplazamiento()); }
function desplazamiento(){
  var v = parseInt($("shift").value, 10);
  return isNaN(v) ? 3 : v;
}

var comparaciones = 0;
function comparar(a, b){
  comparaciones++;
  a = String(a).toLowerCase(); b = String(b).toLowerCase();
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function burbuja(lista, campo){
  var n = lista.length;
  for (var i = 0; i < n - 1; i++){
    var cambio = false;
    for (var j = 0; j < n - 1 - i; j++){
      if (comparar(lista[j][campo], lista[j + 1][campo]) > 0){
        var t = lista[j]; lista[j] = lista[j + 1]; lista[j + 1] = t;
        cambio = true;
      }
    }
    if (!cambio) break;
  }
}
function seleccion(lista, campo){
  var n = lista.length;
  for (var i = 0; i < n - 1; i++){
    var menor = i;
    for (var j = i + 1; j < n; j++){
      if (comparar(lista[j][campo], lista[menor][campo]) < 0) menor = j;
    }
    if (menor !== i){ var t = lista[i]; lista[i] = lista[menor]; lista[menor] = t; }
  }
}

function secuencial(lista, codigo){
  for (var i = 0; i < lista.length; i++){
    if (comparar(lista[i].codigo, codigo) === 0) return i;
  }
  return -1;
}
function binaria(lista, codigo){
  var bajo = 0, alto = lista.length - 1;
  while (bajo <= alto){
    var medio = Math.floor((bajo + alto) / 2);
    var c = comparar(lista[medio].codigo, codigo);
    if (c === 0) return medio;
    if (c < 0) bajo = medio + 1; else alto = medio - 1;
  }
  return -1;
}
function ordenadaPorCodigo(lista){
  for (var i = 0; i < lista.length - 1; i++){
    if (String(lista[i].codigo).toLowerCase() > String(lista[i + 1].codigo).toLowerCase()) return false;
  }
  return true;
}

function esc(s){
  return String(s).replace(/[&<>"']/g, function(c){
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
  });
}
var temporizador;
function aviso(msg, error){
  var t = $("toast");
  t.textContent = msg;
  t.className = "toast on" + (error ? " err" : "");
  clearTimeout(temporizador);
  temporizador = setTimeout(function(){ t.className = "toast"; }, 3200);
}
function existeCodigo(codigo, ignorar){
  for (var i = 0; i < registros.length; i++){
    if (registros[i].codigo.toLowerCase() === codigo.toLowerCase() && registros[i].codigo !== ignorar) return true;
  }
  return false;
}
function autoguardar(){
  try { localStorage.setItem(CLAVE, JSON.stringify(registros)); } catch (e) {}
}

function pintar(resaltar){
  var cuerpo = $("rows");
  if (!registros.length){
    cuerpo.innerHTML = '<tr><td colspan="5" class="empty">Aquí aparecerán tus expedientes. Crea uno o abre un archivo JSON.</td></tr>';
  } else {
    var h = "";
    for (var i = 0; i < registros.length; i++){
      var r = registros[i], ver = visibles[r.codigo];
      h += '<tr' + (resaltar === i ? ' class="hit"' : '') + '>' +
        '<td><b>' + esc(r.codigo) + '</b></td>' +
        '<td>' + esc(r.nombre) + ' ' + esc(r.apellido) + '</td>' +
        '<td>' + esc(r.fecha) + '</td>' +
        '<td class="desc ' + (ver ? 'plain' : 'cipher') + '">' + esc(ver ? descifrar(r.descripcion) : r.descripcion) + '</td>' +
        '<td class="btns">' +
          '<button class="ghost small" data-a="ver" data-i="' + i + '">' + (ver ? 'Ocultar' : 'Descifrar') + '</button> ' +
          '<button class="ghost small" data-a="edit" data-i="' + i + '">Editar</button> ' +
          '<button class="danger small" data-a="del" data-i="' + i + '">Eliminar</button>' +
        '</td></tr>';
    }
    cuerpo.innerHTML = h;
  }
  var cnt=$("count"); if(cnt) cnt.textContent=registros.length;
  $("status").textContent = registros.length
    ? "Tienes " + registros.length + (registros.length === 1 ? " expediente" : " expedientes") + " en pantalla. Recuerda guardar en JSON antes de salir."
    : "Todavía no hay expedientes. Abre un archivo o crea el primero.";
}
function limpiarForm(){
  $("f").reset();
  $("fecha").value = new Date().toISOString().slice(0, 10);
  $("codigo").disabled = false;
  $("formTitle").textContent = "Nuevo expediente";
  $("saveBtn").textContent = "Guardar expediente";
  $("cancelBtn").hidden = true;
  editando = null;
}

$("f").addEventListener("submit", function(e){
  e.preventDefault();
  var codigo = $("codigo").value.trim(), nombre = $("nombre").value.trim(),
      apellido = $("apellido").value.trim(), fecha = $("fecha").value,
      desc = $("descripcion").value.trim();
  if (!codigo || !nombre || !apellido || !fecha || !desc){
    aviso("Faltan datos: completa todos los campos para continuar.", true); return;
  }
  if (existeCodigo(codigo, editando)){
    aviso("El código " + codigo + " ya existe. Prueba con otro.", true); return;
  }
  var nuevo = { codigo: codigo, nombre: nombre, apellido: apellido, fecha: fecha, descripcion: cifrar(desc) };
  if (editando !== null){
    for (var i = 0; i < registros.length; i++) if (registros[i].codigo === editando) registros[i] = nuevo;
    aviso("Expediente actualizado.");
  } else {
    registros.push(nuevo);
    aviso("Expediente guardado.");
  }
  autoguardar(); limpiarForm(); pintar();
});
$("cancelBtn").addEventListener("click", limpiarForm);

$("rows").addEventListener("click", function(e){
  var b = e.target.closest("button"); if (!b) return;
  var i = parseInt(b.getAttribute("data-i"), 10), r = registros[i], a = b.getAttribute("data-a");
  if (a === "ver"){ visibles[r.codigo] = !visibles[r.codigo]; pintar(); }
  if (a === "edit"){
    editando = r.codigo;
    $("codigo").value = r.codigo; $("nombre").value = r.nombre; $("apellido").value = r.apellido;
    $("fecha").value = r.fecha; $("descripcion").value = descifrar(r.descripcion);
    $("formTitle").textContent = "Editando " + r.codigo;
    $("saveBtn").textContent = "Guardar cambios";
    $("cancelBtn").hidden = false;
    $("nombre").focus();
    aviso("La descripción se muestra descifrada con tu desplazamiento actual.");
  }
  if (a === "del"){
    if (!confirm("¿Eliminar el expediente " + r.codigo + "? Esta acción no se puede deshacer.")) return;
    registros.splice(i, 1);
    autoguardar(); pintar(); aviso("Expediente eliminado.");
  }
});

function validarLista(datos){
  if (!Array.isArray(datos)) throw new Error("El archivo debe contener una lista de expedientes.");
  if (!datos.length) throw new Error("El archivo está vacío: no encontré ningún expediente.");
  var vistos = {}, campos = ["codigo", "nombre", "apellido", "fecha", "descripcion"];
  for (var i = 0; i < datos.length; i++){
    for (var c = 0; c < campos.length; c++){
      var v = datos[i] && datos[i][campos[c]];
      if (typeof v !== "string" || !v.trim())
        throw new Error("El expediente #" + (i + 1) + " no tiene el campo «" + campos[c] + "».");
    }
    var k = datos[i].codigo.toLowerCase();
    if (vistos[k]) throw new Error("El código " + datos[i].codigo + " está repetido en el archivo.");
    vistos[k] = true;
  }
  return datos;
}
function cargarTexto(texto){
  try {
    registros = validarLista(JSON.parse(texto));
    visibles = {};
    autoguardar(); pintar();
    aviso("Listo: cargué " + registros.length + " expedientes.");
  } catch (err){
    aviso(err instanceof SyntaxError ? "Ese archivo no es un JSON válido." : err.message, true);
  }
}
$("openBtn").addEventListener("click", function(){ $("file").click(); });
$("file").addEventListener("change", function(){
  var f = this.files[0]; if (!f) return;
  var lector = new FileReader();
  lector.onload = function(){ cargarTexto(lector.result); };
  lector.readAsText(f);
  this.value = "";
});
$("downBtn").addEventListener("click", function(){
  if (!registros.length){ aviso("No hay nada que guardar todavía.", true); return; }
  var blob = new Blob([JSON.stringify(registros, null, 2)], { type: "application/json" });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = "expedientes.json";
  document.body.appendChild(a); a.click(); a.remove();
  aviso("Guardado en expedientes.json.");
});
$("demoBtn").addEventListener("click", function(){
  var demo = [
    ["EXP-003","Carlos","Méndez","2026-10-20","Revisión de caso ficticio, seguimiento pendiente"],
    ["EXP-001","Ana","López","2026-10-16","Primera cita del caso ficticio, notas iniciales"],
    ["EXP-005","Lucía","Pérez","2026-10-28","Notas preparatorias sobre elemento de prueba"],
    ["EXP-002","Bruno","Castillo","2026-10-18","Expediente ficticio para práctica de clase"],
    ["EXP-004","Diana","Ramírez","2026-10-25","Caso ficticio en espera de revisión"]
  ];
  registros = demo.map(function(d){
    return { codigo: d[0], nombre: d[1], apellido: d[2], fecha: d[3], descripcion: cifrar(d[4]) };
  });
  visibles = {}; autoguardar(); pintar();
  aviso("Cargué 5 expedientes de ejemplo.");
});


$("sortBtn").addEventListener("click", function(){
  if (registros.length < 2){ aviso("Necesito al menos dos expedientes para ordenar.", true); return; }
  var alg = $("sAlg").value, campo = $("sCampo").value;
  comparaciones = 0;
  if (alg === "burbuja") burbuja(registros, campo); else seleccion(registros, campo);
  autoguardar(); pintar();
  $("sortRes").innerHTML = '<div class="result">Ordenados por <b>' + campo + '</b> con <b>' +
    (alg === "burbuja" ? "burbuja" : "selección") + '</b>: <b>' + comparaciones + '</b> comparaciones para ' + registros.length + ' expedientes.</div>';
});
$("findBtn").addEventListener("click", function(){
  var codigo = $("qCodigo").value.trim(), alg = $("qAlg").value, caja = $("findRes");
  if (!codigo){ aviso("Escribe el código que quieres buscar.", true); return; }
  if (!registros.length){ aviso("Aún no hay expedientes donde buscar.", true); return; }
  if (alg === "binaria" && !ordenadaPorCodigo(registros)){
    caja.innerHTML = '<div class="result bad">Para buscar por mitades la lista debe estar ordenada por código. Ordénala arriba y vuelve a intentarlo.</div>';
    return;
  }
  comparaciones = 0;
  var pos = alg === "binaria" ? binaria(registros, codigo) : secuencial(registros, codigo);
  var metodo = alg === "binaria" ? "binaria" : "secuencial";
  if (pos >= 0){
    pintar(pos);
    caja.innerHTML = '<div class="result">Encontré <b>' + esc(registros[pos].codigo) + '</b> (' + esc(registros[pos].nombre) + ' ' + esc(registros[pos].apellido) +
      ') en la posición ' + (pos + 1) + '. Búsqueda ' + metodo + ': <b>' + comparaciones + '</b> comparaciones.</div>';
  } else {
    pintar();
    caja.innerHTML = '<div class="result bad">No hay ningún expediente con el código «' + esc(codigo) + '». Búsqueda ' + metodo + ': <b>' + comparaciones + '</b> comparaciones.</div>';
  }
});

(function(){
  limpiarForm();
  try {
    var guardado = localStorage.getItem(CLAVE);
    if (guardado) registros = JSON.parse(guardado);
  } catch (e) { registros = []; }
  pintar();
})();
