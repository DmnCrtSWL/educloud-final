<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import AdminLayout from "../components/layout/AdminLayout.vue";
import { useGroupState } from "@/composables/useGroupState";
import { getLocalDateString } from "@/utils/dateUtils";

const route = useRoute();
const router = useRouter();
const { selectedGroup } = useGroupState();

// Identificador del Trabajo recibido por URL
const idTrabajo = computed(() => route.params.id as string);

// Mock Evaluación Actual (simulando lo que vendría de Backend)
const trabajoActual = ref({
  id: idTrabajo.value,
  nombre: "Proyecto Trimestral",
  tipo: "Trabajo en Clase", // O "Examen", "Tarea"
  descripcion: "Realización de prototipo y exposición oral final.",
  fechaInicio: "2023-10-15",
  fechaEntrega: "2023-11-15",
  ponderacionMes: 30, // % del mes
  criterios: [
    { id: 1, nombre: "Ortografía y Redacción", porcentaje: 20 },
    { id: 2, nombre: "Creatividad", porcentaje: 30 },
    { id: 3, nombre: "Exposición Oral", porcentaje: 50 },
  ]
});

// Mock Students
const alumnos = ref([
  { id: "1", nombre: "Ana Sofía García", matricula: "ALU-001" },
  { id: "2", nombre: "Carlos Mendoza", matricula: "ALU-002" },
  { id: "3", nombre: "Elena Ramírez", matricula: "ALU-003" },
  { id: "4", nombre: "Javier Hernández", matricula: "ALU-004" },
]);

// Helper for Initials
const getInitials = (name: string) => {
  const parts = name.split(" ");
  return (parts[0][0] + (parts[1] ? parts[1][0] : "")).toUpperCase();
};

// Estado Reactivo de las Calificaciones (alumnoId -> criterioId -> valor)
// 100 base para el input (si el criterio vale 20%, y saca 50/100, suma 10% a su nota final)
const notasMap = ref<Record<string, Record<number, number>>>({});

// Inicializamos el mapa en vacío
alumnos.value.forEach(a => {
  notasMap.value[a.id] = {};
});

// Función para obtener nota total en base 100 de acuerdo al peso de los criterios
const getNotaFinalAlumno = (alumnoId: string) => {
  let acumulado = 0;
  trabajoActual.value.criterios.forEach(c => {
    const calif = notasMap.value[alumnoId]?.[c.id] || 0; // valor de 0 a 100 base
    acumulado += (calif * c.porcentaje) / 100;
  });
  return acumulado.toFixed(1);
};

// Emojis y Observaciones
const EMOJIS = ['🌟', '👍', '👎', '😕', '🥇', '🚨'];
const emojiMap = ref<Record<string, string>>({});
const activeEmojiDropdown = ref<string | null>(null);

const toggleEmojiDropdown = (studentId: string) => {
  activeEmojiDropdown.value = activeEmojiDropdown.value === studentId ? null : studentId;
};

const selectEmoji = (studentId: string, emoji: string) => {
  if (emoji === '') delete emojiMap.value[studentId];
  else emojiMap.value[studentId] = emoji;
  triggerAutoSave();
  activeEmojiDropdown.value = null;
};

// Auto-save simulation
const isSaving = ref(false);
const hasSaved = ref(false);
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
let savedStateTimeout: ReturnType<typeof setTimeout> | null = null;

const triggerAutoSave = () => {
  isSaving.value = true;
  hasSaved.value = false;
  if (saveTimeout) clearTimeout(saveTimeout);
  if (savedStateTimeout) clearTimeout(savedStateTimeout);
  
  saveTimeout = setTimeout(() => {
    isSaving.value = false;
    hasSaved.value = true;
    savedStateTimeout = setTimeout(() => { hasSaved.value = false; }, 3000);
  }, 600);
};

// Modals
const closeDropdowns = () => activeEmojiDropdown.value = null;

onMounted(() => document.addEventListener('click', closeDropdowns));
onUnmounted(() => document.removeEventListener('click', closeDropdowns));

const goBack = () => router.push("/tareas");

// ------------- LOGICA DEL MODAL DE OBSERVACIONES -------------
const observacionVisible = ref(false);
const alumnoEditando = ref<{id: string; nombre: string} | null>(null);
const observacionActual = ref("");
const observacionesMap = ref<Record<string, string>>({}); // Diccionario para guardar lo escrito

const abrirModalObservacion = (alumno: any) => {
  alumnoEditando.value = alumno;
  observacionActual.value = observacionesMap.value[alumno.id] || "";
  observacionVisible.value = true;
};

const cerrarModalObservacion = () => {
  observacionVisible.value = false;
  alumnoEditando.value = null;
  observacionActual.value = "";
};

const guardarObservacion = () => {
  if (alumnoEditando.value) {
    observacionesMap.value[alumnoEditando.value.id] = observacionActual.value;
    triggerAutoSave();
  }
  cerrarModalObservacion();
};
// -------------------------------------------------------------

