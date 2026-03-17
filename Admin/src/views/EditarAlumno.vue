<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import AdminLayout from "../components/layout/AdminLayout.vue";

const route = useRoute();
void useRouter; // available if needed for navigation
const alumnoId = route.params.id as string;

interface Tutor { nombre: string; telefono: string; correo: string; }
interface Alumno {
  id: string; nombre: string; curp: string;
  notas_importancia: string | null;
  tutores: Tutor[];
  created_at: string; updated_at: string;
}

// ─── State ─────────────────────────────────────────────────────────────────
const alumno = ref<Alumno | null>(null);
const loading = ref(true);
const saving = ref(false);
const errorMsg = ref<string | null>(null);
const successMsg = ref<string | null>(null);

// Campos editables
const notas = ref("");
const tutores = ref<Tutor[]>([
  { nombre: "", telefono: "", correo: "" },
  { nombre: "", telefono: "", correo: "" },
]);

onMounted(async () => {
  try {
    const res = await fetch(`http://localhost:3001/api/alumnos/${alumnoId}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    alumno.value = json.data;
    notas.value = json.data.notas_importancia ?? "";
    // Rellenar tutores existentes
    const existentes: Tutor[] = json.data.tutores ?? [];
    tutores.value = [
      existentes[0] ?? { nombre: "", telefono: "", correo: "" },
      existentes[1] ?? { nombre: "", telefono: "", correo: "" },
    ];
  } catch (err: unknown) {
    errorMsg.value = (err instanceof Error ? err.message : null) || "No se pudo cargar el alumno";
  } finally {
    loading.value = false;
  }
});

// Avatar/color
const initials = computed(() => {
  if (!alumno.value) return "?";
  return alumno.value.nombre.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
});
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

// ─── Guardar ──────────────────────────────────────────────────────────────────
const save = async () => {
  saving.value = true;
  errorMsg.value = null;
  successMsg.value = null;
  try {
    const tutoresFiltrados = tutores.value.filter((t) => t.nombre.trim());
    const res = await fetch(`http://localhost:3001/api/alumnos/${alumnoId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notas_importancia: notas.value.trim() || null,
        tutores: tutoresFiltrados,
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    successMsg.value = "Cambios guardados correctamente";
  } catch (err: unknown) {
    errorMsg.value = (err instanceof Error ? err.message : null) || "Error al guardar";
  } finally {
    saving.value = false;
  }
};

const inputClass = "block w-full rounded-md border-0 py-2.5 text-gray-900 dark:text-white dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm px-4";
const labelClass = "block text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1";
</script>

<template>
  <admin-layout>
    <div class="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <router-link
            :to="`/alumnos/${alumnoId}/perfil`"
            class="flex items-center justify-center rounded-full bg-white dark:bg-gray-800 p-2 text-gray-500 hover:text-brand-600 dark:hover:text-brand-400 shadow-sm transition-colors border border-gray-100 dark:border-gray-700"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"/>
            </svg>
          </router-link>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Editar Alumno</h1>
        </div>
        <!-- Botón guardar arriba -->
        <button
          v-if="alumno"
          @click="save"
          :disabled="saving"
          class="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors disabled:opacity-60"
        >
          <svg v-if="saving" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          {{ saving ? "Guardando..." : "Guardar cambios" }}
        </button>
      </div>

      <!-- Mensajes de estado -->
      <div v-if="successMsg" class="rounded-md bg-green-50 dark:bg-green-900/20 p-3 text-sm text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
        ✅ {{ successMsg }}
      </div>
      <div v-if="errorMsg" class="rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
        ⚠️ {{ errorMsg }}
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-24">
        <svg class="animate-spin h-6 w-6 text-brand-500" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
      </div>

      <!-- Contenido -->
      <div v-else-if="alumno" class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

        <!-- ─── Columna Izquierda (4 cols) ─── -->
        <div class="lg:col-span-4 space-y-5">

          <!-- Identificación (readonly) -->
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div :class="`h-24 bg-gradient-to-r ${avatarGradient}`"></div>
            <div class="px-6 pb-6 relative">
              <div class="flex justify-center -mt-12 mb-4">
                <div :class="`h-24 w-24 rounded-full border-4 border-white dark:border-gray-800 shadow-sm flex items-center justify-center text-white text-3xl font-bold bg-gradient-to-br ${avatarGradient}`">
                  {{ initials }}
                </div>
              </div>
              <div class="text-center">
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">{{ alumno.nombre }}</h2>
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1 font-mono">{{ alumno.id }}</p>
                <div class="mt-3 inline-flex items-center rounded-full bg-gray-50 dark:bg-gray-700/50 px-3 py-1 text-xs font-mono font-medium text-gray-700 dark:text-gray-300 ring-1 ring-inset ring-gray-200 dark:ring-gray-600">
                  CURP: {{ alumno.curp }}
                </div>
              </div>
            </div>
          </div>

          <!-- Datos de CURP (readonly) -->
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
          <div v-if="curpInfo" class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">Estado de Nacimiento</p>
            <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ curpInfo.estado }}</p>
          </div>

          <!-- ──── Padres / Tutores ──── -->
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
            <div class="flex items-center gap-2 mb-4">
              <div class="h-7 w-7 rounded-lg bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center flex-shrink-0">
                <svg class="h-4 w-4 text-sky-500" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"/>
                </svg>
              </div>
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Padres / Tutores</h3>
            </div>

            <div class="space-y-5">
              <div v-for="(tutor, i) in tutores" :key="i" class="space-y-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                <p class="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">Tutor {{ i + 1 }}</p>
                <div>
                  <label :class="labelClass">Nombre</label>
                  <input v-model="tutor.nombre" type="text" :class="inputClass" placeholder="Nombre completo"/>
                </div>
                <div>
                  <label :class="labelClass">Teléfono</label>
                  <input v-model="tutor.telefono" type="tel" :class="inputClass" placeholder="55 1234 5678"/>
                </div>
                <div>
                  <label :class="labelClass">Correo</label>
                  <input v-model="tutor.correo" type="email" :class="inputClass" placeholder="correo@ejemplo.com"/>
                </div>
              </div>
            </div>
          </div>

          <!-- ──── Notas de Importancia ──── -->
          <div class="bg-red-50 dark:bg-red-900/10 rounded-2xl shadow-sm border border-red-100 dark:border-red-900/30 p-5">
            <div class="flex items-center gap-2 mb-3">
              <svg class="h-5 w-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <h3 class="text-sm font-bold text-red-900 dark:text-red-400 uppercase tracking-wider">Notas de Importancia</h3>
            </div>
            <textarea
              v-model="notas"
              rows="5"
              class="block w-full rounded-md border-0 py-2.5 text-gray-900 dark:text-white dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-red-200 dark:ring-red-900/40 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-red-400 sm:text-sm px-4 resize-none"
              placeholder="Ej. Alergia a penicilina, asma leve, requiere sentarse al frente..."
            />
          </div>

        </div>

        <!-- ─── Columna Derecha (8 cols) ─── -->
        <div class="lg:col-span-8">
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 lg:p-8">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Resumen</h3>
            <p class="text-sm text-gray-400 dark:text-gray-500">
              Completa los campos de la columna izquierda y presiona <span class="font-semibold text-brand-500">Guardar cambios</span>.
              El nombre y la CURP solo se pueden editar desde una solicitud especial.
            </p>

            <!-- Vista previa de tutores -->
            <div v-if="tutores.some(t => t.nombre.trim())" class="mt-6 space-y-3">
              <p class="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Vista previa — Tutores a guardar</p>
              <div v-for="(t, i) in tutores.filter(t => t.nombre.trim())" :key="i" class="flex items-start gap-3 rounded-lg bg-gray-50 dark:bg-gray-700/30 px-4 py-3">
                <div class="h-8 w-8 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center flex-shrink-0 text-sky-600 dark:text-sky-400 text-sm font-bold">
                  T{{ i + 1 }}
                </div>
                <div>
                  <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ t.nombre }}</p>
                  <p v-if="t.telefono" class="text-xs text-gray-500">📞 {{ t.telefono }}</p>
                  <p v-if="t.correo" class="text-xs text-gray-500">✉️ {{ t.correo }}</p>
                </div>
              </div>
            </div>

            <!-- Vista previa de notas -->
            <div v-if="notas.trim()" class="mt-6">
              <p class="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">Vista previa — Nota de importancia</p>
              <div class="rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 px-4 py-3 text-sm text-red-900 dark:text-red-300">
                {{ notas }}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </admin-layout>
</template>
