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

---

**Este documento consolida o escopo técnico e funcional do MVP da plataforma Florify, permitindo o início imediato do desenvolvimento frontend e integração com Supabase.**
