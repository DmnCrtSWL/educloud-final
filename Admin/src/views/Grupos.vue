<script setup lang="ts">
import { ref, computed } from "vue";
import AdminLayout from "../components/layout/AdminLayout.vue";

// ─── ID generator: 6-digit unique folio ─────────────────────────────────────
const usedIds = new Set<string>();
const generateFolio = (): string => {
  let folio: string;
  do {
    folio = String(Math.floor(100000 + Math.random() * 900000));
  } while (usedIds.has(folio));
  usedIds.add(folio);
  return folio;
};

interface Grupo {
  id: string;
  grado: number;
  grupo: string;
  materia: string;
  turno: string;
  docenteId: string;
  docenteName: string;
}

const grupos = ref<Grupo[]>([
  {
    id: generateFolio(),
    grado: 1,
    grupo: "A",
    materia: "Matemáticas",
    turno: "Matutino",
    docenteId: "1",
    docenteName: "María Rodríguez M.",
  },
  {
    id: generateFolio(),
    grado: 1,
    grupo: "B",
    materia: "Lengua Materna (Español)",
    turno: "Vespertino",
    docenteId: "2",
    docenteName: "Juan Torres Luna",
  },
  {
    id: generateFolio(),
    grado: 2,
    grupo: "A",
    materia: "Física",
    turno: "Matutino",
    docenteId: "3",
    docenteName: "Pedro Sánchez Ruiz",
  },
  {
    id: generateFolio(),
    grado: 3,
    grupo: "A",
    materia: "Biología",
    turno: "Matutino",
    docenteId: "4",
    docenteName: "Luis Navarro Soto",
  },
]);

// ─── Pagination ───────────────────────────────────────────────────────────────
const currentPage = ref(1);
const itemsPerPage = 10;
const totalPages = computed(() =>
  Math.ceil(grupos.value.length / itemsPerPage),
);
const paginatedGrupos = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return grupos.value.slice(start, start + itemsPerPage);
});
const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--;
};
const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++;
};

// ─── Delete ───────────────────────────────────────────────────────────────────
const deleteGrupo = (id: string) => {
  grupos.value = grupos.value.filter((g) => g.id !== id);
};

// ─── Badge styles ─────────────────────────────────────────────────────────────
const gradoLabel = (g: number) => (g === 1 ? "1ro" : g === 2 ? "2do" : "3ro");
const turnoStyle = (t: string) =>
  t === "Matutino"
    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
    : "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300";
const gradoStyle = (g: number) => {
  if (g === 1)
    return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
  if (g === 2)
    return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
  return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
};
</script>

