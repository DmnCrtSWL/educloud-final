require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4173'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// ─── Routes ─────────────────────────────────────────────────────────────────
const usersRouter = require('./routes/users');
const alumnosRouter = require('./routes/alumnos');
const importAiRouter = require('./routes/import-ai');
const gruposRouter = require('./routes/grupos');
const evaluacionesRouter = require('./routes/evaluaciones');
app.use('/api/usuarios', usersRouter);
app.use('/api/alumnos', alumnosRouter);
app.use('/api/alumnos', importAiRouter);
app.use('/api/grupos', gruposRouter);
app.use('/api/evaluaciones', evaluacionesRouter);


// ─── Health check ────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'EduCloud API funcionando correctamente' });
});

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ ok: false, message: `Ruta no encontrada: ${req.method} ${req.path}` });
});

// ─── Error handler ───────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ ok: false, message: 'Error interno del servidor' });
});

// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ EduCloud API iniciada en http://localhost:${PORT}`);
});
