<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import AdminLayout from "../components/layout/AdminLayout.vue";

const router = useRouter();

const roles = [
  "Docente",
  "Directivo",
  "Administrativo",
  "Prefectura",
  "Trabajo Social",
  "Sistemas",
];

const newUser = ref({
  nombre: "",
  correo: "",
  password: "",
  rol: "Docente",
});

const saving = ref(false);
const errorMsg = ref<string | null>(null);
const successMsg = ref<string | null>(null);

const goBack = () => {
  router.push("/usuarios");
};

const saveUser = async () => {
  errorMsg.value = null;
  successMsg.value = null;
  saving.value = true;

  try {
    const res = await fetch("http://localhost:3001/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser.value),
    });

    const json = await res.json();

    if (!res.ok) {
      errorMsg.value = json.message || "Error al guardar el usuario";
      return;
    }

    // Éxito — regresar a la lista
    router.push("/usuarios");
  } catch (e: any) {
    errorMsg.value = "No se pudo conectar con el servidor. Verifica que la API esté corriendo.";
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <admin-layout>
    <div class="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <!-- Header -->
      <div class="mb-6 flex items-center gap-4">
        <button
          @click="goBack"
          class="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </button>
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">
            Agregar Nuevo Usuario
          </h1>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 rounded-xl px-6 py-8">

        <!-- Error mensaje -->
        <div
          v-if="errorMsg"
          class="mb-6 rounded-md bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
        >
          ⚠️ {{ errorMsg }}
        </div>

        <form @submit.prevent="saveUser">
          <div class="space-y-6">
            <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">

              <!-- Nombre -->
              <div class="sm:col-span-6">
                <label
                  for="nombre"
                  class="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200"
                >Nombre Completo</label>
                <div class="mt-2">
                  <input
                    type="text"
                    v-model="newUser.nombre"
                    name="nombre"
                    id="nombre"
                    required
                    class="block w-full rounded-md border-0 py-2.5 text-gray-900 dark:text-white dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm sm:leading-6 px-4"
                    placeholder="Ej. Juan Pérez Garza"
                  />
                </div>
              </div>

              <!-- Correo -->
              <div class="sm:col-span-3">
                <label
                  for="correo"
                  class="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200"
                >Correo Electrónico</label>
                <div class="mt-2">
                  <input
                    type="email"
                    v-model="newUser.correo"
                    name="correo"
                    id="correo"
                    required
                    class="block w-full rounded-md border-0 py-2.5 text-gray-900 dark:text-white dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm sm:leading-6 px-4"
                    placeholder="ejemplo@educloud.com"
                  />
                </div>
              </div>

              <!-- Contraseña -->
              <div class="sm:col-span-3">
                <label
                  for="password"
                  class="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200"
                >Contraseña</label>
                <div class="mt-2">
                  <input
                    type="password"
                    v-model="newUser.password"
                    name="password"
                    id="password"
                    required
                    minlength="6"
                    class="block w-full rounded-md border-0 py-2.5 text-gray-900 dark:text-white dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm sm:leading-6 px-4"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <!-- Rol -->
              <div class="sm:col-span-6">
                <label
                  for="rol"
                  class="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200"
                >Rol Asignado</label>
                <div class="mt-2 relative">
                  <select
                    id="rol"
                    v-model="newUser.rol"
                    name="rol"
                    required
                    class="block w-full rounded-md border-0 py-2.5 text-gray-900 dark:text-white dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm sm:leading-6 px-4 appearance-none"
                  >
                    <option v-for="r in roles" :key="r" :value="r">{{ r }}</option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- Footer con botones -->
          <div class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-x-4">
            <button
              @click="goBack"
              type="button"
              class="text-sm font-semibold leading-6 text-gray-900 dark:text-gray-300 hover:text-gray-500 py-2 px-4 rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="saving || !newUser.nombre || !newUser.correo || !newUser.password"
              class="inline-flex items-center gap-2 rounded-md bg-brand-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <svg
                v-if="saving"
                class="animate-spin h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              {{ saving ? "Guardando..." : "Guardar Usuario" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </admin-layout>
</template>
