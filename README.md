# API de Cálculo de Orçamento Arquitetônico

API REST em Node.js com Express para cálculo de orçamentos de projetos arquitetônicos com múltiplos métodos de cobrança e adicionais.

## Descrição

Esta API permite que arquitetos calculem o valor de projetos com base em diferentes métodos de cobrança (m², horas, ou combinado) e adicionem diversos tipos de serviços como renders, mobiliário, paginação de pisos e acompanhamento de obra.

## Funcionalidades

- ✓ Cálculo de orçamento por m²
- ✓ Cálculo de orçamento por horas
- ✓ Cálculo combinado com média ponderada
- ✓ Adicionais: renders, mobiliário, paginação de pisos
- ✓ Acompanhamento de obra (visita ou completo)
- ✓ Validação robusta com Zod
- ✓ Testes automatizados com Jest e Supertest
- ✓ Endpoint de health check

## Requisitos

- Node.js 18+
- npm

## Instalação

1. Clone o repositório:
```bash
git clone <repositório>
cd api-facilitador-arquitetonico
```

2. Instale as dependências:
```bash
npm install
```

## Como Rodar a Aplicação

### Modo desenvolvimento (com watch):
```bash
npm run dev
```

### Modo produção:
```bash
npm start
```

A API estará disponível em `http://localhost:3000`

## Como Rodar os Testes

### Testes normais:
```bash
npm test
```

### Testes com watch (reexecuta automaticamente):
```bash
npm run test:watch
```

### Cobertura de testes:
```bash
npm run test:coverage
```

## Endpoints

### 1. Health Check
```
GET /health
```

**Resposta (200):**
```json
{
  "status": "OK",
  "mensagem": "API de Cálculo de Orçamento Arquitetônico está funcionando",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 2. Calcular Orçamento
```
POST /orcamentos/calcular
```

**Requisição:**
```json
{
  "cliente": "João Silva",
  "nomeProjeto": "Reforma Apartamento",
  "tipoCobranca": "m2",
  "area": 100,
  "valorM2": 150,
  "horasTrabalho": 0,
  "valorHora": 0,
  "nivelDetalhamento": "medio",
  "renders": {
    "quantidade": 3,
    "valorUnitario": 500
  },
  "moveisModulados": 3500,
  "paginacaoPisos": 10000,
  "acompanhamentoObra": {
    "visita": 500,
    "pacote": 0
  },
  "prazoEntrega": "30 dias"
}
```

**Resposta (200):**
```json
{
  "cliente": "João Silva",
  "projeto": "Reforma Apartamento",
  "valorBase": 15000,
  "adicionais": {
    "render": 1500,
    "moveisModulados": 3500,
    "paginacaoPisos": 10000
  },
  "valorFinal": 30000,
  "acompanhamentoObra": {
    "visita": 500
  },
  "metodoCalculo": "m2"
}
```

**Erro de validação (400):**
```json
{
  "erro": "Validação de entrada falhou",
  "detalhes": [
    {
      "campo": "area",
      "mensagem": "Área deve ser um valor positivo"
    }
  ]
}
```

## Tipos de Cobrança

### 1. m² (Metro Quadrado)
```
valorBase = area × valorM2
```

### 2. Hora
```
valorBase = horasTrabalho × valorHora
```

### 3. Ambos (Média Ponderada)
Usa pesos diferentes baseados no nível de detalhamento:

#### Nível Baixo
```
pesoM2 = 0.7
pesoHora = 0.3
valorBase = (valorM2 × 0.7 + valorHora × 0.3) / (0.7 + 0.3)
```

#### Nível Médio
```
pesoM2 = 0.5
pesoHora = 0.5
valorBase = (valorM2 × 0.5 + valorHora × 0.5) / (0.5 + 0.5)
```

#### Nível Alto
```
pesoM2 = 0.3
pesoHora = 0.7
valorBase = (valorM2 × 0.3 + valorHora × 0.7) / (0.3 + 0.7)
```

## Adicionais

Os adicionais são valores extras que podem ser adicionados ao valor base. O padrão é simples:
**Valor = 0 → Ignorado | Valor > 0 → Considerado no cálculo**

### Renders
```
totalRender = quantidade × valorUnitario
```
- Se `quantidade = 0` OU `valorUnitario = 0` → ignorado (não entra no cálculo)
- Caso contrário → totalRender é adicionado ao valor final

### Móveis Modulados
```
moveisModulados = valor direto (0 = ignorado)
```
- Se `moveisModulados = 0` → ignorado
- Se `moveisModulados > 0` → adicionado ao valor final

### Paginação de Pisos
```
paginacaoPisos = valor direto (0 = ignorado)
```
- Se `paginacaoPisos = 0` → ignorado
- Se `paginacaoPisos > 0` → adicionado ao valor final

### Acompanhamento de Obra
Possui dois campos informativos que **NÃO entram no valor final**:
- `visita`: valor informativo de visitas (0 = omitido da resposta)
- `pacote`: valor informativo de pacote (0 = omitido da resposta)

## Validação

Todos os campos são validados usando Zod:

- **Cliente**: obrigatório, string não vazia
- **Nome do Projeto**: obrigatório, string não vazia
- **Tipo de Cobrança**: obrigatório, enum: "m2" | "hora" | "ambos"
- **Área**: deve ser positiva
- **Valor M²**: deve ser não-negativo
- **Horas de Trabalho**: deve ser não-negativa
- **Valor Hora**: deve ser não-negativo
- **Nível de Detalhamento**: obrigatório, enum: "baixo" | "medio" | "alto"
- **Renders**: objeto com `quantidade`, `valorUnitario` (ambos ≥ 0)
- **Móveis Modulados**: número ≥ 0
- **Paginação de Pisos**: número ≥ 0
- **Acompanhamento de Obra**: objeto com `visita`, `pacote` (ambos ≥ 0)
- **Prazo de Entrega**: obrigatório, string não vazia

## Exemplos de Uso

### Exemplo 1: Orçamento Simples por M²
```bash
curl -X POST http://localhost:3000/orcamentos/calcular \
  -H "Content-Type: application/json" \
  -d '{
    "cliente": "Maria Santos",
    "nomeProjeto": "Cozinha Integrada",
    "tipoCobranca": "m2",
    "area": 50,
    "valorM2": 200,
    "horasTrabalho": 0,
    "valorHora": 0,
    "nivelDetalhamento": "medio",
    "renders": {"quantidade": 0, "valorUnitario": 0},
    "moveisModulados": 0,
    "paginacaoPisos": 0,
    "acompanhamentoObra": {"visita": 0, "pacote": 0},
    "prazoEntrega": "15 dias"
  }'
