<script setup lang="ts">
import { ref } from "vue";
import AdminLayout from "../components/layout/AdminLayout.vue";
import { parseCurp } from "../utils/curpTools";

const step = ref<"list" | "upload" | "review" | "done">("list");
const isDragging = ref(false);

interface DraftStudent {
  id: string;
  name: string;
  curp: string;
}

const draftStudents = ref<DraftStudent[]>([]);

// Generar ID EDU-XXX-XXX
const generateId = () => {
  const p1 = Math.floor(Math.random() * 900) + 100;
  const p2 = Math.floor(Math.random() * 900) + 100;
  return `EDU-${p1}-${p2}`;
};

const mockProcessFile = () => {
  const generated: DraftStudent[] = [
    { id: generateId(), name: "García Pérez Ana", curp: "GAPA120514MDFRRN01" },
    {
      id: generateId(),
      name: "López Silva Carlos",
      curp: "LOSC100822HDFLSR02",
    },
    {
      id: generateId(),
      name: "Rodríguez M. María",
      curp: "ROMM130210MDFRMR03",
    },
    { id: generateId(), name: "Torres Luna Juan", curp: "TOLJ111111HDFTLJ04" },
    { id: generateId(), name: "Gómez Díaz Laura", curp: "GODL130510MDFGDL05" },
  ];

  // Ordenar por nombre (empieza por apellido) alfabéticamente
  generated.sort((a, b) => a.name.localeCompare(b.name));

  draftStudents.value = generated;
  step.value = "review";
};

const handleFileUpload = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    mockProcessFile();
  }
};

const handleDrop = (e: DragEvent) => {
  isDragging.value = false;
  if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
    mockProcessFile();
  }
};

const saveAll = () => {
  console.log("Guardando en lote:", draftStudents.value);
  step.value = "done";
};

const reset = () => {
  draftStudents.value = [];
  step.value = "list";
};
</script>

