import { ref, computed } from "vue";

export interface AuthUser {
  id: string;
  nombre: string;
  rol: string;
  correo: string;
}

const USER_KEY  = "educloud_user";
const TOKEN_KEY = "educloud_token";

// ── Estado global reactivo ────────────────────────────────────────────────────
const currentUser = ref<AuthUser | null>(
  (() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  })()
);

const token = ref<string | null>(localStorage.getItem(TOKEN_KEY));

/**
 * Se vuelve `true` una vez que la sesión ha sido verificada contra el servidor
 * (o cuando se determina que no hay token). El router espera este flag antes
 * de redirigir, evitando la pantalla fantasma.
 */
const authReady = ref(false);

// ── API base URL ──────────────────────────────────────────────────────────────
const API = "http://localhost:3001/api";

/**
 * Devuelve los headers de autenticación listos para usar en fetch.
 * Úsalo en cualquier composable que llame a la API protegida.
 */
export function authHeaders(): Record<string, string> {
  const t = token.value;
  return t
    ? { "Content-Type": "application/json", Authorization: `Bearer ${t}` }
    : { "Content-Type": "application/json" };
}

export function useAuth() {
  const isAuthenticated = computed(() => currentUser.value !== null && token.value !== null);
  const isDocente       = computed(() => currentUser.value?.rol === "Docente");
  const isSistemas      = computed(() => currentUser.value?.rol === "Sistemas");
  const isDirectivo     = computed(() => currentUser.value?.rol === "Directivo");
  const isAdmin         = computed(() => ["Directivo", "Sistemas", "Administrativo"].includes(currentUser.value?.rol ?? ""));
  const canSeeAll       = computed(() => isDocente.value || isSistemas.value || isDirectivo.value);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = async (correo: string, password: string): Promise<{ ok: boolean; message?: string }> => {
    const res  = await fetch(`${API}/usuarios/login`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ correo, password }),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) return { ok: false, message: json.message };

    // Guardar token Y perfil
    token.value        = json.token;
    currentUser.value  = json.data as AuthUser;
    localStorage.setItem(TOKEN_KEY, json.token);
    localStorage.setItem(USER_KEY,  JSON.stringify(json.data));
    return { ok: true };
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = () => {
    currentUser.value = null;
    token.value       = null;
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
  };

  // ── Verificar sesión activa contra /me ────────────────────────────────────
  const checkSession = async (): Promise<boolean> => {
    if (!token.value) {
      authReady.value = true;
      return false;
    }
    try {
      const res = await fetch(`${API}/usuarios/me`, {
        headers: { Authorization: `Bearer ${token.value}` },
      });
      if (res.status === 401) {
        // Token realmente inválido/expirado → cerrar sesión
        logout();
        authReady.value = true;
        return false;
      }
      if (!res.ok) {
        // Error del servidor (500, red, etc.) → conservar sesión local
        authReady.value = true;
        return true;
      }
      const json = await res.json();
      currentUser.value = json.data;
      localStorage.setItem(USER_KEY, JSON.stringify(json.data));
      authReady.value = true;
      return true;
    } catch {
      // Sin conexión → conservar sesión local, no expulsar al usuario
      authReady.value = true;
      return true;
    }
  };

  return {
    currentUser,
    token,
    authReady,
    isAuthenticated,
    isDocente,
    isSistemas,
    isDirectivo,
    isAdmin,
    canSeeAll,
    login,
    logout,
    checkSession,
  };
}
