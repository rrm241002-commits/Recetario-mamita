const paramsEdit = new URLSearchParams(window.location.search);
const idEditar = paramsEdit.get("id");

let fotoPrincipalNueva = null; // File
let fotoPrincipalActualURL = null; // string ya guardado en Supabase
let fotosExtraNuevas = []; // File[]
let fotosExtraActuales = []; // string[] ya guardadas

async function iniciar() {
  const sesion = await exigirSesion();
  if (!sesion) return;

  document.getElementById("nombre-recetario").textContent = NOMBRE_RECETARIO;
  document.getElementById("btn-salir").addEventListener("click", cerrarSesion);

  await cargarCategoriasExistentes();
  crearFilaIngrediente();
  crearFilaPaso();

  if (idEditar) {
    document.getElementById("titulo-formulario").textContent = "Editar receta";
    document.title = "Editar receta — " + NOMBRE_RECETARIO;
    document.getElementById("btn-eliminar").classList.remove("oculto");
    await cargarRecetaExistente(idEditar);
  }

  document.getElementById("anadir-ingrediente").addEventListener("click", () => crearFilaIngrediente());
  document.getElementById("anadir-paso").addEventListener("click", () => crearFilaPaso());
  document.getElementById("foto_principal").addEventListener("change", onSeleccionFotoPrincipal);
  document.getElementById("fotos_extra").addEventListener("change", onSeleccionFotosExtra);
  document.getElementById("form-receta").addEventListener("submit", guardarReceta);
  document.getElementById("btn-eliminar").addEventListener("click", eliminarReceta);
}

async function cargarCategoriasExistentes() {
  const { data } = await cliente.from("recetas").select("categoria");
  const categorias = [...new Set((data || []).map(r => r.categoria).filter(Boolean))];
  const datalist = document.getElementById("lista-categorias");
  categorias.forEach(c => {
    const op = document.createElement("option");
    op.value = c;
    datalist.appendChild(op);
  });
}

const ICONO_QUITAR = '<svg class="icono" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>';

function crearFilaIngrediente(valores = {}) {
  const cont = document.getElementById("lista-ingredientes-form");
  const fila = document.createElement("div");
  fila.className = "fila-dinamica";
  fila.innerHTML = `
    <input type="text" class="cant-input" placeholder="Cantidad" value="${escAttr(valores.cantidad)}">
    <input type="text" class="unidad-input" placeholder="Unidad" value="${escAttr(valores.unidad)}">
    <input type="text" class="nombre-input" placeholder="Ingrediente" value="${escAttr(valores.nombre)}">
    <button type="button" class="quitar-fila" title="Quitar">${ICONO_QUITAR}</button>
  `;
  fila.querySelector(".quitar-fila").addEventListener("click", () => fila.remove());
  cont.appendChild(fila);
}

function crearFilaPaso(valor = "") {
  const cont = document.getElementById("lista-pasos-form");
  const fila = document.createElement("div");
  fila.className = "fila-dinamica";
  fila.innerHTML = `
    <textarea class="paso-input" rows="2" placeholder="Describe este paso">${escHTML(valor)}</textarea>
    <button type="button" class="quitar-fila" title="Quitar">${ICONO_QUITAR}</button>
  `;
  fila.querySelector(".quitar-fila").addEventListener("click", () => fila.remove());
  cont.appendChild(fila);
}

async function cargarRecetaExistente(id) {
  const { data: r, error } = await cliente.from("recetas").select("*").eq("id", id).single();
  if (error || !r) {
    document.getElementById("error-formulario").textContent = "No se ha podido cargar esta receta.";
    return;
  }

  document.getElementById("titulo").value = r.titulo || "";
  document.getElementById("categoria").value = r.categoria || "";
  document.getElementById("raciones").value = r.raciones || "";
  document.getElementById("tiempo_prep").value = r.tiempo_prep || "";
  document.getElementById("tiempo_coccion").value = r.tiempo_coccion || "";
  document.getElementById("notas").value = r.notas || "";
  document.getElementById("favorita").checked = !!r.favorita;

  if (r.foto_principal) {
    fotoPrincipalActualURL = r.foto_principal;
    mostrarPreviaFotoPrincipal(r.foto_principal);
  }
  fotosExtraActuales = r.fotos_extra || [];
  renderPreviasFotosExtra();

  document.getElementById("lista-ingredientes-form").innerHTML = "";
  (r.ingredientes && r.ingredientes.length ? r.ingredientes : [{}]).forEach(ing => crearFilaIngrediente(ing));

  document.getElementById("lista-pasos-form").innerHTML = "";
  (r.pasos && r.pasos.length ? r.pasos : [""]).forEach(p => crearFilaPaso(p));
}

