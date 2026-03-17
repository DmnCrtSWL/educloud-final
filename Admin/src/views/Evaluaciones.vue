<template>
  <admin-layout>
    <div class="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div class="mb-6 sm:flex sm:items-center sm:justify-between">
        <div class="sm:flex-auto">
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
            <span class="inline-flex items-center justify-center rounded-lg p-2 bg-brand-100 text-brand-600 dark:bg-brand-900/50 dark:text-brand-400">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 019 9v.375M10.125 2.25A3.375 3.375 0 0113.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 013.375 3.375M9 15l2.25 2.25L15 12" />
              </svg>
            </span>
            Evaluaciones
          </h1>
          <div class="mt-4">
            <GroupSelector />
          </div>
          <p v-if="selectedGroup && selectedMateria" class="mt-4 text-sm text-gray-700 dark:text-gray-300 font-medium">
            {{ selectedGroup.grado }}ro {{ selectedGroup.grupo }} - {{ selectedMateria.nombre }} {{ selectedMateria.docente_nombre ? `- ${selectedMateria.docente_nombre}` : '' }}
          </p>
          <p v-else class="mt-2 text-sm text-gray-700 dark:text-gray-300">
             Selecciona un grupo para visualizar la información de evaluaciones.
          </p>
        </div>
      </div>

      <!-- No Group Selected State -->
      <div
        v-if="!selectedGroup"
        class="mt-8 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700"
      >
        <svg class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
        <h3 class="mt-2 text-sm font-semibold text-gray-900 dark:text-white">Ningún grupo seleccionado</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Por favor, elige un grupo en el selector superior.</p>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <!-- Columna Izquierda: Lista de Alumnos (Ocupa 2/3 en Desktop) -->
        <div class="lg:col-span-2 space-y-4">
          <div class="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <div class="px-6 py-5 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
              <h2 class="text-base font-semibold leading-6 text-gray-900 dark:text-white flex items-center gap-2">
                <svg class="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                </svg>
                Listado de Alumnos
              </h2>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="bg-white dark:bg-gray-900">
                  <tr>
                    <th scope="col" class="py-3.5 pl-6 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-200 w-16">No.</th>
                    <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">Nombre</th>
                    <th scope="col" class="px-6 py-3.5 text-right text-sm font-semibold text-gray-900 dark:text-gray-200 border-l border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/10 w-32">Promedio Gral.</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                  <tr v-for="(alumno, index) in alumnosList" :key="alumno.id" class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td class="whitespace-nowrap py-4 pl-6 pr-3 text-sm font-medium text-gray-500 dark:text-gray-400 font-mono">
                      {{ index + 1 }}
                    </td>
                    <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-white font-medium">
                      {{ alumno.nombre }}
                    </td>
                    <td class="whitespace-nowrap px-6 py-4 text-sm text-right border-l border-gray-100 dark:border-gray-800 bg-gray-50/10 dark:bg-gray-800/5">
                      <span :class="[
                        'inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold font-mono',
                        getGradeColor(alumno.promedio)
                      ]">
                        {{ alumno.promedio.toFixed(1) }}
                      </span>
                    </td>
                  </tr>
                  <tr v-if="alumnosList.length === 0">
                    <td colspan="3" class="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      No hay alumnos registrados en este grupo.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Columna Derecha: Métricas y problemáticos (Ocupa 1/3 en Desktop) -->
        <div class="lg:col-span-1 space-y-6">
          
          <!-- Card de Asistencia Promedio -->
          <div class="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 rounded-xl p-6 relative overflow-hidden group hover:border-brand-300 dark:hover:border-brand-700 transition-colors">
            <div class="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg class="w-16 h-16 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
              </svg>
            </div>
            <dt class="text-sm font-medium leading-6 text-gray-500 dark:text-gray-400 flex items-center gap-2">
              Asistencia Promedio
            </dt>
            <dd class="mt-4 flex items-baseline gap-x-2">
              <span class="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">92%</span>
              <span class="text-sm text-gray-500 dark:text-gray-400">mensual</span>
            </dd>
          </div>

          <!-- Card de Calificación Promedio -->
          <div class="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 rounded-xl p-6 relative overflow-hidden group hover:border-brand-300 dark:hover:border-brand-700 transition-colors">
            <div class="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg class="w-16 h-16 text-brand-600 dark:text-brand-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
              </svg>
            </div>
            <dt class="text-sm font-medium leading-6 text-gray-500 dark:text-gray-400 flex items-center gap-2">
              Promedio del Grupo
            </dt>
            <dd class="mt-4 flex items-baseline gap-x-2">
              <span class="text-4xl font-semibold tracking-tight text-brand-600 dark:text-brand-400">8.9</span>
              <span class="text-sm text-gray-500 dark:text-gray-400">/ 10</span>
            </dd>
          </div>

          <!-- Card Alumnos Problemáticos -->
          <div class="bg-white dark:bg-gray-900 shadow-sm border-t-4 border-t-rose-500 border-x border-b border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden mt-6">
            <div class="px-5 py-4 bg-rose-50/50 dark:bg-rose-900/10 border-b border-gray-100 dark:border-gray-800">
              <h3 class="text-sm font-semibold leading-6 text-rose-800 dark:text-rose-400 flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Atención Requerida
              </h3>
            </div>
            <ul role="list" class="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
              <li v-for="alumno in alumnosProblematicos" :key="alumno.id" class="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div class="min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ alumno.nombre }}</p>
                </div>
                <div class="flex items-center gap-3 ml-4 flex-shrink-0">
                  <span class="inline-flex items-center rounded-md px-2 py-1 text-xs font-bold font-mono text-rose-700 bg-rose-50 ring-1 ring-inset ring-rose-600/20 dark:text-rose-400 dark:bg-rose-900/20 dark:ring-rose-400/30">
                    {{ alumno.promedio.toFixed(1) }}
                  </span>
                  <span class="text-lg" title="Requiere Atención">🚨</span>
                </div>
              </li>
              <li v-if="alumnosProblematicos.length === 0" class="p-6 text-center text-sm text-gray-500 dark:text-gray-400 italic">
                No se detectan alumnos en riesgo académico.
              </li>
            </ul>
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
import GroupSelector from "@/components/common/GroupSelector.vue";