</script>

<template>
  <admin-layout>
    <div class="p-4 sm:p-6 lg:p-8" @click="closeDropdowns">
      <!-- Header y Regresar -->
      <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex items-start gap-4">
          <button
            @click="goBack"
            class="p-2 mt-1 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
          >
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div class="flex flex-col gap-2">
            <h1 class="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
              <span class="inline-flex items-center justify-center rounded-lg p-2 flex-shrink-0" 
                :class="trabajoActual.tipo === 'Examen' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400' : trabajoActual.tipo === 'Tarea' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'">
                <svg v-if="trabajoActual.tipo === 'Examen'" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <svg v-else-if="trabajoActual.tipo === 'Tarea'" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
                <svg v-else class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                </svg>
              </span>
              <span>{{ trabajoActual.nombre }}</span>
            </h1>
            
            <div class="mt-1 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 lg:gap-5">
              <p v-if="selectedGroup" class="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium">
                {{ selectedGroup.grado }}ro {{ selectedGroup.grupo }} - {{ selectedGroup.materia }}
              </p>
              
              <span v-if="selectedGroup" class="hidden sm:inline text-gray-300 dark:text-gray-600">|</span>

              <div class="inline-flex">
                <span class="inline-flex items-center rounded-md bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10 dark:bg-purple-900/40 dark:text-purple-300 dark:ring-purple-700/30">
                  Ponderación: {{ trabajoActual.ponderacionMes ? `${trabajoActual.ponderacionMes}% del Mes` : 'Automática (Restante)' }}
                </span>
              </div>

              <span class="hidden sm:inline text-gray-300 dark:text-gray-600">|</span>

              <div class="flex flex-row items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <div class="flex items-center gap-1.5">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  Inicio: <span class="text-gray-900 dark:text-gray-200 font-medium whitespace-nowrap">{{ trabajoActual.fechaInicio }}</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Entrega: <span class="text-gray-900 dark:text-gray-200 font-medium whitespace-nowrap">{{ trabajoActual.fechaEntrega }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Indicador de Guardado Autorun -->
        <div class="flex items-center gap-2 text-sm h-10 px-4">
          <template v-if="isSaving">
            <svg class="animate-spin h-4 w-4 text-brand-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="text-gray-500 dark:text-gray-400">Guardando...</span>
          </template>
          <template v-else-if="hasSaved">
            <svg class="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span class="text-gray-500 dark:text-gray-400">Guardado</span>
          </template>
        </div>
      </div>

      <!-- Tabla principal de Evaluación -->
      <div class="mt-4 flow-root">
        <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8 pb-32">
          <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div class="overflow-visible shadow-sm rounded-lg bg-white dark:bg-gray-800 border-x border-t border-gray-200 dark:border-gray-700">
              <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-200 sm:pl-6 sticky left-0 z-10 bg-gray-50 dark:bg-gray-800 min-w-[250px] shadow-[1px_0_0_0_rgba(229,231,235,1)] dark:shadow-[1px_0_0_0_rgba(55,65,81,1)]">
                      Estudiante
                    </th>

                    <!-- Generar columnas de rúbrica basados en los Criterios -->
                    <th
                      v-for="criterio in trabajoActual.criterios"
                      :key="criterio.id"
                      scope="col"
                      class="px-3 py-3.5 text-center text-sm font-semibold text-gray-900 dark:text-gray-200 min-w-[140px]"
                    >
                      <div class="flex flex-col items-center">
                        <span class="truncate max-w-[120px]" :title="criterio.nombre">{{ criterio.nombre }}</span>
                        <span class="text-xs font-normal text-gray-500 mt-0.5">Valdrá {{ criterio.porcentaje }}%</span>
                      </div>
                    </th>

                    <!-- Total Score -->
                    <th scope="col" class="px-3 py-3.5 text-center text-sm font-bold text-brand-600 dark:text-brand-400 w-24 border-l border-gray-200 dark:border-gray-700 bg-brand-50/50 dark:bg-brand-900/10">
                      Total
                    </th>

                    <!-- Emoji Action -->
                    <th scope="col" class="px-3 py-3.5 text-center text-sm font-semibold text-gray-900 dark:text-gray-200 w-16">
                      R.
                    </th>
                    <!-- Notes Action -->
                    <th scope="col" class="px-3 py-3.5 text-center text-sm font-semibold text-gray-900 dark:text-gray-200 w-16">
                      Obs.
                    </th>
                  </tr>
                </thead>

                <!-- Filas de Estudiantes -->
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                  <tr v-for="student in alumnos" :key="student.id" class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    
                    <!-- 1. Alumno Info -->
                    <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6 sticky left-0 z-10 bg-white dark:bg-gray-900 shadow-[1px_0_0_0_rgba(229,231,235,1)] dark:shadow-[1px_0_0_0_rgba(55,65,81,1)]">
                      <div class="flex items-center">
                        <div class="h-10 w-10 flex-shrink-0 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 font-medium text-base">
                          {{ getInitials(student.nombre) }}
                        </div>
                        <div class="ml-4">
                          <div class="font-medium text-gray-900 dark:text-white text-sm">
                            {{ student.nombre }}
                          </div>
                          <div class="text-gray-500 dark:text-gray-400 mt-0.5 text-xs">
                            {{ student.matricula }}
                          </div>
                        </div>
                      </div>
                    </td>

                    <!-- 2. Criterios Inputs (sobre 100) -->
                    <td
                      v-for="criterio in trabajoActual.criterios"
                      :key="criterio.id"
                      class="whitespace-nowrap px-3 py-4 text-sm text-center align-middle"
                    >
                      <input
                        type="number"
                        v-model="notasMap[student.id][criterio.id]"
                        @input="triggerAutoSave"
                        min="0"
                        max="100"
                        placeholder="-"
                        class="w-16 mx-auto rounded-md border-0 py-1.5 text-center text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-white dark:ring-gray-600 [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </td>

                    <!-- 3. Acumulado / Score (calculado sumando la multiplicación del peso) -->
                    <td class="whitespace-nowrap px-3 py-4 text-sm text-center font-bold text-gray-900 dark:text-white border-l border-gray-200 dark:border-gray-700 bg-brand-50/20 dark:bg-brand-900/5">
                      {{ getNotaFinalAlumno(student.id) }} <span class="text-xs font-normal text-gray-500">/100</span>
                    </td>

                    <!-- 4. Acciones: Emoji -->
                    <td class="whitespace-nowrap px-3 py-4 text-sm text-center relative">
                      <button
                        @click.stop="toggleEmojiDropdown(student.id)"
                        class="h-8 w-8 rounded-full inline-flex items-center justify-center text-2xl transition-colors mx-auto hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <span v-if="emojiMap[student.id]">{{ emojiMap[student.id] }}</span>
                        <svg v-else class="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>

                      <div
                        v-if="activeEmojiDropdown === student.id"
                        class="absolute z-50 right-full lg:right-1/2 lg:translate-x-1/2 top-4 mt-1 w-max rounded-md bg-white shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-700 dark:ring-gray-600 flex gap-1 p-2"
                        @click.stop
                      >
                        <button v-for="emoji in EMOJIS" :key="emoji" @click="selectEmoji(student.id, emoji)" class="h-8 w-8 rounded-full flex items-center justify-center text-xl hover:bg-gray-100 dark:hover:bg-gray-600">
                          {{ emoji }}
                        </button>
                        <div class="w-px bg-gray-200 dark:bg-gray-600 mx-1"></div>
                        <button @click="selectEmoji(student.id, '')" class="h-8 w-8 rounded-full flex items-center justify-center text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors" title="Quitar">
                          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    </td>

                    <!-- 5. Acciones: Modal Observación -->
                    <td class="whitespace-nowrap py-4 pr-4 pl-3 sm:pr-6 text-center text-sm">
                      <button
                        @click="abrirModalObservacion(student)"
                        class="h-8 w-8 rounded-full inline-flex items-center justify-center transition-colors mx-auto"
                        :class="observacionesMap[student.id] ? 'text-brand-600 bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/30 dark:hover:bg-brand-900/50' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'"
                        :title="observacionesMap[student.id] ? 'Editar observación' : 'Agregar observación'"
                      >
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        <span v-if="observacionesMap[student.id]" class="absolute -top-1 -right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900"></span>
                      </button>
                    </td>
                    
                  </tr>
                </tbody>

              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Observaciones (Oculto por defecto) -->
    <div v-if="observacionVisible" class="relative z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity dark:bg-gray-900/80 backdrop-blur-sm"></div>

      <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div class="relative transform overflow-hidden rounded-xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg dark:bg-gray-800">
            <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4 dark:bg-gray-800">
              <div class="sm:flex sm:items-start">
                <div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10 dark:bg-blue-900/30">
                  <svg class="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                  </svg>
                </div>
                <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                  <h3 class="text-lg font-semibold leading-6 text-gray-900 dark:text-white" id="modal-title">
                    Observación sobre la Evaluación
                  </h3>
                  <div class="mt-2">
                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      Añade un comentario privado o feedback para el alumno <strong class="text-gray-700 dark:text-gray-200">{{ alumnoEditando?.nombre }}</strong>.
                    </p>
                    <textarea
                      v-model="observacionActual"
                      rows="4"
                      class="block w-full rounded-md border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-white dark:ring-gray-600 px-3"
                      placeholder="Escribe tu observación o nota rápida aquí..."
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
            <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                @click="guardarObservacion"
                class="inline-flex w-full justify-center rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 sm:ml-3 sm:w-auto"
              >
                Guardar Observación
              </button>
              <button
                type="button"
                @click="cerrarModalObservacion"
                class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto dark:bg-gray-700 dark:text-gray-300 dark:ring-gray-600 dark:hover:bg-gray-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

  </admin-layout>
</template>
