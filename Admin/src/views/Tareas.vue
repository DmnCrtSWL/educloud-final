<template>
  <admin-layout>
    <div class="p-4 sm:p-6 lg:p-8">
      <!-- Header -->
      <div class="sm:flex sm:items-center sm:justify-between">
        <div class="sm:flex-auto">
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">
            Evaluación Continua
          </h1>
          <p v-if="selectedGroup" class="mt-1 text-lg text-gray-600 dark:text-gray-400 font-medium">
            {{ selectedGroup.grado }}ro {{ selectedGroup.grupo }} - {{ selectedGroup.materia }}
          </p>
          <p v-else class="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Gestiona los trabajos y exámenes del grupo seleccionado.
          </p>
        </div>
        <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none" v-if="selectedGroup">
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
          Por favor, selecciona un grupo en el menú superior para ver y gestionar su evaluación continua.
        </p>
      </div>

      <div v-else>
        <!-- Assignments Table -->
        <div class="mt-8 flow-root">
          <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div
                class="overflow-hidden shadow-sm rounded-lg bg-white dark:bg-gray-800 border-x border-t border-gray-200 dark:border-gray-700"
              >
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
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
                      <th
                        scope="col"
                        class="relative py-3.5 pl-3 pr-4 sm:pr-6"
                      >
                        <span class="sr-only">Acciones</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                    <tr v-for="assignment in currentAssignments" :key="assignment.id">
                      <td class="whitespace-nowrap py-5 pl-4 pr-3 text-sm sm:pl-6">
                        <div class="font-medium text-gray-900 dark:text-white text-base">
                          {{ assignment.name }}
                        </div>
                        <div class="text-gray-500 dark:text-gray-400 mt-0.5 text-xs font-mono">
                          {{ assignment.id }}
                        </div>
                      </td>
                      <td class="whitespace-nowrap px-3 py-5 text-sm text-center">
                        <span
                          :class="[
                            'inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
                            assignment.type === 'Examen'
                              ? 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-400/10 dark:text-rose-400 dark:ring-rose-400/30'
                              : assignment.type === 'Tarea'
                              ? 'bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-400/10 dark:text-purple-400 dark:ring-purple-400/30'
                              : 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/30'
                          ]"
                        >
                          {{ assignment.type }}
                        </span>
                      </td>
                      <td class="whitespace-nowrap px-3 py-5 text-sm text-center">
                        <span
                          v-if="assignment.porcentajeMes"
                          class="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20 dark:bg-purple-400/10 dark:text-purple-400 dark:ring-purple-400/30"
                        >
                          Manual ({{ assignment.porcentajeMes }}%)
                        </span>
                        <span
                          v-else
                          class="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10 dark:bg-gray-400/10 dark:text-gray-400 dark:ring-gray-400/20 shadow-sm"
                        >
                          Automático ({{ Number.isInteger(autoPercentage) ? autoPercentage : autoPercentage.toFixed(1) }}%)
                        </span>
                      </td>
                      <td class="whitespace-nowrap px-3 py-5 text-sm text-gray-500 dark:text-gray-300 text-center">
                        {{ assignment.startDate }}
                      </td>
                      <td class="whitespace-nowrap px-3 py-5 text-sm text-gray-500 dark:text-gray-300 text-center font-medium">
                        {{ assignment.dueDate }}
                      </td>
                      <td class="whitespace-nowrap px-3 py-5 text-sm text-center">
                        <span
                          :class="[
                            'inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
                            getStatusBadgeStyles(assignment.status)
                          ]"
                        >
                          {{ assignment.status }}
                        </span>
                      </td>
                      <td class="relative whitespace-nowrap py-5 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <div class="flex items-center justify-end gap-2">
                          <router-link :to="'/trabajos/' + assignment.id" class="text-gray-400 hover:text-brand-600 transition-colors" title="Ver">
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </router-link>
                          <button class="text-gray-400 hover:text-blue-600 transition-colors" title="Editar">
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button class="text-gray-400 hover:text-red-600 transition-colors" title="Eliminar">
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr v-if="currentAssignments.length === 0">
                      <td
                        colspan="6"
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
import { computed } from "vue";
import AdminLayout from "../components/layout/AdminLayout.vue";
import { useGroupState } from "@/composables/useGroupState";

const { selectedGroup, selectedGroupId } = useGroupState();

type AssignmentStatus = 'Por Comenzar' | 'En Proceso' | 'Evaluada';

interface Assignment {
  id: string;
  name: string;
  type: 'Tarea' | 'Trabajo en Clase' | 'Examen';
  porcentajeMes: number | null;
  startDate: string;
  dueDate: string;
  status: AssignmentStatus;
}

// Helper funcs for dummy data generation
const generateMockAssignments = (groupId: string, subjectInfo: string): Assignment[] => {
  // Simple deterministic generation based on group info
  const prefix = subjectInfo.substring(0, 3).toUpperCase();
  const seed = parseInt(groupId.substring(0, 3)) || 123;
  
  if (groupId === "123456") {
    return [
      { id: `1-${prefix}-101`, name: "Ecuaciones de Primer Grado", type: "Tarea", porcentajeMes: 15, startDate: "2023-10-20", dueDate: "2023-10-25", status: "Evaluada" },
      { id: `1-${prefix}-102`, name: "Ejercicios Prácticos Algebra", type: "Trabajo en Clase", porcentajeMes: 10, startDate: "2023-10-26", dueDate: "2023-10-26", status: "Por Comenzar" },
      { id: `1-${prefix}-103`, name: "Examen Parcial", type: "Examen", porcentajeMes: 40, startDate: "2023-10-15", dueDate: "2023-11-15", status: "En Proceso" },
    ];
  } else if (groupId === "654321") {
    return [
      { id: `2-${prefix}-201`, name: "Examen de Comprensión", type: "Examen", porcentajeMes: 50, startDate: "2023-10-22", dueDate: "2023-10-29", status: "En Proceso" },
      { id: `2-${prefix}-202`, name: "Debate en Clase", type: "Trabajo en Clase", porcentajeMes: 25, startDate: "2023-10-28", dueDate: "2023-10-28", status: "Por Comenzar" },
    ];
  }
  
  // Default generic fallback
  return [
    { id: `X-${prefix}-001`, name: "Trabajo Genérico 1", type: "Trabajo en Clase", porcentajeMes: null, startDate: "2023-10-01", dueDate: "2023-10-05", status: "Evaluada" },
  ];
};

const currentAssignments = computed(() => {
  if (!selectedGroupId.value || !selectedGroup.value) return [];
  return generateMockAssignments(selectedGroupId.value, selectedGroup.value.materia);
});

const autoPercentage = computed(() => {
  const assignments = currentAssignments.value;
  if (!assignments.length) return 0;
  
  const manualTotal = assignments.reduce((acc, curr) => acc + (curr.porcentajeMes || 0), 0);
  const autoCount = assignments.filter(a => a.porcentajeMes === null).length;
  
  if (autoCount === 0) return 0;
  return Math.max(0, (100 - manualTotal) / autoCount);
});

const getStatusBadgeStyles = (status: AssignmentStatus) => {
  switch (status) {
    case 'Por Comenzar':
      return 'bg-gray-50 text-gray-600 ring-gray-500/10 dark:bg-gray-400/10 dark:text-gray-400 dark:ring-gray-400/20';
    case 'En Proceso':
      return 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-400 dark:ring-amber-400/30';
    case 'Evaluada':
      return 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-400/10 dark:text-green-400 dark:ring-green-400/30';
    default:
      return 'bg-gray-50 text-gray-500 ring-gray-500/10';
  }
};
</script>
