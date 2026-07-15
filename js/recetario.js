const LETRAS = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");
let TODAS_LAS_RECETAS = [];
let SOLO_FAVORITAS = false;

function normalizar(txt) {
  return (txt || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function letraInicial(titulo) {
  const l = normalizar(titulo).trim().charAt(0).toUpperCase();
  return /[A-ZÑ]/.test(l) ? l : "#";
}

async function iniciar() {
  const sesion = await exigirSesion();
  if (!sesion) return;

  document.getElementById("nombre-recetario").textContent = NOMBRE_RECETARIO;
  document.title = NOMBRE_RECETARIO;
  document.getElementById("btn-salir").addEventListener("click", cerrarSesion);

  const { data, error } = await cliente
    .from("recetas")
    .select("*")
    .order("titulo", { ascending: true });

  document.getElementById("cargando").classList.add("oculto");

  if (error) {
    document.getElementById("contenedor-recetas").innerHTML =
      `<p class="error-login">No se pudieron cargar las recetas: ${error.message}</p>`;
    return;
  }

  TODAS_LAS_RECETAS = data || [];
  rellenarCategorias(TODAS_LAS_RECETAS);
  render();

  document.getElementById("buscador").addEventListener("input", render);
  document.getElementById("filtro-categoria").addEventListener("change", render);
  document.getElementById("toggle-favoritas").addEventListener("click", (e) => {
    SOLO_FAVORITAS = !SOLO_FAVORITAS;
    e.target.classList.toggle("activo", SOLO_FAVORITAS);
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
      <span class="grande">Aún no hay nada por aquí…</span>
      ${TODAS_LAS_RECETAS.length === 0
        ? '¡Anímate a añadir la primera receta con el botón de arriba!'
        : 'Ninguna receta coincide con la búsqueda o los filtros.'}
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

  const letrasConDatos = new Set(Object.keys(grupos));
  renderIndice(letrasConDatos);

  cont.innerHTML = LETRAS.filter(l => grupos[l]).map(letra => `
    <section class="grupo-letra" id="letra-${letra}">
      <h2>${letra}</h2>
      <div class="rejilla-recetas">
        ${grupos[letra].map(fichaHTML).join("")}
      </div>
    </section>
  `).join("");
}

function fichaHTML(r) {
  const foto = r.foto_principal
    ? `<img class="ficha-foto" src="${r.foto_principal}" alt="${escapeHTML(r.titulo)}">`
    : `<div class="ficha-foto sin-foto">🍽️</div>`;
  return `
    <a class="ficha" href="receta.html?id=${r.id}">
      ${r.favorita ? '<span class="ficha-estrella">★</span>' : ''}
      ${foto}
      <div class="ficha-cuerpo">
        <span class="ficha-categoria">${escapeHTML(r.categoria || '')}</span>
        <span class="ficha-titulo">${escapeHTML(r.titulo)}</span>
        <div class="ficha-meta">
          ${r.tiempo_prep ? `<span>⏱ ${escapeHTML(r.tiempo_prep)}</span>` : ''}
          ${r.raciones ? `<span>🍽 ${escapeHTML(r.raciones)}</span>` : ''}
        </div>
      </div>
    </a>`;
}

function renderIndice(letrasConDatos) {
  const lateral = document.getElementById("indice-lateral");
  const movil = document.getElementById("indice-movil");
  const item = (letra) => {
    const activa = letrasConDatos.has(letra);
    return `<a href="${activa ? '#letra-' + letra : '#'}" class="${activa ? 'con-recetas' : ''}">${letra}</a>`;
  };
  lateral.innerHTML = LETRAS.map(item).join("");
  movil.innerHTML = LETRAS.map(item).join("");
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

iniciar();
