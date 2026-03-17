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
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          ></path>
        </svg>
      </div>
      <h2 class="text-xl font-medium text-gray-700 dark:text-gray-300">
        Herramienta en desarrollo
      </h2>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import AdminLayout from "../components/layout/AdminLayout.vue";
</script>
