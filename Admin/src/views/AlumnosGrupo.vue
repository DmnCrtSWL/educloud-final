<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import AdminLayout from "../components/layout/AdminLayout.vue";

const route = useRoute();
const grupoId = route.params.id as string;

interface Alumno { id: string; nombre: string; curp: string; created_at: string; enrolado?: boolean; }
interface Grupo {
  id: string; grado: number; grupo: string; materia: string;
  turno: string; docente_nombre: string;
}

// ─── State ────────────────────────────────────────────────────────────────────
const grupo = ref<Grupo | null>(null);
const elegibles = ref<Alumno[]>([]);
const loading  = ref(true);
const errorMsg = ref<string | null>(null);
const rango    = ref<{ min: number; max: number } | null>(null);

// Selección para enrolar
const selected     = ref<Set<string>>(new Set());
const enrolling    = ref(false);
const enrollMsg    = ref<string | null>(null);
const enrollError  = ref<string | null>(null);

// Búsqueda global
const searchQuery   = ref("");
const searchResults = ref<Alumno[]>([]);
const searching     = ref(false);
let searchTimer: ReturnType<typeof setTimeout> | null = null;

// ─── Fetch elegibles ──────────────────────────────────────────────────────────
const fetchData = async () => {
  loading.value = true;
  errorMsg.value = null;
  try {
    const res  = await fetch(`http://localhost:3001/api/grupos/${grupoId}/alumnos-elegibles`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    grupo.value    = json.grupo;
    elegibles.value = json.data;
    rango.value    = json.rango;
    // Pre-seleccionar los ya enrolados
    selected.value = new Set(
      (json.data as Alumno[]).filter((a) => a.enrolado).map((a) => a.id)
    );
  } catch (err: unknown) {
    errorMsg.value = (err instanceof Error ? err.message : null) || "Error al cargar";
  } finally {
    loading.value = false;
  }
};
onMounted(fetchData);

// ─── Checkboxes ───────────────────────────────────────────────────────────────
const allSelected = computed(() =>
  elegibles.value.length > 0 && elegibles.value.every((a) => selected.value.has(a.id))
);
const someSelected = computed(() =>
  elegibles.value.some((a) => selected.value.has(a.id)) && !allSelected.value
);

const toggleAll = () => {
  if (allSelected.value) {
    elegibles.value.forEach((a) => selected.value.delete(a.id));
  } else {
    elegibles.value.forEach((a) => selected.value.add(a.id));
  }
  selected.value = new Set(selected.value); // trigger reactivity
};

const toggleOne = (id: string) => {
  if (selected.value.has(id)) selected.value.delete(id);
  else selected.value.add(id);
  selected.value = new Set(selected.value);
};

// ─── Enrolar ─────────────────────────────────────────────────────────────────
const enrolar = async () => {
  if (selected.value.size === 0) return;
  enrolling.value = true;
  enrollMsg.value = null;
  enrollError.value = null;
  try {
    const res = await fetch(`http://localhost:3001/api/grupos/${grupoId}/enrolar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alumno_ids: [...selected.value] }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    enrollMsg.value = json.message;
    await fetchData(); // actualizar la lista
  } catch (err: unknown) {
    enrollError.value = (err instanceof Error ? err.message : null) || "Error al enrolar";
  } finally {
    enrolling.value = false;
  }
};

// ─── Búsqueda debounce ────────────────────────────────────────────────────────
watch(searchQuery, (val) => {
  if (searchTimer) clearTimeout(searchTimer);
  if (!val.trim()) { searchResults.value = []; return; }
  searchTimer = setTimeout(async () => {
    searching.value = true;
    try {
      const res  = await fetch(`http://localhost:3001/api/alumnos?q=${encodeURIComponent(val.trim())}`);
      const json = await res.json();
      searchResults.value = json.data ?? [];
    } catch { searchResults.value = []; }
    finally { searching.value = false; }
  }, 300);
});

// ─── CURP helpers ─────────────────────────────────────────────────────────────
const decodeCurp = (curp: string) => {
  if (!curp || curp.length < 16) return null;
  const yy    = parseInt(curp.slice(4, 6), 10);
  const year  = yy <= 26 ? 2000 + yy : 1900 + yy;
  const sexo  = curp[10] === "H" ? "Hombre" : curp[10] === "M" ? "Mujer" : "—";
  return { year, nacimiento: `${curp.slice(8,10)}/${curp.slice(6,8)}/${year}`, sexo };
};

// ─── Agregar de búsqueda ──────────────────────────────────────────────────────
const addToGeneration = (alumno: Alumno) => {
  if (!elegibles.value.some((e) => e.id === alumno.id)) {
    elegibles.value.unshift(alumno); // Lo mete al principio de la tabla
  }
  selected.value.add(alumno.id);
  selected.value = new Set(selected.value); // Activa reactividad
  searchQuery.value = ""; // Limpia la búsqueda
  searchResults.value = [];
};

