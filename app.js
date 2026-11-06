
var registros = [];
var editando = null;
var visibles = {};
var CLAVE_LOCAL = "mis_expedientes";
var CLAVE_TEMA = "modo_oscuro";

function $(id) {
  return document.getElementById(id);
}


var alfabetoMin = "abcdefghijklmnñopqrstuvwxyz";
var alfabetoMay = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";

function cifrarTexto(texto, k) {
  var resultado = "";
  var n = alfabetoMin.length;
  k = ((k % n) + n) % n;
  
  for (var i = 0; i < texto.length; i++) {
    var c = texto[i];
    var pos = alfabetoMin.indexOf(c);
    if (pos !== -1) {
      resultado += alfabetoMin[(pos + k) % n];
      continue;
    }
    pos = alfabetoMay.indexOf(c);
    if (pos !== -1) {
      resultado += alfabetoMay[(pos + k) % n];
      continue;
    }
    resultado += c; 
  }
  return resultado;
}

function obtenerDesplazamiento() {
  var val = parseInt($("shift").value);
  return isNaN(val) ? 3 : val;
}

function cifrar(t) {
  return cifrarTexto(t, obtenerDesplazamiento());
}

function descifrar(t) {
  return cifrarTexto(t, -obtenerDesplazamiento());
}


var contadorComparaciones = 0;

