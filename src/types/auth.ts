export type UserRole = 'master_plataforma' | 'usuario_loja' | 'cliente';

export interface User {
  id: string;
  nome: string;
  email: string;
  tipo: UserRole;
  loja_id?: string;
  criado_em: string;
}

export interface Loja {
  id: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  email_contato: string;
  telefone: string;
  endereco: string;
  slug: string;
  status: 'pendente' | 'ativo' | 'bloqueado';
  criado_em: string;
  logo_url?: string;
  tema?: {
    corPrimaria?: string;
    corSecundaria?: string;
    corFundo?: string;
    corTexto?: string;
    corDestaque?: string;
  };
}

export interface RegisterMasterForm {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
}

// Produto CVH
export interface ProdutoCvh {
  item_code: string;
  codbarra?: string;
  descricao: string;
  descricao_curta?: string;
  cod_categoria?: string;
  descricao_categoria?: string;
  cod_grupo?: string;
  descricao_grupo?: string;
  data_cadastro?: string;
  ncm?: string;
  class_cond?: string;
  grupo_com?: string;
  grupo_log?: string;
  cst_sp?: string;
  peso?: number;
  cpc?: string;
  epc?: string;
  upc?: string;
  cor?: string;
  foto?: string;
  preco_unitario: number;
  unidade_medida: string;
  embalagem?: string;
  cvh_data_atual?: string;
  importacao_id?: string;
}

// Importação CVH