```

### Exemplo 2: Orçamento por Horas
```bash
curl -X POST http://localhost:3000/orcamentos/calcular \
  -H "Content-Type: application/json" \
  -d '{
    "cliente": "Pedro Costa",
    "nomeProjeto": "Design de Interiores",
    "tipoCobranca": "hora",
    "area": 0,
    "valorM2": 0,
    "horasTrabalho": 60,
    "valorHora": 150,
    "nivelDetalhamento": "alto",
    "renders": {"quantidade": 0, "valorUnitario": 0},
    "moveisModulados": 0,
    "paginacaoPisos": 0,
    "acompanhamentoObra": {"visita": 0, "pacote": 0},
    "prazoEntrega": "45 dias"
  }'
```

### Exemplo 3: Orçamento Combinado com Adicionais
```bash
curl -X POST http://localhost:3000/orcamentos/calcular \
  -H "Content-Type: application/json" \
  -d '{
    "cliente": "Ana Lima",
    "nomeProjeto": "Projeto Residencial Completo",
    "tipoCobranca": "ambos",
    "area": 120,
    "valorM2": 150,
    "horasTrabalho": 40,
    "valorHora": 120,
    "nivelDetalhamento": "alto",
    "renders": {"quantidade": 5, "valorUnitario": 800},
    "moveisModulados": 4500,
    "paginacaoPisos": 30000,
    "acompanhamentoObra": {"visita": 0, "pacote": 2000},
    "prazoEntrega": "90 dias"
  }'
```

## Estrutura do Projeto

```
api-facilitador-arquitetonico/
├── src/
│   ├── config/
│   │   └── app.js                 # Configuração da aplicação Express
│   ├── controllers/
│   │   └── orcamentoController.js # Controllers dos endpoints
│   ├── routes/
│   │   └── index.js               # Definição das rotas
│   ├── services/
│   │   └── orcamentoService.js    # Lógica de cálculo
│   ├── validators/
│   │   └── orcamentoValidator.js  # Schemas Zod de validação
│   └── index.js                   # Arquivo de inicialização
├── tests/
│   └── orcamento.test.js          # Testes automatizados
├── package.json                   # Dependências do projeto
├── jest.config.js                 # Configuração do Jest
├── README.md                       # Este arquivo
└── regras-de-negocio.txt          # Detalhes das regras de negócio
```

## Testes

O projeto inclui 40+ testes automatizados cobrindo:

- ✓ Health check
- ✓ Cálculo por m²
- ✓ Cálculo por horas
- ✓ Cálculo combinado (média ponderada com 3 níveis)
- ✓ Adicionais (renders, mobiliário, paginação, acompanhamento)
- ✓ Validação de entrada
- ✓ Estrutura de resposta
- ✓ Casos complexos com múltiplos adicionais

## Tecnologias

- **Express.js**: Framework web
- **Zod**: Validação de dados
- **Jest**: Framework de testes
- **Supertest**: Testes de integração HTTP
- **Node.js**: Runtime JavaScript

## Estrutura de Resposta

Todos os valores monetários são retornados com 2 casas decimais.

```json
{
  "cliente": "string",
  "projeto": "string",
  "valorBase": "number",
  "adicionais": {
    "render": "number",
    "mobiliario": "number",
    "paginacaoPisos": "number"
  },
  "valorFinal": "number",
  "acompanhamentoObra": {
    "tipo": "visita | completo",
    "valor": "number"
  },
  "metodoCalculo": "m2 | hora | media_ponderada"
}
```

## Boas Práticas Implementadas

- ✓ Separação de responsabilidades (routes, controllers, services)
- ✓ Validação robusta de dados de entrada
- ✓ Mensagens de erro claras
- ✓ Tratamento de erros centralizado
- ✓ Código limpo e bem organizado
- ✓ Testes automatizados abrangentes
- ✓ Documentação completa
- ✓ Estrutura profissional e escalável

## Contribuição

Este projeto segue padrões profissionais de desenvolvimento. Para manter a qualidade:

1. Adicione testes para novas funcionalidades
2. Mantenha a estrutura de pastas organizada
3. Siga as convenções de nomeação
4. Valide todos os dados de entrada

## Licença

MIT

## Suporte

Para mais informações, consulte o arquivo `regras-de-negocio.txt`.
