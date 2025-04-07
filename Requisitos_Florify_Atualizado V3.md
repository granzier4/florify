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
- Verifica se já existe algum usuário com tipo master
- Se não, exibe formulário com: nome, e-mail, senha
- Usa `supabase.auth.signUp()`
- Após sucesso, insere na tabela `usuarios` com `tipo = master_plataforma`, `loja_id = NULL`

### 4.2. Cadastro de loja (tenant)
- Executado pelo master_plataforma
- Campos obrigatórios:
  - Razão social
  - Nome fantasia
  - CNPJ (único)
  - E-mail
  - Telefone
  - Endereço
  - Slug (editável e único)

### 4.3. Cadastro de `usuario_loja`
- Associado obrigatoriamente a uma loja existente
- Campos: nome, e-mail, senha, loja associada
- Criado via `supabase.auth.signUp()`
- Insere na tabela `usuarios` com tipo `usuario_loja`

### 4.4. Cadastro de `cliente`
- Criado via `supabase.auth.signUp()`
- Associado a uma loja
- Campos: nome, e-mail, senha, telefone (opcional), loja associada
- Inserido na tabela `usuarios` com tipo `cliente`

## 5. ESTRUTURA DAS TABELAS PRINCIPAIS
### 5.1. Tabela `usuarios`
| Campo     | Tipo     | Descrição                                    |
|-----------|----------|-----------------------------------------------|
| id        | UUID     | ID do Supabase Auth                          |
| nome      | TEXT     | Nome completo do usuário                     |
| email     | TEXT     | E-mail único                                |
| tipo      | TEXT     | master_plataforma, usuario_loja, cliente     |
| loja_id   | UUID     | Obrigatório para usuario_loja e cliente      |
| criado_em | TIMESTAMP| Padrão: now()                               |

> Restrição: `loja_id` é obrigatório exceto para `master_plataforma`

### 5.2. Tabela `lojas`
| Campo            | Tipo     | Descrição                            |
|------------------|----------|---------------------------------------|
| id               | UUID     | Chave primária                        |
| razao_social     | TEXT     | Nome legal                            |
| nome_fantasia    | TEXT     | Nome comercial                        |
| cnpj             | TEXT     | Único no sistema                      |
| email_contato    | TEXT     | E-mail da loja                        |
| telefone         | TEXT     | Telefone                              |
| endereco         | TEXT     | Endereço completo                     |
| slug             | TEXT     | Editável e único                      |
| status           | TEXT     | pendente / ativo / bloqueado          |
| criado_em        | TIMESTAMP| Criado em                             |
| logo_url         | TEXT     | URL do logotipo                       |
| tema             | JSON     | Paleta de cores (configurável)        |

## 6. CONVENÇÕES DE DESENVOLVIMENTO
- Campos obrigatórios validados no frontend
- Todas requisições assíncronas devem exibir mensagens claras de sucesso ou erro
- Layout base com responsividade mínima (mobile first)
- Nomeação de arquivos e rotas padronizadas por entidade

## 7. PADRÃO DE INTERFACE E COMPONENTES REUTILIZÁVEIS
### 7.1. Layout base
- Header fixo com nome da loja, logout e logo
- Menu lateral (sidebar)
- Conteúdo principal
- Footer opcional

### 7.2. Cores padrão
| Elemento         | Cor        |
|------------------|------------|
| Cor primária     | #2E7D32    |
| Cor secundária   | #A5D6A7    |
| Fundo neutro     | #F8F9FA    |
| Texto principal  | #212121    |
| Destaques        | #FFC107    |

### 7.3. Componentes reutilizáveis
- `<BotaoPrimario />`, `<BotaoSecundario />`, `<BotaoDestaque />`
- `<CampoTexto />` com label e validação integrada
- `<Card />` com sombra, padding e border-radius
- `<Tabela />`, `<MensagemErro />`, `<MensagemSucesso />`

### 7.4. Estrutura de diretórios (React)
| Tipo              | Caminho                          |
|-------------------|----------------------------------|
| Página            | /src/pages/lojas/Cadastrar.tsx   |
| Componente        | /src/components/Button.tsx       |
| Layout global     | /src/layouts/LayoutAdmin.tsx     |
| Estilos globais   | /src/styles/globals.css          |

