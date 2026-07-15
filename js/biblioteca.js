const LETRAS = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");
let TODAS_LAS_RECETAS = [];
let SOLO_FAVORITAS = false;

const ICONO_RELOJ = '<svg class="icono" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>';
const ICONO_RACIONES = '<svg class="icono" viewBox="0 0 24 24"><path d="M3 11h18a9 8 0 0 1-18 0Z"/><path d="M12 3v4"/></svg>';
const ICONO_FOTO = '<svg class="icono" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10.5" r="1.4"/><path d="M21 16l-5-5-4 4-3-3-4 4"/></svg>';
const ICONO_ESTRELLA = '<svg class="icono" viewBox="0 0 24 24"><path d="M12 3l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1L6.6 19.3l1.3-6-4.6-4.1 6.1-.6Z"/></svg>';

function normalizar(txt) {
  return (txt || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function letraInicial(titulo) {
  const l = normalizar(titulo).trim().charAt(0).toUpperCase();
  return /[A-ZÑ]/.test(l) ? l : "#";
}

function fechaRelativa(fechaISO) {
  const diffMs = Date.now() - new Date(fechaISO).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "ahora mismo";
  if (min < 60) return `hace ${min} min`;
  const horas = Math.floor(min / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias < 30) return `hace ${dias} d`;
  return new Date(fechaISO).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

async function iniciar() {
  const sesion = await exigirSesion();
  if (!sesion) return;

  document.getElementById("nombre-recetario").textContent = NOMBRE_RECETARIO;
  document.title = NOMBRE_RECETARIO;
  document.getElementById("btn-salir").addEventListener("click", cerrarSesion);

  const { data, error } = await cliente.from("recetas").select("*").order("titulo", { ascending: true });

  document.getElementById("cargando").classList.add("oculto");

  if (error) {
    document.getElementById("contenedor-recetas").innerHTML = `<p class="error-login">No se pudieron cargar las recetas: ${error.message}</p>`;
    return;
  }

  TODAS_LAS_RECETAS = data || [];
  rellenarCategorias(TODAS_LAS_RECETAS);
  render();

  document.getElementById("buscador").addEventListener("input", render);
  document.getElementById("filtro-categoria").addEventListener("change", render);
  document.getElementById("toggle-favoritas").addEventListener("click", (e) => {
    SOLO_FAVORITAS = !SOLO_FAVORITAS;
    document.getElementById("toggle-favoritas").classList.toggle("activo", SOLO_FAVORITAS);
    render();
  });
}

function rellenarCategorias(recetas) {
  const select = document.getElementById("filtro-categoria");
  const categorias = [...new Set(recetas.map(r => r.categoria).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es"));
  categorias.forEach(cat => {
    const op = document.createElement("option");
    op.value = cat;
    op.textContent = cat;
    select.appendChild(op);
  });
}

function render() {
  const texto = normalizar(document.getElementById("buscador").value);
  const categoria = document.getElementById("filtro-categoria").value;

  let recetas = TODAS_LAS_RECETAS.filter(r => {
    if (categoria && r.categoria !== categoria) return false;
    if (SOLO_FAVORITAS && !r.favorita) return false;
    if (!texto) return true;
    const enTitulo = normalizar(r.titulo).includes(texto);
    const enIngredientes = (r.ingredientes || []).some(ing => normalizar(ing.nombre).includes(texto));
    return enTitulo || enIngredientes;
  });

  const cont = document.getElementById("contenedor-recetas");

  if (recetas.length === 0) {
    cont.innerHTML = `<div class="vacio">
      ${TODAS_LAS_RECETAS.length === 0 ? "No hay recetas todavía." : "Ninguna receta coincide con la búsqueda."}
    </div>`;
    document.getElementById("indice-lateral").innerHTML = "";
    document.getElementById("indice-movil").innerHTML = "";
    return;
  }

  const grupos = {};
  recetas.forEach(r => {
    const letra = letraInicial(r.titulo);
    (grupos[letra] = grupos[letra] || []).push(r);
  });

  renderIndice(new Set(Object.keys(grupos)));

  cont.innerHTML = LETRAS.filter(l => grupos[l]).map(letra => `
    <section class="grupo-letra" id="letra-${letra}">
      <h2>${letra}</h2>
      <div class="rejilla-recetas">${grupos[letra].map(fichaHTML).join("")}</div>
    </section>
  `).join("");
}

function fichaHTML(r) {
  const foto = r.foto_principal
    ? `<img class="ficha-foto" src="${r.foto_principal}" alt="${escapeHTML(r.titulo)}">`
    : `<div class="ficha-foto sin-foto">${ICONO_FOTO}</div>`;
  return `
    <a class="ficha" href="receta.html?id=${r.id}">
      ${r.favorita ? `<span class="ficha-estrella">${ICONO_ESTRELLA}</span>` : ""}
      ${foto}
      <div class="ficha-cuerpo">
        <span class="ficha-categoria">${escapeHTML(r.categoria || "")}</span>
        <span class="ficha-titulo">${escapeHTML(r.titulo)}</span>
        <div class="ficha-meta">
          ${r.tiempo_prep ? `<span>${ICONO_RELOJ} ${escapeHTML(r.tiempo_prep)}</span>` : ""}
          ${r.raciones ? `<span>${ICONO_RACIONES} ${escapeHTML(r.raciones)}</span>` : ""}
        </div>
      </div>
    </a>`;
}

function renderIndice(letrasConDatos) {
  const item = (letra) => {
    const activa = letrasConDatos.has(letra);
    return `<a href="${activa ? "#letra-" + letra : "#"}" class="${activa ? "con-recetas" : ""}">${letra}</a>`;
  };
  document.getElementById("indice-lateral").innerHTML = LETRAS.map(item).join("");
  document.getElementById("indice-movil").innerHTML = LETRAS.map(item).join("");
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

iniciar();
