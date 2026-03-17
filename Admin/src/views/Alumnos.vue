<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import AdminLayout from "../components/layout/AdminLayout.vue";
import AsistenteIA from "../components/AsistenteIA.vue";
import { useAuth, authHeaders } from "../composables/useAuth";
import { useGroupState } from "../composables/useGroupState";

interface Alumno {
  id: string;
  nombre: string;
  curp: string;
  created_at: string;
  num_lista: number;
  grupo_grado?: number;
  grupo_letra?: string;
  estatus: string;
}

const getGradoSugerido = (curp: string) => {
  if (!curp || curp.length < 16) return "Desconocido";
  const yy = parseInt(curp.substring(4, 6), 10);
  if (isNaN(yy)) return "Desconocido";
  const year = yy <= 26 ? 2000 + yy : 1900 + yy;
  if (year >= 2014) return "1er Grado";
  if (year === 2013) return "1er o 2do";
  if (year === 2012) return "2do o 3er";
  return "3er Grado";
};

// ─── State ───────────────────────────────────────────────────────────────────
const alumnos = ref<Alumno[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const showAsistente = ref(false);

// ─── Delete modal ─────────────────────────────────────────────────────────────
const deleteTarget = ref<Alumno | null>(null);
const deleteConfirmOpen = ref(false);
const deleting = ref(false);

const openDeleteModal = (alumno: Alumno) => {
  deleteTarget.value = alumno;
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
    const res = await fetch(`http://localhost:3001/api/alumnos/${deleteTarget.value.id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (res.ok) {
      // Bote de basura = Desaparece de la lista
      alumnos.value = alumnos.value.filter((a) => a.id !== deleteTarget.value!.id);
      // Reasignar num_lista
      alumnos.value = alumnos.value.map((a, i) => ({ ...a, num_lista: i + 1 }));
    }
  } catch {
    await fetchAlumnos();
  } finally {
    deleting.value = false;
    closeDeleteModal();
  }
};

// ─── Edit modal ─────────────────────────────────────────────────────────────
const editTarget = ref<Alumno | null>(null);
const editModalOpen = ref(false);
const editing = ref(false);
const editError = ref<string | null>(null);

const editForm = ref({
  nombre: "",
  curp: ""
});

const openEditModal = (alumno: Alumno) => {
  editTarget.value = alumno;
  editForm.value.nombre = alumno.nombre;
  editForm.value.curp = alumno.curp;
  editError.value = null;
  editModalOpen.value = true;
};

const closeEditModal = () => {
  editTarget.value = null;
  editModalOpen.value = false;
};

const confirmEdit = async () => {
  if (!editTarget.value) return;
  if (!editForm.value.nombre.trim() || !editForm.value.curp.trim()) {
    editError.value = "Nombre y CURP son requeridos.";
    return;
  }
  
  if (editForm.value.curp.trim().length !== 18) {
    editError.value = "La CURP debe tener exactamente 18 caracteres.";
    return;
  }

  editing.value = true;
  editError.value = null;
  
  try {
    const res = await fetch(`http://localhost:3001/api/alumnos/${editTarget.value.id}`, {
      method: "PUT",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
         nombre: editForm.value.nombre,
         curp: editForm.value.curp
      })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Error al actualizar");
    
    // Update local state
    const index = alumnos.value.findIndex(a => a.id === editTarget.value!.id);
    if (index !== -1) {
      alumnos.value[index].nombre = json.data.nombre;
      alumnos.value[index].curp = json.data.curp;
    }
    closeEditModal();
  } catch (err: unknown) {
    editError.value = err instanceof Error ? err.message : "Error de conexión";
  } finally {
    editing.value = false;
  }
};

const { isDocente } = useAuth();
const { selectedGroupId } = useGroupState();

// ─── Fetch ────────────────────────────────────────────────────────────────────
const fetchAlumnos = async () => {
  loading.value = true;
  error.value = null;
  alumnos.value = [];
  try {
    let url = "http://localhost:3001/api/alumnos";
    
    // Si es docente, necesita un grupo seleccionado
    if (isDocente.value) {
      if (!selectedGroupId.value) {
        error.value = "Selecciona un grupo para ver sus alumnos.";
        loading.value = false;
        return;
      }
      url = `http://localhost:3001/api/grupos/${selectedGroupId.value}/enrolados`;
    }

    const res = await fetch(url, { headers: authHeaders() });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    alumnos.value = json.data;
  } catch {
    error.value = "No se pudo conectar con el servidor";
  } finally {
    loading.value = false;
  }
};