## 8. VALIDAÇÃO DAS FUNCIONALIDADES
- Campos obrigatórios sinalizados
- Validação de CNPJ, e-mail, slug e senhas
- Bloqueio de envio duplicado com botão desativado
- Exibição de loading e mensagens reativas (toast ou modal)

## 9. IMPORTAÇÃO DE ARQUIVOS CSV – PRODUTOS CVH

### 9.1. Objetivo
Permitir que o `master_plataforma` importe arquivos CSV da Cooperativa Veiling Holambra (CVH) contendo produtos atualizados. A importação deve ser controlada, auditada e validada antes da atualização da base oficial.

### 9.2. Fluxo resumido
1. Usuário master envia arquivo CSV pelo frontend
2. Backend/cliente lê e valida os dados (estrutura, campos obrigatórios)
3. Compara os itens com a base atual:
   - Identifica produtos **novos**
   - Identifica produtos **alterados** (exibe alterações)
   - Ignora produtos **sem alteração**
4. Exibe um resumo com os itens novos/alterados ao usuário
5. Usuário confirma a importação final
6. Os dados são inseridos/atualizados na tabela oficial
7. Um log da operação é salvo para auditoria futura

### 9.3. Tabela principal: `produtos_cvh`
| Campo              | Tipo      | Descrição                                          |
|--------------------|-----------|---------------------------------------------------|
| itemcode           | TEXT      | Código único do produto (chave mestre)           |
| descricao          | TEXT      | Descrição do produto                             |
| categoria          | TEXT      | Categoria (ex: flor, planta, etc.)               |
| cor                | TEXT      | Cor predominante                                 |
| detalhes           | TEXT      | Observações/detalhes adicionais                  |
| preco_unitario     | NUMERIC   | Preço de referência                              |
| unidade_medida     | TEXT      | Tipo de unidade (vaso, cx, etc.)                 |
| embalagem          | TEXT      | Tipo de embalagem                                |
| cvh_data_atual     | DATE      | Data da última atualização desse item na CVH     |
| lastupdatedate     | TIMESTAMP | Data da última atualização deste registro na base|

> **itemcode** é o campo de controle principal. Diferentes descrições podem existir, mas se o código for o mesmo, ele é considerado o mesmo produto.

### 9.4. Tabela auxiliar: `importacoes_cvh`
| Campo             | Tipo      | Descrição                                     |
|-------------------|-----------|-----------------------------------------------|
| id                | UUID      | Identificador da importação                   |
| nome_arquivo      | TEXT      | Nome do arquivo CSV enviado                   |
| total_linhas      | INTEGER   | Quantidade total de registros no arquivo      |
| novos             | INTEGER   | Quantidade de itens novos                     |
| alterados         | INTEGER   | Quantidade de itens alterados                 |
| usuario_id        | UUID      | Quem executou a importação                    |
| data_importacao   | TIMESTAMP | Quando ocorreu                                |
| status            | TEXT      | concluído / pendente / erro                   |
| diff_preview      | JSON      | Pré-visualização de diferenças detectadas     |

### 9.5. Validações obrigatórias
- Todos os campos obrigatórios devem estar presentes
- itemcode duplicado no mesmo arquivo é rejeitado
- Arquivo CSV inválido (estrutura, separador, codificação) deve ser tratado com mensagem clara
- Produtos com alteração devem mostrar visualmente o “antes e depois” por campo

### 9.6. Tratamento de conflitos
- O sistema **não atualiza automaticamente** os dados
- Alterações só são salvas **após confirmação visual do master**
- Histórico completo fica salvo na tabela de importações

### 9.7. Histórico e rastreabilidade
- Toda importação cria um novo log em `importacoes_cvh`
- Arquivo CSV pode ser salvo em Supabase Storage para rastreabilidade
- Cada produto pode ser relacionado com a última importação que o afetou

---

**Este documento consolida o escopo técnico e funcional do MVP da plataforma Florify, permitindo o início imediato do desenvolvimento frontend e integração com Supabase.**
