<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import AdminLayout from "../components/layout/AdminLayout.vue";
import { useGroupState } from "@/composables/useGroupState";
import { useAuth } from "@/composables/useAuth";
import flatPickr from "vue-flatpickr-component";
import "flatpickr/dist/flatpickr.css";

const dateConfig = { dateFormat: "Y-m-d", altInput: true, altFormat: "d/m/Y" };

const router = useRouter();
const route  = useRoute();
const id     = route.params.id as string;

const { selectedMateria } = useGroupState();
const { currentUser } = useAuth();

const canEdit = computed(() => {
  if (currentUser.value?.rol !== 'Docente') return false;
  if (!selectedMateria.value) return false;
  return currentUser.value.id === selectedMateria.value.docente_id;
});

interface Criterio { id: number; nombre: string; porcentaje: number | null; }

// ── Estado del formulario ────────────────────────────────────────────────────
const loading  = ref(true);
const saving   = ref(false);
const errorMsg = ref<string | null>(null);

const assignment = ref({
  nombre: "",
  descripcion: "",
  tipo: "Trabajo en Clase" as "Tarea" | "Trabajo en Clase" | "Examen",
  ponderacionManual: false,
  porcentajeMes: null as number | null,
  fechaInicio: "",
  fechaEntrega: "",
});

const criterios = ref<Criterio[]>([{ id: Date.now(), nombre: "", porcentaje: null }]);

