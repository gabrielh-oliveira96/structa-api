import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Cálculo de Orçamento Arquitetônico',
      version: '1.0.0',
      description: 'API REST em Node.js com Express para cálculo de orçamentos de projetos arquitetônicos com múltiplos métodos de cobrança e adicionais.',
      contact: {
        name: 'Suporte',
        email: 'suporte@exemplo.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de Desenvolvimento'
      }
    ],
    components: {
      schemas: {
        Render: {
          type: 'object',
          properties: {
            quantidade: {
              type: 'integer',
              description: 'Quantidade de renders (0 = ignorado)'
            },
            valorUnitario: {
              type: 'number',
              description: 'Valor unitário de cada render (0 = ignorado)'
            }
          },
          required: ['quantidade', 'valorUnitario']
        },
        AcompanhamentoObra: {
          type: 'object',
          properties: {
            visita: {
              type: 'number',
              description: 'Valor de visita (0 = não considerar)'
            },
            pacote: {
              type: 'number',
              description: 'Valor de pacote (0 = não considerar)'
            }
          }
        },
        CalcularOrcamentoRequest: {
          type: 'object',
          properties: {
            cliente: {
              type: 'string',
              description: 'Nome do cliente'
            },
            nomeProjeto: {
              type: 'string',
              description: 'Nome do projeto'
            },
            tipoCobranca: {
              type: 'string',
              enum: ['m2', 'hora', 'ambos'],
              description: 'Tipo de cobrança'
            },
            area: {
              type: 'number',
              description: 'Área do projeto em m²'
            },
            valorM2: {
              type: 'number',
              description: 'Valor por metro quadrado'
            },
            horasTrabalho: {
              type: 'number',
              description: 'Horas de trabalho'
            },
            valorHora: {
              type: 'number',
              description: 'Valor por hora'
            },
            nivelDetalhamento: {
              type: 'string',
              enum: ['baixo', 'medio', 'alto'],
              description: 'Nível de detalhamento do projeto'
            },
            renders: {
              $ref: '#/components/schemas/Render'
            },
            moveisModulados: {
              type: 'number',
              description: 'Valor de móveis modulados (0 = ignorado)'
            },
            paginacaoPisos: {
              type: 'number',
              description: 'Valor de paginação de pisos (0 = ignorado)'
            },
            acompanhamentoObra: {
              $ref: '#/components/schemas/AcompanhamentoObra'
            },
            prazoEntrega: {
              type: 'string',
              description: 'Prazo de entrega'
            }
          },
          required: [
            'cliente',
            'nomeProjeto',
            'tipoCobranca',
            'area',
            'valorM2',
            'horasTrabalho',
            'valorHora',
            'nivelDetalhamento',
            'renders',
            'moveisModulados',
            'paginacaoPisos',
            'acompanhamentoObra',
            'prazoEntrega'
          ]
        },
        Adicionais: {
          type: 'object',
          properties: {
            render: {
              type: 'number',
              description: 'Valor total de renders'
            },
            moveisModulados: {
              type: 'number',
              description: 'Valor de móveis modulados'
            },
            paginacaoPisos: {
              type: 'number',
              description: 'Valor de paginação de pisos'
            }
          }
        },
        AcompanhamentoObraResponse: {
          type: 'object',
          description: 'Acompanhamento de obra (não entra no valor final). Omitido se ambos valores são 0.',
          properties: {
            visita: {
              type: 'number'
            },
            pacote: {
              type: 'number'
            }
          }
        },
        CalcularOrcamentoResponse: {
          type: 'object',
          properties: {
            cliente: {
              type: 'string'
            },
            projeto: {
              type: 'string'
            },
            valorBase: {
              type: 'number'
            },
            adicionais: {
              $ref: '#/components/schemas/Adicionais'
            },
            valorFinal: {
              type: 'number'
            },
            acompanhamentoObra: {
              $ref: '#/components/schemas/AcompanhamentoObraResponse'
            },
            metodoCalculo: {
              type: 'string',
              enum: ['m2', 'hora', 'media_ponderada']
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            erro: {
              type: 'string'
            },
            detalhes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  campo: {
                    type: 'string'
                  },
                  mensagem: {
                    type: 'string'
                  }
                }
              }
            }
          }
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string'
            },
            mensagem: {
              type: 'string'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/index.js']
};

export const swaggerSpec = swaggerJsdoc(options);
