<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import AdminLayout from "../components/layout/AdminLayout.vue";
import { authHeaders } from "../composables/useAuth";

interface Grupo {
  id: string;
  grado: number;
  grupo: string;
  turno: string;
  created_at: string;
  total_alumnos: number;
  materias: { id: string; nombre: string; docente_nombre: string }[];
}

const grupos = ref<Grupo[]>([]);
const loading = ref(true);
const errorMsg = ref<string | null>(null);

// ─── Fetch ────────────────────────────────────────────────────────────────────
const fetchGrupos = async () => {
  loading.value = true;
  errorMsg.value = null;
  try {
    const res = await fetch("http://localhost:3001/api/grupos", {
      headers: authHeaders()
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    grupos.value = json.data;
  } catch (err: unknown) {
    errorMsg.value = (err instanceof Error ? err.message : null) || "Error al cargar grupos";
  } finally {
    loading.value = false;
  }
};

onMounted(fetchGrupos);

// ─── Delete con confirmación ───────────────────────────────────────────────────
const deleteTarget = ref<string | null>(null);
const deleting = ref(false);
const showConfirm = ref(false);

const confirmDelete = (id: string) => {
  deleteTarget.value = id;
  showConfirm.value = true;
};

const doDelete = async () => {
  if (!deleteTarget.value) return;
  deleting.value = true;
  try {
    await fetch(`http://localhost:3001/api/grupos/${deleteTarget.value}`, {
      method: "DELETE",
      headers: authHeaders()
    });
    grupos.value = grupos.value.filter((g) => g.id !== deleteTarget.value);
  } finally {
    deleting.value = false;
    showConfirm.value = false;
    deleteTarget.value = null;
  }
};

// ─── Paginación ────────────────────────────────────────────────────────────────
const currentPage = ref(1);
const itemsPerPage = 15;
const totalPages = computed(() => Math.ceil(grupos.value.length / itemsPerPage));
const paginatedGrupos = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return grupos.value.slice(start, start + itemsPerPage);
});

// ─── Badge helpers ────────────────────────────────────────────────────────────
const uniqueDocentes = (materias: { docente_nombre: string }[]) => {
  const docs = materias.map(m => m.docente_nombre).filter(Boolean);
  return Array.from(new Set(docs));
};

const gradoLabel = (g: number) => (g === 1 ? "1ro" : g === 2 ? "2do" : "3ro");
const turnoStyle = (t: string) =>
  t === "Matutino"
    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
    : "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300";
const gradoStyle = (g: number) => {
  if (g === 1) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
  if (g === 2) return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
  return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
};
</script>

