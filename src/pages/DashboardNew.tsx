import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  CardActions,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material';
import { 
  Add as AddIcon, 
  Store as StoreIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  CloudUpload as CloudUploadIcon,
  Inventory as InventoryIcon,
  Link as LinkIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { lojaService } from '../services/lojaService';
import { Loja } from '../types/auth';
import MainLayout from '../components/layout/MainLayout';

const DashboardNew = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const carregarLojas = async () => {
      try {
        const data = await lojaService.listarLojas();
        setLojas(data);
      } catch (err: any) {
        console.error('Erro ao carregar lojas:', err);
        setError(err.message || 'Falha ao carregar lojas');
      } finally {
        setLoading(false);
      }
    };
    
    carregarLojas();
  }, []);
  
  return (
    <MainLayout pageTitle="Dashboard">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Bem-vindo, {user?.nome || user?.email}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gerencie suas lojas e acompanhe o desempenho da plataforma.
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', margin: -1.5, width: '100%', minHeight: user?.tipo === 'usuario_loja' ? 'calc(100vh - 300px)' : 'auto' }}>
        {/* Card de Lojas */}
        <Box sx={{ width: { xs: '100%', sm: '50%', md: '33.33%' }, padding: 1.5 }}>
          <Paper elevation={2} sx={{ height: '100%', borderRadius: 2, overflow: 'hidden' }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', border: 'none', boxShadow: 'none' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <StoreIcon color="primary" sx={{ mr: 0.5 }} fontSize="small" />
                  <Typography variant="subtitle1">Lojas</Typography>
                </Box>
                <Typography variant="h5" color="primary">
                  {loading ? <CircularProgress size={24} /> : lojas.length}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Total de lojas cadastradas na plataforma
                </Typography>
              </CardContent>
              <CardActions sx={{ pt: 0, borderTop: '1px solid', borderColor: 'divider' }}>
                <Button 
                  size="small" 
                  onClick={() => navigate('/lojas')}
                >
                  Ver todas
                </Button>
                <Button 
                  size="small" 
                  color="primary"
                  onClick={() => navigate('/lojas/cadastrar')}
                >
                  Adicionar nova
                </Button>
              </CardActions>
            </Card>
          </Paper>
        </Box>
        
        {/* Card de Usuários */}
        <Box sx={{ width: { xs: '100%', sm: '50%', md: '33.33%' }, padding: 1.5 }}>
          <Paper elevation={2} sx={{ height: '100%', borderRadius: 2, overflow: 'hidden' }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', border: 'none', boxShadow: 'none' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PersonIcon color="primary" sx={{ mr: 0.5 }} fontSize="small" />
                  <Typography variant="subtitle1">Usuários</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Gerencie os usuários da plataforma
                </Typography>
              </CardContent>
              <CardActions sx={{ pt: 0, borderTop: '1px solid', borderColor: 'divider' }}>
                <Button 
                  size="small" 
                  onClick={() => navigate('/usuarios')}
                >
                  Gerenciar
                </Button>
              </CardActions>
            </Card>
          </Paper>
        </Box>
        
        {/* Card de Configurações */}
        <Box sx={{ width: { xs: '100%', sm: '50%', md: '33.33%' }, padding: 1.5 }}>
          <Paper elevation={2} sx={{ height: '100%', borderRadius: 2, overflow: 'hidden' }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', border: 'none', boxShadow: 'none' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <SettingsIcon color="primary" sx={{ mr: 0.5 }} fontSize="small" />
                  <Typography variant="subtitle1">Configurações</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Configure as opções da plataforma
                </Typography>
              </CardContent>
              <CardActions sx={{ pt: 0, borderTop: '1px solid', borderColor: 'divider' }}>
                <Button size="small" disabled>
                  Em breve
                </Button>
              </CardActions>
            </Card>
          </Paper>
        </Box>
        
        {/* Cards para usuários master_plataforma */}
        {user?.tipo === 'master_plataforma' && (
          <>
            {/* Card de Produtos CVH */}
            <Box sx={{ width: { xs: '100%', sm: '50%', md: '33.33%' }, padding: 1.5 }}>
              <Paper elevation={2} sx={{ height: '100%', borderRadius: 2, overflow: 'hidden' }}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', border: 'none', boxShadow: 'none' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CloudUploadIcon color="primary" sx={{ mr: 0.5 }} fontSize="small" />
                      <Typography variant="subtitle1">Produtos CVH</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Importe produtos da Cooperativa Veiling Holambra
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ pt: 0, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button 
                      size="small" 
                      onClick={() => navigate('/produtos/importar-cvh')}
                    >
                      Importar produtos
                    </Button>
                  </CardActions>
                </Card>
              </Paper>
            </Box>
            
            {/* Card de Gestão de Produtos */}
            <Box sx={{ width: { xs: '100%', sm: '50%', md: '33.33%' }, padding: 1.5 }}>
              <Paper elevation={2} sx={{ height: '100%', borderRadius: 2, overflow: 'hidden' }}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', border: 'none', boxShadow: 'none' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <InventoryIcon color="primary" sx={{ mr: 0.5 }} fontSize="small" />
                      <Typography variant="subtitle1">Gestão de Produtos</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Gerencie os produtos disponíveis para cada loja
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ pt: 0, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button 
                      size="small" 
                      onClick={() => navigate('/produtos/gestao-loja')}
                    >
                      Gerenciar produtos
                    </Button>
                  </CardActions>
                </Card>
              </Paper>
            </Box>
            
            {/* Card de Associar Produtos */}
            <Box sx={{ width: { xs: '100%', sm: '50%', md: '33.33%' }, padding: 1.5 }}>
              <Paper elevation={2} sx={{ height: '100%', borderRadius: 2, overflow: 'hidden' }}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', border: 'none', boxShadow: 'none' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <LinkIcon color="primary" sx={{ mr: 0.5 }} fontSize="small" />
                      <Typography variant="subtitle1">Associar Produtos</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Associe produtos CVH às lojas para exibição no catálogo
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ pt: 0, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button 
                      size="small" 
                      onClick={() => navigate('/produtos/associar-loja')}
                    >
                      Associar produtos
                    </Button>
                  </CardActions>
                </Card>
              </Paper>
            </Box>
          </>
        )}
        
        {/* Card de Gestão de Produtos para usuários usuario_loja */}
        {user?.tipo === 'usuario_loja' && (
          <>
            <Box sx={{ width: { xs: '100%', sm: '50%', md: '33.33%' }, padding: 1.5 }}>
              <Paper elevation={2} sx={{ height: '100%', borderRadius: 2, overflow: 'hidden' }}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', border: 'none', boxShadow: 'none' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <InventoryIcon color="primary" sx={{ mr: 0.5 }} fontSize="small" />
                      <Typography variant="subtitle1">Gestão de Produtos</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Gerencie os produtos disponíveis para sua loja
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ pt: 0, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button 
                      size="small" 
                      onClick={() => navigate('/produtos/gestao-loja')}
                    >
                      Gerenciar produtos
                    </Button>
                  </CardActions>
                </Card>
              </Paper>
            </Box>
            
            {/* Card de Estatísticas - Apenas para administrador de loja */}
            <Box sx={{ width: { xs: '100%', sm: '50%', md: '33.33%' }, padding: 1.5 }}>
              <Paper elevation={2} sx={{ height: '100%', borderRadius: 2, overflow: 'hidden' }}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', border: 'none', boxShadow: 'none' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PersonIcon color="primary" sx={{ mr: 0.5 }} fontSize="small" />
                      <Typography variant="subtitle1">Usuários</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Gerencie os usuários da sua loja
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ pt: 0, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button 
                      size="small" 
                      onClick={() => navigate('/usuarios')}
                    >
                      Gerenciar usuários
                    </Button>
                  </CardActions>
                </Card>
              </Paper>
            </Box>
          </>
        )}
      </Box>
      
      {/* Botão de Cadastrar Nova Loja */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/lojas/cadastrar')}
        >
          Cadastrar Nova Loja
        </Button>
      </Box>
    </MainLayout>
  );
};

export default DashboardNew;
