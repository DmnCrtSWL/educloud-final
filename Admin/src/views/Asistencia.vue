<template>
  <admin-layout>
    <div class="p-4 sm:p-6 lg:p-8" @click="closeDropdowns">
      <!-- Header -->
      <div class="sm:flex sm:items-center sm:justify-between">
        <div class="sm:flex-auto">
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">
            Asistencia y Participación
          </h1>
          <p v-if="selectedGroup" class="mt-1 text-lg text-gray-600 dark:text-gray-400 font-medium">
            {{ selectedGroup.grado }}ro {{ selectedGroup.grupo }} - {{ selectedGroup.materia }}
          </p>
          <p v-else class="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Gestiona la asistencia y participación de los alumnos del grupo seleccionado.
          </p>
        </div>

        <!-- Date Selector for Header when Group Selected -->
        <div v-if="selectedGroup" class="mt-4 sm:ml-16 sm:mt-0 flex flex-col sm:flex-row sm:items-center gap-4">
          <div class="relative w-full sm:w-auto">
            <input
              type="date"
              v-model="currentDate"
              @change="triggerAutoSave"
              class="w-full sm:w-auto pl-4 pr-10 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-gray-900 dark:text-white font-medium text-base sm:text-sm focus:ring-2 focus:ring-brand-600 focus:border-brand-600 transition-colors text-center cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:top-0"
            />
            <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          
          <div class="flex items-center gap-2 text-sm h-10 w-[160px] sm:w-auto justify-start sm:justify-end">
            <template v-if="isSaving">
              <svg class="animate-spin h-4 w-4 text-brand-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span class="text-gray-500 dark:text-gray-400">Guardando cambios...</span>
            </template>
            <template v-else-if="hasSaved">
              <svg class="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span class="text-gray-500 dark:text-gray-400">Cambios guardados</span>
            </template>
          </div>
        </div>
      </div>

      <!-- No Group Selected State -->
      <div
        v-if="!selectedGroup"
        class="mt-8 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700"
      >
        <svg
          class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
        <h3 class="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
          Ningún grupo seleccionado
        </h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Por favor, selecciona un grupo en el menú superior para ver la lista de alumnos.
        </p>
      </div>

      <div v-else>
        <!-- Students Table -->
        <div class="mt-6 flow-root">
          <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8 pb-32">
            <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div
                class="overflow-visible shadow-sm rounded-lg bg-white dark:bg-gray-800 border-x border-t border-gray-200 dark:border-gray-700"
              >
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead class="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th
                        scope="col"
                        class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-200 sm:pl-6"
                      >
                        Estudiante
                      </th>
                      <th
                        scope="col"
                        class="px-3 py-3.5 text-center text-sm font-semibold text-gray-900 dark:text-gray-200 w-24"
                      >
                        Asistencia
                      </th>
                      <th
                        scope="col"
                        class="px-3 py-3.5 text-center text-sm font-semibold text-gray-900 dark:text-gray-200 w-32"
                      >
                        Participación
                      </th>
                      <th
                        scope="col"
                        class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200"
                      >
                        Nota Rápida
                      </th>
                      <th
                        scope="col"
                        class="px-3 py-3.5 text-center text-sm font-semibold text-gray-900 dark:text-gray-200 w-24"
                      >
                        Reacción
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                    <tr
                      v-for="student in sortedStudents"
                      :key="student.id"
                      :class="{ 'opacity-60 bg-gray-50 dark:bg-gray-800/50': !isPresent(student.id) }"
                    >
                      <td class="whitespace-nowrap py-6 lg:py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <div class="flex items-center">
                          <div class="h-12 w-12 lg:h-10 lg:w-10 flex-shrink-0">
                            <div
                              class="h-12 w-12 lg:h-10 lg:w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 font-medium text-lg lg:text-base"
                            >
                              {{ getInitials(student.name) }}
                            </div>
                          </div>
                          <div class="ml-4">
                            <div
                              class="font-medium text-gray-900 dark:text-white text-base lg:text-sm"
                              :class="{ 'line-through text-gray-500': !isPresent(student.id) }"
                            >
                              {{ student.name }}
                            </div>
                            <div class="text-gray-500 dark:text-gray-400 mt-1">
                              {{ student.matricula }}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td class="whitespace-nowrap px-3 py-6 lg:py-4 text-sm text-gray-500 text-center align-middle">
                        <button
                          type="button"
                          @click="toggleAttendance(student.id)"
                          class="relative inline-flex h-8 w-14 lg:h-6 lg:w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-600 mx-auto"
                          :class="isPresent(student.id) ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'"
                          role="switch"
                          :aria-checked="isPresent(student.id)"
                        >
                          <span class="sr-only">Asistencia</span>
                          <span
                            aria-hidden="true"
                            class="pointer-events-none inline-block h-7 w-7 lg:h-5 lg:w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                            :class="isPresent(student.id) ? 'translate-x-6 lg:translate-x-5' : 'translate-x-0'"
                          ></span>
                        </button>
                      </td>
                      <td class="whitespace-nowrap px-3 py-6 lg:py-4 text-sm text-gray-500 text-center">
                        <div class="flex items-center justify-center gap-4 lg:gap-3">
                          <span class="w-8 text-center font-semibold text-xl lg:text-lg text-gray-900 dark:text-white">
                            {{ getParticipationPoints(student.id) }}
                          </span>
                          <button
                            @click="incrementParticipation(student.id)"
                            title="Añadir participación"
                            :disabled="!isPresent(student.id)"
                            :class="[
                              'rounded-full flex items-center justify-center h-10 w-10 lg:h-8 lg:w-8 transition-colors shadow-sm border',
                              isPresent(student.id) 
                                ? 'text-green-600 bg-green-50 hover:bg-green-100 dark:text-green-400 dark:bg-green-900/30 dark:hover:bg-green-900/50 border-green-200 dark:border-green-800' 
                                : 'text-gray-400 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 cursor-not-allowed'
                            ]"
                          >
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td class="whitespace-nowrap px-3 py-6 lg:py-4 text-sm text-gray-500">
                        <input
                          type="text"
                          v-model="notesMap[student.id]"
                          @input="triggerAutoSave"
                          placeholder="Agregar nota..."
                          :disabled="!isPresent(student.id)"
                          class="block w-full min-w-[200px] lg:min-w-[150px] rounded-md border-0 py-2.5 lg:py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-base lg:text-sm sm:leading-6 dark:bg-gray-800 dark:text-white dark:ring-gray-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-900"
                        />
                      </td>
                      <td class="whitespace-nowrap px-3 py-6 lg:py-4 text-sm text-center relative">
                        <button
                          @click.stop="toggleEmojiDropdown(student.id)"
                          :disabled="!isPresent(student.id)"
                          class="h-10 w-10 lg:h-8 lg:w-8 rounded-full inline-flex items-center justify-center text-3xl lg:text-2xl transition-colors mx-auto"
                          :class="isPresent(student.id) ? 'hover:bg-gray-100 dark:hover:bg-gray-700' : 'opacity-50 cursor-not-allowed'"
                        >
                          <span v-if="emojiMap[student.id]">{{ emojiMap[student.id] }}</span>
                          <svg v-else class="w-6 h-6 lg:w-5 lg:h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>

                        <div
                          v-if="activeEmojiDropdown === student.id"
                          class="absolute z-10 right-0 lg:right-1/2 lg:translate-x-1/2 top-full mt-1 w-max rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-700 dark:ring-gray-600 flex gap-1 p-2"
                          @click.stop
                        >
                          <button
                            v-for="emoji in EMOJIS"
                            :key="emoji"
                            @click="selectEmoji(student.id, emoji)"
                            class="h-8 w-8 rounded-full flex items-center justify-center text-xl hover:bg-gray-100 dark:hover:bg-gray-600"
                          >
                            {{ emoji }}
                          </button>
                          <div class="w-px bg-gray-200 dark:bg-gray-600 mx-1"></div>
                          <button
                            @click="selectEmoji(student.id, '')"
                            class="h-8 w-8 rounded-full flex items-center justify-center text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                            title="Quitar"
                          >
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr v-if="sortedStudents.length === 0">
                      <td
                        colspan="5"
                        class="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                      >
                        No hay alumnos enrolados en este grupo.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import AdminLayout from "../components/layout/AdminLayout.vue";
