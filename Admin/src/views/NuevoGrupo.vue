<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRouter } from "vue-router";
import AdminLayout from "../components/layout/AdminLayout.vue";

const router = useRouter();

// ─── Mexican curriculum 2026: materias por grado (Secundaria – SEP NEM) ──────
const materiasPorGrado: Record<number, string[]> = {
  1: [
    "Lengua Materna (Español)",
    "Matemáticas",
    "Ciencias Naturales y Tecnología",
    "Historia",
    "Geografía",
    "Formación Cívica y Ética",
    "Tecnología",
    "Artes",
    "Educación Física",
    "Lengua Extranjera (Inglés)",
  ],
  2: [
    "Lengua Materna (Español)",
    "Matemáticas",
    "Física",
    "Química",
    "Historia Universal",
    "Formación Cívica y Ética",
    "Tecnología",
    "Artes",
    "Educación Física",
    "Lengua Extranjera (Inglés)",
  ],
  3: [
    "Lengua Materna (Español)",
    "Matemáticas",
    "Física",
    "Química",
    "Biología",
    "Historia de México",
    "Formación Cívica y Ética",
    "Tecnología",
    "Artes",
    "Educación Física",
    "Lengua Extranjera (Inglés)",
  ],
};

const docentes = [
  { id: "1", name: "María Rodríguez M." },
  { id: "2", name: "Juan Torres Luna" },
  { id: "3", name: "Pedro Sánchez Ruiz" },
  { id: "4", name: "Luis Navarro Soto" },
];

const grupoOptions = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
];

const form = ref({
  grado: 1 as number,
  grupo: "A",
  materia: "",
  turno: "Matutino",
  docenteId: "",
});

const materiasDisponibles = computed(
  () => materiasPorGrado[form.value.grado] ?? [],
);

watch(
  () => form.value.grado,
  () => {
    if (!materiasDisponibles.value.includes(form.value.materia)) {
      form.value.materia = "";
    }
  },
);

const formValid = computed(
  () =>
    form.value.grado &&
    form.value.grupo &&
    form.value.materia &&
    form.value.turno &&
    form.value.docenteId,
);

const goBack = () => router.push("/grupos");

const saveGrupo = () => {
  // Aquí iría la lógica de guardar en el backend o estado global
  console.log("Guardando grupo:", form.value);
  // Simulamos un ID de grupo creado
  const newGroupId = `GRP-${Date.now().toString().slice(-4)}`;
  router.push({
    path: `/grupos/${newGroupId}/enrolar`,
    query: { grado: form.value.grado.toString(), grupo: form.value.grupo },
  });
};
</script>

<template>
  <admin-layout>
    <div class="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <!-- Page header -->
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
            Agregar Nuevo Grupo
          </h1>
        </div>
      </div>

      <div
        class="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 rounded-xl px-6 py-8"
      >
        <form @submit.prevent="saveGrupo">
          <div class="space-y-6">
            <!-- Fila 1: Grado · Grupo · Materia -->
            <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-3">
              <!-- Grado -->
              <div>
                <label
                  for="grado"
                  class="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200"
                  >Grado</label
                >
                <div class="mt-2 relative">
                  <select
                    id="grado"
                    v-model.number="form.grado"
                    class="block w-full rounded-md border-0 py-2.5 px-4 text-gray-900 dark:text-white dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm sm:leading-6 appearance-none"
                  >
                    <option :value="1">1ro</option>
                    <option :value="2">2do</option>
                    <option :value="3">3ro</option>
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

              <!-- Grupo -->
              <div>
                <label
                  for="grupo"
                  class="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200"
                  >Grupo</label
                >
                <div class="mt-2 relative">
                  <select
                    id="grupo"
                    v-model="form.grupo"
                    class="block w-full rounded-md border-0 py-2.5 px-4 text-gray-900 dark:text-white dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm sm:leading-6 appearance-none"
                  >
                    <option v-for="g in grupoOptions" :key="g" :value="g">
                      {{ g }}
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

              <!-- Materia -->
              <div>
                <label
                  for="materia"
                  class="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200"
                >
                  Materia
                  <span
                    class="ml-1 text-xs font-normal text-gray-400 dark:text-gray-500"
                    >Plan SEP NEM 2026</span
                  >
                </label>
                <div class="mt-2 relative">
                  <select
                    id="materia"
                    v-model="form.materia"
                    required
                    class="block w-full rounded-md border-0 py-2.5 px-4 text-gray-900 dark:text-white dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm sm:leading-6 appearance-none"
                  >
                    <option value="" disabled>Selecciona una materia…</option>
                    <option
                      v-for="m in materiasDisponibles"
                      :key="m"
                      :value="m"
                    >
                      {{ m }}
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

            <!-- Fila 2: Docente · Turno -->
            <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <!-- Docente asignado -->
              <div>
                <label
                  for="docente"
                  class="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200"
                >
                  Docente Asignado
                  <span
                    class="ml-1 text-xs font-normal text-gray-400 dark:text-gray-500"
                    >rol Docente</span
                  >
                </label>
                <div class="mt-2 relative">
                  <select
                    id="docente"
                    v-model="form.docenteId"
                    required
                    class="block w-full rounded-md border-0 py-2.5 px-4 text-gray-900 dark:text-white dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm sm:leading-6 appearance-none"
                  >
                    <option value="" disabled>Selecciona un docente…</option>
                    <option v-for="d in docentes" :key="d.id" :value="d.id">
                      {{ d.name }}
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

              <!-- Turno -->
              <div>
                <label
                  class="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200"
                  >Turno</label
                >
                <div class="mt-2 flex gap-2">
                  <label
                    v-for="t in ['Matutino', 'Vespertino']"
                    :key="t"
                    :class="[
                      'flex-1 flex items-center justify-center gap-1.5 rounded-md border px-3 py-2.5 cursor-pointer text-sm font-medium transition-colors',
                      form.turno === t
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
                        : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800',
                    ]"
                  >
                    <input
                      type="radio"
                      :value="t"
                      v-model="form.turno"
                      class="sr-only"
                    />
                    <svg
                      v-if="t === 'Matutino'"
                      class="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
                      />
                    </svg>
                    <svg
                      v-else
                      class="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
                      />
                    </svg>
                    {{ t }}
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer actions -->
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
              :disabled="!formValid"
              class="rounded-md bg-brand-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Guardar Grupo
            </button>
          </div>
        </form>
      </div>
    </div>
  </admin-layout>
</template>
