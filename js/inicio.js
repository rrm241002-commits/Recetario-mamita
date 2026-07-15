const ICONO_FOTO = '<svg class="icono" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10.5" r="1.4"/><path d="M21 16l-5-5-4 4-3-3-4 4"/></svg>';

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

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
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
    .order("actualizado_en", { ascending: false })
    .limit(6);

  if (error || !data || data.length === 0) return;

  document.getElementById("seccion-recientes").classList.remove("oculto");
  document.getElementById("franja-recientes").innerHTML = data.map(r => `
    <a class="tarjeta-reciente" href="receta.html?id=${r.id}">
      ${r.foto_principal
        ? `<img class="tarjeta-reciente-foto" src="${r.foto_principal}" alt="">`
        : `<div class="tarjeta-reciente-foto sin-foto">${ICONO_FOTO}</div>`}
      <div class="tarjeta-reciente-cuerpo">
        <span class="tarjeta-reciente-titulo">${escapeHTML(r.titulo)}</span>
        <span class="tarjeta-reciente-fecha">${fechaRelativa(r.actualizado_en)}</span>
      </div>
    </a>
  `).join("");
}

iniciar();
