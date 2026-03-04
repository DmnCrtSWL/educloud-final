<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import AdminLayout from "../components/layout/AdminLayout.vue";
import { parseCurp } from "../utils/curpTools";

const router = useRouter();
const route = useRoute();

const groupId = route.params.id as string;
const gradoQuery = route.query.grado
  ? parseInt(route.query.grado as string)
  : 1;
const grupoQuery = (route.query.grupo as string) || "A";

const searchQuery = ref("");
const selectedStudents = ref<Set<string>>(new Set());

interface Student {
  id: string;
  name: string;
  curp: string;
  suggestedGrade: 1 | 2 | 3 | null;
  enrolledGroupId: string | null;
}

// Simulamos la bbdd total de alumnos registrados (que entraron por Smart Import)
const allStudents = ref<Student[]>([
  {
    id: "EDU-123-456",
    name: "Alvarez Lopez Maria",
    curp: "AALM110514MDFRRN01",
    suggestedGrade: parseCurp("AALM110514MDFRRN01").suggestedGrade,
    enrolledGroupId: null,
  },
  {
    id: "EDU-234-567",
    name: "García Pérez Ana",
    curp: "GAPA120514MDFRRN01",
    suggestedGrade: parseCurp("GAPA120514MDFRRN01").suggestedGrade,
    enrolledGroupId: null,
  },
  {
    id: "EDU-345-678",
    name: "Gómez Díaz Laura",
    curp: "GODL130510MDFGDL05",
    suggestedGrade: parseCurp("GODL130510MDFGDL05").suggestedGrade,
    enrolledGroupId: null,
  },
  {
    id: "EDU-456-789",
    name: "López Silva Carlos",
    curp: "LOSC100822HDFLSR02",
    suggestedGrade: parseCurp("LOSC100822HDFLSR02").suggestedGrade,
    enrolledGroupId: null,
  },
  {
    id: "EDU-567-890",
    name: "Ramirez Cota Jose",
    curp: "RACJ110210HDFRMR03",
    suggestedGrade: parseCurp("RACJ110210HDFRMR03").suggestedGrade,
    enrolledGroupId: null,
  },
  {
    id: "EDU-678-901",
    name: "Rodríguez M. María",
    curp: "ROMM130210MDFRMR03",
    suggestedGrade: parseCurp("ROMM130210MDFRMR03").suggestedGrade,
    enrolledGroupId: null,
  },
  {
    id: "EDU-789-012",
    name: "Torres Luna Juan",
    curp: "TOLJ111111HDFTLJ04",
    suggestedGrade: parseCurp("TOLJ111111HDFTLJ04").suggestedGrade,
    enrolledGroupId: null,
  },
]);

// Filtramos los que aplican para este grupo.
// Si hay un query text de búsqueda, traemos a los que coinciden SIN importar el grado
// Si no hay busqueda, traemos los del grado `gradoQuery` que no están enrolados.
const filteredStudents = computed(() => {
  return allStudents.value.filter((student) => {
    // Si ya tiene grupo, por ahora no lo sugerimos (a menos que se quiera mover)
    if (student.enrolledGroupId && student.enrolledGroupId !== groupId)
      return false;

    if (searchQuery.value) {
      return (
        student.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        student.curp.toLowerCase().includes(searchQuery.value.toLowerCase())
      );
    }

    // Sugerencia automática por CURP
    return student.suggestedGrade === gradoQuery;
  });
});

const toggleStudentSelection = (id: string) => {
  if (selectedStudents.value.has(id)) {
    selectedStudents.value.delete(id);
  } else {
    selectedStudents.value.add(id);
  }
};

const toggleAll = () => {
  if (
    selectedStudents.value.size === filteredStudents.value.length &&
    filteredStudents.value.length > 0
  ) {
    selectedStudents.value.clear();
  } else {
    filteredStudents.value.forEach((s) => selectedStudents.value.add(s.id));
  }
};

const isAllSelected = computed(() => {
  return (
    filteredStudents.value.length > 0 &&
    selectedStudents.value.size === filteredStudents.value.length
  );
});

const finishEnrollment = () => {
  console.log(
    `Guardando enrolamiento para grupo ${groupId}:`,
    Array.from(selectedStudents.value),
  );
  router.push("/grupos");
};

// Checkbox selection utility
const isSelected = (id: string) => selectedStudents.value.has(id);
</script>

