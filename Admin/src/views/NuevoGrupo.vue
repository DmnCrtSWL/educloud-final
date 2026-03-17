<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import AdminLayout from "../components/layout/AdminLayout.vue";
import { authHeaders } from "../composables/useAuth";

const router = useRouter();

// ─── Constantes ───────────────────────────────────────────────────────────────
const grupoOptions = ["A","B","C","D","E","F","G","H","I","J","K","L"];

// ─── Docentes ─────────────────────────────────────────────────────────────────
interface Docente { id: string; nombre: string; }
const docentes = ref<Docente[]>([]);

onMounted(async () => {
  try {
    const res  = await fetch("http://localhost:3001/api/usuarios", { headers: authHeaders() });
    const json = await res.json();
    if (json.ok) {
      docentes.value = (json.data as { id: string; nombre: string; rol: string }[])
        .filter((u) => u.rol === "Docente")
        .map((u) => ({ id: u.id, nombre: u.nombre }));
    }
  } catch { /* silencioso */ }
});

// ─── Alumnos (para enrolar) ───────────────────────────────────────────────────
interface Alumno { id: string; nombre: string; curp: string; enrolado?: boolean; }
const todosAlumnos  = ref<Alumno[]>([]);
const alumnosSearch = ref("");
const selectedIds   = ref<Set<string>>(new Set());

const alumnosFiltrados = computed(() => {
  const q = alumnosSearch.value.toLowerCase();
  return todosAlumnos.value.filter(
    (a) => !q || a.nombre.toLowerCase().includes(q) || a.curp.toLowerCase().includes(q)
  );
});

const fetchAlumnos = async (grupoId: string) => {
  try {
    const res  = await fetch(`http://localhost:3001/api/grupos/${grupoId}/alumnos-elegibles`, { headers: authHeaders() });
    const json = await res.json();
    if (json.ok) {
      todosAlumnos.value  = json.data;
      selectedIds.value   = new Set(json.data.filter((a: Alumno) => a.enrolado).map((a: Alumno) => a.id));
    }
  } catch { /* silencioso */ }
};

const toggleAlumno = (id: string) => {
  const s = new Set(selectedIds.value);
  if (s.has(id)) { s.delete(id); } else { s.add(id); }
  selectedIds.value = s;
};

// ─── Paso 1: Crear grupo ──────────────────────────────────────────────────────
type Step = 1 | 2;
const step      = ref<Step>(1);
const grupoId   = ref<string | null>(null);

const form = ref({ grado: 1 as 1|2|3, grupo: "A", turno: "Matutino" });
const saving  = ref(false);
const errorMsg = ref<string | null>(null);

const formValid = computed(() => form.value.grado && form.value.grupo && form.value.turno);

