// Cliente único de Supabase, usado por todas las páginas.
const cliente = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Comprueba que haya sesión iniciada; si no, manda al login.
// Se usa al principio de cada página que no sea index.html.
async function exigirSesion() {
  const { data: { session } } = await cliente.auth.getSession();
  if (!session) {
    window.location.href = "index.html";
    return null;
  }
  return session;
}

async function cerrarSesion() {
  await cliente.auth.signOut();
  window.location.href = "index.html";
}
