<template>
  <div class="relative" ref="dropdownRef">
    <button
      class="flex items-center text-gray-700 dark:text-gray-400"
      @click.prevent="toggleDropdown"
    >
      <span
        class="mr-3 flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300 font-semibold text-lg"
      >
        FM
      </span>

      <span class="block mr-1 font-medium text-theme-sm"
        >Francisco Mota Pérez</span
      >

      <ChevronDownIcon :class="{ 'rotate-180': dropdownOpen }" />
    </button>

    <!-- Dropdown Start -->
    <div
      v-if="dropdownOpen"
      class="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
    >
      <div>
        <span
          class="block font-medium text-gray-700 text-theme-sm dark:text-gray-400"
        >
          Francisco Mota Pérez
        </span>
        <span
          class="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400"
        >
          francisco_mp@educloud.com
        </span>
      </div>

      <div class="border-t border-gray-200 dark:border-gray-800 mt-4 pt-2">
        <router-link
          to="/signin"
          @click="signOut"
          class="flex items-center gap-3 px-3 py-2 mt-2 font-medium text-red-600 rounded-lg group text-theme-sm hover:bg-red-50 dark:hover:bg-red-900/10 dark:text-red-400"
        >
          <LogoutIcon
            class="text-red-500 group-hover:text-red-600 dark:text-red-400 dark:group-hover:text-red-300"
          />
          Cerrar Sesión
        </router-link>
      </div>
    </div>
    <!-- Dropdown End -->
  </div>
</template>

<script setup>
import { ChevronDownIcon, LogoutIcon } from "@/icons";
import { RouterLink } from "vue-router";
import { ref, onMounted, onUnmounted } from "vue";

const dropdownOpen = ref(false);
const dropdownRef = ref(null);

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value;
};

const closeDropdown = () => {
  dropdownOpen.value = false;
};

const signOut = () => {
  // Implement sign out logic here
  console.log("Signing out...");
  closeDropdown();
};

const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    closeDropdown();
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>
