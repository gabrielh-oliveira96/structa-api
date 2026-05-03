/**
 * Middleware de tratamento de erros
 * Deve ser registrado DEPOIS de todas as rotas
 */
export const errorHandler = (err, req, res, next) => {
  console.error('Erro capturado:', {
    name: err.name,
    message: err.message,
    statusCode: err.statusCode,
    status: err.status
  });
  
  // Erro de validação Zod
  if (err.name === 'ZodError') {
    return res.status(400).json({
      erro: 'Validação de entrada falhou',
      detalhes: err.errors.map(e => ({
        campo: e.path.join('.'),
        mensagem: e.message
      }))
    });
  }

  // Erro do body-parser (JSON inválido)
  if (err.type === 'entity.parse.failed' || err.statusCode === 400) {
    return res.status(400).json({
      erro: 'JSON inválido ou formato incorreto',
      detalhes: err.message
    });
  }

  // Erro genérico
  res.status(500).json({
    erro: 'Erro interno do servidor'
  });
};

