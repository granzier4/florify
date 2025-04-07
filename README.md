# Florify

Sistema SaaS multi-tenant para comercialização de flores e plantas ornamentais.

## Visão Geral

Plataforma que permite que lojistas ofereçam catálogos personalizados baseados na base de produtos da Cooperativa Veiling Holambra (CVH).

## Tecnologias

- React
- TypeScript
- Vite
- Supabase
- Material UI
- React Router DOM

## Estrutura do Projeto

```
florify/
├── src/
│   ├── assets/        # Imagens, ícones e recursos estáticos
│   ├── components/    # Componentes reutilizáveis
│   ├── contexts/      # Contextos React (AuthContext, etc.)
│   ├── hooks/         # Hooks personalizados
│   ├── pages/         # Páginas da aplicação
│   ├── services/      # Serviços (Supabase, autenticação, etc.)
│   ├── types/         # Definições de tipos TypeScript
│   └── utils/         # Funções utilitárias
└── ...
```

## Configuração de Desenvolvimento

1. Clone o repositório
   ```bash
   git clone https://github.com/granzier4/florify.git
   cd florify
   ```

2. Instale as dependências
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente
   Crie um arquivo `.env` na raiz do projeto com:
   ```
   VITE_SUPABASE_URL=sua_url_do_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
   VITE_APP_ENV=development
   ```

4. Execute o projeto
   ```bash
   npm run dev
   ```

## Padrões de Desenvolvimento

### Branches
- `main`: Produção
- `develop`: Desenvolvimento
- `feature/*`: Novas funcionalidades
- `hotfix/*`: Correções urgentes
- `release/*`: Preparação de releases

### Commits
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação
- `refactor`: Refatoração
- `test`: Testes
- `chore`: Ajustes gerais

## Contribuição

1. Crie uma branch a partir de `develop`
2. Faça suas alterações
3. Abra um Pull Request para `develop`

## Licença

Este projeto está sob a licença [a definir]