const { selectedGroup, selectedMateria } = useGroupState();

interface ActAlumno {
  id: string;
  nombre: string;
  promedio: number;
}

// Simulando el listado completo de alumnos ordenado por nombre (o lista)
const alumnosList = computed<ActAlumno[]>(() => {
  if (!selectedGroup.value) return [];
  return [
    { id: "1", nombre: "Álvarez Medina, Diego", promedio: 9.2 },
    { id: "2", nombre: "Castillo Rojas, Sofía", promedio: 8.5 },
    { id: "3", nombre: "Gómez Hernández, Luis", promedio: 5.8 },
    { id: "4", nombre: "Martínez Fuentes, Ana", promedio: 10.0 },
    { id: "5", nombre: "Pérez García, Miguel", promedio: 6.2 },
    { id: "6", nombre: "Ramírez Ortíz, Karla", promedio: 9.8 },
    { id: "7", nombre: "Torres Silva, Javier", promedio: 4.5 },
    { id: "8", nombre: "Vargas Luna, Elena", promedio: 8.9 },
    { id: "9", nombre: "Zavala Cruz, Raúl", promedio: 7.4 },
    { id: "10", nombre: "Zúñiga López, Carmen", promedio: 5.4 }
  ].sort((a, b) => a.nombre.localeCompare(b.nombre));
});

// Simulando el cálculo o filtrado de alumnos problemáticos
const alumnosProblematicos = computed<ActAlumno[]>(() => {
  return alumnosList.value
    .filter(a => a.promedio < 7.0) // Ejemplo de filtro
    .sort((a, b) => a.promedio - b.promedio) // De menor a mayor
    .slice(0, 5); // Tomamos los 5 con peor promedio
});

const getGradeColor = (promedio: number) => {
  if (promedio >= 9.0) return 'text-green-700 bg-green-50 ring-green-600/20 dark:text-green-400 dark:bg-green-900/20 dark:ring-green-400/30';
  if (promedio >= 7.0) return 'text-gray-700 bg-gray-50 ring-gray-600/20 dark:text-gray-300 dark:bg-gray-800/50 dark:ring-gray-400/20';
  return 'text-rose-700 bg-rose-50 ring-rose-600/20 dark:text-rose-400 dark:bg-rose-900/20 dark:ring-rose-400/30';
};
</script>
