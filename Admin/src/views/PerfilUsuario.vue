<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import AdminLayout from "../components/layout/AdminLayout.vue";

const router = useRouter();
const route = useRoute();
const userId = route.params.id as string;

interface Usuario {
  id: string;
  nombre: string;
  rol: string;
  correo: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

const user = ref<Usuario | null>(null);
const loading = ref(true);
const errorMsg = ref<string | null>(null);

onMounted(async () => {
  try {
    const res = await fetch(`http://localhost:3001/api/usuarios/${userId}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    user.value = json.data;
  } catch (err: unknown) {
    errorMsg.value = (err instanceof Error ? err.message : null) || "No se pudo cargar el usuario";
  } finally {
    loading.value = false;
  }
});

// Iniciales del nombre para el avatar
const initials = computed(() => {
  if (!user.value) return "??";
  return user.value.nombre
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
});

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getRoleStyle = (role: string) => {
  switch (role) {
    case "Directivo":      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
    case "Administrativo": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    case "Docente":        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    case "Prefectura":     return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
    case "Trabajo Social": return "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300";
    case "Sistemas":       return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    default:               return "bg-gray-100 text-gray-800";
  }
};

const getRoleAvatarColor = (role: string) => {
  switch (role) {
    case "Directivo":      return "from-purple-500 to-purple-700";
    case "Administrativo": return "from-blue-500 to-blue-700";
    case "Docente":        return "from-green-500 to-green-700";
    case "Prefectura":     return "from-orange-500 to-orange-700";
    case "Trabajo Social": return "from-teal-500 to-teal-700";
    case "Sistemas":       return "from-red-500 to-red-700";
    default:               return "from-gray-500 to-gray-700";
  }
};
</script>

<template>
  <admin-layout>
    <div class="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">

      <!-- Header -->
      <div class="mb-6 flex items-center gap-4">
        <button
          @click="router.push('/usuarios')"
          class="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </button>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Perfil de Usuario</h1>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-24">
        <svg class="animate-spin h-6 w-6 text-brand-500" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      </div>

      <!-- Error -->
      <div v-else-if="errorMsg" class="rounded-md bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-400">
        ⚠️ {{ errorMsg }}
      </div>

      <!-- Profile card -->
      <div v-else-if="user" class="space-y-6">

        <!-- Top card: avatar + info principal -->
        <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">

          <!-- Banner de color según rol -->
          <div :class="`h-28 bg-gradient-to-r ${getRoleAvatarColor(user.rol)}`"></div>

          <div class="px-6 pb-6">
            <!-- Avatar circular con iniciales -->
            <div class="flex items-end justify-between -mt-12 mb-4">
              <div
                :class="`h-24 w-24 rounded-2xl bg-gradient-to-br ${getRoleAvatarColor(user.rol)} flex items-center justify-center text-white text-3xl font-bold shadow-lg border-4 border-white dark:border-gray-900`"
              >
                {{ initials }}
              </div>
              <router-link
                :to="`/usuarios/${user.id}/editar`"
                class="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500 transition-colors"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
                </svg>
                Editar
              </router-link>
            </div>

            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">{{ user.nombre }}</h2>
            <div class="mt-1 flex items-center gap-3">
              <span
                :class="[
                  'inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ring-gray-500/10',
                  getRoleStyle(user.rol),
                ]"
              >
                {{ user.rol }}
              </span>
              <span class="text-sm font-mono text-gray-400 dark:text-gray-500">{{ user.id }}</span>
            </div>
          </div>
        </div>

        <!-- Info cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <!-- Correo electrónico -->
          <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-5">
            <div class="flex items-center gap-3 mb-3">
              <div class="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <svg class="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
              </div>
              <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Correo</p>
            </div>
            <p class="text-sm font-medium text-gray-900 dark:text-white break-all">{{ user.correo }}</p>
          </div>

          <!-- Rol -->
          <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-5">
            <div class="flex items-center gap-3 mb-3">
              <div class="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                <svg class="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </div>
              <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Rol</p>
            </div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ user.rol }}</p>
          </div>

          <!-- Fecha de creación -->
          <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-5">
            <div class="flex items-center gap-3 mb-3">
              <div class="h-8 w-8 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                <svg class="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
              </div>
              <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Creado el</p>
            </div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ formatDate(user.created_at) }}</p>
          </div>

          <!-- Última actualización -->
          <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-5">
            <div class="flex items-center gap-3 mb-3">
              <div class="h-8 w-8 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                <svg class="h-4 w-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              </div>
              <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Actualizado el</p>
            </div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ formatDate(user.updated_at) }}</p>
          </div>

        </div>

        <!-- Zona de más detalles (por ampliar) -->
        <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <p class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>
            Más detalles del perfil se agregarán próximamente.
          </p>
        </div>

      </div>
    </div>
  </admin-layout>
</template>
