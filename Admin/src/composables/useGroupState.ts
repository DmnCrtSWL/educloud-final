import { ref, computed } from "vue";
import { useAuth } from "./useAuth";

export interface Group {
  id: string;
  grado: number;
  grupo: string;
  materia?: string; // legacy support
  docente_id?: string; // legacy support
  turno: string;
  materias?: { id: string; nombre: string; docente_id: string; docente_nombre: string }[];
}

// Global reactive state
const assignedGroups = ref<Group[]>([]);
const selectedGroupId = ref<string | null>(null);
const selectedMateriaId = ref<string | null>(null);
const hasConfirmedGroup = ref(false);
let fetched = false;

async function fetchGroups(docenteId?: string) {
  try {
    const { authHeaders } = await import("./useAuth");
    const res = await fetch(`http://localhost:3001/api/grupos`, {
      headers: authHeaders(),
    });
    const json = await res.json();
    if (json.ok) {
      if (docenteId) {
        // En caso de docente, solo los suyos
        assignedGroups.value = (json.data as Group[]).filter((g) => {
          if (g.docente_id) return g.docente_id === docenteId; // legacy
          return g.materias && g.materias.some((m) => m.docente_id === docenteId);
        });
      } else {
        // En caso de Admin/Sistemas, todos
        assignedGroups.value = json.data as Group[];
      }
      
      if (!selectedGroupId.value && assignedGroups.value.length > 0) {
        selectedGroupId.value = assignedGroups.value[0].id;
      }
    }
  } catch {
    // ignore
  }
}

export function useGroupState() {
  const { currentUser, isDocente, isSistemas, isAdmin } = useAuth();

  const selectedGroup = computed(() =>
    assignedGroups.value.find((g) => g.id === selectedGroupId.value) ?? null
  );

  const selectedMateria = computed(() => {
    if (!selectedGroupId.value || !selectedMateriaId.value) return null;
    const g = selectedGroup.value;
    if (!g) return null;
    if (g.materias && g.materias.length > 0) {
       return g.materias.find(m => m.id === selectedMateriaId.value) ?? null;
    }
    return g.materia ? { id: 'legacy', nombre: g.materia, docente_id: g.docente_id || '', docente_nombre: '' } : null;
  });

  const selectGroup = (id: string) => {
    selectedGroupId.value = id;
  };

  // Determinar si cargamos y qué cargamos
  if (!fetched && currentUser.value?.id) {
    if (isDocente.value) {
      fetched = true;
      fetchGroups(currentUser.value.id);
    } else if (isSistemas.value || isAdmin.value) {
      fetched = true;
      fetchGroups(); // Sin ID = trae todos
    }
  }
  return {
    assignedGroups,
    selectedGroupId,
    selectedGroup,
    selectedMateriaId,
    selectedMateria,
    hasConfirmedGroup,
    selectGroup,
    refetchGroups: (id?: string) => { fetched = false; fetchGroups(id); },
  };
}
