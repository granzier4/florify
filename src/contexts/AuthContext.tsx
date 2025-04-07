import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/auth';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
  registerMaster: (nome: string, email: string, senha: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar se o usuário está logado ao carregar a aplicação
    const loadUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        console.error('Erro ao carregar usuário:', err);
        setError('Falha ao carregar usuário');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, senha: string) => {
    setLoading(true);
    setError(null);
    try {
      await authService.login(email, senha);
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (err: any) {
      console.error('Erro no login:', err);
      setError(err.message || 'Falha no login');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } catch (err: any) {
      console.error('Erro no logout:', err);
      setError(err.message || 'Falha no logout');
    } finally {
      setLoading(false);
    }
  };

  const registerMaster = async (nome: string, email: string, senha: string) => {
    setLoading(true);
    setError(null);
    try {
      const newUser = await authService.registerMaster({ 
        nome, 
        email, 
        senha, 
        confirmarSenha: senha 
      });
      setUser(newUser);
    } catch (err: any) {
      console.error('Erro no registro:', err);
      setError(err.message || 'Falha no registro');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, registerMaster }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
