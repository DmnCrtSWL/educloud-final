<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import AdminLayout from "../components/layout/AdminLayout.vue";
import { authHeaders } from "../composables/useAuth";

const props  = defineProps<{ id: string }>();
const router = useRouter();

// ─── Catálogo SEP NEM 2026 por grado ─────────────────────────────────────────
const materiasPorGrado: Record<number, string[]> = {
  1: ["Lengua Materna (Español)","Lengua Extranjera (Inglés)","Matemáticas","Ciencias I (Biología)","Historia I","Geografía de México y del Mundo","Formación Cívica y Ética I","Tecnología","Artes","Educación Física I","Tutoría I"],
  2: ["Lengua Materna (Español)","Lengua Extranjera (Inglés)","Matemáticas","Ciencias II (Física)","Historia II (Universal)","Formación Cívica y Ética II","Tecnología","Artes","Educación Física II","Tutoría II"],
  3: ["Lengua Materna (Español)","Lengua Extranjera (Inglés)","Matemáticas","Ciencias III (Química)","Historia de México","Formación Cívica y Ética III","Tecnología","Artes","Educación Física III","Orientación y Tutoría III"],
};

interface GrupoMateria {
  id: string; nombre: string; horario: string | null;
  docente_id: string; docente_nombre: string;
}
interface HorarioBlock {
  dia: number;
  inicio: string;
  fin: string;
}
interface Alumno { id: string; nombre: string; curp: string; }
interface Grupo {
  id: string; grado: number; grupo: string; turno: string; created_at: string;
  materias: GrupoMateria[];
  alumnos: Alumno[];
}
interface Docente { id: string; nombre: string; }

// ─── Estado principal ─────────────────────────────────────────────────────────
const grupo      = ref<Grupo | null>(null);
const loading    = ref(true);
const errorMsg   = ref<string | null>(null);
const docentes   = ref<Docente[]>([]);

// ─── Fetch grupo ──────────────────────────────────────────────────────────────
const fetchGrupo = async () => {
  loading.value  = true;
  errorMsg.value = null;
  try {
    const res  = await fetch(`http://localhost:3001/api/grupos/${props.id}`, { headers: authHeaders() });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    grupo.value = json.data;
  } catch (err: unknown) {
    errorMsg.value = (err instanceof Error ? err.message : null) || "Error al cargar el grupo";
  } finally {
    loading.value = false;
  }
};

// ─── Fetch docentes ───────────────────────────────────────────────────────────
const fetchDocentes = async () => {
  try {
    const res  = await fetch("http://localhost:3001/api/usuarios", { headers: authHeaders() });
    const json = await res.json();
    if (json.ok) {
      docentes.value = (json.data as { id: string; nombre: string; rol: string }[])
        .filter((u) => u.rol === "Docente")
        .map((u) => ({ id: u.id, nombre: u.nombre }));
    }
  } catch { /* silencioso */ }
};

onMounted(async () => {
  await Promise.all([fetchGrupo(), fetchDocentes()]);
});

// ─── Helpers visuales ─────────────────────────────────────────────────────────
const gradoLabel  = (g: number) => g === 1 ? "1er" : g === 2 ? "2do" : "3er";
const gradoStyle  = (g: number) => {
  if (g === 1) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
  if (g === 2) return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
  return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
};
const turnoStyle  = (t: string) =>
  t === "Matutino"
    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
    : "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300";

const diasSemana = [
  { id: 1, label: "Lunes" },
  { id: 2, label: "Martes" },
  { id: 3, label: "Miércoles" },
  { id: 4, label: "Jueves" },
  { id: 5, label: "Viernes" },
  { id: 6, label: "Sábado" },
];

const formatHorario = (hr: string | null) => {
  if (!hr) return "";
  try {
    const parsed = JSON.parse(hr) as HorarioBlock[];
    if (Array.isArray(parsed)) {
      if (parsed.length === 0) return "";
      return parsed.map(h => {
        const d = diasSemana.find(day => day.id === h.dia)?.label.substring(0, 3) || "?";
        return `${d} ${h.inicio}-${h.fin}`;
      }).join(", ");
    }
    return hr; // Fallback to raw string if not an array but valid JSON
  } catch {
    return hr; // Fallback to raw string if legacy
  }
};

// ─── Modal: Agregar Materia ───────────────────────────────────────────────────
const showAddMateria  = ref(false);
const modoLibre       = ref(false);
const savingMateria   = ref(false);
const materiaErrorMsg = ref<string | null>(null);

const newMateria = ref({ nombre: "", docenteId: "" });
const newMateriaHorarios = ref<HorarioBlock[]>([]);

const addHorarioBlock = () => {
  newMateriaHorarios.value.push({ dia: 1, inicio: "08:00", fin: "09:00" });
};
const removeHorarioBlock = (idx: number) => {
  newMateriaHorarios.value.splice(idx, 1);
};

