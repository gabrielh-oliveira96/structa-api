/**
 * Service de Cálculo de Orçamento
 * Implementa todas as regras de negócio para cálculo de orçamentos arquitetônicos
 */

/**
 * Calcula o valor base de acordo com o tipo de cobrança
 * @param {Object} dados - Dados do orçamento
 * @returns {Object} Objeto com valorBase e metodoCalculo
 */
const calcularValorBase = (dados) => {
  const { tipoCobranca, area, valorM2, horasTrabalho, valorHora, nivelDetalhamento } = dados;

  if (tipoCobranca === 'm2') {
    return {
      valorBase: area * valorM2,
      metodoCalculo: 'm2'
    };
  }

  if (tipoCobranca === 'hora') {
    return {
      valorBase: horasTrabalho * valorHora,
      metodoCalculo: 'hora'
    };
  }

  // tipoCobranca === 'ambos'
  const valorM2Total = area * valorM2;
  const valorHoraTotal = horasTrabalho * valorHora;

  // Definir pesos baseado no nível de detalhamento
  let pesoM2, pesoHora;
  
  switch (nivelDetalhamento) {
    case 'baixo':
      pesoM2 = 0.7;
      pesoHora = 0.3;
      break;
    case 'medio':
      pesoM2 = 0.5;
      pesoHora = 0.5;
      break;
    case 'alto':
      pesoM2 = 0.3;
      pesoHora = 0.7;
      break;
  }

  const valorBase = (valorM2Total * pesoM2 + valorHoraTotal * pesoHora) / (pesoM2 + pesoHora);

  return {
    valorBase,
    metodoCalculo: 'media_ponderada'
  };
};

/**
 * Calcula o valor de renders
 * Se quantidade = 0 OU valorUnitario = 0 → totalRender = 0
 * Caso contrário → totalRender = quantidade * valorUnitario
 * @param {Object} renders - Dados de renders
 * @returns {number} Valor total de renders
 */
const calcularValorRender = (renders) => {
  if (renders.quantidade === 0 || renders.valorUnitario === 0) {
    return 0;
  }
  return renders.quantidade * renders.valorUnitario;
};

/**
 * Calcula o orçamento completo
 * @param {Object} dados - Dados validados do orçamento
 * @returns {Object} Objeto com todos os valores calculados
 */
export const calcularOrcamento = (dados) => {
  // Calcular valor base
  const { valorBase, metodoCalculo } = calcularValorBase(dados);

  // Calcular adicionais
  const valorRender = calcularValorRender(dados.renders);
  const moveisModulados = dados.moveisModulados > 0 ? dados.moveisModulados : 0;
  const paginacaoPisos = dados.paginacaoPisos > 0 ? dados.paginacaoPisos : 0;

  // Calcular valor final (acompanhamentoObra NÃO entra)
  const adicionaisTotais = valorRender + moveisModulados + paginacaoPisos;
  const valorFinal = valorBase + adicionaisTotais;

  // Preparar resposta de acompanhamento (sem somar ao total)
  const acompanhamentoResponse = {};
  if (dados.acompanhamentoObra.visita > 0) {
    acompanhamentoResponse.visita = Math.round(dados.acompanhamentoObra.visita * 100) / 100;
  }
  if (dados.acompanhamentoObra.pacote > 0) {
    acompanhamentoResponse.pacote = Math.round(dados.acompanhamentoObra.pacote * 100) / 100;
  }

  return {
    cliente: dados.cliente,
    projeto: dados.nomeProjeto,
    valorBase: Math.round(valorBase * 100) / 100,
    adicionais: {
      render: Math.round(valorRender * 100) / 100,
      moveisModulados: Math.round(moveisModulados * 100) / 100,
      paginacaoPisos: Math.round(paginacaoPisos * 100) / 100
    },
    valorFinal: Math.round(valorFinal * 100) / 100,
    acompanhamentoObra: acompanhamentoResponse,
    metodoCalculo
  };
};