<template>
  <admin-layout>
    <div class="p-4 sm:p-6 lg:p-8">
      <!-- Header -->
      <div class="sm:flex sm:items-center">
        <div class="sm:flex-auto">
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">
            Grupos
          </h1>
        </div>
        <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <router-link
            to="/grupos/nuevo"
            class="block rounded-full bg-brand-500 px-6 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 transition-colors"
          >
            Agregar Grupo
          </router-link>
        </div>
      </div>

      <!-- Table -->
      <div class="mt-8 flow-root">
        <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div
            class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8"
          >
            <div
              class="overflow-hidden shadow-sm rounded-lg bg-white dark:bg-gray-800"
            >
              <table
                class="min-w-full divide-y divide-gray-100 dark:divide-gray-800"
              >
                <thead class="bg-gray-50/50 dark:bg-gray-800/30">
                  <tr>
                    <th
                      class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-200 sm:pl-6"
                    >
                      ID
                    </th>
                    <th
                      class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200"
                    >
                      Grado
                    </th>
                    <th
                      class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200"
                    >
                      Grupo
                    </th>
                    <th
                      class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200"
                    >
                      Materia
                    </th>
                    <th
                      class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200"
                    >
                      Turno
                    </th>
                    <th
                      class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200"
                    >
                      Docente Asignado
                    </th>
                    <th
                      class="relative py-3.5 pl-3 pr-4 sm:pr-6 text-center text-sm font-semibold text-gray-900 dark:text-gray-200"
                    >
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody
                  class="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900"
                >
                  <tr
                    v-for="g in paginatedGrupos"
                    :key="g.id"
                    class="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    <td
                      class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-mono text-gray-500 dark:text-gray-400 sm:pl-6"
                    >
                      {{ g.id }}
                    </td>
                    <td class="whitespace-nowrap px-3 py-4 text-sm">
                      <span
                        :class="[
                          'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ring-gray-500/10 dark:ring-gray-400/20',
                          gradoStyle(g.grado),
                        ]"
                      >
                        {{ gradoLabel(g.grado) }}
                      </span>
                    </td>
                    <td
                      class="whitespace-nowrap px-3 py-4 text-sm font-semibold text-gray-900 dark:text-white"
                    >
                      {{ g.grupo }}
                    </td>
                    <td
                      class="px-3 py-4 text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate"
                    >
                      {{ g.materia }}
                    </td>
                    <td class="whitespace-nowrap px-3 py-4 text-sm">
                      <span
                        :class="[
                          'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ring-gray-500/10 dark:ring-gray-400/20',
                          turnoStyle(g.turno),
                        ]"
                      >
                        {{ g.turno }}
                      </span>
                    </td>
                    <td
                      class="whitespace-nowrap px-3 py-4 text-sm text-gray-700 dark:text-gray-300"
                    >
                      <div class="flex items-center gap-2">
                        <div
                          class="h-7 w-7 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-xs font-bold text-brand-700 dark:text-brand-300 flex-shrink-0"
                        >
                          {{ g.docenteName.charAt(0) }}
                        </div>
                        {{ g.docenteName }}
                      </div>
                    </td>
                    <td
                      class="relative whitespace-nowrap py-4 pl-3 pr-4 text-center text-sm font-medium sm:pr-6"
                    >
                      <div class="flex items-center justify-center gap-2">
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
                          @click="deleteGrupo(g.id)"
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

                  <!-- Empty state -->
                  <tr v-if="grupos.length === 0">
                    <td
                      colspan="7"
                      class="py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      <div class="flex flex-col items-center gap-2">
                        <svg
                          class="h-10 w-10 text-gray-300 dark:text-gray-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke-width="1"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
                          />
                        </svg>
                        <span
                          >No hay grupos registrados. Haz clic en
                          <span class="font-medium text-brand-600"
                            >Agregar Grupo</span
                          >
                          para comenzar.</span
                        >
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- Pagination -->
              <div
                v-if="grupos.length > 0"
                class="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 sm:px-6"
              >
                <div class="flex flex-1 justify-between sm:hidden">
                  <button
                    @click="prevPage"
                    :disabled="currentPage === 1"
                    class="relative inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    @click="nextPage"
                    :disabled="currentPage === totalPages"
                    class="relative ml-3 inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
                <div
                  class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between"
                >
                  <p class="text-sm text-gray-700 dark:text-gray-400">
                    Mostrando
                    <span class="font-medium">{{
                      (currentPage - 1) * itemsPerPage + 1
                    }}</span>
                    a
                    <span class="font-medium">{{
                      Math.min(currentPage * itemsPerPage, grupos.length)
                    }}</span>
                    de
                    <span class="font-medium">{{ grupos.length }}</span>
                    resultados
                  </p>
                  <nav
                    class="isolate inline-flex -space-x-px rounded-md shadow-sm"
                    aria-label="Pagination"
                  >
                    <button
                      @click="prevPage"
                      :disabled="currentPage === 1"
                      class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 dark:text-gray-500 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                    >
                      <span class="sr-only">Anterior</span>
                      <svg
                        class="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    </button>
                    <button
                      aria-current="page"
                      class="relative z-10 inline-flex items-center bg-brand-600 px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                    >
                      {{ currentPage }}
                    </button>
                    <button
                      @click="nextPage"
                      :disabled="currentPage === totalPages"
                      class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 dark:text-gray-500 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                    >
                      <span class="sr-only">Siguiente</span>
                      <svg
                        class="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </admin-layout>
</template>