<template>
  <admin-layout>
    <div class="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <!-- Encabezado de la página -->
      <div class="sm:flex sm:items-center mb-8">
        <div class="sm:flex-auto">
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">
            Alumnos
          </h1>
        </div>
        <div class="mt-4 sm:ml-16 sm:mt-0 flex items-center gap-3">
          <button
            @click="step = 'upload'"
            v-if="step === 'list'"
            title="Smart Import"
            class="flex items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30 p-2.5 text-brand-600 dark:text-brand-400 hover:bg-brand-200 dark:hover:bg-brand-800 transition-colors"
          >
            <svg
              class="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"
              />
              <path
                d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"
              />
              <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
              <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
            </svg>
          </button>
          <router-link
            to="/alumnos/nuevo"
            class="block rounded-full bg-brand-500 px-6 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 transition-colors cursor-pointer"
          >
            Agregar Alumno
          </router-link>
        </div>
      </div>

      <!-- PASO 0: LIST (Empty / Default State) -->
      <div v-if="step === 'list'" class="mt-8 flow-root">
        <div
          class="overflow-x-auto shadow-sm rounded-lg bg-white dark:bg-gray-800 text-center py-16 border border-gray-100 dark:border-gray-700"
        >
          <div
            class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800"
          >
            <svg
              class="h-6 w-6 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
              />
            </svg>
          </div>
          <h3 class="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
            No hay alumnos
          </h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Comienza agregando un alumno o usa el cohete 🚀 para importar en
            lote.
          </p>
        </div>
      </div>

      <!-- PASO 1: UPLOAD -->
      <div v-if="step === 'upload'" class="mt-8">
        <div
          class="flex justify-center rounded-2xl border-2 border-dashed px-6 py-24 sm:py-32 transition-colors relative"
          :class="
            isDragging
              ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/10'
              : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-brand-400 dark:hover:border-brand-500'
          "
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
        >
          <div class="text-center">
            <div
              class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-900/20 mb-6"
            >
              <svg
                class="h-10 w-10 text-brand-600 dark:text-brand-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
                />
              </svg>
            </div>
            <h3
              class="mt-2 text-xl font-semibold text-gray-900 dark:text-white"
            >
              Smart Import Inteligente
            </h3>
            <p
              class="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400 max-w-md mx-auto"
            >
              Arrastra y suelta tu archivo Excel (.xlsx, .csv) o una imagen de
              la lista de asistencia. Nuestra IA extraerá automáticamente
              nombres y fechas sugeridas a partir del CURP.
            </p>
            <div
              class="mt-8 flex justify-center text-sm leading-6 text-gray-600 dark:text-gray-400"
            >
              <label
                for="file-upload"
                class="relative cursor-pointer rounded-md bg-brand-600 px-6 py-3 font-semibold text-white focus-within:outline-none focus-within:ring-2 focus-within:ring-brand-600 focus-within:ring-offset-2 hover:bg-brand-500 transition-colors shadow-sm"
              >
                <span>Seleccionar archivo local</span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  class="sr-only"
                  @change="handleFileUpload"
                  accept=".xlsx,.xls,.csv,image/*"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- PASO 2: REVIEW -->
      <div
        v-if="step === 'review'"
        class="mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
      >
        <div
          class="bg-white dark:bg-gray-900 shadow-sm ring-1 ring-gray-200 dark:ring-gray-800 rounded-xl overflow-hidden"
        >
          <div
            class="px-4 py-4 border-b border-gray-200 dark:border-gray-800 sm:flex sm:items-center sm:justify-between bg-gray-50/50 dark:bg-gray-800/30"
          >
            <div class="flex items-center gap-4">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300"
                >Se encontraron {{ draftStudents.length }} alumnos para
                importar.</span
              >
            </div>
            <div class="mt-4 sm:mt-0 flex gap-3">
              <button
                @click="reset"
                class="text-sm font-semibold leading-6 text-gray-900 dark:text-gray-300 hover:text-gray-500 py-1.5 px-3"
              >
                Descartar
              </button>
              <button
                @click="saveAll"
                class="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                Guardar alumnos
              </button>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table
              class="min-w-full divide-y divide-gray-200 dark:divide-gray-800"
            >
              <thead class="bg-white dark:bg-gray-900">
                <tr>
                  <th
                    scope="col"
                    class="py-3.5 pl-4 pr-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide sm:pl-6"
                  >
                    ID
                  </th>
                  <th
                    scope="col"
                    class="px-3 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    Nombre del Alumno
                  </th>
                  <th
                    scope="col"
                    class="px-3 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    CURP
                  </th>
                  <th
                    scope="col"
                    class="px-3 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody
                class="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900"
              >
                <tr
                  v-for="student in draftStudents"
                  :key="student.id"
                  class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td
                    class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-mono text-gray-500 dark:text-gray-400 sm:pl-6"
                  >
                    {{ student.id }}
                  </td>
                  <td
                    class="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    {{ student.name }}
                  </td>
                  <td
                    class="whitespace-nowrap px-3 py-4 text-sm font-mono text-gray-500 dark:text-gray-400"
                  >
                    {{ student.curp }}
                  </td>
                  <td
                    class="relative whitespace-nowrap py-4 pl-3 pr-4 text-center text-sm font-medium sm:pr-6"
                  >
                    <div class="flex items-center justify-center gap-2">
                      <button
                        class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        title="Ver"
                      >
                        <svg
                          class="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke-width="1.5"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                          />
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                          />
                        </svg>
                      </button>
                      <button
                        class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                        title="Editar"
                      >
                        <svg
                          class="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke-width="1.5"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                          />
                        </svg>
                      </button>
                      <button
                        class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                        title="Eliminar"
                      >
                        <svg
                          class="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke-width="1.5"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- PASO 3: DONE -->
      <div v-if="step === 'done'" class="mt-8">
        <div
          class="rounded-2xl border-2 border-green-100 dark:border-green-900/50 bg-green-50 dark:bg-green-900/20 px-6 py-24 sm:py-32 text-center"
        >
          <div
            class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-800/40 mb-6"
          >
            <svg
              class="h-10 w-10 text-green-600 dark:text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </div>
          <h3 class="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            ¡Importación Exitosa!
          </h3>
          <p
            class="mt-2 text-base text-gray-600 dark:text-gray-300 max-w-md mx-auto"
          >
            Los alumnos han sido calculados, organizados y guardados
            exitosamente en la base de datos de la escuela.
          </p>
          <div class="mt-8">
            <button
              @click="reset"
              class="rounded-md bg-white dark:bg-gray-800 px-6 py-3 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Importar otra lista
            </button>
          </div>
        </div>
      </div>
    </div>
  </admin-layout>
</template>
