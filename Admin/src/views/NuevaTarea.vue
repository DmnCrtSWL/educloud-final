<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import AdminLayout from "../components/layout/AdminLayout.vue";
import { useGroupState } from "@/composables/useGroupState";
import { useAuth } from "@/composables/useAuth";
import flatPickr from "vue-flatpickr-component";
import "flatpickr/dist/flatpickr.css";

const dateConfig = {
  dateFormat: "Y-m-d",
  altInput: true,
  altFormat: "d/m/Y",
};

const router = useRouter();
const { selectedGroup, selectedMateria } = useGroupState();
const { currentUser } = useAuth();

const canEdit = computed(() => {
  if (currentUser.value?.rol !== 'Docente') return false;
  if (!selectedMateria.value) return false;
  return currentUser.value.id === selectedMateria.value.docente_id;
});

interface Criterio {
  id: number;
  nombre: string;
  porcentaje: number | null;
}

const assignment = ref({
  nombre: "",
  descripcion: "",
  tipo: "Trabajo en Clase" as "Tarea" | "Trabajo en Clase" | "Examen",
  ponderacionManual: false,
  porcentajeMes: null as number | null,
  fechaInicio: "",
  fechaEntrega: "",
});

const criterios = ref<Criterio[]>([
  { id: Date.now(), nombre: "", porcentaje: null },
]);

const totalPorcentaje = computed(() => {
  return criterios.value.reduce(
    (acc, c) => acc + (Number(c.porcentaje) || 0),
    0,
  );
});

const isTotalValid = computed(() => {
  return totalPorcentaje.value === 100;
});

const isFormValid = computed(() => {
  const isPonderacionValid =
    !assignment.value.ponderacionManual ||
    (assignment.value.porcentajeMes !== null &&
      assignment.value.porcentajeMes > 0 &&
      assignment.value.porcentajeMes <= 100);

  return (
    assignment.value.nombre.trim() !== "" &&
    assignment.value.fechaInicio !== "" &&
    assignment.value.fechaEntrega !== "" &&
    isPonderacionValid &&
    criterios.value.length > 0 &&
    criterios.value.every(
      (c) =>
        c.nombre.trim() !== "" && c.porcentaje !== null && c.porcentaje > 0,
    ) &&
    isTotalValid.value
  );
});

const addCriterio = () => {
  criterios.value.push({
    id: Date.now(),
    nombre: "",
    porcentaje: null,
  });
};

const removeCriterio = (index: number) => {
  if (criterios.value.length > 1) {
    criterios.value.splice(index, 1);
  }
};

const saving = ref(false);
const errorMsg = ref<string | null>(null);

const goBack = () => {
  router.push("/tareas");
};

