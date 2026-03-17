<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import AdminLayout from "../components/layout/AdminLayout.vue";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Usuario {
  id: string;
  nombre: string;
  rol: string;
  correo: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

const router = useRouter();
// No longer using currentUser in this setup

// ─── State ───────────────────────────────────────────────────────────────────
const users = ref<Usuario[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

// ─── Delete modal state ───────────────────────────────────────────────────────
const deleteTarget = ref<Usuario | null>(null);
const deleteConfirmOpen = ref(false);
const deleting = ref(false);

const openDeleteModal = (user: Usuario) => {
  deleteTarget.value = user;
  deleteConfirmOpen.value = true;
};

const closeDeleteModal = () => {
  deleteTarget.value = null;
  deleteConfirmOpen.value = false;
};

const confirmDelete = async () => {
  if (!deleteTarget.value) return;
  deleting.value = true;
  try {
    const res = await fetch(`http://localhost:3001/api/usuarios/${deleteTarget.value.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      users.value = users.value.filter((u) => u.id !== deleteTarget.value!.id);
    }
  } catch {
    await fetchUsers();
  } finally {
    deleting.value = false;
    closeDeleteModal();
  }
};

// No password modals anymore

// ─── Fetch users from API ────────────────────────────────────────────────────
const fetchUsers = async () => {
  loading.value = true;
  error.value = null;
  try {
    const res = await fetch("http://localhost:3001/api/usuarios");
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Error al cargar usuarios");
    users.value = json.data;
  } catch {
    error.value = "No se pudo conectar con el servidor";
  } finally {
    loading.value = false;
  }
};

onMounted(fetchUsers);

// ─── Pagination ──────────────────────────────────────────────────────────────
const currentPage = ref(1);
const itemsPerPage = 10;
const totalPages = computed(() => Math.ceil(users.value.length / itemsPerPage));

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return users.value.slice(start, start + itemsPerPage);
});

const prevPage = () => { if (currentPage.value > 1) currentPage.value--; };
const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++; };

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-MX", { year: "numeric", month: "2-digit", day: "2-digit" });
};

const getRoleStyle = (role: string) => {
  switch (role) {
    case "Directivo":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
    case "Administrativo":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    case "Docente":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    case "Prefectura":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
    case "Trabajo Social":
      return "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300";
    case "Sistemas":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-800";
  }
};
</script>

<template>
  <admin-layout>
    <div class="p-4 sm:p-6 lg:p-8">
      <!-- Header -->
      <div class="sm:flex sm:items-center">
        <div class="sm:flex-auto">
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">
            Usuarios
          </h1>
        </div>
        <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <router-link
            to="/usuarios/nuevo"
            class="block rounded-full bg-brand-500 px-6 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 transition-colors"
          >
            Agregar Usuario
          </router-link>
        </div>
      </div>

      <!-- Error banner -->
      <div
        v-if="error"
        class="mt-4 rounded-md bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
      >
        ⚠️ {{ error }}
      </div>

      <div class="mt-8 flow-root">
        <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div class="overflow-hidden shadow-sm rounded-lg bg-white dark:bg-gray-800">

              <!-- Loading state -->
              <div
                v-if="loading"
                class="flex items-center justify-center py-20 text-gray-500 dark:text-gray-400"
              >
                <svg class="animate-spin h-6 w-6 mr-3 text-brand-500" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Cargando usuarios...
              </div>

              <!-- Empty state -->
              <div
                v-else-if="!loading && users.length === 0 && !error"
                class="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500"
              >
                <svg class="h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                <p class="text-sm">No hay usuarios registrados aún.</p>
                <router-link to="/usuarios/nuevo" class="mt-3 text-brand-500 hover:text-brand-600 text-sm font-medium">
                  Agregar el primer usuario →
                </router-link>
              </div>

              <!-- Table -->
              <table
                v-else-if="!loading"
                class="min-w-full divide-y divide-gray-100 dark:divide-gray-800"
              >
                <thead class="bg-gray-50/50 dark:bg-gray-800/30">
                  <tr>
                    <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-200 sm:pl-6">
                      ID
                    </th>
                    <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">
                      Nombre
                    </th>
                    <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">
                      Rol
                    </th>
                    <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">
                      Correo Electrónico
                    </th>
                    <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">
                      Fecha de Alta
                    </th>
                    <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6 text-center text-sm font-semibold text-gray-900 dark:text-gray-200">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                  <tr
                    v-for="user in paginatedUsers"
                    :key="user.id"
                    class="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-mono text-gray-500 dark:text-gray-400 sm:pl-6">
                      {{ user.id }}
                    </td>
                    <td class="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {{ user.nombre }}
                    </td>
                    <td class="whitespace-nowrap px-3 py-4 text-sm">
                      <span
                        :class="[
                          'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ring-gray-500/10 dark:ring-gray-400/20',
                          getRoleStyle(user.rol),
                        ]"
                      >
                        {{ user.rol }}
                      </span>
                    </td>
                    <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {{ user.correo }}
                    </td>
                    <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {{ formatDate(user.created_at) }}
                    </td>
                     <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-center text-sm font-medium sm:pr-6">
                         <div class="flex items-center justify-center gap-2">
                           <!-- Monitor / Stream removed -->
                           <!-- Ver perfil -->
                           <button
                             @click="router.push(`/usuarios/${user.id}/perfil`)"
                             class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                             title="Ver perfil"
                           >
                             <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                               <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                               <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                             </svg>
                           </button>
                           <!-- Editar -->
                           <button
                             @click="router.push(`/usuarios/${user.id}/editar`)"
                             class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                             title="Editar"
                           >
                             <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                               <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                             </svg>
                           </button>
                           <!-- Eliminar -->
                           <button
                             @click="openDeleteModal(user)"
                             class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                             title="Eliminar"
                           >
                             <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                               <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                             </svg>
                           </button>
                         </div>
                     </td>
                   </tr>
                </tbody>
              </table>

              <!-- Pagination -->
              <div
                v-if="!loading && users.length > 0"
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
                <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p class="text-sm text-gray-700 dark:text-gray-400">
                      Mostrando
                      <span class="font-medium">{{ (currentPage - 1) * itemsPerPage + 1 }}</span>
                      a
                      <span class="font-medium">{{ Math.min(currentPage * itemsPerPage, users.length) }}</span>
                      de
                      <span class="font-medium">{{ users.length }}</span>
                      resultados
                    </p>
                  </div>
                  <div>
                    <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                      <button
                        @click="prevPage"
                        :disabled="currentPage === 1"
                        class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 dark:text-gray-500 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                      >
                        <span class="sr-only">Anterior</span>
                        <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd" />
                        </svg>
                      </button>
                      <button
                        aria-current="page"
                        class="relative z-10 inline-flex items-center bg-brand-600 px-4 py-2 text-sm font-semibold text-white focus:z-20"
                      >
                        {{ currentPage }}
                      </button>
                      <button
                        @click="nextPage"
                        :disabled="currentPage === totalPages"
                        class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 dark:text-gray-500 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                      >
                        <span class="sr-only">Siguiente</span>
                        <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
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
    </div>
  </admin-layout>

  <!-- ─── Delete Confirmation Modal ──────────────────────────────────────────── -->
  <Teleport to="body">
    <div
      v-if="deleteConfirmOpen"
      class="fixed inset-0 z-[999999] flex items-center justify-center p-4"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/50 backdrop-blur-sm"
        @click="closeDeleteModal"
      ></div>
      <!-- Modal card -->
      <div class="relative z-10 w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-6">
        <div class="flex items-center gap-4 mb-4">
          <div class="h-10 w-10 flex-shrink-0 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <svg class="h-5 w-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <div>
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">Eliminar usuario</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">Esta acción no se puede deshacer</p>
          </div>
        </div>

        <p class="text-sm text-gray-600 dark:text-gray-300 mb-6">
          ¿Estás seguro de que deseas eliminar a
          <span class="font-semibold text-gray-900 dark:text-white">{{ deleteTarget?.nombre }}</span>?
          El registro quedará desactivado pero no se borrará de la base de datos.
        </p>

        <div class="flex items-center justify-end gap-3">
          <button
            @click="closeDeleteModal"
            class="text-sm font-semibold text-gray-900 dark:text-gray-300 hover:text-gray-500 py-2 px-4 rounded-md transition-colors"
          >
            Cancelar
          </button>
          <button
            @click="confirmDelete"
            :disabled="deleting"
            class="inline-flex items-center gap-2 rounded-md bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-500 transition-colors disabled:opacity-60"
          >
            <svg v-if="deleting" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            {{ deleting ? "Eliminando..." : "Sí, eliminar" }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Modal removed -->
</template>
