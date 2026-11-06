
var registros = [];
var editando = null;      
var visibles = {};        
var CLAVE = "expedientes_v2";
var $ = function(id){ return document.getElementById(id); };


var CMIN = "abcdefghijklmnopqrstuvwxyz";           
var CMAY = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
var MIN = "abcdefghijklmnopqrstuvwxyzñáéíóúü";      
var MAY = "ABCDEFGHIJKLMNOPQRSTUVWXYZÑÁÉÍÓÚÜ";
var DIGITOS = "0123456789";


function posicion(abc, ch){
  for (var i = 0; i < abc.length; i++) if (abc[i] === ch) return i;
  return -1;
}
function minusculas(texto){                          
  var salida = "";
  for (var i = 0; i < texto.length; i++){
    var p = posicion(MAY, texto[i]);
    salida += (p >= 0) ? MIN[p] : texto[i];
  }
  return salida;
}
function esEspacio(c){ return c === " " || c === "\n" || c === "\r" || c === "\t"; }
function recortar(texto){                            
  var ini = 0, fin = texto.length;
  while (ini < fin && esEspacio(texto[ini])) ini++;
  while (fin > ini && esEspacio(texto[fin - 1])) fin--;
  var salida = "";
  for (var i = ini; i < fin; i++) salida += texto[i];
  return salida;
}
function leerEntero(texto){                          
  var n = 0, hay = false;
  for (var i = 0; i < texto.length; i++){
    var d = posicion(DIGITOS, texto[i]);
    if (d < 0) break;
    n = n * 10 + d; hay = true;
  }
  return hay ? n : null;
}
function escapar(texto){                             
  var salida = "";
  for (var i = 0; i < texto.length; i++){
    var c = texto[i];
    if (c === "&") salida += "&amp;";
    else if (c === "<") salida += "&lt;";
    else if (c === ">") salida += "&gt;";
    else if (c === '"') salida += "&quot;";
    else if (c === "'") salida += "&#39;";
    else salida += c;
  }
  return salida;
}
function agregar(lista, elemento){ lista[lista.length] = elemento; }   
function quitarEn(lista, pos){                                          
  for (var k = pos; k < lista.length - 1; k++) lista[k] = lista[k + 1];
  lista.length = lista.length - 1;
}

function cesar(texto, k){
 
  var n = CMIN.length, salida = "";
  k = ((k % n) + n) % n;
  for (var i = 0; i < texto.length; i++){
    var ch = texto[i], p = posicion(CMIN, ch);
    if (p >= 0) { salida += CMIN[(p + k) % n]; continue; }
    p = posicion(CMAY, ch);
    if (p >= 0) { salida += CMAY[(p + k) % n]; continue; }
    salida += ch; 
  }
  return salida;
}
function desplazamiento(){
  var v = leerEntero(recortar($("shift").value));
  return v === null ? 3 : v;
}
function cifrar(t){ return cesar(t, desplazamiento()); }
function descifrar(t){ return cesar(t, -desplazamiento()); }

var comparaciones = 0;
function comparar(a, b){
  comparaciones++;
  a = minusculas(a); b = minusculas(b);
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
    var suma = bajo + alto;
    var medio = (suma - (suma % 2)) / 2;   
    var c = comparar(lista[medio].codigo, codigo);
    if (c === 0) return medio;
    if (c < 0) bajo = medio + 1; else alto = medio - 1;
  }
  return -1;
}
function ordenadaPorCodigo(lista){
  for (var i = 0; i < lista.length - 1; i++){
    if (minusculas(lista[i].codigo) > minusculas(lista[i + 1].codigo)) return false;
  }
  return true;
}

var ESCAPES_U = [["00e1","á"],["00e9","é"],["00ed","í"],["00f3","ó"],["00fa","ú"],["00fc","ü"],["00f1","ñ"],
                 ["00c1","Á"],["00c9","É"],["00cd","Í"],["00d3","Ó"],["00da","Ú"],["00dc","Ü"],["00d1","Ñ"],
                 ["00bf","¿"],["00a1","¡"]];
