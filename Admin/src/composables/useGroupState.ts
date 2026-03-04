import { ref, computed } from "vue";

export interface Group {
  id: string;
  grado: number;
  grupo: string;
  materia: string;
  turno: string;
  docenteId: string;
  docenteName: string;
}

// Global state to store the list of groups assigned to the user
const assignedGroups = ref<Group[]>([
  {
    id: "123456",
    grado: 1,
    grupo: "B",
    materia: "Historia",
    turno: "Vespertino",
    docenteId: "1",
    docenteName: "Docente Actual",
  },
  {
    id: "654321",
    grado: 2,
    grupo: "A",
    materia: "Historia General",
    turno: "Matutino",
    docenteId: "1",
    docenteName: "Docente Actual",
  },
]);

// Global state for the currently selected group ID
const selectedGroupId = ref<string | null>(null);

export function useGroupState() {
  const selectedGroup = computed(() => {
    return (
      assignedGroups.value.find((g) => g.id === selectedGroupId.value) || null
    );
  });

  const selectGroup = (id: string) => {
    selectedGroupId.value = id;
  };

  // Set initial group to the first one if none is selected and groups are available
  if (!selectedGroupId.value && assignedGroups.value.length > 0) {
    selectedGroupId.value = assignedGroups.value[0].id;
  }

  return {
    assignedGroups,
    selectedGroupId,
    selectedGroup,
    selectGroup,
  };
}