onMounted(fetchAlumnos);

// Si cambia el grupo seleccionado y es docente, volver a cargar
watch(selectedGroupId, () => {
  if (isDocente.value) fetchAlumnos();
});
</script>

<template>
  <admin-layout>
    <div class="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

      <!-- Encabezado -->
      <div class="sm:flex sm:items-center mb-8">
        <div class="sm:flex-auto">
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Alumnos</h1>
        </div>
        <div v-if="!isDocente" class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none flex items-center gap-3">
          <!-- Botón cohete (Smart Import) -->
          <button
            title="Asistente IA"
            @click="showAsistente = true"
            class="flex items-center justify-center h-10 w-10 rounded-full bg-brand-500 text-white shadow-sm hover:bg-brand-600 transition-colors"
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
              <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
              <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
              <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
            </svg>
          </button>
          <router-link
            to="/alumnos/nuevo"
            class="block rounded-full bg-brand-500 px-6 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-brand-600 transition-colors"
          >
            Agregar Alumno
          </router-link>
        </div>

      </div>

      <!-- Error -->
      <div
        v-if="error"
        class="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
      >
        ⚠️ {{ error }}
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <svg class="animate-spin h-6 w-6 text-brand-500" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="!loading && alumnos.length === 0 && !error"
        class="overflow-x-auto shadow-sm rounded-lg bg-white dark:bg-gray-800 text-center py-16 border border-gray-100 dark:border-gray-700"
      >
        <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <svg class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
          </svg>
        </div>
        <h3 class="mt-2 text-sm font-semibold text-gray-900 dark:text-white">No hay alumnos</h3>
        <p v-if="isDocente" class="mt-1 text-sm text-gray-500 dark:text-gray-400">Selecciona un grupo para ver a los alumnos enrolados.</p>
        <div v-else>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Comienza agregando un alumno.</p>
          <router-link to="/alumnos/nuevo" class="mt-3 inline-block text-brand-500 hover:text-brand-600 text-sm font-medium">
            Agregar el primer alumno →
          </router-link>
        </div>
      </div>

      <!-- Tabla de alumnos -->
      <div v-else-if="!loading" class="flow-root">
        <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div class="overflow-hidden shadow-sm rounded-lg bg-white dark:bg-gray-800">
              <table class="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                <thead class="bg-gray-50/50 dark:bg-gray-800/30">
                  <tr>
                    <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-200 sm:pl-6 w-16">
                      #
                    </th>
                    <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">
                      Código
                    </th>
                    <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">
                      Nombre
                    </th>
                    <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">
                      CURP
                    </th>
                    <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">
                      Grado Sugerido
                    </th>
                    <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">
                      Grupo Asignado
                    </th>
                    <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6 text-center text-sm font-semibold text-gray-900 dark:text-gray-200">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                  <tr
                    v-for="alumno in alumnos"
                    :key="alumno.id"
                    class="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    <!-- Número de lista -->
                    <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-semibold text-gray-400 dark:text-gray-500 sm:pl-6">
                      {{ alumno.num_lista }}
                    </td>
                    <!-- Código EDU-XXX-XXX -->
                    <td class="whitespace-nowrap px-3 py-4 text-sm font-mono text-gray-500 dark:text-gray-400">
                      {{ alumno.id }}
                    </td>
                    <!-- Nombre -->
                    <td class="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {{ alumno.nombre }}
                    </td>
                    <!-- CURP -->
                    <td class="whitespace-nowrap px-3 py-4 text-sm font-mono text-gray-500 dark:text-gray-400">
                      {{ alumno.curp }}
                    </td>
                    <!-- Grado Sugerido -->
                    <td class="whitespace-nowrap px-3 py-4 text-sm font-medium">
                      <span class="inline-flex items-center rounded-md bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 ring-1 ring-inset ring-purple-500/10">
                        {{ getGradoSugerido(alumno.curp) }}
                      </span>
                    </td>
                    <!-- Grupo Asignado -->
                    <td class="whitespace-nowrap px-3 py-4 text-sm font-medium">
                      <span v-if="alumno.estatus === 'Baja'" class="inline-flex items-center gap-1 rounded-md bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-300 ring-1 ring-inset ring-red-500/10">
                        Baja
                      </span>
                      <span v-else-if="alumno.grupo_grado && alumno.grupo_letra" class="inline-flex items-center gap-1 rounded-md bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300 ring-1 ring-inset ring-green-500/10">
                        <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        {{ alumno.grupo_grado }}ro {{ alumno.grupo_letra }}
                      </span>
                      <span v-else class="text-xs text-gray-400 dark:text-gray-500 italic">
                        Sin asignar
                      </span>
                    </td>
                    <!-- Acciones -->
                    <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-center text-sm font-medium sm:pr-6">
                      <div class="flex items-center justify-center gap-2">
                        <!-- Ver perfil -->
                        <router-link
                          :to="`/alumnos/${alumno.id}/perfil`"
                          class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                          title="Ver perfil"
                        >
                          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          </svg>
                        </router-link>
                        <!-- Editar Rápido -->
                        <button
                          v-if="!isDocente && alumno.estatus !== 'Baja'"
                          @click="openEditModal(alumno)"
                          class="text-brand-500 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
                          title="Editar"
                        >
                          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                          </svg>
                        </button>
                        <!-- Eliminar -->
                        <button
                          v-if="!isDocente && alumno.estatus !== 'Baja'"
                          @click="openDeleteModal(alumno)"
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

              <!-- Pie de tabla -->
              <div class="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 sm:px-6">
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Total: <span class="font-medium text-gray-900 dark:text-white">{{ alumnos.length }}</span> alumnos — ordenados alfabéticamente por apellido
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </admin-layout>

  <!-- ─── Modal eliminar ─────────────────────────────────────────────────────── -->
  <Teleport to="body">
    <div
      v-if="deleteConfirmOpen"
      class="fixed inset-0 z-[999999] flex items-center justify-center p-4"
    >
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeDeleteModal"></div>
      <div class="relative z-10 w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-6">
        <div class="flex items-center gap-4 mb-4">
          <div class="h-10 w-10 flex-shrink-0 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <svg class="h-5 w-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <div>
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">Eliminar alumno</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">Esta acción no se puede deshacer</p>
          </div>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-300 mb-6">
          ¿Estás seguro de que deseas eliminar a
          <span class="font-semibold text-gray-900 dark:text-white">{{ deleteTarget?.nombre }}</span>?
        </p>
        <div class="flex items-center justify-end gap-3">
          <button @click="closeDeleteModal" class="text-sm font-semibold text-gray-900 dark:text-gray-300 hover:text-gray-500 py-2 px-4 rounded-md transition-colors">
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

    <!-- Modal Editar -->
    <div
      v-if="editModalOpen"
      class="fixed inset-0 z-[999999] flex items-center justify-center p-4"
    >
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeEditModal"></div>
      <div class="relative z-10 w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-6">
        <div class="flex items-center gap-4 mb-4">
          <div class="h-10 w-10 flex-shrink-0 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
            <svg class="h-5 w-5 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
          </div>
          <div>
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">Editar información</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">Actualiza los datos del alumno</p>
          </div>
        </div>
        
        <div v-if="editError" class="mb-4 text-xs font-medium text-red-500 bg-red-50 dark:bg-red-900/10 p-2 rounded-md ring-1 ring-inset ring-red-500/20">
          {{ editError }}
        </div>

        <div class="space-y-4 mb-6">
          <div>
            <label class="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200 mb-1">Nombre Completo</label>
            <input v-model="editForm.nombre" type="text" class="block w-full rounded-md border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-white dark:ring-gray-700 uppercase" />
          </div>
          <div>
            <label class="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200 mb-1">CURP</label>
            <input v-model="editForm.curp" type="text" maxlength="18" class="block w-full rounded-md border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-white dark:ring-gray-700 uppercase" />
          </div>
        </div>

        <div class="flex items-center justify-end gap-3">
          <button @click="closeEditModal" class="text-sm font-semibold text-gray-900 dark:text-gray-300 hover:text-gray-500 py-2 px-4 rounded-md transition-colors">
            Cancelar
          </button>
          <button
            @click="confirmEdit"
            :disabled="editing"
            class="inline-flex items-center gap-2 rounded-md bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-500 transition-colors disabled:opacity-60"
          >
            <svg v-if="editing" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            {{ editing ? "Guardando..." : "Guardar Cambios" }}
          </button>
        </div>
      </div>
    </div>

  </Teleport>

  <!-- ─── Asistente IA modal ─────────────────────────────────────────────────── -->
  <AsistenteIA v-if="showAsistente" @close="showAsistente = false" @imported="fetchAlumnos" />
</template>
