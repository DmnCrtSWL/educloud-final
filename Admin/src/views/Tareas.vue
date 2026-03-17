<template>
  <admin-layout>
    <div class="p-4 sm:p-6 lg:p-8">
      <!-- Header -->
      <div class="sm:flex sm:items-center sm:justify-between">
        <div class="sm:flex-auto">
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">
            Evaluación Continua
          </h1>
          <div class="mt-4">
            <GroupSelector />
          </div>
          <p
            v-if="selectedGroup && selectedMateria"
            class="mt-4 text-lg text-gray-600 dark:text-gray-400 font-medium"
          >
            {{ selectedGroup.grado }}ro {{ selectedGroup.grupo }} -
            {{ selectedMateria.nombre }} {{ selectedMateria.docente_nombre ? `- ${selectedMateria.docente_nombre}` : '' }}
          </p>
          <p v-else class="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Gestiona los trabajos y exámenes del grupo seleccionado.
          </p>
        </div>
        <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none" v-if="selectedGroup && canEdit">
          <router-link
            to="/tareas/nueva"
            class="inline-block rounded-full bg-brand-500 px-6 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 transition-colors"
          >
            Nuevo Registro
          </router-link>
        </div>
      </div>

      <!-- No Group Selected State -->
      <div
        v-if="!selectedGroup"
        class="mt-8 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700"
      >
        <svg
          class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
        <h3 class="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
          Ningún grupo seleccionado
        </h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Por favor, selecciona un grupo en el menú superior para ver y
          gestionar su evaluación continua.
        </p>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="mt-8 flex justify-center py-16">
        <svg class="animate-spin h-6 w-6 text-brand-500" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
      </div>

      <!-- Error -->
      <div v-else-if="errorMsg" class="mt-8 rounded-md bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
        ⚠️ {{ errorMsg }}
      </div>

      <div v-else-if="selectedGroup">
        <!-- Assignments Table -->
        <div class="mt-8 flow-root">
          <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div
              class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8"
            >
              <div
                class="overflow-hidden shadow-sm rounded-lg bg-white dark:bg-gray-800 border-x border-t border-gray-200 dark:border-gray-700"
              >
                <table
                  class="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
                >
                  <thead class="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th
                        scope="col"
                        class="px-4 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200"
                      >
                        Desglose
                      </th>
                      <th
                        scope="col"
                        class="px-3 py-3.5 text-center text-sm font-semibold text-gray-900 dark:text-gray-200"
                      >
                        Tipo
                      </th>
                      <th
                        scope="col"
                        class="px-3 py-3.5 text-center text-sm font-semibold text-gray-900 dark:text-gray-200"
                      >
                        Ponderación Mes
                      </th>
                      <th
                        scope="col"
                        class="px-3 py-3.5 text-center text-sm font-semibold text-gray-900 dark:text-gray-200"
                      >
                        Fecha de Inicio
                      </th>
                      <th
                        scope="col"
                        class="px-3 py-3.5 text-center text-sm font-semibold text-gray-900 dark:text-gray-200"
                      >
                        Fecha de Entrega
                      </th>
                      <th
                        scope="col"
                        class="px-3 py-3.5 text-center text-sm font-semibold text-gray-900 dark:text-gray-200"
                      >
                        Estado
                      </th>
                      <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span class="sr-only">Acciones</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody
                    class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900"
                  >
                    <tr
                      v-for="assignment in assignments"
                      :key="assignment.id"
                    >
                      <td
                        class="whitespace-nowrap py-5 pl-4 pr-3 text-sm sm:pl-6"
                      >
                        <div
                          class="font-medium text-gray-900 dark:text-white text-base"
                        >
                          {{ assignment.nombre }}
                        </div>
                        <div
                          class="text-gray-500 dark:text-gray-400 mt-0.5 text-xs font-mono"
                        >
                          {{ assignment.id }}
                        </div>
                      </td>
                      <td
                        class="whitespace-nowrap px-3 py-5 text-sm text-center"
                      >
                        <span
                          :class="[
                            'inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
                            assignment.tipo === 'Examen'
                              ? 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-400/10 dark:text-rose-400 dark:ring-rose-400/30'
                              : assignment.tipo === 'Tarea'
                                ? 'bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-400/10 dark:text-purple-400 dark:ring-purple-400/30'
                                : 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/30',
                          ]"
                        >
                          {{ assignment.tipo }}
                        </span>
                      </td>
                      <td
                        class="whitespace-nowrap px-3 py-5 text-sm text-center"
                      >
                        <span
                          v-if="assignment.ponderacion_mes"
                          class="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20 dark:bg-purple-400/10 dark:text-purple-400 dark:ring-purple-400/30"
                        >
                          Manual ({{ assignment.ponderacion_mes }}%)
                        </span>
                        <span
                          v-else
                          class="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10 dark:bg-gray-400/10 dark:text-gray-400 dark:ring-gray-400/20 shadow-sm"
                        >
                          Automático ({{
                            Number.isInteger(autoPercentage)
                              ? autoPercentage
                              : autoPercentage.toFixed(1)
                          }}%)
                        </span>
                      </td>
                      <td
                        class="whitespace-nowrap px-3 py-5 text-sm text-gray-500 dark:text-gray-300 text-center"
                      >
                        {{ formatDate(assignment.fecha_inicio) }}
                      </td>
                      <td
                        class="whitespace-nowrap px-3 py-5 text-sm text-gray-500 dark:text-gray-300 text-center font-medium"
                      >
                        {{ formatDate(assignment.fecha_entrega) }}
                      </td>
                      <td
                        class="whitespace-nowrap px-3 py-5 text-sm text-center"
                      >
                        <span
                          :class="[
                            'inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
                            getStatusBadgeStyles(getStatus(assignment)),
                          ]"
                        >
                          {{ getStatus(assignment) }}
                        </span>
                      </td>
                      <td
                        class="relative whitespace-nowrap py-5 pl-3 pr-4 text-right text-sm font-medium sm:pr-6"
                      >
                        <div class="flex items-center justify-end gap-2">
                          <router-link
                            :to="'/trabajos/' + assignment.id"
                            class="text-gray-400 hover:text-brand-600 transition-colors"
                            title="Ver"
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
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </router-link>
                          <!-- Editar -->
                          <router-link
                            v-if="canEdit"
                            :to="'/evaluaciones/' + assignment.id + '/editar'"
                            class="text-gray-400 hover:text-blue-600 transition-colors"
                            title="Editar"
                          >
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                          </router-link>
                          <button
                            v-if="canEdit"
                            class="text-gray-400 hover:text-red-600 transition-colors"
                            title="Eliminar"
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr v-if="assignments.length === 0">
                      <td
                        colspan="7"
                        class="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                      >
                        No hay trabajos o exámenes asignados para este grupo aún.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import AdminLayout from "../components/layout/AdminLayout.vue";
