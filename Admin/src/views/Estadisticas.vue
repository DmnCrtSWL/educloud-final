<template>
  <admin-layout>
    <div
      class="flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 min-h-[400px]"
    >
      <div class="text-gray-400 dark:text-gray-500 mb-4">
        <svg
          class="w-16 h-16 mx-auto"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          ></path>
        </svg>
      </div>
      <h2 class="text-xl font-medium text-gray-700 dark:text-gray-300">
        Esperando datos...
      </h2>
    </div>
  </admin-layout>
</template>

<script>
import AdminLayout from "../components/layout/AdminLayout.vue";
export default {
  components: { AdminLayout },
  name: "Estadisticas",
};
</script>
