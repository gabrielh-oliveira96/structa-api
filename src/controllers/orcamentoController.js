import { validarOrcamento } from '../validators/orcamentoValidator.js';
import { calcularOrcamento } from '../services/orcamentoService.js';

/**
 * Controller para calcular orçamento
 * Recebe os dados, valida e calcula o orçamento
 */
export const calcularOrcamentoController = async (req, res, next) => {
  try {
    // Validar dados de entrada
    const dadosValidados = validarOrcamento(req.body);

    // Calcular orçamento
    const resultado = calcularOrcamento(dadosValidados);

    // Retornar resposta
    res.status(200).json(resultado);
  } catch (erro) {
    next(erro);
  }
};

/**
 * Controller para verificar saúde da API
 */
export const healthController = (req, res) => {
  res.status(200).json({
    status: 'OK',
    mensagem: 'API de Cálculo de Orçamento Arquitetônico está funcionando',
    timestamp: new Date().toISOString()
  });
};