// ── Cargar evaluación existente ──────────────────────────────────────────────
onMounted(async () => {
  try {
    const res  = await fetch(`http://localhost:3001/api/evaluaciones/${id}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    const d = json.data;
    assignment.value = {
      nombre:           d.nombre,
      descripcion:      d.descripcion ?? "",
      tipo:             d.tipo,
      ponderacionManual: !!d.ponderacion_mes,
      porcentajeMes:    d.ponderacion_mes,
      fechaInicio:      d.fecha_inicio,
      fechaEntrega:     d.fecha_entrega,
    };
    criterios.value = d.criterios.map((c: { id: number; nombre: string; porcentaje: number }) => ({
      id:         c.id,
      nombre:     c.nombre,
      porcentaje: c.porcentaje,
    }));
  } catch (err: unknown) {
    errorMsg.value = (err instanceof Error ? err.message : null) || "Error al cargar la evaluación";
  } finally {
    loading.value = false;
    if (!canEdit.value) {
      router.push("/tareas");
    }
  }
});

// ── Validaciones ─────────────────────────────────────────────────────────────
const totalPorcentaje = computed(() =>
  criterios.value.reduce((acc, c) => acc + (Number(c.porcentaje) || 0), 0)
);
const isTotalValid = computed(() => totalPorcentaje.value === 100);
const isFormValid  = computed(() => {
  const ponderacionOk =
    !assignment.value.ponderacionManual ||
    (assignment.value.porcentajeMes !== null &&
      assignment.value.porcentajeMes > 0 &&
      assignment.value.porcentajeMes <= 100);
  return (
    assignment.value.nombre.trim() !== "" &&
    assignment.value.fechaInicio   !== "" &&
    assignment.value.fechaEntrega  !== "" &&
    ponderacionOk &&
    criterios.value.length > 0 &&
    criterios.value.every((c) => c.nombre.trim() !== "" && c.porcentaje !== null && c.porcentaje > 0) &&
    isTotalValid.value
  );
});

// ── Criterios ────────────────────────────────────────────────────────────────
const addCriterio    = () => criterios.value.push({ id: Date.now(), nombre: "", porcentaje: null });
const removeCriterio = (i: number) => { if (criterios.value.length > 1) criterios.value.splice(i, 1); };

// ── Guardar (PUT) ────────────────────────────────────────────────────────────
const saveAssignment = async () => {
  if (!isFormValid.value) return;
  saving.value  = true;
  errorMsg.value = null;

  const payload = {
    nombre:        assignment.value.nombre.trim(),
    descripcion:   assignment.value.descripcion.trim() || null,
    tipo:          assignment.value.tipo,
    ponderacion_mes: assignment.value.ponderacionManual ? assignment.value.porcentajeMes : null,
    fecha_inicio:  assignment.value.fechaInicio,
    fecha_entrega: assignment.value.fechaEntrega,
    criterios: criterios.value.map((c) => ({
      nombre:     c.nombre.trim(),
      porcentaje: Number(c.porcentaje),
    })),
  };

  try {
    const res  = await fetch(`http://localhost:3001/api/evaluaciones/${id}`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
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

const goBack = () => router.push("/tareas");
</script>

<template>
  <admin-layout>
    <div class="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-24">
        <svg class="animate-spin h-7 w-7 text-brand-500" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
      </div>

      <template v-else>
        <!-- Header -->
        <div class="mb-6 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <button
              @click="goBack"
              class="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"/>
              </svg>
            </button>
            <div>
              <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Editar Evaluación</h1>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5 font-mono">{{ id }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 rounded-xl px-6 py-8">
          <!-- Error -->
          <div v-if="errorMsg" class="mb-5 rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
            ⚠️ {{ errorMsg }}
          </div>

          <form @submit.prevent="saveAssignment">
            <div class="space-y-8">
              <!-- Detalles Generales -->
              <div>
                <h2 class="text-base font-semibold leading-7 text-gray-900 dark:text-white">Detalles Generales</h2>
                <p class="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">Información básica del trabajo.</p>
                <div class="mt-6 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-6">
                  <!-- Nombre -->
                  <div class="sm:col-span-6">
                    <label class="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">Nombre</label>
                    <div class="mt-2">
                      <input
                        v-model="assignment.nombre"
                        type="text"
                        placeholder="Ej. Lectura Capítulo 3"
                        class="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 dark:text-white dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm"
                      />
                    </div>
                  </div>

                  <!-- Descripción -->
                  <div class="sm:col-span-6">
                    <label class="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">Descripción <span class="text-gray-400 font-normal">(opcional)</span></label>
                    <div class="mt-2">
                      <textarea
                        v-model="assignment.descripcion"
                        rows="3"
                        class="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 dark:text-white dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm resize-y"
                      />
                    </div>
                  </div>

                  <!-- Tipo -->
                  <div class="sm:col-span-3">
                    <label class="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">Tipo</label>
                    <div class="mt-2">
                      <select
                        v-model="assignment.tipo"
                        class="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 dark:text-white dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm"
                      >
                        <option>Tarea</option>
                        <option>Trabajo en Clase</option>
                        <option>Examen</option>
                      </select>
                    </div>
                  </div>

                  <!-- Fechas -->
                  <div class="sm:col-span-3">
                    <label class="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">Fecha de Inicio</label>
                    <div class="mt-2">
                      <flat-pickr v-model="assignment.fechaInicio" :config="dateConfig" class="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 dark:text-white dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm" />
                    </div>
                  </div>
                  <div class="sm:col-span-3">
                    <label class="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">Fecha de Entrega</label>
                    <div class="mt-2">
                      <flat-pickr v-model="assignment.fechaEntrega" :config="dateConfig" class="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 dark:text-white dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm" />
                    </div>
                  </div>

                  <!-- Ponderación -->
                  <div class="sm:col-span-6">
                    <div class="flex items-center gap-3">
                      <input type="checkbox" id="ponderacion-manual-edit" v-model="assignment.ponderacionManual" class="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-600" />
                      <label for="ponderacion-manual-edit" class="text-sm font-medium text-gray-900 dark:text-gray-200">Asignar ponderación manual del mes</label>
                    </div>
                    <div v-if="assignment.ponderacionManual" class="mt-3 flex items-center gap-3">
                      <input
                        v-model.number="assignment.porcentajeMes"
                        type="number" min="1" max="100"
                        class="w-24 rounded-md border-0 py-2.5 px-3 text-gray-900 dark:text-white dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm text-center [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span class="text-sm text-gray-500">% del mes</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="border-t border-gray-200 dark:border-gray-800 pt-8">
                <div class="flex items-center justify-between mb-4">
                  <div>
                    <h2 class="text-base font-semibold leading-7 text-gray-900 dark:text-white">Criterios de Evaluación</h2>
                    <p class="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">La suma debe ser exactamente 100%.</p>
                  </div>
                  <div
                    :class="['text-sm font-semibold tabular-nums px-2.5 py-1 rounded-full', totalPorcentaje === 100 ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400']"
                  >
                    {{ totalPorcentaje }}%
                  </div>
                </div>

                <div class="space-y-3">
                  <div v-for="(criterio, index) in criterios" :key="criterio.id" class="flex items-center gap-3">
                    <input
                      v-model="criterio.nombre"
                      type="text"
                      :placeholder="`Criterio ${index + 1}`"
                      class="flex-1 rounded-md border-0 py-2.5 px-3 text-gray-900 dark:text-white dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm"
                    />
                    <div class="flex items-center gap-2 flex-shrink-0">
                      <input
                        v-model.number="criterio.porcentaje"
                        type="number" min="1" max="100"
                        placeholder="0"
                        class="w-20 rounded-md border-0 py-2.5 px-3 text-center text-gray-900 dark:text-white dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span class="text-gray-500 text-sm">%</span>
                    </div>
                    <button
                      type="button"
                      @click="removeCriterio(index)"
                      :disabled="criterios.length <= 1"
                      class="p-1.5 text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded"
                    >
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  @click="addCriterio"
                  class="mt-4 inline-flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                  </svg>
                  Agregar criterio
                </button>

                <div v-if="criterios.length > 0 && !isTotalValid" class="mt-3 text-xs text-amber-600 dark:text-amber-400">
                  La suma de los porcentajes debe ser exactamente 100%. Actualmente es {{ totalPorcentaje }}%.
                </div>
              </div>
            </div>

            <!-- Acciones -->
            <div class="mt-10 pt-6 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-x-4">
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
                {{ saving ? 'Guardando…' : 'Guardar Cambios' }}
              </button>
            </div>
          </form>
        </div>
      </template>
    </div>
  </admin-layout>
</template>