function onSeleccionFotoPrincipal(e) {
  const file = e.target.files[0];
  if (!file) return;
  fotoPrincipalNueva = file;
  mostrarPreviaFotoPrincipal(URL.createObjectURL(file));
}

function mostrarPreviaFotoPrincipal(src) {
  const img = document.getElementById("previa-foto-principal");
  img.src = src;
  img.classList.remove("oculto");
}

function onSeleccionFotosExtra(e) {
  fotosExtraNuevas = fotosExtraNuevas.concat(Array.from(e.target.files));
  renderPreviasFotosExtra();
}

function renderPreviasFotosExtra() {
  const cont = document.getElementById("previa-fotos-extra");
  cont.innerHTML = "";
  fotosExtraActuales.forEach(url => {
    const img = document.createElement("img");
    img.src = url;
    cont.appendChild(img);
  });
  fotosExtraNuevas.forEach(file => {
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    cont.appendChild(img);
  });
}

async function subirFoto(file) {
  const extension = file.name.split(".").pop();
  const nombreArchivo = `${crypto.randomUUID()}.${extension}`;
  const { error } = await cliente.storage.from(BUCKET_FOTOS).upload(nombreArchivo, file);
  if (error) throw error;
  const { data } = cliente.storage.from(BUCKET_FOTOS).getPublicUrl(nombreArchivo);
  return data.publicUrl;
}

function recogerIngredientes() {
  return Array.from(document.querySelectorAll("#lista-ingredientes-form .fila-dinamica"))
    .map(fila => ({
      cantidad: fila.querySelector(".cant-input").value.trim(),
      unidad: fila.querySelector(".unidad-input").value.trim(),
      nombre: fila.querySelector(".nombre-input").value.trim(),
    }))
    .filter(i => i.nombre);
}

function recogerPasos() {
  return Array.from(document.querySelectorAll("#lista-pasos-form .paso-input"))
    .map(t => t.value.trim())
    .filter(Boolean);
}

async function guardarReceta(e) {
  e.preventDefault();
  const btn = document.getElementById("btn-guardar");
  const errorEl = document.getElementById("error-formulario");
  errorEl.textContent = "";
  btn.disabled = true;
  btn.textContent = "Guardando…";

  try {
    let urlFotoPrincipal = fotoPrincipalActualURL;
    if (fotoPrincipalNueva) {
      urlFotoPrincipal = await subirFoto(fotoPrincipalNueva);
    }

    let urlsFotosExtra = fotosExtraActuales.slice();
    for (const file of fotosExtraNuevas) {
      urlsFotosExtra.push(await subirFoto(file));
    }

    const registro = {
      titulo: document.getElementById("titulo").value.trim(),
      categoria: document.getElementById("categoria").value.trim() || "Sin categoría",
      raciones: document.getElementById("raciones").value.trim(),
      tiempo_prep: document.getElementById("tiempo_prep").value.trim(),
      tiempo_coccion: document.getElementById("tiempo_coccion").value.trim(),
      notas: document.getElementById("notas").value.trim(),
      favorita: document.getElementById("favorita").checked,
      ingredientes: recogerIngredientes(),
      pasos: recogerPasos(),
      foto_principal: urlFotoPrincipal,
      fotos_extra: urlsFotosExtra,
    };

    let idFinal = idEditar;
    if (idEditar) {
      const { error } = await cliente.from("recetas").update(registro).eq("id", idEditar);
      if (error) throw error;
    } else {
      const { data: sesionData } = await cliente.auth.getUser();
      registro.creado_por = sesionData.user.id;
      const { data, error } = await cliente.from("recetas").insert(registro).select().single();
      if (error) throw error;
      idFinal = data.id;
    }

    window.location.href = "receta.html?id=" + idFinal;
  } catch (err) {
    errorEl.textContent = "No se pudo guardar: " + err.message;
    btn.disabled = false;
    btn.textContent = "Guardar receta";
  }
}

async function eliminarReceta() {
  if (!confirm("¿Seguro que quieres eliminar esta receta? No se puede deshacer.")) return;
  const { error } = await cliente.from("recetas").delete().eq("id", idEditar);
  if (error) {
    document.getElementById("error-formulario").textContent = "No se pudo eliminar: " + error.message;
    return;
  }
  window.location.href = "biblioteca.html";
}

function escAttr(str) {
  return (str || "").toString().replace(/"/g, "&quot;");
}
function escHTML(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

iniciar();
