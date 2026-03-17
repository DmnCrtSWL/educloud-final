<script setup lang="ts">
import { ref, computed } from "vue";

const emit = defineEmits<{
  (e: "close"): void;
  (e: "imported"): void;
}>();

// ─── File types ───────────────────────────────────────────────────────────────
const ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.csv," +
  "image/jpeg,image/jpg,image/png,image/heic,image/heif,image/webp," +
  "application/pdf,application/msword," +
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document," +
  "application/vnd.ms-excel," +
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

// ─── State ────────────────────────────────────────────────────────────────────
type Step = "idle" | "processing" | "done" | "error";

const step = ref<Step>("idle");
const isDragging = ref(false);
const files = ref<File[]>([]);
const fileInput = ref<HTMLInputElement | null>(null);

// Resultados
interface AlumnoResult {
  id: string;
  nombre: string;
  curp: string;
}
interface Omitido {
  nombre?: string;
  curp?: string;
  razon: string;
}
const insertados = ref<AlumnoResult[]>([]);
const omitidos = ref<Omitido[]>([]);
const notaIA = ref<string | null>(null);
const errorMsg = ref<string | null>(null);

// Progress messages
const progressMessages = [
  "Leyendo los archivos...",
  "Analizando el contenido con IA...",
  "Extrayendo nombres y CURPs...",
  "Insertando alumnos en la base de datos...",
];
const progressIndex = ref(0);
let progressInterval: ReturnType<typeof setInterval> | null = null;

