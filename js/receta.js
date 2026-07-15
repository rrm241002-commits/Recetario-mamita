const params = new URLSearchParams(window.location.search);
const idReceta = params.get("id");

async function iniciar() {
  const sesion = await exigirSesion();
  if (!sesion) return;

  document.getElementById("nombre-recetario").textContent = NOMBRE_RECETARIO;
  document.getElementById("btn-salir").addEventListener("click", cerrarSesion);

  if (!idReceta) {
    window.location.href = "recetario.html";
    return;
  }

  const { data: r, error } = await cliente.from("recetas").select("*").eq("id", idReceta).single();

  document.getElementById("cargando").classList.add("oculto");

  if (error || !r) {
    document.getElementById("cargando").classList.remove("oculto");
    document.getElementById("cargando").textContent = "No se ha encontrado esta receta.";
    return;
  }

  document.title = r.titulo + " — " + NOMBRE_RECETARIO;
  document.getElementById("v-titulo").textContent = r.titulo;
  document.getElementById("v-categoria").textContent = r.categoria || "";
  document.getElementById("v-prep").textContent = r.tiempo_prep || "—";
  document.getElementById("v-coccion").textContent = r.tiempo_coccion || "—";
  document.getElementById("v-raciones").textContent = r.raciones || "—";
  document.getElementById("link-editar").href = "editar.html?id=" + r.id;

  if (r.foto_principal) {
    const img = document.getElementById("v-foto");
    img.src = r.foto_principal;
    img.alt = r.titulo;
    img.classList.remove("oculto");
  }

  const listaIng = document.getElementById("v-ingredientes");
  (r.ingredientes || []).forEach(ing => {
    const li = document.createElement("li");
    const cant = [ing.cantidad, ing.unidad].filter(Boolean).join(" ");
    li.innerHTML = `${cant ? `<span class="cant">${escapeHTML(cant)}</span>` : ""}<span>${escapeHTML(ing.nombre)}</span>`;
    listaIng.appendChild(li);
  });

  const listaPasos = document.getElementById("v-pasos");
  (r.pasos || []).forEach(paso => {
    const li = document.createElement("li");
    li.textContent = paso;
    listaPasos.appendChild(li);
  });

  const galeria = document.getElementById("v-galeria");
  (r.fotos_extra || []).forEach(url => {
    const img = document.createElement("img");
    img.src = url;
    img.alt = "";
    galeria.appendChild(img);
  });

  if (r.notas && r.notas.trim()) {
    document.getElementById("bloque-notas").classList.remove("oculto");
    document.getElementById("v-notas").textContent = r.notas;
  }

  const btnFav = document.getElementById("btn-favorita");
  const textoFav = btnFav.querySelector("svg").outerHTML + " ";
  const actualizarBotonFav = () => {
    btnFav.innerHTML = textoFav + (r.favorita ? "Quitar de favoritas" : "Favorita");
    btnFav.classList.toggle("activo", r.favorita);
  };
  actualizarBotonFav();
  btnFav.addEventListener("click", async () => {
    r.favorita = !r.favorita;
    actualizarBotonFav();
    await cliente.from("recetas").update({ favorita: r.favorita }).eq("id", r.id);
  });

  document.getElementById("btn-imprimir").addEventListener("click", () => window.print());

  document.getElementById("vista-receta").classList.remove("oculto");
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

iniciar();
