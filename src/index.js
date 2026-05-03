import { createApp } from './config/app.js';
import { createRoutes } from './routes/index.js';
import { errorHandler } from './config/errorHandler.js';

const PORT = process.env.PORT || 3000;

const app = createApp();
const routes = createRoutes();

// Registrar rotas
app.use('/', routes);

// Registrar middleware de erro DEPOIS das rotas
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`✓ Servidor iniciado na porta ${PORT}`);
  console.log(`✓ URL: http://localhost:${PORT}`);
  console.log(`✓ Health check: GET http://localhost:${PORT}/health`);
  console.log(`✓ Calcular orçamento: POST http://localhost:${PORT}/orcamentos/calcular`);
});

export default server;
