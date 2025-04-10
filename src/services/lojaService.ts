import { supabase } from '../lib/supabaseClient';
import { Loja } from '../types/auth';

export interface CriarLojaDTO {
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  email_contato: string;
  telefone: string;
  endereco: string;
  slug: string;
  logo_url?: string;
  tema: {
    corPrimaria: string;
    corSecundaria: string;
    corFundo: string;
    corTexto: string;
    corDestaque: string;
  };
}

export const lojaService = {
  // Listar todas as lojas
  listarLojas: async (): Promise<Loja[]> => {
    try {
      const { data, error } = await supabase
        .from('lojas')
        .select('*')
        .order('criado_em', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Erro ao listar lojas:', error);
      throw new Error('Falha ao listar lojas: ' + (error.message || 'Erro desconhecido'));
    }
  },
  
  // Buscar loja por ID
  buscarLojaPorId: async (id: string): Promise<Loja | null> => {
    const { data, error } = await supabase
      .from('lojas')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Erro ao buscar loja:', error);
      throw new Error('Falha ao buscar loja');
    }
    
    return data;
  },
  
  // Buscar loja por CNPJ
  buscarLojaPorCNPJ: async (cnpj: string): Promise<Loja | null> => {
    const { data, error } = await supabase
      .from('lojas')
      .select('*')
      .eq('cnpj', cnpj)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 é o código para "não encontrado"
      console.error('Erro ao buscar loja por CNPJ:', error);
      throw new Error('Falha ao buscar loja por CNPJ');
    }
    
    return data;
  },
  
  // Buscar loja por slug
  buscarLojaPorSlug: async (slug: string): Promise<Loja | null> => {
    const { data, error } = await supabase
      .from('lojas')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar loja por slug:', error);
      throw new Error('Falha ao buscar loja por slug');
    }
    
    return data;
  },
  
  // Criar uma nova loja
  criarLoja: async (loja: CriarLojaDTO): Promise<Loja> => {
    // Verificar se já existe uma loja com o mesmo CNPJ
    const lojaExistente = await lojaService.buscarLojaPorCNPJ(loja.cnpj);
    if (lojaExistente) {
      throw new Error('Já existe uma loja cadastrada com este CNPJ');
    }
    
    // Verificar se já existe uma loja com o mesmo slug
    const slugExistente = await lojaService.buscarLojaPorSlug(loja.slug);
    if (slugExistente) {
      throw new Error('Este slug já está em uso. Por favor, escolha outro');
    }
    
    // Inserir a nova loja
    const { error } = await supabase
      .from('lojas')
      .insert([{ ...loja, status: 'pendente' }]);
    
    if (error) {
      console.error('Erro ao criar loja:', error);
      throw new Error('Falha ao criar loja');
    }
    
    // Buscar a loja recém-criada para retornar com o ID
    const novaLoja = await lojaService.buscarLojaPorCNPJ(loja.cnpj);
    if (!novaLoja) {
      throw new Error('Erro ao recuperar a loja após criação');
    }
    
    return novaLoja;
  },
  
  // Atualizar uma loja existente
  atualizarLoja: async (id: string, loja: Partial<CriarLojaDTO>): Promise<Loja> => {
    // Se estiver atualizando o CNPJ, verificar se já existe
    if (loja.cnpj) {
      const lojaExistente = await lojaService.buscarLojaPorCNPJ(loja.cnpj);
      if (lojaExistente && lojaExistente.id !== id) {
        throw new Error('Já existe uma loja cadastrada com este CNPJ');
      }
    }
    
    // Se estiver atualizando o slug, verificar se já existe
    if (loja.slug) {
      const slugExistente = await lojaService.buscarLojaPorSlug(loja.slug);
      if (slugExistente && slugExistente.id !== id) {
        throw new Error('Este slug já está em uso. Por favor, escolha outro');
      }
    }
    
    // Atualizar a loja
    const { error } = await supabase
      .from('lojas')
      .update(loja)
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao atualizar loja:', error);
      throw new Error('Falha ao atualizar loja');
    }
    
    // Buscar a loja atualizada
    const lojaAtualizada = await lojaService.buscarLojaPorId(id);
    if (!lojaAtualizada) {
      throw new Error('Erro ao recuperar a loja após atualização');
    }
    
    return lojaAtualizada;
  },
  
  // Alterar o status de uma loja
  alterarStatusLoja: async (id: string, status: 'pendente' | 'ativo' | 'bloqueado'): Promise<void> => {
    const { error } = await supabase
      .from('lojas')
      .update({ status })
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao alterar status da loja:', error);
      throw new Error('Falha ao alterar status da loja');
    }
  },
  
  // Upload de logo da loja
  uploadLogo: async (id: string, file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${id}-logo.${fileExt}`;
    const filePath = `logos/${fileName}`;
    
    const { error } = await supabase.storage
      .from('florify')
      .upload(filePath, file, { upsert: true });
    
    if (error) {
      console.error('Erro ao fazer upload da logo:', error);
      throw new Error('Falha ao fazer upload da logo');
    }
    
    // Obter a URL pública da logo
    const { data } = supabase.storage
      .from('florify')
      .getPublicUrl(filePath);
    
    // Atualizar a loja com a URL da logo
    await lojaService.atualizarLoja(id, { 
      logo_url: data.publicUrl 
    } as any);
    
    return data.publicUrl;
  }
};
