<template>
  <ThemeProvider>
    <SidebarProvider>
      <!-- Bloquea el render hasta que la sesión esté verificada -->
      <template v-if="authReady">
        <RouterView />
      </template>
      <template v-else>
        <div class="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-[9999]">
          <svg class="animate-spin h-8 w-8 text-brand-500" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
      </template>
    </SidebarProvider>
  </ThemeProvider>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import ThemeProvider from "./components/layout/ThemeProvider.vue";
import SidebarProvider from "./components/layout/SidebarProvider.vue";
import { useAuth } from "./composables/useAuth";

const { checkSession, authReady } = useAuth();

onMounted(async () => {
  // Siempre verificar contra el servidor al cargar la app
  await checkSession();
});
</script>