// ─── Style helpers ────────────────────────────────────────────────────────────
const gradoLabel = (g: number) => (g === 1 ? "1ro" : g === 2 ? "2do" : "3ro");
const gradoStyle = (g: number) => {
  if (g === 1) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
  if (g === 2) return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
  return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
};
const turnoStyle = (t: string) =>
  t === "Matutino"
    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
    : "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300";
</script>

<template>
  <admin-layout>
    <div class="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">

      <!-- Header -->
      <div class="flex items-center gap-4">
        <router-link to="/grupos" class="flex items-center justify-center rounded-full bg-white dark:bg-gray-800 p-2 text-gray-500 hover:text-brand-600 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"/>
          </svg>
        </router-link>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Alumnos del Grupo</h1>
      </div>

      <!-- Loading / Error -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <svg class="animate-spin h-6 w-6 text-brand-500" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
      </div>
      <div v-else-if="errorMsg" class="rounded-md bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-400">⚠️ {{ errorMsg }}</div>

      <template v-else-if="grupo">

        <!-- ─── Grupo header card ─────────────────────────────────────────── -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div class="flex flex-wrap gap-4 items-stretch">
            <div class="flex flex-col items-center bg-gray-50 dark:bg-gray-700/40 rounded-xl px-5 py-3 min-w-[80px]">
              <p class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Grado</p>
              <span :class="['inline-flex items-center rounded-full px-3 py-1 text-sm font-bold ring-1 ring-inset ring-gray-500/10', gradoStyle(grupo.grado)]">{{ gradoLabel(grupo.grado) }}</span>
            </div>
            <div class="flex flex-col items-center bg-gray-50 dark:bg-gray-700/40 rounded-xl px-5 py-3 min-w-[80px]">
              <p class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Grupo</p>
              <span class="text-2xl font-black text-gray-900 dark:text-white">{{ grupo.grupo }}</span>
            </div>
            <div class="flex flex-col items-center bg-gray-50 dark:bg-gray-700/40 rounded-xl px-5 py-3 min-w-[110px]">
              <p class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Turno</p>
              <span :class="['inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ring-gray-500/10', turnoStyle(grupo.turno)]">{{ grupo.turno }}</span>
            </div>
            <div class="flex flex-col bg-gray-50 dark:bg-gray-700/40 rounded-xl px-5 py-3 flex-1 min-w-[160px]">
              <p class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Materia</p>
              <p class="text-base font-bold text-gray-900 dark:text-white">{{ grupo.materia }}</p>
            </div>
            <div class="flex flex-col bg-gray-50 dark:bg-gray-700/40 rounded-xl px-5 py-3 flex-1 min-w-[160px]">
              <p class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Docente</p>
              <div class="flex items-center gap-2 mt-0.5">
                <div class="h-7 w-7 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-xs font-bold text-brand-700 dark:text-brand-300 flex-shrink-0">{{ grupo.docente_nombre.charAt(0) }}</div>
                <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ grupo.docente_nombre }}</p>
              </div>
            </div>
          </div>
          <div v-if="rango" class="mt-4 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <svg class="h-4 w-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/>
            </svg>
            Ciclo 2025–2026 · Generación elegible: nacidos entre {{ rango.min }} y {{ rango.max }}
          </div>
        </div>

        <!-- ─── Buscador de casos especiales ─────────────────────────────── -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <svg class="h-5 w-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9ZM9.75 14.25l1.039-.039a1.5 1.5 0 0 1 1.07.43l1.141 1.142a1.5 1.5 0 0 0 1.07.43l1.141.039m-4.461 4.453 1.039-.039a1.5 1.5 0 0 1 1.07.43l1.141 1.142a1.5 1.5 0 0 0 1.07.43l1.141.039"/>
            </svg>
            Búsqueda manual
            <span class="text-xs font-normal text-gray-400">(agrega alumnos de otra generación o repetidores)</span>
          </h2>
          <div class="relative">
            <input v-model="searchQuery" type="text" placeholder="Nombre, código EDU-XXX-XXX o CURP…"
              class="block w-full rounded-xl border-0 py-3 pl-10 pr-4 text-gray-900 dark:text-white dark:bg-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm"/>
            <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg v-if="!searching" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
              </svg>
              <svg v-else class="animate-spin h-4 w-4 text-brand-400" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            </div>
          </div>
          <div v-if="searchResults.length > 0" class="mt-3 space-y-2">
            <div v-for="a in searchResults" :key="a.id"
              class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 px-4 py-3">
              
              <div class="flex items-center gap-3 min-w-0">
                <div class="h-9 w-9 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-sm font-bold text-brand-700 dark:text-brand-300 flex-shrink-0">
                  {{ a.nombre.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase() }}
                </div>
                <div class="min-w-0 pr-2">
                  <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ a.nombre }}</p>
                  <p class="text-xs text-gray-500 font-mono">{{ a.id }} · {{ a.curp }}</p>
                </div>
              </div>

              <div class="flex items-center gap-3 flex-shrink-0 sm:ml-auto">
                <span v-if="decodeCurp(a.curp)" class="text-xs text-gray-400 font-mono hidden sm:inline-block">Nac. {{ decodeCurp(a.curp)?.year }}</span>
                <span v-if="selected.has(a.id)" class="inline-flex items-center rounded-lg bg-brand-100 dark:bg-brand-900/30 px-3 py-1.5 text-xs font-semibold text-brand-700 dark:text-brand-300">
                  Seleccionado en tabla
                </span>
                <button v-else @click="addToGeneration(a)" class="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 dark:bg-white px-3 py-1.5 text-xs font-semibold text-white dark:text-gray-900 shadow-sm hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Agregar a la lista
                </button>
              </div>
            </div>
          </div>
          <div v-else-if="searchQuery.trim() && !searching" class="mt-3 text-center text-sm text-gray-400 py-4">
            Sin resultados para "{{ searchQuery }}"
          </div>
        </div>

        <!-- ─── Tabla de elegibles con checkboxes ────────────────────────── -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <!-- Barra de acción sticky -->
          <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 class="text-base font-semibold text-gray-900 dark:text-white">
                Generación elegible
                <span class="ml-2 text-sm font-normal text-gray-500"> {{ elegibles.length }} alumnos · {{ selected.size }} seleccionados</span>
              </h2>
            </div>
            <div class="flex items-center gap-3">
              <!-- Feedback msgs -->
              <span v-if="enrollMsg" class="text-sm text-green-600 dark:text-green-400">✅ {{ enrollMsg }}</span>
              <span v-if="enrollError" class="text-sm text-red-600 dark:text-red-400">⚠️ {{ enrollError }}</span>
              <!-- Botón enrolar -->
              <button
                @click="enrolar"
                :disabled="selected.size === 0 || enrolling"
                class="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg v-if="enrolling" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                <svg v-else class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"/>
                </svg>
                {{ enrolling ? "Enrolando…" : `Enrolar ${selected.size > 0 ? selected.size : ''} seleccionados` }}
              </button>
            </div>
          </div>

          <table class="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
            <thead class="bg-gray-50/50 dark:bg-gray-800/30">
              <tr>
                <th class="py-3.5 pl-6 pr-3 w-10">
                  <!-- Select all -->
                  <input
                    type="checkbox"
                    :checked="allSelected"
                    :indeterminate="someSelected"
                    @change="toggleAll"
                    class="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-brand-600 focus:ring-brand-600 cursor-pointer"
                  />
                </th>
                <th class="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">#</th>
                <th class="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Alumno</th>
                <th class="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Código</th>
                <th class="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">CURP</th>
                <th class="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Nacimiento</th>
                <th class="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Sexo</th>
                <th class="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-900">
              <tr
                v-for="(a, i) in elegibles"
                :key="a.id"
                @click="toggleOne(a.id)"
                :class="[
                  'cursor-pointer transition-colors',
                  selected.has(a.id)
                    ? 'bg-brand-50 dark:bg-brand-900/10'
                    : 'hover:bg-gray-50/50 dark:hover:bg-gray-800/30'
                ]"
              >
                <td class="py-4 pl-6 pr-3 w-10" @click.stop>
                  <input
                    type="checkbox"
                    :checked="selected.has(a.id)"
                    @change="toggleOne(a.id)"
                    class="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-brand-600 focus:ring-brand-600 cursor-pointer"
                  />
                </td>
                <td class="px-3 py-4 text-sm font-mono text-gray-400 dark:text-gray-500">{{ i + 1 }}</td>
                <td class="px-3 py-4">
                  <div class="flex items-center gap-3">
                    <div :class="[
                      'h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors',
                      selected.has(a.id)
                        ? 'bg-brand-500 text-white'
                        : 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                    ]">
                      {{ a.nombre.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase() }}
                    </div>
                    <router-link :to="`/alumnos/${a.id}/perfil`" @click.stop
                      class="text-sm font-semibold text-gray-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                      {{ a.nombre }}
                    </router-link>
                  </div>
                </td>
                <td class="px-3 py-4 text-xs font-mono text-gray-500 dark:text-gray-400">{{ a.id }}</td>
                <td class="px-3 py-4 text-xs font-mono text-gray-600 dark:text-gray-300">{{ a.curp }}</td>
                <td class="px-3 py-4 text-sm text-gray-700 dark:text-gray-300">{{ decodeCurp(a.curp)?.nacimiento ?? '—' }}</td>
                <td class="px-3 py-4 text-sm text-gray-700 dark:text-gray-300">{{ decodeCurp(a.curp)?.sexo ?? '—' }}</td>
                <td class="px-3 py-4">
                  <span v-if="a.enrolado" class="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-300">
                    ✓ Enrolado
                  </span>
                  <span v-else class="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Pendiente
                  </span>
                </td>
              </tr>

              <!-- Empty state -->
              <tr v-if="elegibles.length === 0">
                <td colspan="8" class="py-16 text-center">
                  <svg class="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600 mb-2" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/>
                  </svg>
                  <p class="text-sm font-semibold text-gray-900 dark:text-white">Sin alumnos elegibles</p>
                  <p class="mt-1 text-sm text-gray-500">Nacidos entre {{ rango?.min }} y {{ rango?.max }}.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </template>
    </div>
  </admin-layout>
</template>
