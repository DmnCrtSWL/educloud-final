<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import AdminLayout from "../components/layout/AdminLayout.vue";

const router = useRouter();

const roles = [
  "Dirección",
  "Administrativo",
  "Docente",
  "Prefectura",
  "Trabajo Social",
  "Sistemas",
];
const newUser = ref({
  name: "",
  email: "",
  password: "",
  role: "Docente",
});

const goBack = () => {
  router.push("/usuarios");
};

const saveUser = () => {
  // Aquí iría la lógica de guardar en el backend o en el estado global
  console.log("Guardando usuario:", newUser.value);
  // Redirigir de vuelta a la lista de usuarios
  router.push("/usuarios");
};
</script>

<template>
  <admin-layout>
    <div class="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <div class="mb-6 flex items-center gap-4">
        <button
          @click="goBack"
          class="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">
            Agregar Nuevo Usuario
          </h1>
        </div>
      </div>

      <div
        class="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 rounded-xl px-6 py-8"
      >
        <form @submit.prevent="saveUser">
          <div class="space-y-6">
            <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <!-- Name -->
              <div class="sm:col-span-6">
                <label
                  for="name"
                  class="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200"
                  >Nombre Completo</label
                >
                <div class="mt-2">
                  <input
                    type="text"
                    v-model="newUser.name"
                    name="name"
                    id="name"
                    required
                    class="block w-full rounded-md border-0 py-2.5 text-gray-900 dark:text-white dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm sm:leading-6 px-4"
                    placeholder="Ej. Juan Pérez Garza"
                  />
                </div>
              </div>

              <!-- Email -->
              <div class="sm:col-span-3">
                <label
                  for="email"
                  class="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200"
                  >Correo Electrónico</label
                >
                <div class="mt-2">
                  <input
                    type="email"
                    v-model="newUser.email"
                    name="email"
                    id="email"
                    required
                    class="block w-full rounded-md border-0 py-2.5 text-gray-900 dark:text-white dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm sm:leading-6 px-4"
                    placeholder="ejemplo@educloud.com"
                  />
                </div>
              </div>

              <!-- Password -->
              <div class="sm:col-span-3">
                <label
                  for="password"
                  class="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200"
                  >Contraseña</label
                >
                <div class="mt-2">
                  <input
                    type="password"
                    v-model="newUser.password"
                    name="password"
                    id="password"
                    required
                    class="block w-full rounded-md border-0 py-2.5 text-gray-900 dark:text-white dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm sm:leading-6 px-4"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <!-- Role -->
              <div class="sm:col-span-6">
                <label
                  for="role"
                  class="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200"
                  >Rol Asignado</label
                >
                <div class="mt-2 relative">
                  <select
                    id="role"
                    v-model="newUser.role"
                    name="role"
                    required
                    class="block w-full rounded-md border-0 py-2.5 text-gray-900 dark:text-white dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm sm:leading-6 px-4 appearance-none"
                  >
                    <option v-for="r in roles" :key="r" :value="r">
                      {{ r }}
                    </option>
                  </select>
                  <div
                    class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500"
                  >
                    <svg
                      class="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="m19.5 8.25-7.5 7.5-7.5-7.5"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-x-4"
          >
            <button
              @click="goBack"
              type="button"
              class="text-sm font-semibold leading-6 text-gray-900 dark:text-gray-300 hover:text-gray-500 py-2 px-4 rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="rounded-md bg-brand-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 transition-colors"
              :disabled="!newUser.name || !newUser.email || !newUser.password"
            >
              Guardar Usuario
            </button>
          </div>
        </form>
      </div>
    </div>
  </admin-layout>
</template>