<template>
  <admin-layout>
    <div class="p-4 sm:p-6 lg:p-8">

      <!-- Header -->
      <div class="sm:flex sm:items-center mb-8">
        <div class="sm:flex-auto">
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Grupos</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gestión de grupos — cada grupo puede tener múltiples materias y docentes
          </p>
        </div>
        <div class="mt-4 sm:ml-16 sm:mt-0">
          <router-link
            to="/grupos/nuevo"
            class="block rounded-full bg-brand-500 px-6 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-brand-600 transition-colors"
          >
            Agregar Grupo
          </router-link>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <svg class="animate-spin h-6 w-6 text-brand-500" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
      </div>

      <!-- Error -->
      <div v-else-if="errorMsg" class="rounded-md bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-400">
        ⚠️ {{ errorMsg }}
      </div>

      <!-- Tabla -->
      <div v-else class="flow-root">
        <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div class="overflow-hidden shadow-sm rounded-lg bg-white dark:bg-gray-800">
              <table class="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
                <thead class="bg-gray-50/50 dark:bg-gray-800/30">
                  <tr>
                    <th class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-200 sm:pl-6">ID</th>
                    <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">Grado</th>
                    <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">Grupo</th>
                    <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">Turno</th>
                    <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">Docentes</th>
                    <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">Alumnos</th>
                    <th class="relative py-3.5 pl-3 pr-4 sm:pr-6 text-center text-sm font-semibold text-gray-900 dark:text-gray-200">Acciones</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-900">
                  <tr
                    v-for="g in paginatedGrupos"
                    :key="g.id"
                    class="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-mono text-gray-500 dark:text-gray-400 sm:pl-6">{{ g.id }}</td>
                    <td class="whitespace-nowrap px-3 py-4 text-sm">
                      <span :class="['inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ring-gray-500/10', gradoStyle(g.grado)]">
                        {{ gradoLabel(g.grado) }}
                      </span>
                    </td>
                    <td class="whitespace-nowrap px-3 py-4 text-sm font-bold text-gray-900 dark:text-white">{{ g.grupo }}</td>
                    <td class="whitespace-nowrap px-3 py-4 text-sm">
                      <span :class="['inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ring-gray-500/10', turnoStyle(g.turno)]">
                        {{ g.turno }}
                      </span>
                    </td>
                    <!-- Docentes badge -->
                    <td class="px-3 py-4 text-sm">
                      <div v-if="uniqueDocentes(g.materias).length > 0" class="flex flex-col gap-1">
                        <span
                          v-for="(docente, idx) in uniqueDocentes(g.materias).slice(0, 2)"
                          :key="idx"
                          class="inline-flex items-center text-xs text-gray-700 dark:text-gray-300 max-w-[160px] truncate"
                        >
                          <svg class="mr-1 h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                          </svg>
                          {{ docente }}
                        </span>
                        <span v-if="uniqueDocentes(g.materias).length > 2" class="text-xs text-brand-600 dark:text-brand-400 max-w-[160px] truncate">
                          +{{ uniqueDocentes(g.materias).length - 2 }} más
                        </span>
                      </div>
                      <span v-else class="text-xs text-gray-400 dark:text-gray-500 italic">Sin docentes</span>
                    </td>
                    <!-- Alumnos count -->
                    <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-700 dark:text-gray-300">
                      <span class="inline-flex items-center gap-1 font-medium bg-gray-50/50 dark:bg-gray-800 px-2.5 py-1 rounded-md">
                        <svg class="h-4 w-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"/>
                        </svg>
                        {{ g.total_alumnos }}
                      </span>
                    </td>
                    <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-center text-sm font-medium sm:pr-6">
                      <div class="flex items-center justify-center gap-3">
                        <!-- Ver detalle -->
                        <router-link
                          :to="`/grupos/${g.id}/detalle`"
                          class="text-brand-600 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
                          title="Ver detalle del grupo"
                        >
                          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
                          </svg>
                        </router-link>
                        <!-- Eliminar -->
                        <button
                          @click="confirmDelete(g.id)"
                          class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                          title="Eliminar"
                        >
                          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>

                  <tr v-if="grupos.length === 0">
                    <td colspan="7" class="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
                      <div class="flex flex-col items-center gap-2">
                        <svg class="h-10 w-10 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"/>
                        </svg>
                        <span>No hay grupos registrados. Haz clic en <span class="font-medium text-brand-600">Agregar Grupo</span>.</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- Paginación -->
              <div v-if="grupos.length > itemsPerPage" class="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-4 py-3 sm:px-6">
                <p class="text-sm text-gray-700 dark:text-gray-400">
                  Mostrando <span class="font-medium">{{ (currentPage - 1) * itemsPerPage + 1 }}</span>
                  a <span class="font-medium">{{ Math.min(currentPage * itemsPerPage, grupos.length) }}</span>
                  de <span class="font-medium">{{ grupos.length }}</span>
                </p>
                <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm">
                  <button @click="currentPage--" :disabled="currentPage === 1" class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50">
                    <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd"/></svg>
                  </button>
                  <button class="relative z-10 inline-flex items-center bg-brand-600 px-4 py-2 text-sm font-semibold text-white">{{ currentPage }}</button>
                  <button @click="currentPage++" :disabled="currentPage === totalPages" class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50">
                    <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd"/></svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Modal de confirmación de eliminación -->
    <Teleport to="body">
      <div v-if="showConfirm" class="fixed inset-0 z-[99999] flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showConfirm = false"/>
        <div class="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 w-full max-w-sm mx-4 z-10">
          <div class="flex items-center gap-3 mb-4">
            <div class="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
              <svg class="h-5 w-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/>
              </svg>
            </div>
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">¿Eliminar grupo?</h3>
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">Esta acción no se puede deshacer.</p>
          <div class="flex gap-3 justify-end">
            <button @click="showConfirm = false" class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              Cancelar
            </button>
            <button @click="doDelete" :disabled="deleting" class="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60">
              {{ deleting ? 'Eliminando…' : 'Sí, eliminar' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </admin-layout>
</template>