function leerJSON(texto){
  var i = 0, n = texto.length;
  var INVALIDO = "Ese archivo no es un JSON válido.";
  function saltar(){ while (i < n && esEspacio(texto[i])) i++; }
  function esperar(c){
    saltar();
    if (texto[i] !== c) throw INVALIDO + " Se esperaba «" + c + "» cerca de la posición " + (i + 1) + ".";
    i++;
  }
  function cadena(){
    esperar('"');
    var s = "";
    while (true){
      if (i >= n) throw INVALIDO + " Hay un texto sin cerrar.";
      var c = texto[i]; i++;
      if (c === '"') return s;
      if (c !== "\\"){ s += c; continue; }
      var e = texto[i]; i++;
      if (e === "n") s += "\n";
      else if (e === "t") s += "\t";
      else if (e === "r") s += "\r";
      else if (e === '"' || e === "\\" || e === "/") s += e;
      else if (e === "u"){
        var cod = "";
        for (var k = 0; k < 4 && i < n; k++){ cod += minusculas(texto[i]); i++; }
        var letra = null;
        for (var q = 0; q < ESCAPES_U.length; q++) if (ESCAPES_U[q][0] === cod) letra = ESCAPES_U[q][1];
        if (letra === null) throw "El archivo usa un carácter especial (\\u" + cod + ") que esta versión no reconoce.";
        s += letra;
      } else throw INVALIDO;
    }
  }
  function objeto(){
    esperar("{");
    var obj = {};
    saltar();
    if (texto[i] === "}"){ i++; return obj; }
    while (true){
      var clave = cadena();
      esperar(":");
      saltar();
      if (texto[i] !== '"') throw "Todos los datos de un expediente deben ser texto entre comillas.";
      obj[clave] = cadena();
      saltar();
      if (texto[i] === ","){ i++; continue; }
      if (texto[i] === "}"){ i++; return obj; }
      throw INVALIDO;
    }
  }
  saltar();
  if (i >= n) throw "El archivo está vacío: no se encontró ningún expediente.";
  if (texto[i] !== "[") throw "El archivo debe contener una lista de expedientes.";
  i++;
  var lista = [];
  saltar();
  if (texto[i] === "]"){ i++; }
  else {
    while (true){
      agregar(lista, objeto());
      saltar();
      if (texto[i] === ","){ i++; continue; }
      if (texto[i] === "]"){ i++; break; }
      throw INVALIDO;
    }
  }
  saltar();
  if (i < n) throw INVALIDO + " Hay contenido de más al final.";
  return lista;
}

var CAMPOS = ["codigo", "nombre", "apellido", "fecha", "descripcion"];
function textoJSON(t){
  var s = '"';
  for (var i = 0; i < t.length; i++){
    var c = t[i];
    if (c === '"') s += '\\"';
    else if (c === "\\") s += "\\\\";
    else if (c === "\n") s += "\\n";
    else if (c === "\r") s += "\\r";
    else if (c === "\t") s += "\\t";
    else s += c;
  }
  return s + '"';
}
function escribirJSON(lista){
  if (lista.length === 0) return "[]";
  var s = "[\n";
  for (var i = 0; i < lista.length; i++){
    s += "  {\n";
    for (var c = 0; c < CAMPOS.length; c++){
      s += "    " + textoJSON(CAMPOS[c]) + ": " + textoJSON(lista[i][CAMPOS[c]]) + (c < CAMPOS.length - 1 ? "," : "") + "\n";
    }
    s += "  }" + (i < lista.length - 1 ? "," : "") + "\n";
  }
  return s + "]";
}

function validarLista(datos){
  if (datos.length === 0) throw "El archivo está vacío: no se encontró ningún expediente.";
  for (var i = 0; i < datos.length; i++){
    for (var c = 0; c < CAMPOS.length; c++){
      var v = datos[i][CAMPOS[c]];
      if (v === undefined || recortar(v) === "")
        throw "El expediente #" + (i + 1) + " no tiene el campo «" + CAMPOS[c] + "».";
    }
    for (var j = 0; j < i; j++){
      if (minusculas(datos[j].codigo) === minusculas(datos[i].codigo))
        throw "El código " + datos[i].codigo + " está repetido en el archivo.";
    }
  }
  return datos;
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
    if (minusculas(registros[i].codigo) === minusculas(codigo) && registros[i].codigo !== ignorar) return true;
  }
  return false;
}
function autoguardar(){
  try { localStorage.setItem(CLAVE, escribirJSON(registros)); } catch (e) {}
}

function pintar(resaltar){
  var cuerpo = $("rows");
  if (registros.length === 0){
    cuerpo.innerHTML = '<tr><td colspan="5" class="empty">Aquí aparecerán tus expedientes. Crea uno o abre un archivo JSON.</td></tr>';
  } else {
    var h = "";
    for (var i = 0; i < registros.length; i++){
      var r = registros[i], ver = visibles[r.codigo];
      h += '<tr' + (resaltar === i ? ' class="hit"' : '') + '>' +
        '<td><b>' + escapar(r.codigo) + '</b></td>' +
        '<td>' + escapar(r.nombre) + ' ' + escapar(r.apellido) + '</td>' +
        '<td>' + escapar(r.fecha) + '</td>' +
        '<td class="desc ' + (ver ? 'plain' : 'cipher') + '">' + escapar(ver ? descifrar(r.descripcion) : r.descripcion) + '</td>' +
        '<td class="btns">' +
          '<button class="ghost small" data-a="ver" data-i="' + i + '">' + (ver ? 'Ocultar' : 'Descifrar') + '</button> ' +
          '<button class="ghost small" data-a="edit" data-i="' + i + '">Editar</button> ' +
          '<button class="danger small" data-a="del" data-i="' + i + '">Eliminar</button>' +
        '</td></tr>';
    }
    cuerpo.innerHTML = h;
  }
  $("count").textContent = registros.length;
  $("status").textContent = registros.length > 0
    ? "Tienes " + registros.length + (registros.length === 1 ? " expediente" : " expedientes") + " en pantalla. Recuerda guardar en JSON antes de salir."
    : "Todavía no hay expedientes. Abre un archivo o crea el primero.";
}
function limpiarForm(){
  $("f").reset();
  $("codigo").disabled = false;
  $("formTitle").textContent = "Nuevo expediente";
  $("saveBtn").textContent = "Guardar expediente";
  $("cancelBtn").hidden = true;
  editando = null;
}