import { useGroupState } from "@/composables/useGroupState";
import { useAuth } from "@/composables/useAuth";
import GroupSelector from "@/components/common/GroupSelector.vue";

const formatDate = (dateString: string) => {
  if (!dateString) return "";
  const dateOnly = dateString.split("T")[0];
  const parts = dateOnly.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateString;
};

const { selectedGroup, selectedGroupId, selectedMateria } = useGroupState();
const { currentUser } = useAuth();

const canEdit = computed(() => {
  if (currentUser.value?.rol !== 'Docente') return false;
  if (!selectedMateria.value) return false;
  return currentUser.value.id === selectedMateria.value.docente_id;
});

type AssignmentStatus = "Por Comenzar" | "En Proceso" | "Evaluada";

interface Criterio { id: number; nombre: string; porcentaje: number; }
interface Assignment {
  id: string;
  nombre: string;
  tipo: "Tarea" | "Trabajo en Clase" | "Examen";
  ponderacion_mes: number | null;
  fecha_inicio: string;
  fecha_entrega: string;
  criterios: Criterio[];
  created_at: string;
}

const assignments = ref<Assignment[]>([]);
const loading = ref(false);
const errorMsg = ref<string | null>(null);

// Calcular estado dinámico basado en las fechas
const getStatus = (a: Assignment): AssignmentStatus => {
  const today = new Date().toISOString().split("T")[0];
  if (today < a.fecha_inicio) return "Por Comenzar";
  if (today <= a.fecha_entrega) return "En Proceso";
  return "Evaluada";
};

// Cargar evaluaciones cuando cambia el grupo
watch(selectedGroupId, async (newId) => {
  assignments.value = [];
  errorMsg.value = null;
  if (!newId) return;

  loading.value = true;
  try {
    const res = await fetch(`http://localhost:3001/api/evaluaciones?grupo_id=${newId}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    assignments.value = json.data;
  } catch (err: unknown) {
    errorMsg.value = (err instanceof Error ? err.message : null) || "Error al cargar evaluaciones";
  } finally {
    loading.value = false;
  }
}, { immediate: true });

// Ponderación automática: porcentaje restante dividido entre los que no tienen manual
const autoPercentage = computed(() => {
  const manualTotal = assignments.value.reduce((acc, a) => acc + (a.ponderacion_mes || 0), 0);
  const autoCount = assignments.value.filter((a) => !a.ponderacion_mes).length;
  if (autoCount === 0) return 0;
  return Math.max(0, (100 - manualTotal) / autoCount);
});

const getStatusBadgeStyles = (status: AssignmentStatus) => {
  switch (status) {
    case "Por Comenzar": return "bg-gray-50 text-gray-600 ring-gray-500/10 dark:bg-gray-400/10 dark:text-gray-400 dark:ring-gray-400/20";
    case "En Proceso":   return "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-400 dark:ring-amber-400/30";
    case "Evaluada":     return "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-400/10 dark:text-green-400 dark:ring-green-400/30";
    default:             return "bg-gray-50 text-gray-500 ring-gray-500/10";
  }
};
</script>
