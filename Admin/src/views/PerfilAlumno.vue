<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import AdminLayout from "../components/layout/AdminLayout.vue";
import { useAuth } from "../composables/useAuth";

import { useRouter } from "vue-router";

const route = useRoute();
const alumnoId = route.params.id as string;
const { isDocente, currentUser, token } = useAuth();

interface Alumno {
  id: string;
  nombre: string;
  curp: string;
  notas_importancia: string | null;
  tutores: { nombre: string; telefono: string; correo: string }[];
  created_at: string;
  updated_at: string;
  grupo_grado?: number;
  grupo_letra?: string;
  grupo_id?: string;
  estatus: string;
}

const alumno = ref<Alumno | null>(null);
const loading = ref(true);
const errorMsg = ref<string | null>(null);

// Modals State
const showDarBajaModal = ref(false);
const darBajaPassword = ref("");
const darBajaLoading = ref(false);
const darBajaError = ref("");

const showCambiarGrupoModal = ref(false);
const gruposOptions = ref<{id:string; name:string}[]>([]);
const selectedNewGrupo = ref("");
const cambiarGrupoLoading = ref(false);
const cambiarGrupoError = ref("");

onMounted(async () => {
  try {
    const res = await fetch(`http://localhost:3001/api/alumnos/${alumnoId}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    alumno.value = json.data;
  } catch (err: unknown) {
    errorMsg.value = (err instanceof Error ? err.message : null) || "No se pudo cargar el alumno";
  } finally {
    loading.value = false;
  }
});

// Iniciales para el avatar
const initials = computed(() => {
  if (!alumno.value) return "?";
  return alumno.value.nombre.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
});

// Color dinámico basado en inicial del nombre
const avatarGradient = computed(() => {
  if (!alumno.value) return "from-gray-400 to-gray-600";
  const palettes = [
    "from-sky-400 to-sky-600","from-blue-400 to-blue-600","from-indigo-400 to-indigo-600",
    "from-violet-400 to-violet-600","from-purple-400 to-purple-600","from-pink-400 to-pink-600",
    "from-rose-400 to-rose-600","from-orange-400 to-orange-600","from-amber-400 to-amber-600",
    "from-green-400 to-green-600","from-emerald-400 to-emerald-600","from-teal-400 to-teal-600",
    "from-cyan-400 to-cyan-600",
  ];
  return palettes[alumno.value.nombre.charCodeAt(0) % palettes.length];
});

// Parseo de CURP
const curpInfo = computed(() => {
  const c = alumno.value?.curp;
  if (!c || c.length < 16) return null;
  const estados: Record<string, string> = {
    AS:"Aguascalientes",BC:"Baja California",BS:"Baja California Sur",CC:"Campeche",
    CS:"Chiapas",CH:"Chihuahua",DF:"Ciudad de México",CL:"Coahuila",CM:"Colima",
    DG:"Durango",GT:"Guanajuato",GR:"Guerrero",HG:"Hidalgo",JC:"Jalisco",
    MC:"Estado de México",MN:"Michoacán",MS:"Morelos",NT:"Nayarit",NL:"Nuevo León",
    OC:"Oaxaca",PL:"Puebla",QT:"Querétaro",QR:"Quintana Roo",SP:"San Luis Potosí",
    SL:"Sinaloa",SR:"Sonora",TC:"Tabasco",TS:"Tamaulipas",TL:"Tlaxcala",
    VZ:"Veracruz",YN:"Yucatán",ZS:"Zacatecas",NE:"Nacido en el extranjero",
  };
  const yy = parseInt(c.slice(4, 6), 10);
  return {
    nacimiento: `${c.slice(8,10)}/${c.slice(6,8)}/${yy <= 24 ? 2000 + yy : 1900 + yy}`,
    sexo: c[10] === "H" ? "Hombre" : c[10] === "M" ? "Mujer" : "No especificado",
    estado: estados[c.slice(11, 13)] ?? c.slice(11, 13),
  };
});

const formatDate = (isoString: string) => {
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(isoString));
};

interface Note { id: number; type: "text" | "emoji"; content: string; date: string; author: string; }
const timeline = ref<Note[]>([
  { id: 1, type: "text", content: "El alumno mostró gran mejoría en matemáticas esta semana.", date: new Date(Date.now() - 86400000).toISOString(), author: "Prof. Alberto (Matemáticas)" },
  { id: 2, type: "emoji", content: "⭐", date: new Date(Date.now() - 172800000).toISOString(), author: "Profa. Carmen (Español)" },
  { id: 3, type: "text", content: "No entregó el proyecto final de la unidad 2.", date: new Date(Date.now() - 345600000).toISOString(), author: "Prof. Luis (Historia)" }
]);

const newNoteText = ref("");
const addingNote = ref(false);

const addNote = () => {
  if (!newNoteText.value.trim()) return;
  addingNote.value = true;
  setTimeout(() => {
    timeline.value.unshift({
      id: Date.now(),
      type: "text",
      content: newNoteText.value.trim(),
      date: new Date().toISOString(),
      author: currentUser.value?.nombre || "Docente"
    });
    newNoteText.value = "";
    addingNote.value = false;
  }, 400);
};

const userInitials = computed(() => {
  if (!currentUser.value) return "YO";
  return currentUser.value.nombre.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
});

interface QuickAction {
  icon: string;
  label: string;
  category: string;
  bg: string;
  text: string;
  border: string;
}

const quickActions: QuickAction[] = [
  { icon: '🌟', label: 'Reconocimiento', category: 'positive', bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  { icon: '🙋‍♂️', label: 'Participación', category: 'positive', bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
  { icon: '📚', label: 'Tarea/Material', category: 'info', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  { icon: '⚠️', label: 'Atención', category: 'warning', bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
  { icon: '🚨', label: 'Incidencia', category: 'negative', bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200' },
  { icon: '💬', label: 'Nota General', category: 'neutral', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
];

const addQuickLog = (action: QuickAction) => {
  timeline.value.unshift({
    id: Date.now(),
    type: "emoji",
    content: action.icon,
    date: new Date().toISOString(),
    author: currentUser.value?.nombre || "Docente"
  });
};

const getCategoryBadge = (content: string) => {
  const action = quickActions.find(a => a.icon === content);
  if (action) return action;
  return { label: 'Nota', bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
};

// Rol based filters logic
// Docentes won't see "General", only their subjects. Admin/Sistemas can see "General".
const roleFilterMockOptions = computed(() => {
  if (isDocente.value) {
    return [
      { id: "mat", name: "Matemáticas I (Tu materia)" },
      { id: "tut", name: "Tutoría (Tu materia)" },
    ];
  }
  return [
    { id: "all", name: "General (Todas las materias)" },
    { id: "mat", name: "Matemáticas I" },
    { id: "esp", name: "Español I" },
    { id: "bio", name: "Biología" }
  ];
});

const selectedFilter = ref(isDocente.value ? "mat" : "all");

// Stats mockup based on selection
const dashboardStats = computed(() => {
  if (selectedFilter.value === "all") {
    return {
      promedio: 8.6,
      tareas: 85,
      asistencias: 92,
      inasistencias: 5
    };
  } else if (selectedFilter.value === "mat") {
    return {
      promedio: 9.3,
      tareas: 100,
      asistencias: 98,
      inasistencias: 1
    };
  } else {
    return {
      promedio: 7.5,
      tareas: 70,
      asistencias: 88,
      inasistencias: 4
    };
  }
});

// Cambiar de Grupo Func
const openCambiarGrupo = async () => {
  cambiarGrupoError.value = "";
  selectedNewGrupo.value = "";
  try {
    const res = await fetch(`http://localhost:3001/api/grupos`);
    const json = await res.json();
    if (res.ok) {
      gruposOptions.value = json.data.map((g: { id: string; grado: number; grupo: string; turno: string }) => ({
        id: g.id,
        name: `${g.grado}ro ${g.grupo} - ${g.turno}`
      }));
      showCambiarGrupoModal.value = true;
    }
  } catch (_err) {
    cambiarGrupoError.value = "Error al cargar los grupos";
  }
};

const confirmCambiarGrupo = async () => {
  if (!selectedNewGrupo.value) return;
  cambiarGrupoLoading.value = true;
  cambiarGrupoError.value = "";
  try {
    const res = await fetch(`http://localhost:3001/api/grupos/${selectedNewGrupo.value}/enrolar`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token.value}` },
      body: JSON.stringify({ alumno_ids: [alumno.value!.id] })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    
    // Update local state
    const fetchedGroup = gruposOptions.value.find(g => g.id === selectedNewGrupo.value);
    if (fetchedGroup && alumno.value) {
      const match = fetchedGroup.name.match(/^(\d)ro\s+([A-Z])/);
      if (match) {
        alumno.value.grupo_grado = parseInt(match[1]);
        alumno.value.grupo_letra = match[2];
        alumno.value.grupo_id = selectedNewGrupo.value;
      }
    }
    showCambiarGrupoModal.value = false;
  } catch (err: unknown) {
    cambiarGrupoError.value = err instanceof Error ? err.message : "Error al cambiar de grupo";
  } finally {
    cambiarGrupoLoading.value = false;
  }
};

const confirmDarBaja = async () => {
  if (!darBajaPassword.value) {
    darBajaError.value = "Ingresa tu contraseña";
    return;
  }
  darBajaLoading.value = true;
  darBajaError.value = "";
  try {
    const res = await fetch(`http://localhost:3001/api/alumnos/${alumno.value!.id}/dar-baja`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token.value}` },
      body: JSON.stringify({ password: darBajaPassword.value })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    if (alumno.value) {
      alumno.value.estatus = 'Baja';
      alumno.value.grupo_grado = undefined;
      alumno.value.grupo_letra = undefined;
      alumno.value.grupo_id = undefined;
    }
    showDarBajaModal.value = false;
  } catch (err: unknown) {
    darBajaError.value = err instanceof Error ? err.message : "Error al procesar la baja";
  } finally {
    darBajaLoading.value = false;
  }
};

</script>

<template>
  <admin-layout>
    <div class="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <router-link
            to="/alumnos"
            class="flex items-center justify-center rounded-full bg-white dark:bg-gray-800 p-2 text-gray-500 hover:text-brand-600 dark:hover:text-brand-400 shadow-sm transition-colors border border-gray-100 dark:border-gray-700"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"/>
            </svg>
          </router-link>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Perfil del Alumno</h1>
        </div>
        <div class="flex items-center gap-2" v-if="alumno">
          <div class="flex flex-wrap items-center gap-3">
              <router-link
                v-if="!isDocente && alumno.estatus !== 'Baja'"
                :to="`/alumnos/${alumno.id}/editar`"
                class="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 transition-all hover:scale-[1.02]"
              >
                <svg class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                </svg>
                Editar Perfil
              </router-link>
              <button
                v-if="!isDocente && alumno.estatus !== 'Baja'"
                @click="openCambiarGrupo"
                class="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition-all hover:scale-[1.02]"
              >
                Cambiar de Grupo
              </button>
              <button
                v-if="!isDocente && alumno.estatus !== 'Baja'"
                @click="showDarBajaModal = true"
                class="inline-flex items-center gap-2 rounded-xl bg-red-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-950 transition-all hover:scale-[1.02]"
              >
                Dar de Baja
              </button>
            </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-24">
        <svg class="animate-spin h-6 w-6 text-brand-500" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
      </div>

      <!-- Error -->
      <div v-else-if="errorMsg" class="rounded-md bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
        ⚠️ {{ errorMsg }}
      </div>

      <!-- Contenido del perfil -->
      <div v-else-if="alumno" class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

        <!-- Columna Izquierda (4 cols) -->
        <div class="lg:col-span-4 space-y-5">

          <!-- Card de identificación -->
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div :class="`h-24 bg-gradient-to-r ${avatarGradient}`"></div>
            <div class="px-6 pb-6 relative">
              <div class="flex justify-center -mt-12 mb-4">
                <div :class="`h-24 w-24 rounded-full border-4 border-white dark:border-gray-800 shadow-sm flex items-center justify-center text-white text-3xl font-bold bg-gradient-to-br ${avatarGradient}`">
                  {{ initials }}
                </div>
              </div>
              <div class="text-center">
                  <h1 class="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                    {{ alumno.nombre }}
                    <span v-if="alumno.estatus === 'Baja'" class="ml-2 inline-flex items-center rounded-md bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-900/30 dark:text-red-400 ring-1 ring-inset ring-red-500/10">
                      Baja
                    </span>
                  </h1><p class="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1 font-mono">{{ alumno.id }}</p>
                <div class="mt-3 flex flex-wrap items-center justify-center gap-2">
                  <span class="inline-flex items-center rounded-full bg-gray-50 dark:bg-gray-700/50 px-3 py-1 text-xs font-mono font-medium text-gray-700 dark:text-gray-300 ring-1 ring-inset ring-gray-200 dark:ring-gray-600">
                    CURP: {{ alumno.curp }}
                  </span>
                  <span v-if="alumno.grupo_grado && alumno.grupo_letra" class="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300 ring-1 ring-inset ring-green-500/20">
                    <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    Grupo: {{ alumno.grupo_grado }}ro {{ alumno.grupo_letra }}
                  </span>
                  <span v-else class="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400 ring-1 ring-inset ring-gray-200 dark:ring-gray-700">
                    Sin grupo
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Datos decodificados de CURP -->
          <div v-if="curpInfo" class="grid grid-cols-2 gap-4">
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
              <p class="text-xs font-medium text-gray-400 dark:text-gray-500 mb-1 uppercase tracking-wide">Nacimiento</p>
              <div class="text-base font-bold text-gray-900 dark:text-white">{{ curpInfo.nacimiento }}</div>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
              <p class="text-xs font-medium text-gray-400 dark:text-gray-500 mb-1 uppercase tracking-wide">Sexo</p>
              <div class="text-base font-bold text-gray-900 dark:text-white">{{ curpInfo.sexo }}</div>
            </div>
          </div>

          <!-- Estado de nacimiento -->
          <div v-if="curpInfo" class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">Estado de Nacimiento</p>
            <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ curpInfo.estado }}</p>
          </div>

          <!-- Padres / Tutores -->
          <div v-if="alumno.tutores && alumno.tutores.length > 0" class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
            <div class="flex items-center gap-2 mb-4">
              <div class="h-7 w-7 rounded-lg bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center flex-shrink-0">
                <svg class="h-4 w-4 text-sky-500" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"/>
                </svg>
              </div>
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Padres / Tutores</h3>
            </div>
            <div class="space-y-4">
              <div v-for="(tutor, i) in alumno.tutores" :key="i" class="space-y-1 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                <p class="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">Tutor {{ i + 1 }}</p>
                <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ tutor.nombre }}</p>
                <p v-if="tutor.telefono" class="text-xs text-gray-500 dark:text-gray-400">📞 {{ tutor.telefono }}</p>
                <p v-if="tutor.correo" class="text-xs text-gray-500 dark:text-gray-400">✉️ {{ tutor.correo }}</p>
              </div>
            </div>
          </div>
          <div v-else class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
            <div class="flex items-center gap-2 mb-2">
              <div class="h-7 w-7 rounded-lg bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center flex-shrink-0">
                <svg class="h-4 w-4 text-sky-500" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"/>
                </svg>
              </div>
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Padres / Tutores</h3>
            </div>
            <p class="text-xs text-gray-400 dark:text-gray-500 italic">Sin tutores registrados. Agrégalos desde Editar.</p>
          </div>

          <!-- Fechas de registro -->
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 space-y-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-0.5">Registrado el</p>
              <p class="text-sm font-medium text-gray-900 dark:text-white">{{ formatDate(alumno.created_at) }}</p>
            </div>
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-0.5">Actualizado el</p>
              <p class="text-sm font-medium text-gray-900 dark:text-white">{{ formatDate(alumno.updated_at) }}</p>
            </div>
          </div>

          <!-- Notas de importancia -->
          <div class="bg-red-50 dark:bg-red-900/10 rounded-2xl shadow-sm border border-red-100 dark:border-red-900/30 p-6">
            <div class="flex items-center gap-2 mb-3">
              <svg class="h-5 w-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <h3 class="text-sm font-bold text-red-900 dark:text-red-400 uppercase tracking-wider">Notas de Importancia</h3>
            </div>
            <p v-if="alumno.notas_importancia" class="text-sm text-red-900 dark:text-red-300 leading-relaxed whitespace-pre-line">{{ alumno.notas_importancia }}</p>
            <p v-else class="text-xs text-red-700 dark:text-red-500 italic">Sin notas registradas. Agrégalas desde Editar.</p>
          </div>

        </div>

        <!-- Columna Derecha: Timeline y KPI (8 cols) -->
        <div class="lg:col-span-8 space-y-6">
          
          <!-- Filtro de vista -->
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 class="text-base font-bold text-gray-900 dark:text-white">Resumen de Desempeño</h2>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                <span v-if="isDocente">Estás viendo solo tu asignatura asignada.</span>
                <span v-else>Selecciona una asignatura para ver el detalle.</span>
              </p>
            </div>
            
            <div class="relative min-w-[200px] w-full sm:w-auto">
              <select v-model="selectedFilter" class="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 dark:text-white dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 sm:text-sm font-semibold appearance-none focus:ring-2 focus:ring-brand-600">
                <option v-for="opt in roleFilterMockOptions" :key="opt.id" :value="opt.id">{{ opt.name }}</option>
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/></svg>
              </div>
            </div>
          </div>

          <!-- KPI Cards -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <!-- Calificación -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between group hover:border-brand-500 transition-colors cursor-default">
              <div class="flex items-center gap-2 mb-2 text-gray-500 dark:text-gray-400">
                <svg class="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"/></svg>
                <span class="text-xs font-bold uppercase tracking-wider">Promedio</span>
              </div>
              <p class="text-3xl font-black text-gray-900 dark:text-white" :class="{'text-red-500!': dashboardStats.promedio < 6, 'text-green-500!': dashboardStats.promedio >= 9}">
                {{ dashboardStats.promedio.toFixed(1) }}
              </p>
            </div>

            <!-- Tareas -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between group hover:border-brand-500 transition-colors cursor-default">
              <div class="flex items-center gap-2 mb-2 text-gray-500 dark:text-gray-400">
                <svg class="h-5 w-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"/></svg>
                <span class="text-xs font-bold uppercase tracking-wider">Tareas</span>
              </div>
              <p class="text-2xl font-black text-gray-900 dark:text-white">{{ dashboardStats.tareas }}%</p>
            </div>

            <!-- Asistencias -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between group hover:border-brand-500 transition-colors cursor-default">
              <div class="flex items-center gap-2 mb-2 text-gray-500 dark:text-gray-400">
                <svg class="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 0 1 9 9v.375M10.125 2.25A3.375 3.375 0 0 1 13.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 0 1 3.375 3.375M9 15l2.25 2.25L15 12"/></svg>
                <span class="text-xs font-bold uppercase tracking-wider">Asistencia</span>
              </div>
              <p class="text-2xl font-black text-gray-900 dark:text-white">{{ dashboardStats.asistencias }}%</p>
            </div>

            <!-- Faltas -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between group hover:border-brand-500 transition-colors cursor-default">
              <div class="flex items-center gap-2 mb-2 text-gray-500 dark:text-gray-400">
                <svg class="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM4 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 10.374 21c-2.331 0-4.512-.645-6.374-1.766Z"/></svg>
                <span class="text-xs font-bold uppercase tracking-wider">Faltas</span>
              </div>
              <p class="text-2xl font-black text-gray-900 dark:text-white">{{ dashboardStats.inasistencias }}</p>
            </div>
          </div>

          <!-- Componente Timeline -->
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6 pb-2">
            <h3 class="text-base font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
              Bitácora Docente
            </h3>

            <!-- Escribir nueva nota -->
            <div class="mb-10 flex gap-4">
               <div :class="`h-12 w-12 shrink-0 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-base shadow-md ring-4 ring-white dark:ring-gray-800`" :title="currentUser?.nombre">
                {{ userInitials }}
               </div>
               <div class="grow space-y-4">
                <div class="relative">
                  <textarea
                    v-model="newNoteText"
                    rows="3"
                    class="block w-full resize-none rounded-2xl border-0 py-3.5 px-5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-500 sm:text-sm sm:leading-6 dark:bg-gray-900 dark:text-white transition-all focus:shadow-md"
                    placeholder="Escribe una observación, nota o comportamiento del alumno..."
                  ></textarea>
                </div>
                
                <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <!-- Quick Actions -->
                  <div class="flex flex-wrap gap-2 justify-center sm:justify-start">
                    <button 
                      v-for="action in quickActions" 
                      :key="action.label"
                      @click="addQuickLog(action)"
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105 active:scale-95 border"
                      :class="[action.bg, action.text, action.border, 'hover:shadow-sm']"
                      :title="action.label"
                    >
                      <span class="text-sm">{{ action.icon }}</span>
                      <span class="hidden lg:inline">{{ action.label }}</span>
                    </button>
                  </div>

                  <button
                    @click="addNote"
                    :disabled="!newNoteText.trim() || addingNote"
                    class="w-full sm:w-auto rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <svg v-if="addingNote" class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                    Publicar Nota
                  </button>
                </div>
               </div>
            </div>

            <!-- Timeline -->
            <div v-if="timeline.length > 0" class="flow-root pl-5 sm:pl-8">
              <ul role="list" class="-mb-8">
                <li v-for="(event, eventIdx) in timeline" :key="event.id">
                  <div class="relative pb-8">
                    <span v-if="eventIdx !== timeline.length - 1" class="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true"></span>
                    <div class="relative flex space-x-3 items-start">
                      <div>
                        <span v-if="event.type === 'emoji'" class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20 ring-4 ring-white dark:ring-gray-800 text-lg border border-blue-100 dark:border-blue-900/50">
                          {{ event.content }}
                        </span>
                        <span v-else class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-900/20 ring-4 ring-white dark:ring-gray-800 border border-brand-100 dark:border-brand-900/50">
                          <svg class="h-4 w-4 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"/>
                          </svg>
                        </span>
                      </div>
                      <div class="flex min-w-0 flex-1 justify-between gap-4 pt-1.5">
                        <div v-if="event.type === 'text'" class="space-y-1">
                          <div class="flex items-center gap-2">
                            <span class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400 ring-1 ring-inset ring-brand-500/20">Observación</span>
                            <span class="text-xs font-semibold text-gray-400 dark:text-gray-500">•</span>
                            <p class="text-xs font-bold text-gray-500 dark:text-gray-400">{{ event.author }}</p>
                          </div>
                          <p class="text-sm text-gray-900 dark:text-gray-200 leading-relaxed font-medium">{{ event.content }}</p>
                        </div>
                        <div v-else class="space-y-1">
                          <div class="flex items-center gap-2">
                            <span 
                              class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset"
                              :class="[getCategoryBadge(event.content).bg, getCategoryBadge(event.content).text, 'ring-current/20']"
                            >
                              {{ getCategoryBadge(event.content).label }}
                            </span>
                            <span class="text-xs font-semibold text-gray-400 dark:text-gray-500">•</span>
                            <p class="text-xs font-bold text-gray-500 dark:text-gray-400">{{ event.author }}</p>
                          </div>
                          <p class="text-sm font-bold text-gray-800 dark:text-gray-100">Registró una acción rápida en el perfil.</p>
                        </div>
                        <div class="whitespace-nowrap text-right text-xs text-gray-500 dark:text-gray-400 font-medium">
                          <time :datetime="event.date">{{ formatDate(event.date) }}</time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Modals -->
      <Teleport to="body">
        <div v-if="showCambiarGrupoModal" class="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl w-full max-w-md ring-1 ring-gray-200 dark:ring-gray-700">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">Cambiar de Grupo</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Selecciona el nuevo grupo para este alumno. Esto lo dará de baja de su grupo actual de forma automática.</p>
            
            <div v-if="cambiarGrupoError" class="mb-4 text-xs font-medium text-red-500 bg-red-50 dark:bg-red-900/10 p-2 rounded-md ring-1 ring-inset ring-red-500/20">
              {{ cambiarGrupoError }}
            </div>

            <div class="mb-6">
              <label class="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200 mb-1">Nuevo Grupo</label>
              <select v-model="selectedNewGrupo" class="block w-full rounded-md border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-white dark:ring-gray-700">
                <option disabled value="">Selecciona un grupo...</option>
                <option v-for="grupo in gruposOptions" :key="grupo.id" :value="grupo.id" :disabled="grupo.id === alumno?.grupo_id">{{ grupo.name }}</option>
              </select>
            </div>

            <div class="flex justify-end gap-3">
              <button @click="showCambiarGrupoModal = false" :disabled="cambiarGrupoLoading" class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">
                Cancelar
              </button>
              <button @click="confirmCambiarGrupo" :disabled="!selectedNewGrupo || cambiarGrupoLoading" class="px-4 py-2 text-sm font-semibold text-white bg-red-600 border border-transparent rounded-xl hover:bg-red-500 transition-colors disabled:opacity-50 inline-flex items-center">
                <svg v-if="cambiarGrupoLoading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                Mover Alumno
              </button>
            </div>
          </div>
        </div>

        <div v-if="showDarBajaModal" class="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl w-full max-w-md ring-1 ring-gray-200 dark:ring-gray-700">
          <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10 mb-4">
            <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">Dar de baja al alumno</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">¿Estás seguro de que deseas dar de baja a <strong class="text-gray-700 dark:text-gray-200">{{ alumno?.nombre }}</strong>? Esta acción lo removerá de cualquier grupo, listas, y no podrá ser restaurado fácilmente. Por seguridad ingresa tu contraseña.</p>
          
          <div v-if="darBajaError" class="mb-4 text-xs font-medium text-red-500 bg-red-50 dark:bg-red-900/10 p-2 rounded-md ring-1 ring-inset ring-red-500/20">
            {{ darBajaError }}
          </div>

          <div class="mb-6">
            <label class="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200 mb-1">Contraseña de Administrador</label>
            <input v-model="darBajaPassword" type="password" placeholder="Tu contraseña..." class="block w-full rounded-md border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-red-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-white dark:ring-gray-700" />
          </div>

            <div class="flex justify-end gap-3">
              <button @click="showDarBajaModal = false" :disabled="darBajaLoading" class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">
                Cancelar
              </button>
              <button @click="confirmDarBaja" :disabled="darBajaLoading" class="px-4 py-2 text-sm font-semibold text-white bg-red-800 border border-transparent rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 inline-flex items-center">
                <svg v-if="darBajaLoading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                Confirmar Baja
              </button>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </admin-layout>
</template>