import { useGroupState } from "@/composables/useGroupState";

import { getLocalDateString } from "@/utils/dateUtils";

const { selectedGroup, selectedGroupId } = useGroupState();

const currentDate = ref(getLocalDateString());

// Mocked students data mapping groupId -> students array
const mockStudentsByGroup: Record<string, unknown[]> = {
  "123456": [
    { id: "1", name: "Ana Sofía García", matricula: "ALU-001" },
    { id: "2", name: "Carlos Mendoza", matricula: "ALU-002" },
    { id: "3", name: "Elena Ramírez", matricula: "ALU-003" },
    { id: "4", name: "Javier Hernández", matricula: "ALU-004" },
    { id: "5", name: "Lucía Fernández", matricula: "ALU-005" },
    { id: "6", name: "Miguel Torres", matricula: "ALU-006" },
  ],
  "654321": [
    { id: "7", name: "Alejandro Vargas", matricula: "ALU-007" },
    { id: "8", name: "Beatriz Ruiz", matricula: "ALU-008" },
    { id: "9", name: "Daniel Ortiz", matricula: "ALU-009" },
  ],
};

const currentStudentsInfo = computed(() => {
  if (!selectedGroupId.value) return [];
  // Ensure we are working with an array of objects that have id, name, matricula
  return (mockStudentsByGroup[selectedGroupId.value] || []) as {id: string, name: string, matricula: string}[];
});

