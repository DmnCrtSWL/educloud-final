import { createRouter, createWebHistory } from "vue-router";
import { watch } from "vue";
import { useAuth } from "../composables/useAuth";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { left: 0, top: 0 };
  },
  routes: [
    {
      path: "/estadisticas",
      name: "Estadísticas",
      component: () => import("../views/Estadisticas.vue"),
      meta: { title: "Estadísticas" },
    },
    {
      path: "/agenda",
      name: "Agenda",
      component: () => import("../views/Agenda.vue"),
      meta: { title: "Agenda" },
    },
    {
      path: "/planeaciones",
      name: "Planeaciones",
      component: () => import("../views/Planeaciones.vue"),
      meta: { title: "Planeaciones" },
    },
    {
      path: "/usuarios",
      name: "Usuarios",
      component: () => import("../views/Usuarios.vue"),
      meta: { title: "Usuarios" },
    },
    {
      path: "/usuarios/nuevo",
      name: "NuevoUsuario",
      component: () => import("../views/NuevoUsuario.vue"),
      meta: { title: "Agregar Usuario" },
    },
    {
      path: "/usuarios/:id/perfil",
      name: "PerfilUsuario",
      component: () => import("../views/PerfilUsuario.vue"),
      meta: { title: "Perfil de Usuario" },
      props: true,
    },
    {
      path: "/usuarios/:id/editar",
      name: "EditarUsuario",
      component: () => import("../views/EditarUsuario.vue"),
      meta: { title: "Editar Usuario" },
      props: true,
    },
    {
      path: "/grupos",
      name: "Grupos",
      component: () => import("../views/Grupos.vue"),
      meta: { title: "Grupos" },
    },
    {
      path: "/grupos/nuevo",
      name: "NuevoGrupo",
      component: () => import("../views/NuevoGrupo.vue"),
      meta: { title: "Agregar Grupo" },
    },
    {
      path: "/alumnos",
      name: "Alumnos",
      component: () => import("../views/Alumnos.vue"),
      meta: { title: "Alumnos" },
    },
    {
      path: "/alumnos/nuevo",
      name: "NuevoAlumno",
      component: () => import("../views/NuevoAlumno.vue"),
      meta: { title: "Agregar Alumno" },
    },
    {
      path: "/alumnos/:id/perfil",
      name: "PerfilAlumno",
      component: () => import("../views/PerfilAlumno.vue"),
      meta: { title: "Perfil del Alumno" },
      props: true,
    },
    {
      path: "/alumnos/:id/editar",
      name: "EditarAlumno",
      component: () => import("../views/EditarAlumno.vue"),
      meta: { title: "Editar Alumno" },
      props: true,
    },
    {
      path: "/grupos/:id/enrolar",
      name: "EnrolarAlumnos",
      component: () => import("../views/EnrolarAlumnos.vue"),
      meta: { title: "Enrolar Alumnos" },
      props: true,
    },
    {
      path: "/grupos/:id/alumnos",
      name: "AlumnosGrupo",
      component: () => import("../views/AlumnosGrupo.vue"),
      meta: { title: "Alumnos del Grupo" },
      props: true,
    },
    {
      path: "/grupos/:id/detalle",
      name: "DetalleGrupo",
      component: () => import("../views/DetalleGrupo.vue"),
      meta: { title: "Detalle del Grupo" },
      props: true,
    },
    {
      path: "/asistencia",
      name: "Asistencia",
      component: () => import("../views/Asistencia.vue"),
      meta: { title: "Asistencia y Participación" },
    },
    {
      path: "/tareas/nueva",
      name: "NuevaTarea",
      component: () => import("../views/NuevaTarea.vue"),
      meta: { title: "Nuevo Registro (Evaluación)" },
    },
    {
      path: "/tareas",
      name: "Tareas",
      component: () => import("../views/Tareas.vue"),
      meta: { title: "Evaluación Continua" },
    },
    {
      path: "/trabajos/:id",
      name: "DetalleTrabajo",
      component: () => import("../views/DetalleTrabajo.vue"),
      meta: { title: "Evaluación de Trabajo" },
      props: true,
    },
    {
      path: "/evaluaciones/:id/editar",
      name: "EditarEvaluacion",
      component: () => import("../views/EditarEvaluacion.vue"),
      meta: { title: "Editar Evaluación" },
      props: true,
    },
    {
      path: "/evaluaciones",
      name: "Evaluaciones",
      component: () => import("../views/Evaluaciones.vue"),
      meta: { title: "Evaluaciones" },
    },
    {
      path: "/",
      redirect: "/estadisticas",
    },
    {
      path: "/signin",
      name: "Signin",
      component: () => import("../views/Auth/Signin.vue"),
      meta: { title: "Signin" },
    },
    {
      path: "/:pathMatch(.*)*",
      name: "404 Error",
      component: () => import("../views/Errors/FourZeroFour.vue"),
      meta: { title: "404 Error" },
    },
  ],
});

export default router;

// ── Rutas que NO requieren autenticación ──────────────────────────────────────
const PUBLIC_ROUTES = ["/signin", "/signup", "/reset-password"];

router.beforeEach(async (to, _from, next) => {
  // Actualizar título
  document.title = `EduCloud | ${to.meta.title ?? ""}`;

  // Esperar a que la sesión esté verificada antes de decidir
  const { authReady } = useAuth();
  if (!authReady.value) {
    await new Promise<void>((resolve) => {
      const stop = watch(authReady, (ready) => {
        if (ready) { stop(); resolve(); }
      });
    });
  }

  const token = localStorage.getItem("educloud_token");
  const isPublic = PUBLIC_ROUTES.some((r) => to.path.startsWith(r));

  if (!token && !isPublic) {
    // No autenticado → login
    return next("/signin");
  }

  if (token && to.path === "/signin") {
    // Ya autenticado → dashboard
    return next("/estadisticas");
  }

  // Rutas restringidas para Docentes
  const { isDocente } = useAuth();
  if (isDocente.value && (to.path.startsWith("/usuarios") || to.path.startsWith("/grupos"))) {
    return next("/estadisticas");
  }

  next();
});

