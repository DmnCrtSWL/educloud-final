<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import AdminLayout from "../components/layout/AdminLayout.vue";

const router = useRouter();

const newStudent = ref({
  nombre: "",
  curp: "",
});

const saving = ref(false);
const errorMsg = ref<string | null>(null);

const goBack = () => router.push("/alumnos");

const saveStudent = async () => {
  errorMsg.value = null;
  saving.value = true;

  try {
    const res = await fetch("http://localhost:3001/api/alumnos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newStudent.value),
    });

    const json = await res.json();
    if (!res.ok) {
      errorMsg.value = json.message || "Error al guardar el alumno";
      return;
    }

    router.push("/alumnos");
  } catch {
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
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Agregar Nuevo Alumno</h1>
      </div>

      <div class="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 rounded-xl px-6 py-8">

        <!-- Error -->
        <div
          v-if="errorMsg"
          class="mb-6 rounded-md bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
        >
          ⚠️ {{ errorMsg }}
        </div>

        <!-- Info: el servidor genera el código -->
        <div class="mb-6 rounded-md bg-brand-50 dark:bg-brand-900/10 p-4 text-sm text-brand-700 dark:text-brand-400 border border-brand-200 dark:border-brand-800/30">
          <p>El código <span class="font-mono font-semibold">EDU-XXX-XXX</span> será generado automáticamente por el sistema al guardar.</p>
        </div>

        <form @submit.prevent="saveStudent">
          <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">

            <!-- Nombre -->
            <div class="sm:col-span-6">
              <label for="nombre" class="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">
                Nombre Completo
                <span class="ml-1 text-xs text-gray-400">(Apellido Paterno Apellido Materno Nombre)</span>
              </label>
              <div class="mt-2">
                <input
                  type="text"
                  v-model="newStudent.nombre"
                  id="nombre"
                  required
                  class="block w-full rounded-md border-0 py-2.5 text-gray-900 dark:text-white dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm px-4"
                  placeholder="Ej. García Pérez Ana"
                />
              </div>
            </div>

            <!-- CURP -->
            <div class="sm:col-span-6">
              <label for="curp" class="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">
                CURP
              </label>
              <div class="mt-2">
                <input
                  type="text"
                  v-model="newStudent.curp"
                  id="curp"
                  required
                  maxlength="18"
                  class="block w-full rounded-md border-0 py-2.5 text-gray-900 dark:text-white dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm px-4 uppercase tracking-widest font-mono"
                  placeholder="Ej. GAPA120514MDFRRN01"
                />
              </div>
              <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">18 caracteres</p>
            </div>

          </div>

          <!-- Footer -->
          <div class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-x-4">
            <button
              type="button"
              @click="goBack"
              class="text-sm font-semibold text-gray-900 dark:text-gray-300 hover:text-gray-500 py-2 px-4 rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="saving || !newStudent.nombre || newStudent.curp.length !== 18"
              class="inline-flex items-center gap-2 rounded-md bg-brand-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <svg v-if="saving" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              {{ saving ? "Guardando..." : "Guardar Alumno" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </admin-layout>
</template>
