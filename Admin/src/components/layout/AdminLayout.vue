<template>
  <div class="min-h-screen xl:flex">
    <app-sidebar />
    <Backdrop />
    <div
      class="flex-1 transition-all duration-300 ease-in-out"
      :class="[isExpanded || isHovered ? 'lg:ml-[290px]' : 'lg:ml-[90px]']"
    >
      <app-header />
      <div class="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
        <slot></slot>
      </div>

      <!-- Modal de Selección de Grupo para Docentes -->
      <div
        v-if="showGroupSelectorModal"
        class="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6"
      >
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
        <div class="relative z-10 w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8">
          
          <div class="mb-6 flex flex-col items-center text-center">
            <div class="w-16 h-16 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-full flex items-center justify-center mb-4">
              <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">¡Bienvenido, Docente!</h2>
            <p class="text-gray-500 dark:text-gray-400">
              Para comenzar, por favor selecciona el grupo y materia con el que vas a trabajar.
            </p>
          </div>

          <div class="mt-4">
            <select
              v-model="selectedCombinedId"
              class="block w-full rounded-xl border-0 py-3 pl-4 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-brand-600 sm:text-lg sm:leading-6 dark:bg-gray-800 dark:text-white dark:ring-gray-700 font-medium cursor-pointer"
            >
              <option value="" disabled>Seleccionar grupo y materia...</option>
              <option
                v-for="opt in combinedOptions"
                :key="opt.id"
                :value="opt.id"
              >
                {{ opt.label }}
              </option>
            </select>
          </div>

          <div class="mt-8 flex justify-center">
            <button
              @click="confirmGroupSelection"
              :disabled="!selectedMateria"
              class="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-500 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Comenzar a trabajar
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import AppSidebar from "./AppSidebar.vue";
import AppHeader from "./AppHeader.vue";
import Backdrop from "./Backdrop.vue";
import { useSidebar } from "@/composables/useSidebar";
import { useAuth } from "@/composables/useAuth";
import { useGroupState } from "@/composables/useGroupState";
import { ref, watch } from "vue";

const { isExpanded, isHovered } = useSidebar();
const { isDocente, currentUser } = useAuth();
const { assignedGroups, selectedGroupId, selectedMateriaId, selectedMateria, hasConfirmedGroup } = useGroupState();

const selectedCombinedId = ref("");

const combinedOptions = computed(() => {
  const optionsMap = new Map();
  for (const g of assignedGroups.value) {
    if (g.materias && g.materias.length > 0) {
      for (const m of g.materias) {
        if (m.docente_id === currentUser.value?.id) {
           const label = `${g.grado}ro ${g.grupo} - ${m.nombre}`;
           if (!optionsMap.has(label)) {
             optionsMap.set(label, {
               id: `${g.id}|${m.id}`,
               groupId: g.id,
               materiaId: m.id,
               label
             });
           }
        }
      }
    } else if (g.materia) {
        if (!g.docente_id || g.docente_id === currentUser.value?.id) {
             const label = `${g.grado}ro ${g.grupo} - ${g.materia}`;
             if (!optionsMap.has(label)) {
               optionsMap.set(label, {
                 id: `${g.id}|legacy`,
                 groupId: g.id,
                 materiaId: 'legacy',
                 label
               });
             }
        }
    }
  }
  return Array.from(optionsMap.values());
});

watch(selectedCombinedId, (val) => {
  if (!val) return;
  const opt = combinedOptions.value.find(o => o.id === val);
  if (opt) {
    selectedGroupId.value = opt.groupId;
    selectedMateriaId.value = opt.materiaId;
  }
});

const showGroupSelectorModal = computed(() => {
  return isDocente.value && !hasConfirmedGroup.value;
});

const confirmGroupSelection = () => {
  if (selectedMateria.value) {
    hasConfirmedGroup.value = true;
  }
};
</script>