function compararCadenas(a, b) {
  contadorComparaciones++;
  a = String(a).toLowerCase();
  b = String(b).toLowerCase();
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function ordenarBurbuja(lista, campo) {
  var n = lista.length;
  for (var i = 0; i < n - 1; i++) {
    var huboCambio = false;
    for (var j = 0; j < n - 1 - i; j++) {
      if (compararCadenas(lista[j][campo], lista[j + 1][campo]) > 0) {
        var temp = lista[j];
        lista[j] = lista[j + 1];
        lista[j + 1] = temp;
        huboCambio = true;
      }
    }
    if (!huboCambio) break;
  }
}

function ordenarSeleccion(lista, campo) {
  var n = lista.length;
  for (var i = 0; i < n - 1; i++) {
    var minimo = i;
    for (var j = i + 1; j < n; j++) {
      if (compararCadenas(lista[j][campo], lista[minimo][campo]) < 0) {
        minimo = j;
      }
    }
    if (minimo !== i) {
      var temp = lista[i];
      lista[i] = lista[minimo];
      lista[minimo] = temp;
    }
  }
}


function buscarSecuencial(lista, codigo) {
  for (var i = 0; i < lista.length; i++) {
    if (compararCadenas(lista[i].codigo, codigo) === 0) {
      return i;
    }
  }
  return -1;
}

function buscarBinaria(lista, codigo) {
  var inicio = 0;
  var fin = lista.length - 1;
  
  while (inicio <= fin) {
    var medio = Math.floor((inicio + fin) / 2);
    var comparacion = compararCadenas(lista[medio].codigo, codigo);
    
    if (comparacion === 0) return medio;
    if (comparacion < 0) {
      inicio = medio + 1;
    } else {
      fin = medio - 1;
    }
  }
  return -1;
}

function estaOrdenadoPorCodigo(lista) {
  for (var i = 0; i < lista.length - 1; i++) {
    if (String(lista[i].codigo).toLowerCase() > String(lista[i + 1].codigo).toLowerCase()) {
      return false;
    }
  }
  return true;
}

function mostrarAviso(mensaje, esError) {
  var toast = $("toast");
  toast.textContent = mensaje;
  toast.style.display = "block";
  if (esError) {
    toast.className = "toast err";
  } else {
    toast.className = "toast";
  }
  
  setTimeout(function() {
    toast.style.display = "none";
  }, 3000);
}

function guardarLocal() {
  try {
    localStorage.setItem(CLAVE_LOCAL, JSON.stringify(registros));
  } catch (e) {
    console.log("Error al guardar localmente");
  }
}

function actualizarTabla(resaltarIndice) {
  var tbody = $("rows");
  tbody.innerHTML = "";
  
  if (registros.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty">No hay expedientes registrados.</td></tr>';
  } else {
    for (var i = 0; i < registros.length; i++) {
      var r = registros[i];
      var estaVisible = visibles[r.codigo];
      
      var tr = document.createElement("tr");
      if (resaltarIndice === i) {
        tr.className = "hit";
      }
      
      var descripcionTexto = estaVisible ? descifrar(r.descripcion) : r.descripcion;
      var claseDesc = estaVisible ? "plain" : "cipher";
      var textoBotonVer = estaVisible ? "Ocultar" : "Descifrar";
      
      tr.innerHTML = '<td><b>' + r.codigo + '</b></td>' +
                     '<td>' + r.nombre + ' ' + r.apellido + '</td>' +
                     '<td>' + r.fecha + '</td>' +
                     '<td class="' + claseDesc + '">' + descripcionTexto + '</td>' +
                     '<td>' +
                       '<button class="ghost small" onclick="toggleVer(' + i + ')">' + textoBotonVer + '</button> ' +
                       '<button class="ghost small" onclick="cargarEdicion(' + i + ')">Editar</button> ' +
                       '<button class="danger small" onclick="eliminarRegistro(' + i + ')">Eliminar</button>' +
                     '</td>';
      tbody.appendChild(tr);
    }
  }
  
  $("count").textContent = registros.length;
  if (registros.length > 0) {
    $("status").textContent = "Tienes " + registros.length + " expediente(s) en pantalla.";
  } else {
    $("status").textContent = "Todavía no hay expedientes. Abre un archivo o crea el primero.";
  }
}

function limpiarFormulario() {
  $("f").reset();
  $("fecha").value = new Date().toISOString().slice(0, 10);
  $("codigo").disabled = false;
  $("formTitle").textContent = "Nuevo expediente";
  $("saveBtn").textContent = "Guardar expediente";
  $("cancelBtn").style.display = "none";
  editando = null;
}

window.toggleVer = function(i) {
  var codigo = registros[i].codigo;
  visibles[codigo] = !visibles[codigo];
  actualizarTabla();
};

window.cargarEdicion = function(i) {
  var r = registros[i];
  editando = r.codigo;
  $("codigo").value = r.codigo;
  $("nombre").value = r.nombre;
  $("apellido").value = r.apellido;
  $("fecha").value = r.fecha;
  $("descripcion").value = descifrar(r.descripcion);
  
  $("formTitle").textContent = "Editando " + r.codigo;
  $("saveBtn").textContent = "Guardar cambios";
  $("cancelBtn").style.display = "inline-block";
  $("nombre").focus();
  mostrarAviso("Cargado para editar.");
};

window.eliminarRegistro = function(i) {
  var r = registros[i];
  if (confirm("¿Estás seguro de eliminar el expediente " + r.codigo + "?")) {
    registros.splice(i, 1);
    guardarLocal();
    actualizarTabla();
    mostrarAviso("Expediente eliminado.");
  }
};

$("f").addEventListener("submit", function(e) {
  e.preventDefault();
  
  var codigo = $("codigo").value.trim();
  var nombre = $("nombre").value.trim();
  var apellido = $("apellido").value.trim();
  var fecha = $("fecha").value;
  var descripcion = $("descripcion").value.trim();
  
  if (!codigo || !nombre || !apellido || !fecha || !descripcion) {
    mostrarAviso("Por favor, llena todos los campos.", true);
    return;
  }
  
  for (var i = 0; i < registros.length; i++) {
    if (registros[i].codigo === codigo && registros[i].codigo !== editando) {
      mostrarAviso("El código ya existe.", true);
      return;
    }
  }
  
  var obj = {
    codigo: codigo,
    nombre: nombre,
    apellido: apellido,
    fecha: fecha,
    descripcion: cifrar(descripcion)
  };
  
  if (editando !== null) {
    for (var j = 0; j < registros.length; j++) {
      if (registros[j].codigo === editando) {
        registros[j] = obj;
      }
    }
    mostrarAviso("Expediente actualizado con éxito.");
  } else {
    registros.push(obj);
    mostrarAviso("Expediente guardado con éxito.");
  }
  
  guardarLocal();
  limpiarFormulario();
  actualizarTabla();
});

$("cancelBtn").addEventListener("click", function() {
  limpiarFormulario();
});

$("sortBtn").addEventListener("click", function() {
  if (registros.length < 2) {
    mostrarAviso("Se necesitan al menos 2 expedientes para ordenar.", true);
    return;
  }
  
  var algoritmo = $("sAlg").value;
  var campo = $("sCampo").value;
  contadorComparaciones = 0;
  
  if (algoritmo === "burbuja") {
    ordenarBurbuja(registros, campo);
  } else {
    ordenarSeleccion(registros, campo);
  }
  
  guardarLocal();
  actualizarTabla();
  
  $("sortRes").innerHTML = '<div class="result">Ordenado por <b>' + campo + '</b> usando <b>' + algoritmo + 
                           '</b>. Total de comparaciones: <b>' + contadorComparaciones + '</b>.</div>';
});

$("findBtn").addEventListener("click", function() {
  var codigoBuscado = $("qCodigo").value.trim();
  var metodo = $("qAlg").value;
  var contenedorRes = $("findRes");
  
  if (!codigoBuscado) {
    mostrarAviso("Escribe un código para buscar.", true);
    return;
  }
  
  if (registros.length === 0) {
    mostrarAviso("No hay expedientes para buscar.", true);
    return;
  }
  
  if (metodo === "binaria" && !estaOrdenadoPorCodigo(registros)) {
    contenedorRes.innerHTML = '<div class="result bad">Error: Para usar búsqueda binaria, la lista debe estar ordenada por código previamente.</div>';
    return;
  }
  
  contadorComparaciones = 0;
  var posicion = -1;
  
  if (metodo === "binaria") {
    posicion = buscarBinaria(registros, codigoBuscado);
  } else {
    posicion = buscarSecuencial(registros, codigoBuscado);
  }
  
  if (posicion !== -1) {
    actualizarTabla(posicion);
    contenedorRes.innerHTML = '<div class="result">¡Encontrado! Expediente <b>' + registros[posicion].codigo + 
                              '</b> en la posición ' + (posicion + 1) + '. Comparaciones: <b>' + contadorComparaciones + '</b>.</div>';
  } else {
    actualizarTabla();
    contenedorRes.innerHTML = '<div class="result bad">No se encontró ningún expediente con el código ' + codigoBuscado + 
                              '. Comparaciones: <b>' + contadorComparaciones + '</b>.</div>';
  }
});

$("openBtn").addEventListener("click", function() {
  $("file").click();
});

$("file").addEventListener("change", function(e) {
  var archivo = e.target.files[0];
  if (!archivo) return;
  
  var lector = new FileReader();
  lector.onload = function(evento) {
    try {
      var datos = JSON.parse(evento.target.result);
      if (Array.isArray(datos)) {
        registros = datos;
        visibles = {};
        guardarLocal();
        actualizarTabla();
        mostrarAviso("Archivo cargado correctamente.");
      } else {
        mostrarAviso("El archivo JSON no tiene el formato correcto.", true);
      }
    } catch (err) {
      mostrarAviso("Error al leer el archivo JSON.", true);
    }
  };
  lector.readAsText(archivo);
  $("file").value = "";
});

$("downBtn").addEventListener("click", function() {
  if (registros.length === 0) {
    mostrarAviso("No hay datos para exportar.", true);
    return;
  }
  
  var datosJson = JSON.stringify(registros, null, 2);
  var blob = new Blob([datosJson], { type: "application/json" });
  var url = URL.createObjectURL(blob);
  
  var enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = "expedientes.json";
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  
  mostrarAviso("Archivo JSON descargado.");
});

$("demoBtn").addEventListener("click", function() {
  var datosDemo = [
    ["EXP-003", "Carlos", "Méndez", "2026-10-20", "Revisión de caso ficticio, seguimiento pendiente"],
    ["EXP-001", "Ana", "López", "2026-10-16", "Primera cita del caso ficticio, notas iniciales"],
    ["EXP-005", "Lucía", "Pérez", "2026-10-28", "Notas preparatorias sobre elemento de prueba"],
    ["EXP-002", "Bruno", "Castillo", "2026-10-18", "Expediente ficticio para práctica de clase"],
    ["EXP-004", "Diana", "Ramírez", "2026-10-25", "Caso ficticio en espera de revisión"]
  ];
  
  registros = datosDemo.map(function(d) {
    return {
      codigo: d[0],
      nombre: d[1],
      apellido: d[2],
      fecha: d[3],
      descripcion: cifrar(d[4])
    };
  });
  
  visibles = {};
  guardarLocal();
  actualizarTabla();
  mostrarAviso("Datos de ejemplo cargados.");
});

var themeToggleBtn = $("themeToggleBtn");

function aplicarTema(esOscuro) {
  if (esOscuro) {
    document.body.classList.add("dark-mode");
    themeToggleBtn.textContent = "☀️ Modo Claro";
  } else {
    document.body.classList.remove("dark-mode");
    themeToggleBtn.textContent = "🌙 Modo Oscuro";
  }
}

themeToggleBtn.addEventListener("click", function() {
  var esOscuroActual = document.body.classList.contains("dark-mode");
  var nuevoEstado = !esOscuroActual;
  aplicarTema(nuevoEstado);
  try {
    localStorage.setItem(CLAVE_TEMA, nuevoEstado ? "1" : "0");
  } catch (e) {}
});

(function() {
  limpiarFormulario();
  try {
    var guardado = localStorage.getItem(CLAVE_LOCAL);
    if (guardado) {
      registros = JSON.parse(guardado);
    }

    var temaGuardado = localStorage.getItem(CLAVE_TEMA);
    if (temaGuardado === "1") {
      aplicarTema(true);
    }
  } catch (e) {
    registros = [];
  }
  actualizarTabla();
})();
