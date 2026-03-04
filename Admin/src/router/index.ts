import { createRouter, createWebHistory } from "vue-router";

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
      path: "/grupos/:id/enrolar",
      name: "EnrolarAlumnos",
      component: () => import("../views/EnrolarAlumnos.vue"),
      meta: { title: "Enrolar Alumnos" },
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

router.beforeEach((to, from, next) => {
  document.title = `Vue.js ${to.meta.title} | TailAdmin - Vue.js Tailwind CSS Dashboard Template`;
  next();
});
