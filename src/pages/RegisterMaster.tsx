import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  CircularProgress,
  Alert
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';

const RegisterMaster = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingMaster, setCheckingMaster] = useState(true);
  const [masterExists, setMasterExists] = useState(false);
  
  const { registerMaster } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    const checkMaster = async () => {
      try {
        const exists = await authService.checkMasterExists();
        setMasterExists(exists);
        if (exists) {
          // Se já existe um master, redireciona para login
          navigate('/login');
        }
      } catch (err) {
        console.error('Erro ao verificar master:', err);
        setError('Falha ao verificar se existe um administrador');
      } finally {
        setCheckingMaster(false);
      }
    };
    
    checkMaster();
  }, [navigate]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validações
    if (!nome || !email || !senha || !confirmarSenha) {
      setError('Todos os campos são obrigatórios');
      return;
    }
    
    if (senha !== confirmarSenha) {
      setError('As senhas não coincidem');
      return;
    }
    
    if (senha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    setLoading(true);
    try {
      await registerMaster(nome, email, senha);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Erro no registro:', err);
      setError(err.message || 'Falha ao registrar usuário');
    } finally {
      setLoading(false);
    }
  };
  
  if (checkingMaster) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  if (masterExists) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 8 }}>
          <Alert severity="info">
            Um administrador já está registrado. Redirecionando para o login...
          </Alert>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" align="center" gutterBottom>
            Florify
          </Typography>
          <Typography variant="h5" component="h2" align="center" gutterBottom>
            Cadastro de Administrador
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="nome"
              label="Nome completo"
              name="nome"
              autoComplete="name"
              autoFocus
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="E-mail"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="senha"
              label="Senha"
              type="password"
              id="senha"
              autoComplete="new-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmarSenha"
              label="Confirmar senha"
              type="password"
              id="confirmarSenha"
              autoComplete="new-password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, bgcolor: '#2E7D32' }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Cadastrar'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default RegisterMaster;
