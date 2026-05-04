import { z } from 'zod';

// Schema para Renders
const rendersSchema = z.object({
  quantidade: z.number().nonnegative('Quantidade de renders deve ser não-negativa'),
  valorUnitario: z.number().nonnegative('Valor unitário do render deve ser não-negativo')
}).strict();

// Schema para Acompanhamento de Obra
const acompanhamentoObraSchema = z.object({
  visita: z.number().nonnegative('Valor de visita deve ser não-negativo').default(0),
  pacote: z.number().nonnegative('Valor de pacote deve ser não-negativo').default(0)
}).strict();

// Schema Principal de Orçamento
export const calcularOrcamentoSchema = z.object({
  cliente: z.string().min(1, 'Nome do cliente é obrigatório'),
  nomeProjeto: z.string().min(1, 'Nome do projeto é obrigatório'),
  tipoCobranca: z.enum(['m2', 'hora', 'ambos'], {
    errorMap: () => ({ message: 'Tipo de cobrança deve ser "m2", "hora" ou "ambos"' })
  }),
  area: z.number(),
  valorM2: z.number(),
  horasTrabalho: z.number(),
  valorHora: z.number(),
  nivelDetalhamento: z.enum(['baixo', 'medio', 'alto'], {
    errorMap: () => ({ message: 'Nível de detalhamento deve ser "baixo", "medio" ou "alto"' })
  }),
  renders: rendersSchema,
  moveisModulados: z.number().nonnegative('Móveis modulados deve ser não-negativo'),
  paginacaoPisos: z.number().nonnegative('Paginação de pisos deve ser não-negativa'),
  acompanhamentoObra: acompanhamentoObraSchema,
  prazoEntrega: z.string().min(1, 'Prazo de entrega é obrigatório')
}).strict().superRefine((data, ctx) => {
  // Validações condicionais baseadas em tipoCobranca
  if (data.tipoCobranca === 'm2' || data.tipoCobranca === 'ambos') {
    if (data.area < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: 0,
        type: 'number',
        inclusive: true,
        path: ['area'],
        message: 'Área deve ser não-negativa'
      });
    }
    if (data.valorM2 < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: 0,
        type: 'number',
        inclusive: true,
        path: ['valorM2'],
        message: 'Valor m² deve ser não-negativo'
      });
    }
  }

  if (data.tipoCobranca === 'hora' || data.tipoCobranca === 'ambos') {
    if (data.horasTrabalho < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: 0,
        type: 'number',
        inclusive: true,
        path: ['horasTrabalho'],
        message: 'Horas de trabalho deve ser não-negativa'
      });
    }
    if (data.valorHora < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: 0,
        type: 'number',
        inclusive: true,
        path: ['valorHora'],
        message: 'Valor hora deve ser não-negativo'
      });
    }
  }

  // Para tipo ambos, pelo menos um dos valores deve ser positivo
  if (data.tipoCobranca === 'ambos' && data.area === 0 && data.horasTrabalho === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['tipoCobranca'],
      message: 'Para tipo "ambos", pelo menos área ou horas de trabalho deve ser positivo'
    });
  }
});

export const validarOrcamento = (dados) => {
  const resultado = calcularOrcamentoSchema.safeParse(dados);
  
  if (!resultado.success) {
    const erro = new Error('Validação falhou');
    erro.name = 'ZodError';
    erro.errors = resultado.error.errors;
    throw erro;
  }

  return resultado.data;
};
