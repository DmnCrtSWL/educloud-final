<template>
  <div v-if="(isDocente || isSistemas || isAdmin) && assignedGroups.length > 0" class="flex flex-wrap items-center gap-3">
    
    <!-- Grado Selector -->
    <div class="relative min-w-[120px]">
      <select
        v-model="localGrado"
        @change="onGradoChange"
        class="block w-full rounded-2xl border-0 py-2 pl-4 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 dark:ring-gray-700/50 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-brand-600 sm:text-sm sm:leading-6 shadow-sm font-medium custom-select"
      >
        <option :value="null" disabled>Grado...</option>
        <option v-for="g in availableGrados" :key="g" :value="g">{{ g }}ro</option>
      </select>
    </div>

    <!-- Grupo Selector -->
    <div class="relative min-w-[120px]">
      <select
        v-model="localGrupo"
        @change="onGrupoChange"
        :disabled="!localGrado"
        class="block w-full rounded-2xl border-0 py-2 pl-4 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 dark:ring-gray-700/50 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-brand-600 sm:text-sm sm:leading-6 shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed custom-select"
      >
        <option :value="null" disabled>Grupo...</option>
        <option v-for="g in availableGrupos" :key="g" :value="g">Grupo {{ g }}</option>
      </select>
    </div>

    <!-- Materia Selector -->
    <div class="relative min-w-[200px] flex-1">
      <select
        v-model="localMateriaId"
        @change="onMateriaChange"
        :disabled="!selectedGroup"
        class="block w-full rounded-2xl border-0 py-2 pl-4 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 dark:ring-gray-700/50 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-brand-600 sm:text-sm sm:leading-6 shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed custom-select"
      >
        <option :value="null" disabled>Selecciona materia...</option>
        <option v-for="m in availableMaterias" :key="m.id" :value="m.id">
          {{ m.nombre }} {{ m.docente_nombre ? `- ${m.docente_nombre}` : '' }}
        </option>
      </select>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useGroupState, type Group } from "@/composables/useGroupState";
import { useAuth } from "@/composables/useAuth";

const { assignedGroups, selectedGroupId, selectedMateriaId, selectedGroup } = useGroupState();
const { isDocente, isSistemas, isAdmin } = useAuth();

const localGrado = ref<number | null>(null);
const localGrupo = ref<string | null>(null);
const localMateriaId = ref<string | null>(null);

const availableGrados = computed(() => {
  const grados = new Set(assignedGroups.value.map(g => g.grado));
  return Array.from(grados).sort((a, b) => a - b);
});

const availableGrupos = computed(() => {
  if (!localGrado.value) return [];
  const grupos = assignedGroups.value.filter(g => g.grado === localGrado.value).map(g => g.grupo);
  return [...new Set(grupos)].sort();
});

const availableMaterias = computed(() => {
  if (!localGrado.value || !localGrupo.value) return [];
  
  // Buscar todas las instancias que coincidan con Grado y Grupo, en caso de que el backend desglose las clases
  const matchingGroups = assignedGroups.value.filter(g => g.grado === localGrado.value && g.grupo === localGrupo.value);
  
  const uniqueMaterias: { id: string; nombre: string; docente_id: string; docente_nombre: string }[] = [];
  const seenKeys = new Set<string>();

  for (const g of matchingGroups) {
    if (g.materias && g.materias.length > 0) {
      for (const m of g.materias) {
        const key = `${m.nombre}-${m.docente_nombre || ''}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          uniqueMaterias.push(m);
        }
      }
    } else if (g.materia) {
      const key = `${g.materia}-${g.docente_id || ''}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        uniqueMaterias.push({ id: g.id, nombre: g.materia, docente_id: g.docente_id || '', docente_nombre: (g as Group & { docente_nombre?: string }).docente_nombre || '' });
      }
    }
  }

  return uniqueMaterias;
});

const onGradoChange = () => {
  localGrupo.value = null;
  localMateriaId.value = null;
  selectedGroupId.value = null;
  selectedMateriaId.value = null;
};

const onGrupoChange = () => {
  localMateriaId.value = null;
  selectedMateriaId.value = null;
  
  const g = assignedGroups.value.find(g => g.grado === localGrado.value && g.grupo === localGrupo.value);
  if (g) {
    selectedGroupId.value = g.id;
  } else {
    selectedGroupId.value = null;
  }
};

const onMateriaChange = () => {
  selectedMateriaId.value = localMateriaId.value;
};

watch(() => selectedGroup.value, (newGroup) => {
  if (newGroup) {
    localGrado.value = newGroup.grado;
    localGrupo.value = newGroup.grupo;
  } else {
    localGrado.value = null;
    localGrupo.value = null;
  }
}, { immediate: true });

watch(() => selectedMateriaId.value, (newId) => {
  localMateriaId.value = newId;
}, { immediate: true });

watch(availableMaterias, (materias) => {
  if (materias.length === 1 && !localMateriaId.value) {
    localMateriaId.value = materias[0].id;
    selectedMateriaId.value = materias[0].id;
  }
}, { immediate: true, deep: true });

// Update global materia ID when local changes programatically (like auto-select)
watch(localMateriaId, (newId) => {
  if (newId !== selectedMateriaId.value) {
    selectedMateriaId.value = newId;
  }
});
</script>

<style scoped>
.custom-select {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1em;
}
</style>