<template>
  <admin-layout>
    <div class="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <!-- Encabezado de la página -->
      <div class="sm:flex sm:items-center justify-between mb-8">
        <div>
          <div class="flex items-center gap-3">
            <button
              @click="$router.push('/grupos')"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
            <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">
              Enrolar Alumnos
            </h1>
          </div>
        </div>
        <div class="mt-4 sm:ml-16 sm:mt-0 flex gap-3">
          <button
            @click="$router.push('/grupos')"
            class="text-sm font-semibold leading-6 text-gray-900 dark:text-gray-300 hover:text-gray-500 py-1.5 px-3"
          >
            Saltar por ahora
          </button>
          <button
            @click="finishEnrollment"
            class="block rounded-lg bg-brand-600 px-6 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 transition-colors cursor-pointer"
          >
            Finalizar Enrolamiento (<span class="font-bold">{{
              selectedStudents.size
            }}</span
            >)
          </button>
        </div>
      </div>

      <div
        class="bg-white dark:bg-gray-900 shadow-sm ring-1 ring-gray-200 dark:ring-gray-800 rounded-xl overflow-hidden"
      >
        <!-- Toolbar -->
        <div
          class="px-4 py-4 border-b border-gray-200 dark:border-gray-800 sm:flex sm:items-center sm:justify-between bg-gray-50/50 dark:bg-gray-800/30"
        >
          <div class="flex items-center gap-4">
            <div
              class="bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded-lg text-sm font-medium"
            >
              Sugerencias para:
              <span class="font-bold">{{ gradoQuery }}ro {{ grupoQuery }}</span>
            </div>
          </div>
          <div class="mt-4 sm:mt-0 relative w-full sm:w-80">
            <div
              class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
            >
              <svg
                class="h-5 w-5 text-gray-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar alumno por nombre o CURP..."
              class="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 dark:text-white dark:bg-gray-800 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm sm:leading-6"
            />
          </div>
        </div>

        <div class="overflow-x-auto">
          <table
            class="min-w-full divide-y divide-gray-200 dark:divide-gray-800"
          >
            <thead class="bg-white dark:bg-gray-900">
              <tr>
                <th scope="col" class="relative px-7 sm:w-12 sm:px-6">
                  <input
                    type="checkbox"
                    :checked="isAllSelected"
                    @change="toggleAll"
                    class="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-600 dark:border-gray-600 dark:bg-gray-800"
                  />
                </th>
                <th
                  scope="col"
                  class="py-3.5 pl-4 pr-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                >
                  ID Alumno
                </th>
                <th
                  scope="col"
                  class="px-3 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                >
                  Nombre Completo
                </th>
                <th
                  scope="col"
                  class="px-3 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                >
                  CURP
                </th>
                <th
                  scope="col"
                  class="px-3 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                >
                  Grado Sugerido
                </th>
              </tr>
            </thead>
            <tbody
              class="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900"
            >
              <tr
                v-for="student in filteredStudents"
                :key="student.id"
                :class="[
                  isSelected(student.id)
                    ? 'bg-brand-50/50 dark:bg-brand-900/10'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
                  'cursor-pointer transition-colors',
                ]"
                @click="toggleStudentSelection(student.id)"
              >
                <td class="relative px-7 sm:w-12 sm:px-6">
                  <input
                    type="checkbox"
                    :checked="isSelected(student.id)"
                    @click.stop="toggleStudentSelection(student.id)"
                    class="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-600 dark:border-gray-600 dark:bg-gray-800"
                  />
                </td>
                <td
                  class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-mono text-gray-500 dark:text-gray-400"
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
                <td class="whitespace-nowrap px-3 py-4 text-sm">
                  <span
                    :class="
                      student.suggestedGrade === gradoQuery
                        ? 'text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 ring-green-600/20'
                        : 'text-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 ring-gray-500/10'
                    "
                    class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset"
                  >
                    {{ student.suggestedGrade }}ro Secundaria
                  </span>
                </td>
              </tr>

              <!-- Empty state table -->
              <tr v-if="filteredStudents.length === 0">
                <td
                  colspan="5"
                  class="py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  <div class="flex flex-col items-center gap-2">
                    <svg
                      class="h-10 w-10 text-gray-300 dark:text-gray-600"
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
                    <span
                      >No hay alumnos que coincidan con la búsqueda o el
                      criterio de Grado Sugerido.</span
                    >
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </admin-layout>
</template>