const crearGrupo = async () => {
  if (!formValid.value) return;
  saving.value  = true;
  errorMsg.value = null;
  try {
    const res  = await fetch("http://localhost:3001/api/grupos", {
      method:  "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body:    JSON.stringify({
        grado: form.value.grado,
        grupo: form.value.grupo,
        turno: form.value.turno,
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    grupoId.value = json.data.id;
    await fetchAlumnos(json.data.id);
    step.value = 2;
  } catch (err: unknown) {
    errorMsg.value = (err instanceof Error ? err.message : null) || "Error al guardar";
  } finally {
    saving.value = false;
  }
};

// ─── Paso 2: Enrolar alumnos ──────────────────────────────────────────────────
const enrolando = ref(false);

const enrolarYContinuar = async () => {
  if (!grupoId.value) return;
  enrolando.value = true;
  try {
    const ids = Array.from(selectedIds.value);
    if (ids.length > 0) {
      await fetch(`http://localhost:3001/api/grupos/${grupoId.value}/enrolar`, {
        method:  "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body:    JSON.stringify({ alumno_ids: ids }),
      });
    }
    router.push(`/grupos/${grupoId.value}/detalle`);
  } finally {
    enrolando.value = false;
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const gradoLabel = (g: number) => g === 1 ? "1er" : g === 2 ? "2do" : "3er";
const selectClass = "block w-full rounded-md border-0 py-2.5 px-4 text-gray-900 dark:text-white dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm appearance-none";
</script>

<template>
  <admin-layout>
    <div class="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">

      <!-- Header -->
      <div class="mb-8 flex items-center gap-4">
        <button
          @click="step === 1 ? router.push('/grupos') : step = 1"
          class="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"/>
          </svg>
        </button>
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Nuevo Grupo</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Paso {{ step }} de 2 — {{ step === 1 ? 'Datos del grupo' : 'Enrolar alumnos' }}
          </p>
        </div>
      </div>

      <!-- Stepper visual -->
      <div class="flex items-center mb-8 gap-0">
        <div class="flex items-center gap-2">
          <div :class="['h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors', step >= 1 ? 'bg-brand-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500']">1</div>
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Datos</span>
        </div>
        <div class="flex-1 h-px bg-gray-200 dark:bg-gray-700 mx-3"></div>
        <div class="flex items-center gap-2">
          <div :class="['h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors', step >= 2 ? 'bg-brand-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500']">2</div>
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Alumnos</span>
        </div>
      </div>

      <!-- Error global -->
      <div v-if="errorMsg" class="mb-5 rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
        ⚠️ {{ errorMsg }}
      </div>

      <!-- ─── PASO 1: Datos del grupo ───────────────────────────────────────── -->
      <div v-if="step === 1" class="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 rounded-xl px-6 py-8">
        <form @submit.prevent="crearGrupo">
          <div class="space-y-6">

            <!-- Grado + Grupo -->
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <!-- Grado -->
              <div>
                <label class="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">Grado</label>
                <div class="relative">
                  <select id="grado" v-model.number="form.grado" :class="selectClass">
                    <option :value="1">1er grado</option>
                    <option :value="2">2do grado</option>
                    <option :value="3">3er grado</option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
                    </svg>
                  </div>
                </div>
              </div>

              <!-- Grupo -->
              <div>
                <label class="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">Grupo</label>
                <div class="relative">
                  <select id="grupo" v-model="form.grupo" :class="selectClass">
                    <option v-for="g in grupoOptions" :key="g" :value="g">Grupo {{ g }}</option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <!-- Turno -->
            <div>
              <label class="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">Turno</label>
              <div class="flex gap-3">
                <label
                  v-for="t in ['Matutino', 'Vespertino']"
                  :key="t"
                  :class="[
                    'flex-1 flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 cursor-pointer text-sm font-medium transition-all',
                    form.turno === t
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600',
                  ]"
                >
                  <input type="radio" :value="t" v-model="form.turno" class="sr-only"/>
                  <svg v-if="t === 'Matutino'" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"/>
                  </svg>
                  <svg v-else class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"/>
                  </svg>
                  {{ t }}
                </label>
              </div>
            </div>

            <!-- Preview del ID -->
            <div class="rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
              <svg class="h-5 w-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z"/>
              </svg>
              <div>
                <p class="text-xs text-gray-500 dark:text-gray-400">Se creará como</p>
                <p class="text-sm font-semibold text-gray-900 dark:text-white font-mono">
                  GRP-XXXX · {{ gradoLabel(form.grado) }} grado · Grupo {{ form.grupo }} · {{ form.turno }}
                </p>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-4">
            <button
              type="button"
              @click="router.push('/grupos')"
              class="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-500 py-2 px-4 rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="!formValid || saving"
              class="rounded-md bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg v-if="saving" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              {{ saving ? 'Creando grupo…' : 'Crear grupo y continuar →' }}
            </button>
          </div>
        </form>
      </div>

      <!-- ─── PASO 2: Enrolar Alumnos ──────────────────────────────────────── -->
      <div v-else class="space-y-4">

        <!-- Info card del grupo creado -->
        <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-5 py-4 flex items-center gap-3">
          <svg class="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
          </svg>
          <div>
            <p class="text-sm font-semibold text-green-800 dark:text-green-300">Grupo creado: <span class="font-mono">{{ grupoId }}</span></p>
            <p class="text-xs text-green-700 dark:text-green-400">Ahora selecciona los alumnos que formarán parte del grupo.</p>
          </div>
        </div>

        <!-- Panel de selección de alumnos -->
        <div class="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">

          <!-- Search + contador -->
          <div class="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-4">
            <div class="relative flex-1 max-w-xs">
              <svg class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
              </svg>
              <input
                v-model="alumnosSearch"
                type="text"
                placeholder="Buscar alumno…"
                class="block w-full rounded-md border-0 py-2 pl-9 pr-3 text-gray-900 dark:text-white dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-brand-600 sm:text-sm"
              />
            </div>
            <span class="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
              <span class="font-semibold text-brand-600 dark:text-brand-400">{{ selectedIds.size }}</span> seleccionados
            </span>
          </div>

          <!-- Lista -->
          <div class="max-h-96 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
            <!-- Vacío -->
            <div v-if="todosAlumnos.length === 0" class="py-16 text-center text-sm text-gray-400 dark:text-gray-500">
              No se encontraron alumnos elegibles para este grado.
            </div>
            <label
              v-for="alumno in alumnosFiltrados"
              :key="alumno.id"
              :class="[
                'flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors',
                selectedIds.has(alumno.id)
                  ? 'bg-brand-50 dark:bg-brand-900/10'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
              ]"
            >
              <input
                type="checkbox"
                :checked="selectedIds.has(alumno.id)"
                @change="toggleAlumno(alumno.id)"
                class="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ alumno.nombre }}</p>
                <p class="text-xs font-mono text-gray-400 dark:text-gray-500">{{ alumno.curp }}</p>
              </div>
              <span v-if="alumno.enrolado" class="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md">Ya enrolado</span>
            </label>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between gap-4 pt-2">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Puedes enrolar más alumnos desde el detalle del grupo.
          </p>
          <button
            @click="enrolarYContinuar"
            :disabled="enrolando"
            class="rounded-md bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <svg v-if="enrolando" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            {{ selectedIds.size > 0 ? `Enrolar ${selectedIds.size} alumno(s) y continuar →` : 'Continuar sin enrolar →' }}
          </button>
        </div>
      </div>

    </div>
  </admin-layout>
</template>
