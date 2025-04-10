import { supabase } from '../lib/supabaseClient';

export interface Usuario {
  id: string;
  email: string;
  nome: string;
  telefone?: string;
  tipo: 'master_plataforma' | 'usuario_loja' | 'cliente';
  status: 'ativo' | 'inativo' | 'pendente';
  loja_id?: string;
  criado_em?: string;
  atualizado_em?: string;
}

export interface CriarUsuarioDTO {
  email: string;
  senha: string;
  nome: string;
  telefone?: string;
  tipo: 'master_plataforma' | 'usuario_loja' | 'cliente';
  loja_id?: string;
}

export interface AtualizarUsuarioDTO {
  nome?: string;
  telefone?: string;
  tipo?: 'master_plataforma' | 'usuario_loja' | 'cliente';
  status?: 'ativo' | 'inativo' | 'pendente';
  loja_id?: string;
}

export const usuarioService = {
  // Listar todos os usuários
  listarUsuarios: async (): Promise<Usuario[]> => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('criado_em', { ascending: false });
      
      if (error) throw error;
      return data as Usuario[];
    } catch (error: any) {
      console.error('Erro ao listar usuários:', error);
      throw new Error('Falha ao listar usuários: ' + (error.message || 'Erro desconhecido'));
    }
  },
  
  // Buscar usuário por ID
  buscarUsuarioPorId: async (id: string): Promise<Usuario | null> => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Usuario;
    } catch (error: any) {
      console.error('Erro ao buscar usuário por ID:', error);
      throw new Error('Falha ao buscar usuário por ID: ' + (error.message || 'Erro desconhecido'));
    }
  },
  
  // Buscar usuário por email
  buscarUsuarioPorEmail: async (email: string): Promise<Usuario | null> => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // Usuário não encontrado
          return null;
        }
        throw error;
      }
      
      return data as Usuario;
    } catch (error: any) {
      console.error('Erro ao buscar usuário por email:', error);
      throw new Error('Falha ao buscar usuário por email: ' + (error.message || 'Erro desconhecido'));
    }
  },
  
  // Criar um novo usuário
  criarUsuario: async (usuario: CriarUsuarioDTO): Promise<Usuario> => {
    try {
      // Verificar se já existe um usuário com o mesmo email
      const usuarioExistente = await usuarioService.buscarUsuarioPorEmail(usuario.email);
      if (usuarioExistente) {
        throw new Error('Já existe um usuário cadastrado com este email');
      }
      
      // Verificar regras de negócio para loja_id
      if (usuario.tipo === 'master_plataforma' && usuario.loja_id) {
        throw new Error('Administradores da plataforma não podem estar associados a uma loja');
      }
      
      if ((usuario.tipo === 'usuario_loja' || usuario.tipo === 'cliente') && !usuario.loja_id) {
        throw new Error('Usuários de loja e clientes devem estar associados a uma loja');
      }
      
      // Criar o usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: usuario.email,
        password: usuario.senha,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            nome: usuario.nome,
            tipo: usuario.tipo
          }
        }
      });
      
      if (authError) throw authError;
      if (!authData.user) throw new Error('Falha ao criar usuário na autenticação');
      
      // Inserir o usuário na tabela usuarios
      const { error: dbError } = await supabase
        .from('usuarios')
        .insert([{
          id: authData.user.id,
          email: usuario.email,
          nome: usuario.nome,
          telefone: usuario.telefone,
          tipo: usuario.tipo,
          status: 'pendente', // Usuário começa como pendente até confirmar o email
          loja_id: usuario.loja_id
        }]);
      
      if (dbError) throw dbError;
      
      // Buscar o usuário recém-criado para retornar com todos os dados
      const novoUsuario = await usuarioService.buscarUsuarioPorId(authData.user.id);
      if (!novoUsuario) {
        throw new Error('Erro ao recuperar o usuário após criação');
      }
      
      return novoUsuario;
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      throw new Error('Falha ao criar usuário: ' + (error.message || 'Erro desconhecido'));
    }
  },
  
  // Atualizar um usuário existente
  atualizarUsuario: async (id: string, dados: AtualizarUsuarioDTO): Promise<Usuario> => {
    try {
      // Verificar regras de negócio para loja_id e tipo
      if (dados.tipo === 'master_plataforma' && dados.loja_id) {
        throw new Error('Administradores da plataforma não podem estar associados a uma loja');
      }
      
      if ((dados.tipo === 'usuario_loja' || dados.tipo === 'cliente') && dados.loja_id === null) {
        throw new Error('Usuários de loja e clientes devem estar associados a uma loja');
      }
      
      const { error } = await supabase
        .from('usuarios')
        .update({
          ...dados,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      
      // Buscar o usuário atualizado
      const usuarioAtualizado = await usuarioService.buscarUsuarioPorId(id);
      if (!usuarioAtualizado) {
        throw new Error('Erro ao recuperar o usuário após atualização');
      }
      
      return usuarioAtualizado;
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      throw new Error('Falha ao atualizar usuário: ' + (error.message || 'Erro desconhecido'));
    }
  },
  
  // Alterar o status de um usuário
  alterarStatusUsuario: async (id: string, status: 'ativo' | 'inativo' | 'pendente'): Promise<void> => {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ 
          status,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
    } catch (error: any) {
      console.error('Erro ao alterar status do usuário:', error);
      throw new Error('Falha ao alterar status do usuário: ' + (error.message || 'Erro desconhecido'));
    }
  },
  
  // Associar usuário a uma loja
  associarUsuarioLoja: async (usuarioId: string, lojaId: string): Promise<void> => {
    try {
      // Verificar o tipo do usuário antes de associar
      const usuario = await usuarioService.buscarUsuarioPorId(usuarioId);
      if (!usuario) {
        throw new Error('Usuário não encontrado');
      }
      
      if (usuario.tipo === 'master_plataforma') {
        throw new Error('Administradores da plataforma não podem ser associados a uma loja');
      }
      
      const { error } = await supabase
        .from('usuarios')
        .update({ 
          loja_id: lojaId,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', usuarioId);
      
      if (error) throw error;
    } catch (error: any) {
      console.error('Erro ao associar usuário à loja:', error);
      throw new Error('Falha ao associar usuário à loja: ' + (error.message || 'Erro desconhecido'));
    }
  },
  
  // Desassociar usuário de uma loja
  desassociarUsuarioLoja: async (usuarioId: string): Promise<void> => {
    try {
      // Verificar o tipo do usuário antes de desassociar
      const usuario = await usuarioService.buscarUsuarioPorId(usuarioId);
      if (!usuario) {
        throw new Error('Usuário não encontrado');
      }
      
      if (usuario.tipo !== 'master_plataforma') {
        throw new Error('Apenas administradores da plataforma podem não estar associados a uma loja');
      }
      
      const { error } = await supabase
        .from('usuarios')
        .update({ 
          loja_id: null,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', usuarioId);
      
      if (error) throw error;
    } catch (error: any) {
      console.error('Erro ao desassociar usuário da loja:', error);
      throw new Error('Falha ao desassociar usuário da loja: ' + (error.message || 'Erro desconhecido'));
    }
  },
  
  // Resetar senha do usuário
  resetarSenha: async (email: string): Promise<void> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    } catch (error: any) {
      console.error('Erro ao resetar senha:', error);
      throw new Error('Falha ao enviar email de redefinição de senha: ' + (error.message || 'Erro desconhecido'));
    }
  }
};