const saveAssignment = async () => {
  if (!isFormValid.value) return;
  if (!selectedGroup.value?.id) {
    errorMsg.value = "No hay grupo seleccionado.";
    return;
  }
  if (!canEdit.value) {
    errorMsg.value = "No tienes permiso para crear evaluaciones.";
    return;
  }

  saving.value = true;
  errorMsg.value = null;

  const payload = {
    grupo_id: selectedGroup.value.id,
    nombre: assignment.value.nombre.trim(),
    descripcion: assignment.value.descripcion.trim() || null,
    tipo: assignment.value.tipo,
    ponderacion_mes: assignment.value.ponderacionManual ? assignment.value.porcentajeMes : null,
    fecha_inicio: assignment.value.fechaInicio,
    fecha_entrega: assignment.value.fechaEntrega,
    criterios: criterios.value.map((c) => ({
      nombre: c.nombre.trim(),
      porcentaje: Number(c.porcentaje),
    })),
  };

  try {
    const res = await fetch("http://localhost:3001/api/evaluaciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    router.push("/tareas");
  } catch (err: unknown) {
    errorMsg.value = (err instanceof Error ? err.message : null) || "Error al guardar";
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <admin-layout>
    <div class="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div class="mb-6 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button
            @click="goBack"
            class="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
              />
            </svg>
          </button>
          <div>
            <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">
              Nuevo Registro
            </h1>
            <p
              v-if="selectedGroup && selectedMateria"
              class="mt-1 text-sm text-gray-600 dark:text-gray-400 font-medium"
            >
              {{ selectedGroup.grado }}ro {{ selectedGroup.grupo }} -
              {{ selectedMateria.nombre }} {{ selectedMateria.docente_nombre ? `- ${selectedMateria.docente_nombre}` : '' }}
            </p>
          </div>
        </div>
      </div>

      <div
        class="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 rounded-xl px-6 py-8"
      >
        <!-- Error -->
        <div v-if="errorMsg" class="mb-5 rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
          ⚠️ {{ errorMsg }}
        </div>

        <form @submit.prevent="saveAssignment">
          <div class="space-y-8">
            <!-- Detalles Generales -->
            <div>
              <h2
                class="text-base font-semibold leading-7 text-gray-900 dark:text-white"
              >
                Detalles Generales
              </h2>
              <p
                class="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400"
              >
                Información básica del trabajo.
              </p>

              <div class="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <!-- Tipo de Registro (Botones) -->
                <div class="sm:col-span-6 mb-2">
                  <label
                    class="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200 mb-2"
                    >Tipo de Evaluación</label
                  >
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <!-- Tarea -->
                    <button
                      type="button"
                      @click="assignment.tipo = 'Tarea'"
                      :class="[
                        'relative flex cursor-pointer rounded-xl border p-4 shadow-sm focus:outline-none transition-colors items-center justify-center',
                        assignment.tipo === 'Tarea'
                          ? 'bg-purple-50 border-purple-600 ring-2 ring-purple-600 dark:bg-purple-900/20 dark:border-purple-500 dark:ring-purple-500'
                          : 'bg-white border-gray-300 dark:bg-gray-800 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500',
                      ]"
                    >
                      <span
                        class="flex flex-col items-center text-center gap-2"
                      >
                        <svg
                          class="h-6 w-6"
                          :class="
                            assignment.tipo === 'Tarea'
                              ? 'text-purple-600 dark:text-purple-400'
                              : 'text-gray-500 dark:text-gray-400'
                          "
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                          />
                        </svg>
                        <span
                          class="block text-sm font-medium"
                          :class="
                            assignment.tipo === 'Tarea'
                              ? 'text-purple-900 dark:text-purple-100'
                              : 'text-gray-900 dark:text-gray-100'
                          "
                        >
                          Tarea
                        </span>
                      </span>
                    </button>

                    <!-- Trabajo en Clase -->
                    <button
                      type="button"
                      @click="assignment.tipo = 'Trabajo en Clase'"
                      :class="[
                        'relative flex cursor-pointer rounded-xl border p-4 shadow-sm focus:outline-none transition-colors items-center justify-center',
                        assignment.tipo === 'Trabajo en Clase'
                          ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-600 dark:bg-blue-900/20 dark:border-blue-500 dark:ring-blue-500'
                          : 'bg-white border-gray-300 dark:bg-gray-800 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500',
                      ]"
                    >
                      <span
                        class="flex flex-col items-center text-center gap-2"
                      >
                        <svg
                          class="h-6 w-6"
                          :class="
                            assignment.tipo === 'Trabajo en Clase'
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-gray-500 dark:text-gray-400'
                          "
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                          />
                        </svg>
                        <span
                          class="block text-sm font-medium"
                          :class="
                            assignment.tipo === 'Trabajo en Clase'
                              ? 'text-blue-900 dark:text-blue-100'
                              : 'text-gray-900 dark:text-gray-100'
                          "
                        >
                          Trabajo en Clase
                        </span>
                      </span>
                    </button>

                    <!-- Examen -->
                    <button
                      type="button"
                      @click="assignment.tipo = 'Examen'"
                      :class="[
                        'relative flex cursor-pointer rounded-xl border p-4 shadow-sm focus:outline-none transition-colors items-center justify-center',
                        assignment.tipo === 'Examen'
                          ? 'bg-rose-50 border-rose-600 ring-2 ring-rose-600 dark:bg-rose-900/20 dark:border-rose-500 dark:ring-rose-500'
                          : 'bg-white border-gray-300 dark:bg-gray-800 dark:border-gray-700 hover:border-rose-500 dark:hover:border-rose-500',
                      ]"
                    >
                      <span
                        class="flex flex-col items-center text-center gap-2"
                      >
                        <svg
                          class="h-6 w-6"
                          :class="
                            assignment.tipo === 'Examen'
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-gray-500 dark:text-gray-400'
                          "
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                          />
                        </svg>
                        <span
                          class="block text-sm font-medium"
                          :class="
                            assignment.tipo === 'Examen'
                              ? 'text-rose-900 dark:text-rose-100'
                              : 'text-gray-900 dark:text-gray-100'
                          "
                        >
                          Examen
                        </span>
                      </span>
                    </button>
                  </div>
                </div>

                <!-- Nombre -->
                <div class="sm:col-span-6">
                  <label
                    for="nombre"
                    class="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200"
                    >Nombre</label
                  >
                  <div class="mt-2">
                    <input
                      type="text"
                      v-model="assignment.nombre"
                      name="nombre"
                      id="nombre"
                      required
                      class="block w-full rounded-md border-0 py-2.5 text-gray-900 dark:text-white dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm sm:leading-6 px-4"
                      placeholder="Ej. Línea del Tiempo Independencia"
                    />
                  </div>
                </div>
                <!-- Descripción -->
                <div class="sm:col-span-6">
                  <label
                    for="descripcion"
                    class="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200"
                    >Descripción / Instrucciones (Opcional)</label
                  >
                  <div class="mt-2">
                    <textarea
                      id="descripcion"
                      v-model="assignment.descripcion"
                      name="descripcion"
                      rows="3"
                      class="block w-full rounded-md border-0 py-2.5 text-gray-900 dark:text-white dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm sm:leading-6 px-4"
                      placeholder="Detalles sobre cómo debe entregarse..."
                    ></textarea>
                  </div>
                </div>

                <!-- Fechas -->
                <div class="sm:col-span-3">
                  <label
                    for="fechaInicio"
                    class="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200"
                    >Fecha de Inicio</label
                  >
                  <div class="mt-2 relative">
                    <flat-pickr
                      v-model="assignment.fechaInicio"
                      :config="dateConfig"
                      id="fechaInicio"
                      required
                      class="block w-full rounded-md border-0 py-2.5 px-4 text-gray-900 dark:text-white dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm sm:leading-6"
                      placeholder="DD/MM/YYYY"
                    />
                  </div>
                </div>

                <div class="sm:col-span-3">
                  <label
                    for="fechaEntrega"
                    class="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200"
                    >Fecha de Entrega</label
                  >
                  <div class="mt-2 relative">
                    <flat-pickr
                      v-model="assignment.fechaEntrega"
                      :config="dateConfig"
                      id="fechaEntrega"
                      required
                      class="block w-full rounded-md border-0 py-2.5 px-4 text-gray-900 dark:text-white dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm sm:leading-6"
                      placeholder="DD/MM/YYYY"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <hr class="border-gray-200 dark:border-gray-800 mb-4 mt-4" />

          <!-- Ponderación Mensual -->
          <div class="pb-4">
            <h2
              class="text-base font-semibold leading-7 text-gray-900 dark:text-white"
            >
              Ponderación Mensual
            </h2>
            <p class="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
              Define cuánto valor tiene este trabajo en la calificación final
              del mes.
            </p>

            <div class="mt-6 flex items-start gap-3">
              <div class="flex h-6 items-center">
                <input
                  id="ponderacionManual"
                  name="ponderacionManual"
                  type="checkbox"
                  v-model="assignment.ponderacionManual"
                  class="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-600 dark:border-gray-700 dark:bg-gray-900 dark:checked:bg-brand-600"
                />
              </div>
              <div class="text-sm leading-6 flex-1">
                <label
                  for="ponderacionManual"
                  class="font-medium text-gray-900 dark:text-gray-200"
                >
                  Asignar porcentaje para la evaluación del mes manualmente
                </label>

                <div
                  v-if="!assignment.ponderacionManual"
                  class="mt-2 text-gray-500 dark:text-gray-400 flex items-start gap-2 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800"
                >
                  <svg
                    class="w-5 h-5 flex-shrink-0 text-brand-500 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p>
                    El valor de este registro se calculará de forma automática
                    repartiendo equitativamente el porcentaje restante del mes
                    entre todas las evaluaciones sin ponderación manual fijada.
                  </p>
                </div>

                <div
                  v-else
                  class="mt-4 flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  <div class="relative w-32">
                    <input
                      type="number"
                      v-model="assignment.porcentajeMes"
                      min="1"
                      max="100"
                      placeholder="Ej. 50"
                      required
                      class="block w-full rounded-md border-0 py-2 text-gray-900 dark:text-white dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm sm:leading-6 px-4 pr-8"
                    />
                    <div
                      class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"
                    >
                      <span class="text-gray-500 sm:text-sm font-medium"
                        >%</span
                      >
                    </div>
                  </div>
                  <p
                    class="text-sm text-gray-500 dark:text-gray-400 font-medium bg-gray-50 dark:bg-gray-800/50 py-1.5 px-3 rounded-md border border-gray-100 dark:border-gray-800"
                  >
                    Restan
                    <span class="font-bold text-gray-900 dark:text-white"
                      >{{ 100 - (assignment.porcentajeMes || 0) }}%</span
                    >
                    sin asignar este mes.
                  </p>
                </div>
              </div>
            </div>

            <hr class="border-gray-200 dark:border-gray-800 mb-4 mt-4" />

            <!-- Criterios de Evaluación -->
            <div>
              <div class="flex items-center justify-between">
                <div>
                  <h2
                    class="text-base font-semibold leading-7 text-gray-900 dark:text-white"
                  >
                    Criterios de Evaluación
                  </h2>
                  <p
                    class="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400"
                  >
                    Establece qué aspectos se calificarán y su peso porcentual.
                  </p>
                </div>
                <div class="text-right">
                  <span
                    class="text-sm font-medium text-gray-500 dark:text-gray-400"
                    >Total:
                  </span>
                  <span
                    :class="[
                      'text-lg font-bold',
                      isTotalValid
                        ? 'text-green-600 dark:text-green-500'
                        : 'text-red-500 dark:text-red-400',
                    ]"
                  >
                    {{ totalPorcentaje }}%
                  </span>
                </div>
              </div>

              <div class="mt-6 space-y-4">
                <div
                  v-for="(criterio, index) in criterios"
                  :key="criterio.id"
                  class="flex items-start gap-3 sm:gap-4"
                >
                  <div class="flex-grow">
                    <label :for="'criterio-' + index" class="sr-only"
                      >Criterio</label
                    >
                    <input
                      type="text"
                      :id="'criterio-' + index"
                      v-model="criterio.nombre"
                      required
                      placeholder="Ej. Ortografía y Sintaxis"
                      class="block w-full rounded-md border-0 py-2.5 text-gray-900 dark:text-white dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm sm:leading-6 px-4"
                    />
                  </div>

                  <div class="w-24 sm:w-32 flex-shrink-0 relative">
                    <label :for="'porcentaje-' + index" class="sr-only"
                      >Porcentaje</label
                    >
                    <input
                      type="number"
                      :id="'porcentaje-' + index"
                      v-model="criterio.porcentaje"
                      required
                      min="1"
                      max="100"
                      placeholder="0"
                      class="block w-full rounded-md border-0 py-2.5 pr-8 pl-4 text-gray-900 dark:text-white dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm sm:leading-6"
                    />
                    <div
                      class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"
                    >
                      <span class="text-gray-500 sm:text-sm font-medium"
                        >%</span
                      >
                    </div>
                  </div>

                  <button
                    type="button"
                    @click="removeCriterio(index)"
                    :disabled="criterios.length === 1"
                    class="flex-shrink-0 mt-1.5 p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-500 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
                    title="Eliminar criterio"
                  >
                    <svg
                      class="w-5 h-5 sm:w-6 sm:h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div class="mt-4">
                <button
                  type="button"
                  @click="addCriterio"
                  class="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-500 transition-colors"
                >
                  <svg
                    class="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                  Agregar otro criterio
                </button>
              </div>

              <div
                v-if="!isTotalValid && totalPorcentaje > 0"
                class="mt-3 text-sm text-red-500"
              >
                La suma de los porcentajes debe ser exactamente 100%.
                Actualmente es {{ totalPorcentaje }}%.
              </div>
            </div>
          </div>

          <div
            class="mt-10 pt-6 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-x-4"
          >
            <button
              @click="goBack"
              type="button"
              class="text-sm font-semibold leading-6 text-gray-900 dark:text-gray-300 hover:text-gray-500 py-2 px-4 rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="!isFormValid || saving"
              class="rounded-full bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg v-if="saving" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              {{ saving ? 'Guardando…' : 'Guardar Registro' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </admin-layout>
</template>
