import { Router } from 'express';
import { calcularOrcamentoController, healthController } from '../controllers/orcamentoController.js';

export const createRoutes = () => {
  const router = Router();

  /**
   * @swagger
   * /health:
   *   get:
   *     tags:
   *       - Saúde
   *     summary: Verificar saúde da API
   *     description: Verifica se a API está funcionando corretamente
   *     responses:
   *       200:
   *         description: API está funcionando
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/HealthResponse'
   *             example:
   *               status: OK
   *               mensagem: API de Cálculo de Orçamento Arquitetônico está funcionando
   *               timestamp: 2024-01-15T10:30:00.000Z
   */
  router.get('/health', healthController);

  /**
   * @swagger
   * /orcamentos/calcular:
   *   post:
   *     tags:
   *       - Orçamentos
   *     summary: Calcular orçamento de projeto arquitetônico
   *     description: Calcula o valor de um projeto com base em diferentes métodos de cobrança e adicionais
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CalcularOrcamentoRequest'
   *           examples:
   *             exemplo_simples_m2:
   *               value:
   *                 cliente: Maria Santos
   *                 nomeProjeto: Cozinha Integrada
   *                 tipoCobranca: m2
   *                 area: 50
   *                 valorM2: 200
   *                 horasTrabalho: 0
   *                 valorHora: 0
   *                 nivelDetalhamento: medio
   *                 renders:
   *                   quantidade: 0
   *                   valorUnitario: 0
   *                 moveisModulados: 0
   *                 paginacaoPisos: 0
   *                 acompanhamentoObra:
   *                   visita: 0
   *                   pacote: 0
   *                 prazoEntrega: 15 dias
   *             exemplo_completo:
   *               value:
   *                 cliente: Ana Lima
   *                 nomeProjeto: Projeto Residencial Completo
   *                 tipoCobranca: ambos
   *                 area: 120
   *                 valorM2: 150
   *                 horasTrabalho: 40
   *                 valorHora: 120
   *                 nivelDetalhamento: alto
   *                 renders:
   *                   quantidade: 5
   *                   valorUnitario: 800
   *                 moveisModulados: 4500
   *                 paginacaoPisos: 30000
   *                 acompanhamentoObra:
   *                   visita: 0
   *                   pacote: 2000
   *                 prazoEntrega: 90 dias
   *     responses:
   *       200:
   *         description: Orçamento calculado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/CalcularOrcamentoResponse'
   *             examples:
   *               exemplo_simples:
   *                 value:
   *                   cliente: Maria Santos
   *                   projeto: Cozinha Integrada
   *                   valorBase: 10000
   *                   adicionais:
   *                     render: 0
   *                     moveisModulados: 0
   *                     paginacaoPisos: 0
   *                   valorFinal: 10000
   *                   acompanhamentoObra: {}
   *                   metodoCalculo: m2
   *               exemplo_completo:
   *                 value:
   *                   cliente: Ana Lima
   *                   projeto: Projeto Residencial Completo
   *                   valorBase: 22800
   *                   adicionais:
   *                     render: 4000
   *                     moveisModulados: 4500
   *                     paginacaoPisos: 30000
   *                   valorFinal: 61300
   *                   acompanhamentoObra:
   *                     pacote: 2000
   *                   metodoCalculo: media_ponderada
   *       400:
   *         description: Erro de validação
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               erro: Validação de entrada falhou
   *               detalhes:
   *                 - campo: area
   *                   mensagem: Área deve ser um valor positivo
   */
  router.post('/orcamentos/calcular', calcularOrcamentoController);

  return router;
};