// State maps
const attendanceMap = ref<Record<string, boolean>>({}); // true = present, false = absent. Default is true if undefined.
const participationMap = ref<Record<string, number>>({});
const notesMap = ref<Record<string, string>>({});
const emojiMap = ref<Record<string, string>>({});

const activeEmojiDropdown = ref<string | null>(null);
const EMOJIS = ['👍', '👎', '🙂', '😕', '☹️', '🥇', '🚨'];

// Auto-save simulation
const isSaving = ref(false);
const hasSaved = ref(false);
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
let savedStateTimeout: ReturnType<typeof setTimeout> | null = null;

const triggerAutoSave = () => {
  isSaving.value = true;
  hasSaved.value = false;
  
  if (saveTimeout) clearTimeout(saveTimeout);
  if (savedStateTimeout) clearTimeout(savedStateTimeout);
  
  saveTimeout = setTimeout(() => {
    isSaving.value = false;
    hasSaved.value = true;
    
    // Hide "Cambios guardados" after 3 seconds
    savedStateTimeout = setTimeout(() => {
      hasSaved.value = false;
    }, 3000);
  }, 600); // Simulate network request delay
};

const closeDropdowns = () => {
  activeEmojiDropdown.value = null;
};

onMounted(() => {
  document.addEventListener('click', closeDropdowns);
});

onUnmounted(() => {
  document.removeEventListener('click', closeDropdowns);
});

// Reset local state when grouping changes
watch(selectedGroupId, () => {
  attendanceMap.value = {};
  participationMap.value = {};
  notesMap.value = {};
  emojiMap.value = {};
  activeEmojiDropdown.value = null;
});

// Helper for sorting
const getLastName = (name: string) => {
  const parts = name.split(" ");
  // Simple heuristic: get the text starting from the second word,
  // or just return the name if it's a single word (unlikely, but safe)
  return parts.length > 1 ? parts.slice(1).join(" ") : name;
};

// Derived sorted students list
const sortedStudents = computed(() => {
  const students = [...currentStudentsInfo.value];
  
  return students.sort((a, b) => {
    // 1. Sort by Attendance (Absent students go to the bottom)
    const aPresent = isPresent(a.id);
    const bPresent = isPresent(b.id);
    
    if (aPresent && !bPresent) return -1;
    if (!aPresent && bPresent) return 1;
    
    // 2. Sort Alphabetically by Surname
    const aSurname = getLastName(a.name).toLowerCase();
    const bSurname = getLastName(b.name).toLowerCase();
    
    return aSurname.localeCompare(bSurname);
  });
});

// Methods
const getInitials = (name: string) => {
  const parts = name.split(" ");
  return (parts[0][0] + (parts[1] ? parts[1][0] : "")).toUpperCase();
};

const isPresent = (studentId: string) => {
  // If undefined, we default to true (present)
  return attendanceMap.value[studentId] ?? true;
};

const toggleAttendance = (studentId: string) => {
  attendanceMap.value[studentId] = !isPresent(studentId);
  triggerAutoSave();
};

const getParticipationPoints = (studentId: string) => participationMap.value[studentId] || 0;

const incrementParticipation = (studentId: string) => {
  if (!isPresent(studentId)) return; // Prevent adding participation to absentees
  const current = getParticipationPoints(studentId);
  participationMap.value[studentId] = current + 1;
  triggerAutoSave();
};

const toggleEmojiDropdown = (studentId: string) => {
  if (!isPresent(studentId)) return;
  activeEmojiDropdown.value = activeEmojiDropdown.value === studentId ? null : studentId;
};

const selectEmoji = (studentId: string, emoji: string) => {
  if (emoji === '') {
    delete emojiMap.value[studentId];
  } else {
    emojiMap.value[studentId] = emoji;
  }
  triggerAutoSave();
  activeEmojiDropdown.value = null;
};
</script>
