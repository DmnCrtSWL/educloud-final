<template>
  <div class="relative" ref="dropdownRef">
    <button
      class="flex items-center text-gray-700 dark:text-gray-400"
      @click.prevent="toggleDropdown"
    >
      <!-- Avatar con iniciales -->
      <span
        class="mr-3 flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300 font-semibold text-base"
      >
        {{ initials }}
      </span>

      <span class="block mr-1 font-medium text-theme-sm hidden sm:block">{{ displayName }}</span>

      <ChevronDownIcon :class="{ 'rotate-180': dropdownOpen }" />
    </button>

    <!-- Dropdown -->
    <div
      v-if="dropdownOpen"
      class="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark z-50"
    >
      <!-- Info usuario -->
      <div class="px-1 pb-1">
        <span class="block font-semibold text-gray-900 text-theme-sm dark:text-white">
          {{ currentUser?.nombre ?? 'Usuario' }}
        </span>
        <span class="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
          {{ currentUser?.correo }}
        </span>
        <span class="mt-1.5 inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/20 dark:text-brand-300 ring-1 ring-inset ring-brand-600/20">
          {{ currentUser?.rol }}
        </span>
      </div>

      <div class="border-t border-gray-200 dark:border-gray-800 mt-3 pt-2">
        <button
          @click="handleSignOut"
          class="flex w-full items-center gap-3 px-3 py-2 mt-1 font-medium text-red-600 rounded-lg group text-theme-sm hover:bg-red-50 dark:hover:bg-red-900/10 dark:text-red-400 transition-colors"
        >
          <LogoutIcon class="text-red-500 group-hover:text-red-600 dark:text-red-400" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronDownIcon, LogoutIcon } from "@/icons";
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "@/composables/useAuth";

const router = useRouter();
const { currentUser, logout } = useAuth();

const dropdownOpen = ref(false);
const dropdownRef  = ref<HTMLElement | null>(null);

// Iniciales del usuario real
const initials = computed(() => {
  const nombre = currentUser.value?.nombre ?? "";
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
});

const displayName = computed(() => {
  const nombre = currentUser.value?.nombre ?? "Usuario";
  // Mostrar solo los primeros dos nombres/palabras
  return nombre.split(" ").slice(0, 2).join(" ");
});

const toggleDropdown = () => { dropdownOpen.value = !dropdownOpen.value; };
const closeDropdown  = () => { dropdownOpen.value = false; };

const handleSignOut = () => {
  logout();
  closeDropdown();
  router.push("/signin");
};

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    closeDropdown();
  }
};

onMounted(()   => document.addEventListener("click", handleClickOutside));
onUnmounted(() => document.removeEventListener("click", handleClickOutside));
</script>
