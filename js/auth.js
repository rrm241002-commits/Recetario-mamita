document.getElementById("nombre-recetario").textContent = NOMBRE_RECETARIO;
document.title = NOMBRE_RECETARIO;

// Si ya hay sesión abierta, pasa directo al recetario.
cliente.auth.getSession().then(({ data: { session } }) => {
  if (session) window.location.href = "recetario.html";
});

const form = document.getElementById("form-login");
const errorEl = document.getElementById("error-login");
const btnEntrar = document.getElementById("btn-entrar");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorEl.textContent = "";
  btnEntrar.disabled = true;
  btnEntrar.textContent = "Entrando…";

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const { error } = await cliente.auth.signInWithPassword({ email, password });

  if (error) {
    errorEl.textContent = "Correo o contraseña incorrectos.";
    btnEntrar.disabled = false;
    btnEntrar.textContent = "Entrar";
    return;
  }

  window.location.href = "recetario.html";
});
