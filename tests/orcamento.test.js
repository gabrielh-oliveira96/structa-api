import request from 'supertest';
import { createApp } from '../src/config/app.js';
import { createRoutes } from '../src/routes/index.js';
import { errorHandler } from '../src/config/errorHandler.js';

const app = createApp();
const routes = createRoutes();
app.use('/', routes);
app.use(errorHandler);

/**
 * Factory para criar payloads padrão de orçamento
 * Reduz repetição de código e facilita testes
 */
const criarPayloadPadrao = (sobrescrita = {}) => ({
  cliente: 'Cliente Teste',
  nomeProjeto: 'Projeto Teste',
  tipoCobranca: 'm2',
  area: 100,
  valorM2: 100,
  horasTrabalho: 0,
  valorHora: 0,
  nivelDetalhamento: 'medio',
  renders: {
    quantidade: 0,
    valorUnitario: 0
  },
  moveisModulados: 0,
  paginacaoPisos: 0,
  acompanhamentoObra: {
    visita: 0,
    pacote: 0
  },
  prazoEntrega: '30 dias',
  ...sobrescrita
});

describe('API de Cálculo de Orçamento Arquitetônico', () => {
  
  // ===============================================
  // Testes de Health Check
  // ===============================================
  describe('GET /health', () => {
    it('deve retornar status 200 com mensagem de saúde', async () => {
      const res = await request(app)
        .get('/health')
        .expect(200);

      expect(res.body).toHaveProperty('status', 'OK');
      expect(res.body).toHaveProperty('mensagem');
      expect(res.body).toHaveProperty('timestamp');
    });
  });

  // ===============================================
  // Testes de Cálculo por M² - Sucesso
  // ===============================================
  describe('POST /orcamentos/calcular - Tipo M² (Sucesso)', () => {
    it('deve calcular corretamente com valores simples', async () => {
      const payload = criarPayloadPadrao({
        tipoCobranca: 'm2',
        area: 100,
        valorM2: 150
      });

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(200);

      expect(res.body.cliente).toBe('Cliente Teste');
      expect(res.body.projeto).toBe('Projeto Teste');
      expect(res.body.valorBase).toBe(15000); // 100 * 150
      expect(res.body.metodoCalculo).toBe('m2');
      expect(res.body.valorFinal).toBe(15000);
    });

    it('deve calcular corretamente com valores maiores e realistas', async () => {
      const payload = criarPayloadPadrao({
        cliente: 'Empresa Grande',
        tipoCobranca: 'm2',
        area: 500,
        valorM2: 350
      });

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(200);

      expect(res.body.valorBase).toBe(175000); // 500 * 350
      expect(res.body.metodoCalculo).toBe('m2');
    });

    it('deve calcular com valores decimais (centavos)', async () => {
      const payload = criarPayloadPadrao({
        tipoCobranca: 'm2',
        area: 45.5,
        valorM2: 125.50
      });

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(200);

      const valorEsperado = Math.round(45.5 * 125.50 * 100) / 100;
      expect(res.body.valorBase).toBe(valorEsperado);
    });

    it('deve calcular com area igual a 1', async () => {
      const payload = criarPayloadPadrao({
        tipoCobranca: 'm2',
        area: 1,
        valorM2: 200
      });

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(200);

      expect(res.body.valorBase).toBe(200);
    });

    it('deve calcular com valorM2 igual a 0', async () => {
      const payload = criarPayloadPadrao({
        tipoCobranca: 'm2',
        area: 100,
        valorM2: 0
      });

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(200);

      expect(res.body.valorBase).toBe(0);
    });
  });

  // ===============================================
  // Testes de Cálculo por Hora - Sucesso
  // ===============================================
  describe('POST /orcamentos/calcular - Tipo Hora (Sucesso)', () => {
    it('deve calcular corretamente com valores simples', async () => {
      const payload = criarPayloadPadrao({
        tipoCobranca: 'hora',
        area: 0,
        valorM2: 0,
        horasTrabalho: 40,
        valorHora: 150
      });

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(200);

      expect(res.body.valorBase).toBe(6000); // 40 * 150
      expect(res.body.metodoCalculo).toBe('hora');
      expect(res.body.valorFinal).toBe(6000);
    });

    it('deve calcular com muitas horas', async () => {
      const payload = criarPayloadPadrao({
        tipoCobranca: 'hora',
        horasTrabalho: 200,
        valorHora: 200
      });

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(200);

      expect(res.body.valorBase).toBe(40000); // 200 * 200
    });

    it('deve calcular com horas iguais a 0', async () => {
      const payload = criarPayloadPadrao({
        tipoCobranca: 'hora',
        horasTrabalho: 0,
        valorHora: 150
      });

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(200);

      expect(res.body.valorBase).toBe(0);
    });

    it('deve calcular com horas decimais', async () => {
      const payload = criarPayloadPadrao({
        tipoCobranca: 'hora',
        horasTrabalho: 7.5,
        valorHora: 80
      });

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(200);

      expect(res.body.valorBase).toBe(600); // 7.5 * 80
    });
  });

  // ===============================================
  // Testes de Cálculo Combinado (Média Ponderada) - Sucesso
  // ===============================================
  describe('POST /orcamentos/calcular - Tipo Ambos (Sucesso)', () => {
    it('deve aplicar média ponderada com peso baixo', async () => {
      const payload = criarPayloadPadrao({
        tipoCobranca: 'ambos',
        area: 100,
        valorM2: 100,
        horasTrabalho: 50,
        valorHora: 100,
        nivelDetalhamento: 'baixo'
      });

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(200);

      // (10000 * 0.7 + 5000 * 0.3) / 1 = 8500
      expect(res.body.valorBase).toBe(8500);
      expect(res.body.metodoCalculo).toBe('media_ponderada');
    });

    it('deve aplicar média ponderada com peso médio', async () => {
      const payload = criarPayloadPadrao({
        tipoCobranca: 'ambos',
        area: 100,
        valorM2: 100,
        horasTrabalho: 50,
        valorHora: 100,
        nivelDetalhamento: 'medio'
      });

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(200);

      // (10000 * 0.5 + 5000 * 0.5) / 1 = 7500
      expect(res.body.valorBase).toBe(7500);
      expect(res.body.metodoCalculo).toBe('media_ponderada');
    });

    it('deve aplicar média ponderada com peso alto', async () => {
      const payload = criarPayloadPadrao({
        tipoCobranca: 'ambos',
        area: 100,
        valorM2: 100,
        horasTrabalho: 50,
        valorHora: 100,
        nivelDetalhamento: 'alto'
      });

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(200);

      // (10000 * 0.3 + 5000 * 0.7) / 1 = 6500
      expect(res.body.valorBase).toBe(6500);
      expect(res.body.metodoCalculo).toBe('media_ponderada');
    });

    it('deve calcular média ponderada quando apenas horas têm valor alto', async () => {
      const payload = criarPayloadPadrao({
        tipoCobranca: 'ambos',
        area: 50,
        valorM2: 50,
        horasTrabalho: 100,
        valorHora: 100,
        nivelDetalhamento: 'medio'
      });

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(200);

      // valorM2 = 50 * 50 = 2500
      // valorHora = 100 * 100 = 10000
      // (2500 * 0.5 + 10000 * 0.5) / 1 = 6250
      expect(res.body.valorBase).toBe(6250);
      expect(res.body.metodoCalculo).toBe('media_ponderada');
    });

    it('deve calcular média ponderada quando apenas area tem valor', async () => {
      const payload = criarPayloadPadrao({
        tipoCobranca: 'ambos',
        area: 100,
        valorM2: 100,
        horasTrabalho: 0,
        valorHora: 100,
        nivelDetalhamento: 'medio'
      });

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(200);

      // (10000 * 0.5 + 0 * 0.5) / 1 = 5000
      expect(res.body.valorBase).toBe(5000);
      expect(res.body.metodoCalculo).toBe('media_ponderada');
    });
  });

  // ===============================================
  // Testes de Adicionais
  // ===============================================
  describe('POST /orcamentos/calcular - Adicionais (Sucesso)', () => {
    it('deve calcular renders corretamente quando quantidade e valorUnitario > 0', async () => {
      const payload = criarPayloadPadrao({
        renders: {
          quantidade: 3,
          valorUnitario: 500
        }
      });

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(200);

      expect(res.body.adicionais.render).toBe(1500); // 3 * 500
      expect(res.body.valorFinal).toBe(11500); // 10000 + 1500
    });

    it('deve ignorar renders quando quantidade = 0', async () => {
      const payload = criarPayloadPadrao({
        renders: {
          quantidade: 0,
          valorUnitario: 500
        }
      });

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(200);

      expect(res.body.adicionais.render).toBe(0);
      expect(res.body.valorFinal).toBe(10000);
    });

    it('deve ignorar renders quando valorUnitario = 0', async () => {
      const payload = criarPayloadPadrao({
        renders: {
          quantidade: 5,
          valorUnitario: 0
        }
      });

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(200);

      expect(res.body.adicionais.render).toBe(0);
      expect(res.body.valorFinal).toBe(10000);
    });

    it('deve calcular moveisModulados corretamente quando > 0', async () => {
      const payload = criarPayloadPadrao({
        moveisModulados: 4300
      });

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(200);

      expect(res.body.adicionais.moveisModulados).toBe(4300);
      expect(res.body.valorFinal).toBe(14300);
    });

    it('deve ignorar moveisModulados quando = 0', async () => {
      const payload = criarPayloadPadrao({
        moveisModulados: 0
      });

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(200);

      expect(res.body.adicionais.moveisModulados).toBe(0);
      expect(res.body.valorFinal).toBe(10000);
    });

    it('deve calcular paginacaoPisos corretamente quando > 0', async () => {
      const payload = criarPayloadPadrao({
        paginacaoPisos: 10000
      });

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(200);

      expect(res.body.adicionais.paginacaoPisos).toBe(10000);
      expect(res.body.valorFinal).toBe(20000);
    });

    it('deve ignorar paginacaoPisos quando = 0', async () => {
      const payload = criarPayloadPadrao({
        paginacaoPisos: 0
      });

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(200);

      expect(res.body.adicionais.paginacaoPisos).toBe(0);
      expect(res.body.valorFinal).toBe(10000);
    });

    it('deve incluir visita em acompanhamento quando valor > 0', async () => {
      const payload = criarPayloadPadrao({
        acompanhamentoObra: {
          visita: 500,
          pacote: 0
        }
      });

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(200);

      expect(res.body.acompanhamentoObra.visita).toBe(500);
      expect(res.body.valorFinal).toBe(10000); // NÃO soma acompanhamento
    });

    it('deve incluir pacote em acompanhamento quando valor > 0', async () => {
      const payload = criarPayloadPadrao({
        acompanhamentoObra: {
          visita: 0,
          pacote: 2000
        }
      });

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(200);

      expect(res.body.acompanhamentoObra.pacote).toBe(2000);
      expect(res.body.valorFinal).toBe(10000); // NÃO soma acompanhamento
    });

    it('deve omitir acompanhamento quando valores são 0', async () => {
      const payload = criarPayloadPadrao({
        acompanhamentoObra: {
          visita: 0,
          pacote: 0
        }
      });

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(200);

      expect(Object.keys(res.body.acompanhamentoObra).length).toBe(0);
      expect(res.body.valorFinal).toBe(10000);
    });

    it('deve calcular com todos os adicionais juntos', async () => {
      const payload = criarPayloadPadrao({
        renders: {
          quantidade: 2,
          valorUnitario: 1000
        },
        moveisModulados: 1500,
        paginacaoPisos: 5000,
        acompanhamentoObra: {
          visita: 500,
          pacote: 1000
        }
      });

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(200);

      // 10000 + 2000 (render) + 1500 (móveis) + 5000 (pisos) = 18500
      expect(res.body.adicionais.render).toBe(2000);
      expect(res.body.adicionais.moveisModulados).toBe(1500);
      expect(res.body.adicionais.paginacaoPisos).toBe(5000);
      expect(res.body.acompanhamentoObra.visita).toBe(500);
      expect(res.body.acompanhamentoObra.pacote).toBe(1000);
      expect(res.body.valorFinal).toBe(18500); // NÃO soma acompanhamento
    });
  });

  // ===============================================
  // Testes de Validação - Erros
  // ===============================================
  describe('POST /orcamentos/calcular - Validação de Erros', () => {
    it('deve retornar erro 400 quando área for negativa em m2', async () => {
      const payload = criarPayloadPadrao({
        tipoCobranca: 'm2',
        area: -10,
        valorM2: 100
      });

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(400);

      expect(res.body).toHaveProperty('erro');
      expect(Array.isArray(res.body.detalhes)).toBe(true);
    });

    it('deve retornar erro 400 quando area for zero em m2', async () => {
      const payload = criarPayloadPadrao({
        tipoCobranca: 'm2',
        area: 0,
        valorM2: 100
      });

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(400);

      expect(res.body).toHaveProperty('erro');
    });

    it('deve retornar erro 400 quando horasTrabalho for negativo', async () => {
      const payload = criarPayloadPadrao({
        tipoCobranca: 'hora',
        horasTrabalho: -5,
        valorHora: 100
      });

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(400);

      expect(res.body).toHaveProperty('erro');
    });

    it('deve retornar erro 400 quando valorM2 for negativo', async () => {
      const payload = criarPayloadPadrao({
        tipoCobranca: 'm2',
        area: 100,
        valorM2: -50
      });

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(400);

      expect(res.body).toHaveProperty('erro');
    });

    it('deve retornar erro 400 quando valorHora for negativo', async () => {
      const payload = criarPayloadPadrao({
        tipoCobranca: 'hora',
        horasTrabalho: 40,
        valorHora: -100
      });

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(400);

      expect(res.body).toHaveProperty('erro');
    });

    it('deve retornar erro 400 quando tipoCobranca for inválido', async () => {
      const payload = criarPayloadPadrao({
        tipoCobranca: 'invalido'
      });

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(400);

      expect(res.body).toHaveProperty('erro');
      expect(Array.isArray(res.body.detalhes)).toBe(true);
    });

    it('deve retornar erro 400 quando nivelDetalhamento for inválido', async () => {
      const payload = criarPayloadPadrao({
        nivelDetalhamento: 'super_alto'
      });

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(400);

      expect(res.body).toHaveProperty('erro');
    });

    it('deve retornar erro 400 quando cliente não for informado', async () => {
      const payload = criarPayloadPadrao();
      delete payload.cliente;

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(400);

      expect(res.body).toHaveProperty('erro');
    });

    it('deve retornar erro 400 quando nomeProjeto não for informado', async () => {
      const payload = criarPayloadPadrao();
      delete payload.nomeProjeto;

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(400);

      expect(res.body).toHaveProperty('erro');
    });

    it('deve retornar erro 400 quando prazoEntrega não for informado', async () => {
      const payload = criarPayloadPadrao();
      delete payload.prazoEntrega;

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(400);

      expect(res.body).toHaveProperty('erro');
    });

    it('deve retornar erro 400 quando tipo acompanhamento for inválido', async () => {
      const payload = criarPayloadPadrao({
        acompanhamentoObra: {
          ativo: true,
          tipo: 'mensal',
          valor: 100
        }
      });

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(400);

      expect(res.body).toHaveProperty('erro');
    });

    it('deve retornar erro 400 quando renders quantidade for negativa', async () => {
      const payload = criarPayloadPadrao({
        renders: {
          quantidade: -1,
          valorUnitario: 500
        }
      });

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(400);

      expect(res.body).toHaveProperty('erro');
    });

    it('deve retornar erro 400 quando moveisModulados for negativo', async () => {
      const payload = criarPayloadPadrao({
        moveisModulados: -100
      });

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(400);

      expect(res.body).toHaveProperty('erro');
    });

    it('deve retornar erro 400 quando paginacaoPisos for negativo', async () => {
      const payload = criarPayloadPadrao({
        paginacaoPisos: -50
      });

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(400);

      expect(res.body).toHaveProperty('erro');
    });

    it('deve retornar erro 400 quando acompanhamento visita for negativo', async () => {
      const payload = criarPayloadPadrao({
        acompanhamentoObra: {
          visita: -500,
          pacote: 0
        }
      });

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(400);

      expect(res.body).toHaveProperty('erro');
    });

    it('deve retornar erro 400 quando acompanhamento pacote for negativo', async () => {
      const payload = criarPayloadPadrao({
        acompanhamentoObra: {
          visita: 0,
          pacote: -1000
        }
      });

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(400);

      expect(res.body).toHaveProperty('erro');
    });

    it('deve retornar erro 400 para tipo ambos sem area em m2', async () => {
      const payload = criarPayloadPadrao({
        tipoCobranca: 'ambos',
        area: 0,
        valorM2: 100,
        horasTrabalho: 50,
        valorHora: 100
      });

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(400);

      expect(res.body).toHaveProperty('erro');
    });

    it('deve retornar erro 400 para tipo ambos com ambos valores zero', async () => {
      const payload = criarPayloadPadrao({
        tipoCobranca: 'ambos',
        area: 0,
        valorM2: 100,
        horasTrabalho: 0,
        valorHora: 100
      });

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(400);

      expect(res.body).toHaveProperty('erro');
    });
  });

  // ===============================================
  // Testes de Estrutura da Resposta
  // ===============================================
  describe('POST /orcamentos/calcular - Estrutura da Resposta', () => {
    it('deve retornar todos os campos obrigatórios', async () => {
      const payload = criarPayloadPadrao();

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(200);

      expect(res.body).toHaveProperty('cliente');
      expect(res.body).toHaveProperty('projeto');
      expect(res.body).toHaveProperty('valorBase');
      expect(res.body).toHaveProperty('adicionais');
      expect(res.body).toHaveProperty('valorFinal');
      expect(res.body).toHaveProperty('acompanhamentoObra');
      expect(res.body).toHaveProperty('metodoCalculo');
    });

    it('deve retornar adicionais com todos os subitens', async () => {
      const payload = criarPayloadPadrao({
        renders: {
          quantidade: 1,
          valorUnitario: 100
        },
        moveisModulados: 500,
        paginacaoPisos: 1000
      });

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(200);

      expect(res.body.adicionais).toHaveProperty('render');
      expect(res.body.adicionais).toHaveProperty('moveisModulados');
      expect(res.body.adicionais).toHaveProperty('paginacaoPisos');
    });

    it('deve retornar acompanhamentoObra com visita e pacote', async () => {
      const payload = criarPayloadPadrao({
        acompanhamentoObra: {
          visita: 100,
          pacote: 200
        }
      });

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(200);

      expect(res.body.acompanhamentoObra).toHaveProperty('visita');
      expect(res.body.acompanhamentoObra).toHaveProperty('pacote');
    });

    it('deve retornar valores numéricos válidos', async () => {
      const payload = criarPayloadPadrao({
        area: 100,
        valorM2: 150.75
      });

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(200);

      expect(typeof res.body.valorBase).toBe('number');
      expect(typeof res.body.valorFinal).toBe('number');
      expect(typeof res.body.adicionais.render).toBe('number');
      expect(typeof res.body.adicionais.mobiliario).toBe('number');
      expect(typeof res.body.adicionais.paginacaoPisos).toBe('number');
    });

    it('deve retornar JSON válido e não nulo', async () => {
      const payload = criarPayloadPadrao();

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(200);

      expect(typeof res.body).toBe('object');
      expect(res.body).not.toBeNull();
    });

    it('deve preservar dados do cliente e projeto na resposta', async () => {
      const payload = criarPayloadPadrao({
        cliente: 'João da Silva',
        nomeProjeto: 'Restauração da Vila'
      });

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(200);

      expect(res.body.cliente).toBe('João da Silva');
      expect(res.body.projeto).toBe('Restauração da Vila');
    });
  });

  // ===============================================
  // Testes de Cenários Complexos
  // ===============================================
  describe('POST /orcamentos/calcular - Cenários Complexos', () => {
    it('deve calcular corretamente com valores muito altos', async () => {
      const payload = criarPayloadPadrao({
        tipoCobranca: 'm2',
        area: 5000,
        valorM2: 2000
      });

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(200);

      expect(res.body.valorBase).toBe(10000000); // 5000 * 2000
    });

    it('deve calcular corretamente com valores muito pequenos', async () => {
      const payload = criarPayloadPadrao({
        tipoCobranca: 'm2',
        area: 0.5,
        valorM2: 50
      });

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(200);

      expect(res.body.valorBase).toBe(25); // 0.5 * 50
    });

    it('deve somar adicionais corretamente e refletir no valor final', async () => {
      const payload = criarPayloadPadrao({
        area: 100,
        valorM2: 100,
        renders: {
          ativo: true,
          quantidade: 1,
          valorUnitario: 1000
        },
        mobiliario: {
          ativo: true,
          itens: [{ nome: 'Item', valor: 500 }]
        },
        paginacaoPisos: {
          ativo: true,
          area: 10,
          valorM2: 100
        }
      });

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(200);

      const somaAdicionais = 1000 + 500 + 1000;
      const valorTotal = 10000 + somaAdicionais;
      expect(res.body.valorFinal).toBe(valorTotal);
    });

    it('deve validar tipos corretamente m2, hora e ambos', async () => {
      const tipos = ['m2', 'hora', 'ambos'];
      
      for (const tipo of tipos) {
        const payload = criarPayloadPadrao({
          tipoCobranca: tipo,
          area: tipo === 'hora' ? 0 : 100,
          valorM2: tipo === 'hora' ? 0 : 100,
          horasTrabalho: tipo === 'm2' ? 0 : 40,
          valorHora: tipo === 'm2' ? 0 : 100
        });

        const res = await request(app)
          .post('/orcamentos/calcular')
          .send(payload)
          .expect(200);

        expect(res.body).toHaveProperty('metodoCalculo');
      }
    });

    it('deve validar todos os níveis de detalhamento', async () => {
      const niveis = ['baixo', 'medio', 'alto'];
      
      for (const nivel of niveis) {
        const payload = criarPayloadPadrao({
          tipoCobranca: 'ambos',
          area: 100,
          valorM2: 100,
          horasTrabalho: 50,
          valorHora: 100,
          nivelDetalhamento: nivel
        });

        const res = await request(app)
          .post('/orcamentos/calcular')
          .send(payload)
          .expect(200);

        expect(res.body.metodoCalculo).toBe('media_ponderada');
      }
    });

    it('deve manter precisão com valores decimais em múltiplas operações', async () => {
      const payload = criarPayloadPadrao({
        area: 33.33,
        valorM2: 75.50,
        renders: {
          ativo: true,
          quantidade: 2,
          valorUnitario: 250.75
        }
      });

      const res = await request(app)
        .post('/orcamentos/calcular')
        .send(payload)
        .expect(200);

      expect(res.body.valorBase).toBeGreaterThan(0);
      expect(res.body.adicionais.render).toBeGreaterThan(0);
      expect(res.body.valorFinal).toBeGreaterThan(0);
    });
  });
});