// ─── Computed ─────────────────────────────────────────────────────────────────
const hasFiles = computed(() => files.value.length > 0);

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getFileIcon = (file: File) => {
  const name = file.name.toLowerCase();
  if (file.type.startsWith("image/")) return "🖼️";
  if (name.endsWith(".pdf")) return "📄";
  if (name.endsWith(".doc") || name.endsWith(".docx")) return "📝";
  if (name.endsWith(".xls") || name.endsWith(".xlsx")) return "📊";
  if (name.endsWith(".csv")) return "📋";
  return "📁";
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ─── File handlers ────────────────────────────────────────────────────────────
const addFiles = (newFiles: FileList | null) => {
  if (!newFiles) return;
  Array.from(newFiles).forEach((f) => {
    if (!files.value.some((x) => x.name === f.name && x.size === f.size)) {
      files.value.push(f);
    }
  });
};

const handleDrop = (e: DragEvent) => {
  isDragging.value = false;
  addFiles(e.dataTransfer?.files ?? null);
};

const handleFileInput = (e: Event) => {
  addFiles((e.target as HTMLInputElement).files);
};

const removeFile = (index: number) => {
  files.value.splice(index, 1);
};

// ─── Process ──────────────────────────────────────────────────────────────────
const processWithAI = async () => {
  if (!hasFiles.value) return;

  step.value = "processing";
  progressIndex.value = 0;
  progressInterval = setInterval(() => {
    if (progressIndex.value < progressMessages.length - 1) {
      progressIndex.value++;
    }
  }, 2000);

  try {
    const formData = new FormData();
    files.value.forEach((f) => formData.append("files", f));

    const res = await fetch("http://localhost:3001/api/alumnos/import-ai", {
      method: "POST",
      body: formData,
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Error en el servidor");

    insertados.value = json.insertados || [];
    omitidos.value = json.omitidos || [];
    notaIA.value = json.nota || null;
    step.value = "done";

    if (insertados.value.length > 0) {
      emit("imported");
    }
  } catch (err: unknown) {
    errorMsg.value =
      err instanceof Error ? err.message : "No se pudo conectar con el servidor";
    step.value = "error";
  } finally {
    if (progressInterval) clearInterval(progressInterval);
  }
};

const handleClose = () => {
  emit("close");
};
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[999999] flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/60 backdrop-blur-sm"
        @click="step === 'processing' ? null : handleClose()"
      />

      <!-- Modal -->
      <div class="relative z-10 w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">

        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div class="flex items-center gap-3">
            <div class="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-sm">
              <svg class="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
                <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
                <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
                <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
              </svg>
            </div>
            <div>
              <h2 class="text-base font-semibold text-gray-900 dark:text-white">Asistente IA</h2>
              <p class="text-xs text-gray-500 dark:text-gray-400">Importa listas de alumnos automáticamente</p>
            </div>
          </div>
          <button
            v-if="step !== 'processing'"
            @click="handleClose"
            class="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- ═══════════ ESTADO: IDLE ═══════════ -->
        <div v-if="step === 'idle'" class="p-6">
          <!-- Drop zone -->
          <div
            class="relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer"
            :class="isDragging
              ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/10 scale-[1.01]'
              : 'border-gray-300 dark:border-gray-700 hover:border-brand-400 dark:hover:border-brand-500 bg-gray-50 dark:bg-gray-800/50'"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
            @click="fileInput?.click()"
          >
            <div class="flex flex-col items-center justify-center py-10 px-6 text-center select-none">
              <div
                class="h-14 w-14 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-200"
                :class="isDragging ? 'bg-brand-100 dark:bg-brand-900/30 scale-110' : 'bg-gray-100 dark:bg-gray-800'"
              >
                <svg class="h-7 w-7 transition-colors" :class="isDragging ? 'text-brand-500' : 'text-gray-400'" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"/>
                </svg>
              </div>
              <p class="text-sm font-semibold text-gray-700 dark:text-gray-200">
                {{ isDragging ? "Suelta el archivo aquí" : "Arrastra tu archivo aquí" }}
              </p>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                o <span class="text-brand-500 font-medium underline underline-offset-2">selecciona desde tu dispositivo</span>
              </p>
              <p class="mt-3 text-xs text-gray-400 dark:text-gray-500">
                PDF · Word · Excel · CSV · JPG · PNG · HEIC · WebP
              </p>
            </div>
            <input ref="fileInput" type="file" :accept="ACCEPT" capture="environment" multiple class="sr-only" @change="handleFileInput"/>
          </div>

          <!-- Lista de archivos -->
          <div v-if="hasFiles" class="mt-4 space-y-2">
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Archivos ({{ files.length }})
            </p>
            <div v-for="(file, i) in files" :key="i" class="flex items-center gap-3 rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2.5 group">
              <span class="text-xl leading-none select-none">{{ getFileIcon(file) }}</span>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ file.name }}</p>
                <p class="text-xs text-gray-400">{{ formatSize(file.size) }}</p>
              </div>
              <button @click.stop="removeFile(i)" class="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded transition-all" title="Quitar">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
          <p v-else class="mt-4 text-xs text-center text-gray-400 dark:text-gray-500">
            La IA extraerá nombres y CURPs automáticamente.
          </p>

          <!-- Footer idle -->
          <div class="mt-6 flex items-center justify-end gap-3">
            <button @click="handleClose" class="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-500 py-2 px-4 rounded-md transition-colors">
              Cancelar
            </button>
            <button
              @click="processWithAI"
              :disabled="!hasFiles"
              class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:from-brand-600 hover:to-brand-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
              </svg>
              Procesar con IA
            </button>
          </div>
        </div>

        <!-- ═══════════ ESTADO: PROCESSING ═══════════ -->
        <div v-else-if="step === 'processing'" class="p-10 flex flex-col items-center justify-center text-center">
          <div class="relative mb-6">
            <div class="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg">
              <svg class="animate-spin h-8 w-8 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            </div>
            <!-- Pulso animated -->
            <div class="absolute inset-0 rounded-2xl animate-ping bg-brand-400 opacity-20"/>
          </div>
          <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-1">Procesando con GPT-4o</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 transition-all duration-500">
            {{ progressMessages[progressIndex] }}
          </p>
          <div class="mt-4 flex gap-1.5">
            <span v-for="(_, i) in progressMessages" :key="i"
              class="h-1.5 w-6 rounded-full transition-all duration-300"
              :class="i <= progressIndex ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'"
            />
          </div>
        </div>

        <!-- ═══════════ ESTADO: ERROR ═══════════ -->
        <div v-else-if="step === 'error'" class="p-6">
          <div class="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-5 text-center mb-6">
            <div class="text-3xl mb-2">❌</div>
            <p class="text-sm font-semibold text-red-700 dark:text-red-400">Error al procesar</p>
            <p class="text-xs text-red-600 dark:text-red-500 mt-1">{{ errorMsg }}</p>
          </div>
          <div class="flex justify-end gap-3">
            <button @click="handleClose" class="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-500 py-2 px-4 rounded-md">Cerrar</button>
            <button @click="step = 'idle'" class="rounded-xl bg-brand-500 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors">Reintentar</button>
          </div>
        </div>

        <!-- ═══════════ ESTADO: DONE ═══════════ -->
        <div v-else-if="step === 'done'" class="p-6">
          <!-- Resumen -->
          <div class="flex items-center gap-4 mb-5">
            <div class="h-12 w-12 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
              <svg class="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
              </svg>
            </div>
            <div>
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">¡Importación completada!</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                <span class="font-medium text-green-600 dark:text-green-400">{{ insertados.length }} insertados</span>
                <span v-if="omitidos.length > 0"> · <span class="font-medium text-amber-600 dark:text-amber-400">{{ omitidos.length }} omitidos</span></span>
              </p>
            </div>
          </div>

          <!-- Nota de la IA -->
          <div v-if="notaIA" class="mb-4 rounded-lg bg-brand-50 dark:bg-brand-900/10 border border-brand-200 dark:border-brand-800/30 px-3 py-2 text-xs text-brand-700 dark:text-brand-400">
            💬 {{ notaIA }}
          </div>

          <!-- Lista insertados -->
          <div v-if="insertados.length > 0" class="mb-3">
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Alumnos registrados</p>
            <div class="max-h-44 overflow-y-auto space-y-1.5 pr-1">
              <div v-for="a in insertados" :key="a.id" class="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/10 px-3 py-2">
                <svg class="h-3.5 w-3.5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                </svg>
                <span class="text-sm font-medium text-gray-900 dark:text-white flex-1 truncate">{{ a.nombre }}</span>
                <span class="text-xs font-mono text-gray-400">{{ a.id }}</span>
              </div>
            </div>
          </div>

          <!-- Lista omitidos -->
          <div v-if="omitidos.length > 0" class="mb-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Omitidos</p>
            <div class="max-h-28 overflow-y-auto space-y-1.5 pr-1">
              <div v-for="(o, i) in omitidos" :key="i" class="rounded-lg bg-amber-50 dark:bg-amber-900/10 px-3 py-2">
                <p class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ o.nombre || "Sin nombre" }}</p>
                <p class="text-xs text-amber-600 dark:text-amber-400">{{ o.razon }}</p>
              </div>
            </div>
          </div>

          <div class="flex justify-end">
            <button
              @click="handleClose"
              class="rounded-xl bg-brand-500 px-6 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  </Teleport>
</template>