$("f").addEventListener("submit", function(e){
  e.preventDefault();
  var codigo = recortar($("codigo").value), nombre = recortar($("nombre").value),
      apellido = recortar($("apellido").value), fecha = $("fecha").value,
      desc = recortar($("descripcion").value);
  if (codigo === "" || nombre === "" || apellido === "" || fecha === "" || desc === ""){
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
    agregar(registros, nuevo);
    aviso("Expediente guardado.");
  }
  autoguardar(); limpiarForm(); pintar();
});
$("cancelBtn").addEventListener("click", limpiarForm);

$("rows").addEventListener("click", function(e){
  var b = e.target.closest("button"); if (!b) return;
  var i = leerEntero(b.getAttribute("data-i")), r = registros[i], a = b.getAttribute("data-a");
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
    quitarEn(registros, i);
    autoguardar(); pintar(); aviso("Expediente eliminado.");
  }
});


function cargarTexto(texto){
  try {
    registros = validarLista(leerJSON(texto));
    visibles = {};
    autoguardar(); pintar();
    aviso("Listo: cargué " + registros.length + " expedientes.");
  } catch (err){
    aviso(typeof err === "string" ? err : "No pude leer ese archivo.", true);
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
  if (registros.length === 0){ aviso("No hay nada que guardar todavía.", true); return; }
  var blob = new Blob([escribirJSON(registros)], { type: "application/json" });
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
  registros = [];
  for (var i = 0; i < demo.length; i++){
    var d = demo[i];
    agregar(registros, { codigo: d[0], nombre: d[1], apellido: d[2], fecha: d[3], descripcion: cifrar(d[4]) });
  }
  visibles = {}; autoguardar(); pintar();
  aviso("Se han cargado 5 expedientes de ejemplo.");
});


$("sortBtn").addEventListener("click", function(){
  if (registros.length < 2){ aviso("Se necesitan al menos dos expedientes para ordenar.", true); return; }
  var alg = $("sAlg").value, campo = $("sCampo").value;
  comparaciones = 0;
  if (alg === "burbuja") burbuja(registros, campo); else seleccion(registros, campo);
  autoguardar(); pintar();
  $("sortRes").innerHTML = '<div class="result">Ordenados por <b>' + campo + '</b> con <b>' +
    (alg === "burbuja" ? "burbuja" : "selección") + '</b>: <b>' + comparaciones + '</b> comparaciones para ' + registros.length + ' expedientes.</div>';
});
$("findBtn").addEventListener("click", function(){
  var codigo = recortar($("qCodigo").value), alg = $("qAlg").value, caja = $("findRes");
  if (codigo === ""){ aviso("Escribe el código que quieres buscar.", true); return; }
  if (registros.length === 0){ aviso("Aún no hay expedientes donde buscar.", true); return; }
  if (alg === "binaria" && !ordenadaPorCodigo(registros)){
    caja.innerHTML = '<div class="result bad">Para buscar por mitades la lista debe estar ordenada por código. Ordénala arriba y vuelve a intentarlo.</div>';
    return;
  }
  comparaciones = 0;
  var pos = alg === "binaria" ? binaria(registros, codigo) : secuencial(registros, codigo);
  var metodo = alg === "binaria" ? "binaria" : "secuencial";
  if (pos >= 0){
    pintar(pos);
    caja.innerHTML = '<div class="result">Encontré <b>' + escapar(registros[pos].codigo) + '</b> (' + escapar(registros[pos].nombre) + ' ' + escapar(registros[pos].apellido) +
      ') en la posición ' + (pos + 1) + '. Búsqueda ' + metodo + ': <b>' + comparaciones + '</b> comparaciones.</div>';
  } else {
    pintar();
    caja.innerHTML = '<div class="result bad">No hay ningún expediente con el código «' + escapar(codigo) + '». Búsqueda ' + metodo + ': <b>' + comparaciones + '</b> comparaciones.</div>';
  }
});


(function(){
  limpiarForm();
  try {
    var guardado = localStorage.getItem(CLAVE);
    if (guardado) registros = validarLista(leerJSON(guardado));
  } catch (e) { registros = []; }
  pintar();
})();
