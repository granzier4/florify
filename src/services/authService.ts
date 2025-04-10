import { supabase } from '../lib/supabaseClient';
import { User, RegisterMasterForm } from '../types/auth';

export const authService = {
  // Verificar se existe um master_plataforma
  async checkMasterExists(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id')
        .eq('tipo', 'master_plataforma')
        .limit(1);
      
      if (error) {
        console.error('Erro ao verificar master:', error);
        // Se houver erro de permissão, assumimos que não existe master ainda
        if (error.code === '42501' || error.message.includes('permission denied')) {
          return false;
        }
        throw error;
      }
      
      return data && data.length > 0;
    } catch (err) {
      console.error('Erro ao verificar master:', err);
      // Em caso de erro, assumimos que não existe master para permitir o cadastro inicial
      return false;
    }
  },
  
  // Registrar um novo master_plataforma
  async registerMaster(formData: RegisterMasterForm): Promise<User> {
    // 1. Criar o usuário no Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.senha,
    });
    
    if (authError || !authData.user) {
      console.error('Erro ao criar usuário:', authError);
      throw authError || new Error('Falha ao criar usuário');
    }
    
    // 2. Inserir na tabela usuarios
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .insert([
        {
          id: authData.user.id,
          nome: formData.nome,
          email: formData.email,
          tipo: 'master_plataforma',
        }
      ])
      .select()
      .single();
    
    if (userError) {
      console.error('Erro ao inserir usuário na tabela:', userError);
      throw userError;
    }
    
    return userData;
  },
  
  // Fazer login
  async login(email: string, senha: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });
    
    if (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    }
    
    return data;
  },
  
  // Obter usuário atual
  async getCurrentUser(): Promise<User | null> {
    const { data: authData } = await supabase.auth.getUser();
    
    if (!authData.user) {
      return null;
    }
    
    const { data } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    return data;
  },
  
  // Logout
  async logout() {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Erro ao fazer logout:', error);
      throw error;
    }
  }
};
