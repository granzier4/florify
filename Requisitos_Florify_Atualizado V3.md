# DOCUMENTO DE REQUISITOS DE SOFTWARE – MVP FLORIFY (VERSÃO ATUALIZADA)

## 1. VISÃO GERAL DO SISTEMA
A Florify é uma plataforma SaaS multi-tenant voltada para a comercialização de flores e plantas ornamentais. Seu propósito é permitir que lojistas ofereçam catálogos personalizados baseados na base de produtos da Cooperativa Veiling Holambra (CVH), com possibilidade futura de produtos próprios. A plataforma será construída como MVP com foco em:

- Baixo custo operacional (uso de Supabase e arquitetura serverless)
- Rápida implementação (stack moderna e enxuta)
- Alto controle de segurança (autenticação Supabase Auth + RLS)
- Desenvolvimento incremental com testes contínuos

## 2. OBJETIVOS DO MVP
1. Estrutura multi-tenant com gerenciamento de lojas (tenants)
2. Cadastro e controle de usuários por tipo
3. Importação e controle de versão de produtos da CVH (via CSV)
4. Exibição do catálogo com ativação por loja
5. Associação de clientes a lojas com controle de favoritos
6. Rastreabilidade completa da origem e atualização de produtos

## 3. PAPÉIS DO SISTEMA (ROLES)
### 3.1. master_plataforma
- Criado manualmente inicialmente
- Permissão irrestrita: cria lojas, usuários, importa dados, visualiza tudo

### 3.2. usuario_loja
- Associado a uma loja obrigatoriamente
- Acesso ao catálogo, ativação de produtos e gerenciamento de pedidos

### 3.3. cliente
- Usuário autenticado, criado via `signUp()`
- Vinculado a uma loja no momento do cadastro
- Pode visualizar o catálogo da loja e futuramente realizar pedidos

## 4. FLUXO DE CRIAÇÃO INICIAL (SEM AUTENTICAÇÃO)
### 4.1. Cadastro do `master_plataforma`
- Executado manualmente uma única vez no sistema
- Usa Supabase Auth via `signUp()`

### 4.2. Cadastro de loja
- Executado pelo master_plataforma
- Slug único editável, CNPJ único validado

### 4.3. Cadastro de `usuario_loja`
- Criado via `signUp()` com `tipo = usuario_loja` e `loja_id`

### 4.4. Cadastro de `cliente`
- Criado via `signUp()` com `tipo = cliente` e `loja_id`

## 5. TABELAS PADRÃO DO SISTEMA
### 5.1. `lojas`
- Campos: id (PK), razao_social, nome_fantasia, cnpj, email_contato, telefone, endereco, slug, status, criado_em, logo_url, tema (json)

### 5.2. `usuarios`
- Campos: id (PK), nome, email, tipo, loja_id (obrigatório para usuario_loja e cliente), criado_em

### 5.3. `produtos_cvh`
- Estrutura baseada na tabela real enviada:
  - codbarra (PK)
  - item_code
  - descricao, descricao_curta
  - categoria, grupo, condicao, unidade, peso
  - cpc, epc, upc
  - cor, ncm, foto, status
  - data_atualizacao (timestamp)

> O campo `codbarra` é a chave principal e única para identificação de produtos.

## 6. IMPORTAÇÃO DE PRODUTOS DA CVH
### 6.1. Objetivo
Permitir que o master_plataforma importe arquivos CSV da CVH para atualização da base `produtos_cvh`, com controle de alterações e histórico completo.

### 6.2. Processo resumido
1. Upload do CSV com validação de campos
2. Identificação de produtos:
   - novos (não existem na base)
   - alterados (existem mas com dados diferentes)
   - inalterados (sem mudanças)
3. Visualização dos itens novos/alterados
4. Confirmação e aplicação das mudanças

### 6.3. Campos mínimos exigidos no CSV
- codbarra (chave principal)
- item_code (suporte)
- descricao, categoria, cor
- peso, embalagem

## 7. PADRÕES DE INTERFACE E COMPONENTES
### 7.1. Layout base
- Header fixo, menu lateral, conteúdo principal

### 7.2. Paleta de cores
| Elemento        | Cor       |
|-----------------|-----------|
| Primária        | #2E7D32   |
| Secundária      | #A5D6A7   |
| Neutro fundo    | #F8F9FA   |
| Texto principal | #212121   |
| Destaques       | #FFC107   |

### 7.3. Componentes reutilizáveis
- `<BotaoPrimario />`, `<CampoTexto />`, `<Card />`, `<Tabela />`
- `<MensagemErro />`, `<MensagemSucesso />`

### 7.4. Responsividade
- Mobile first, grid adaptativo, botões full width em telas pequenas

---

**Este documento reflete com fidelidade o estado atual do projeto, respeitando o modelo de dados real, a implementação da lógica de logs, e as práticas de desenvolvimento e UX estabelecidas para o MVP da plataforma Florify.**