const materiasBase = computed(() =>
  grupo.value ? materiasPorGrado[grupo.value.grado] ?? [] : []
);

const docenteSeleccionado = computed(() =>
  docentes.value.find((d) => d.id === newMateria.value.docenteId)
);

const materiaFormValid = computed(() =>
  newMateria.value.nombre && newMateria.value.docenteId
);

const openAddMateria = () => {
  newMateria.value = { nombre: "", docenteId: "" };
  newMateriaHorarios.value = [];
  modoLibre.value  = false;
  materiaErrorMsg.value = null;
  showAddMateria.value  = true;
};

const saveMateria = async () => {
  if (!materiaFormValid.value || !grupo.value) return;
  savingMateria.value   = true;
  materiaErrorMsg.value = null;
  try {
    const res  = await fetch(`http://localhost:3001/api/grupos/${grupo.value.id}/materias`, {
      method:  "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body:    JSON.stringify({
        nombre:         newMateria.value.nombre.trim(),
        horario:        newMateriaHorarios.value.length > 0 ? JSON.stringify(newMateriaHorarios.value) : null,
        docente_id:     newMateria.value.docenteId,
        docente_nombre: docenteSeleccionado.value?.nombre ?? "",
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    grupo.value.materias.push(json.data);
    showAddMateria.value = false;
  } catch (err: unknown) {
    materiaErrorMsg.value = (err instanceof Error ? err.message : null) || "Error al guardar";
  } finally {
    savingMateria.value = false;
  }
};

// ─── Eliminar materia ─────────────────────────────────────────────────────────
const deletingMateriaId = ref<string | null>(null);

const eliminarMateria = async (materiaId: string) => {
  if (!grupo.value) return;
  deletingMateriaId.value = materiaId;
  try {
    await fetch(`http://localhost:3001/api/grupos/${grupo.value.id}/materias/${materiaId}`, {
      method: "DELETE", headers: authHeaders(),
    });
    grupo.value.materias = grupo.value.materias.filter((m) => m.id !== materiaId);
  } finally {
    deletingMateriaId.value = null;
  }
};

// ─── Tab activo ───────────────────────────────────────────────────────────────
type Tab = "materias" | "alumnos";
const activeTab = ref<Tab>("materias");

// ─── CSS helpers ──────────────────────────────────────────────────────────────
const selectClass = "block w-full rounded-md border-0 py-2.5 px-4 text-gray-900 dark:text-white dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm appearance-none";
const inputClass  = "block w-full rounded-md border-0 py-2.5 px-4 text-gray-900 dark:text-white dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm";
</script>

<template>
  <admin-layout>
    <div class="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">

      <!-- Header -->
      <div class="mb-6 flex items-center gap-4">
        <button
          @click="router.push('/grupos')"
          class="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"/>
          </svg>
        </button>
        <div class="flex-1 min-w-0">
          <div v-if="grupo" class="flex items-center gap-3 flex-wrap">
            <h1 class="text-2xl font-semibold text-gray-900 dark:text-white font-mono">{{ grupo.id }}</h1>
            <span :class="['inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ring-gray-500/10', gradoStyle(grupo.grado)]">
              {{ gradoLabel(grupo.grado) }} grado
            </span>
            <span class="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 ring-1 ring-inset ring-gray-500/10">
              Grupo {{ grupo.grupo }}
            </span>
            <span :class="['inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ring-gray-500/10', turnoStyle(grupo.turno)]">
              {{ grupo.turno }}
            </span>
          </div>
          <div v-else-if="loading" class="h-7 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-24">
        <svg class="animate-spin h-8 w-8 text-brand-500" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
      </div>

      <!-- Error -->
      <div v-else-if="errorMsg" class="rounded-md bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-400">
        ⚠️ {{ errorMsg }}
      </div>

      <template v-else-if="grupo">
        <!-- Stats -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
            <p class="text-xs text-gray-500 dark:text-gray-400">Materias</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ grupo.materias.length }}</p>
          </div>
          <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
            <p class="text-xs text-gray-500 dark:text-gray-400">Alumnos</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ grupo.alumnos.length }}</p>
          </div>
          <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 col-span-2 sm:col-span-1">
            <p class="text-xs text-gray-500 dark:text-gray-400">Turno</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ grupo.turno }}</p>
          </div>
        </div>

        <!-- Tabs -->
        <div class="border-b border-gray-200 dark:border-gray-800 mb-6">
          <nav class="-mb-px flex gap-6">
            <button
              @click="activeTab = 'materias'"
              :class="[
                'py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2',
                activeTab === 'materias'
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
              ]"
            >
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
              <span>Materias ({{ grupo.materias.length }})</span>
            </button>
            <button
              @click="activeTab = 'alumnos'"
              :class="[
                'py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2',
                activeTab === 'alumnos'
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
              ]"
            >
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
              </svg>
              <span>Alumnos ({{ grupo.alumnos.length }})</span>
            </button>
          </nav>
        </div>

        <!-- ─── TAB MATERIAS ──────────────────────────────────────────────── -->
        <div v-if="activeTab === 'materias'">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-base font-semibold text-gray-900 dark:text-white">Lista de Materias</h2>
            <button
              @click="openAddMateria"
              class="flex items-center gap-2 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 transition-colors"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
              </svg>
              Agregar Materia
            </button>
          </div>

          <!-- Empty -->
          <div
            v-if="grupo.materias.length === 0"
            class="bg-white dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl py-16 text-center"
          >
            <svg class="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"/>
            </svg>
            <p class="text-sm text-gray-500 dark:text-gray-400">No hay materias asignadas.</p>
            <button @click="openAddMateria" class="mt-3 text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline">
              + Agregar la primera materia
            </button>
          </div>

          <!-- Tabla materias -->
          <div v-else class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
            <table class="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
              <thead class="bg-gray-50/50 dark:bg-gray-800/30">
                <tr>
                  <th class="py-3.5 pl-5 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">Materia</th>
                  <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">Horario</th>
                  <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">Docente</th>
                  <th class="relative py-3.5 pl-3 pr-5 text-right text-sm font-semibold text-gray-900 dark:text-gray-200">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                <tr
                  v-for="m in grupo.materias"
                  :key="m.id"
                  class="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                >
                  <td class="py-4 pl-5 pr-3 text-sm font-medium text-gray-900 dark:text-white">{{ m.nombre }}</td>
                  <td class="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                    <div v-if="m.horario" class="flex flex-col gap-1">
                      <span
                        v-for="(bk, idx) in formatHorario(m.horario).split(', ')"
                        :key="idx"
                        class="inline-flex w-max items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs font-mono"
                      >
                        🕐 {{ bk }}
                      </span>
                    </div>
                    <span v-else class="text-gray-400 dark:text-gray-600 italic">Sin horario</span>
                  </td>
                  <td class="px-3 py-4 text-sm text-gray-700 dark:text-gray-300">
                    <div class="flex items-center gap-2">
                      <div class="h-7 w-7 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-xs font-bold text-brand-700 dark:text-brand-300 flex-shrink-0">
                        {{ m.docente_nombre.charAt(0) }}
                      </div>
                      {{ m.docente_nombre }}
                    </div>
                  </td>
                  <td class="py-4 pl-3 pr-5 text-right">
                    <button
                      @click="eliminarMateria(m.id)"
                      :disabled="deletingMateriaId === m.id"
                      class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors disabled:opacity-50"
                      title="Eliminar materia"
                    >
                      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ─── TAB ALUMNOS ───────────────────────────────────────────────── -->
        <div v-else>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-base font-semibold text-gray-900 dark:text-white">Alumnos Enrolados</h2>
            <router-link
              :to="`/grupos/${grupo.id}/enrolar`"
              class="flex items-center gap-2 rounded-full border border-brand-500 text-brand-600 dark:text-brand-400 px-4 py-2 text-sm font-semibold hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
              </svg>
              Gestionar alumnos
            </router-link>
          </div>

          <div
            v-if="grupo.alumnos.length === 0"
            class="bg-white dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl py-16 text-center"
          >
            <svg class="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"/>
            </svg>
            <p class="text-sm text-gray-500 dark:text-gray-400">No hay alumnos enrolados en este grupo.</p>
            <router-link :to="`/grupos/${grupo.id}/enrolar`" class="mt-3 inline-block text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline">
              + Enrolar alumnos
            </router-link>
          </div>

          <div v-else class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
            <table class="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
              <thead class="bg-gray-50/50 dark:bg-gray-800/30">
                <tr>
                  <th class="py-3.5 pl-5 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">#</th>
                  <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">Nombre</th>
                  <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">CURP</th>
                  <th class="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 dark:text-gray-200 pr-5">Perfil</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                <tr
                  v-for="(a, i) in grupo.alumnos"
                  :key="a.id"
                  class="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                >
                  <td class="py-4 pl-5 pr-3 text-sm text-gray-400 dark:text-gray-500 font-semibold">{{ i + 1 }}</td>
                  <td class="px-3 py-4 text-sm font-medium text-gray-900 dark:text-white">{{ a.nombre }}</td>
                  <td class="px-3 py-4 text-sm font-mono text-gray-500 dark:text-gray-400">{{ a.curp }}</td>
                  <td class="px-3 py-4 pr-5 text-right">
                    <router-link
                      :to="`/alumnos/${a.id}/perfil`"
                      class="text-brand-600 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
                      title="Ver perfil"
                    >
                      <svg class="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
                      </svg>
                    </router-link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>

    </div>

    <!-- ─── Modal: Agregar Materia ─────────────────────────────────────────── -->
    <Teleport to="body">
      <div v-if="showAddMateria" class="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showAddMateria = false"></div>
        <div class="relative z-10 w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-6">
          <div class="flex items-center justify-between mb-5">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Agregar Materia</h2>
            <button @click="showAddMateria = false" class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div v-if="materiaErrorMsg" class="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
            ⚠️ {{ materiaErrorMsg }}
          </div>

          <div class="space-y-4">

            <!-- Nombre de materia -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="block text-sm font-medium text-gray-900 dark:text-gray-200">Materia</label>
                <button type="button" @click="modoLibre = !modoLibre; newMateria.nombre = ''" class="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium">
                  {{ modoLibre ? '← Catálogo SEP' : 'Materia personalizada' }}
                </button>
              </div>

              <!-- Texto libre -->
              <input
                v-if="modoLibre"
                v-model="newMateria.nombre"
                type="text"
                placeholder="Nombre de la materia…"
                :class="inputClass"
              />

              <!-- Selector SEP -->
              <div v-else class="relative">
                <select v-model="newMateria.nombre" :class="selectClass">
                  <option value="" disabled>Selecciona del catálogo SEP 2026…</option>
                  <optgroup label="Plan SEP NEM 2026">
                    <option v-for="m in materiasBase" :key="m" :value="m">{{ m }}</option>
                  </optgroup>
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
                  </svg>
                </div>
              </div>
            </div>

            <!-- Horarios -->
            <div>
              <div class="flex items-center justify-between mb-3">
                <label class="block text-sm font-medium text-gray-900 dark:text-gray-200">
                  Horario de Clases
                </label>
                <button
                  type="button"
                  @click="addHorarioBlock"
                  class="text-xs flex items-center gap-1 font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
                >
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
                  </svg>
                  Añadir bloque
                </button>
              </div>

              <div class="space-y-3 max-h-48 overflow-y-auto mb-2 custom-scrollbar">
                <div v-if="newMateriaHorarios.length === 0" class="text-sm text-gray-400 dark:text-gray-500 italic text-center py-2 border border-dashed border-gray-200 dark:border-gray-800 rounded-md">
                  Aún no has agregado horarios (opcional).
                </div>
                
                <div
                  v-for="(hb, idx) in newMateriaHorarios"
                  :key="idx"
                  class="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <!-- Día -->
                  <div class="relative w-1/3">
                    <select v-model.number="hb.dia" class="block w-full rounded-md border-0 py-2 pl-3 pr-8 text-gray-900 dark:text-white dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 sm:text-xs appearance-none focus:ring-2 focus:ring-brand-600">
                      <option v-for="d in diasSemana" :key="d.id" :value="d.id">{{ d.label }}</option>
                    </select>
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-gray-500">
                      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/></svg>
                    </div>
                  </div>
                  <!-- Inicio -->
                  <input type="time" v-model="hb.inicio" class="block w-full rounded-md border-0 py-2 px-2 text-gray-900 dark:text-white dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 sm:text-xs focus:ring-2 focus:ring-brand-600" />
                  <span class="text-gray-400 text-xs">a</span>
                  <!-- Fin -->
                  <input type="time" v-model="hb.fin" class="block w-full rounded-md border-0 py-2 px-2 text-gray-900 dark:text-white dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 sm:text-xs focus:ring-2 focus:ring-brand-600" />
                  
                  <!-- Eliminar -->
                  <button type="button" @click="removeHorarioBlock(idx)" class="p-1.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors flex-shrink-0">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Docente -->
            <div>
              <label class="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">Docente Asignado</label>
              <div class="relative">
                <select v-model="newMateria.docenteId" :class="selectClass">
                  <option value="" disabled>Selecciona un docente…</option>
                  <option v-for="d in docentes" :key="d.id" :value="d.id">{{ d.nombre }}</option>
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
                  </svg>
                </div>
              </div>
              <p v-if="docentes.length === 0" class="mt-1 text-xs text-amber-600 dark:text-amber-400">
                No hay usuarios con rol Docente.
              </p>
            </div>
          </div>

          <!-- Acciones -->
          <div class="mt-6 flex items-center justify-end gap-3">
            <button @click="showAddMateria = false" class="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-500 py-2 px-4 rounded-md transition-colors">
              Cancelar
            </button>
            <button
              @click="saveMateria"
              :disabled="!materiaFormValid || savingMateria"
              class="rounded-md bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <svg v-if="savingMateria" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              {{ savingMateria ? 'Guardando…' : 'Agregar Materia' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </admin-layout>
</template>
