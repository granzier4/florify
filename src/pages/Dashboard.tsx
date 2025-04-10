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
} from '@mui/material';
import { 
  Add as AddIcon, 
  Store as StoreIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  CloudUpload as CloudUploadIcon,
  Inventory as InventoryIcon,
  Link as LinkIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { lojaService } from '../services/lojaService';
import { Loja } from '../types/auth';

const Dashboard = () => {
  const { user, logout } = useAuth();
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
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">
          Dashboard
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={() => logout()}
            sx={{ ml: 2 }}
          >
            Sair
          </Button>
        </Box>
      </Box>
      
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
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ flex: '1 1 300px', maxWidth: '350px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <StoreIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Lojas</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {loading ? <CircularProgress size={24} /> : lojas.length}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Total de lojas cadastradas na plataforma
              </Typography>
            </CardContent>
            <CardActions>
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
        </Box>
        
        <Box sx={{ flex: '1 1 300px', maxWidth: '350px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PersonIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Usuários</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Gerencie os usuários da plataforma
              </Typography>
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                onClick={() => navigate('/usuarios')}
              >
                Gerenciar usuários
              </Button>
            </CardActions>
          </Card>
        </Box>
        
        <Box sx={{ flex: '1 1 300px', maxWidth: '350px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <DashboardIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Estatísticas</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Acompanhe o desempenho da plataforma
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" disabled>
                Em breve
              </Button>
            </CardActions>
          </Card>
        </Box>
        
        <Box sx={{ flex: '1 1 300px', maxWidth: '350px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SettingsIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Configurações</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Configure as opções da plataforma
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" disabled>
                Em breve
              </Button>
            </CardActions>
          </Card>
        </Box>
        
        {/* Cards para usuários master_plataforma */}
        {user?.tipo === 'master_plataforma' && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, width: '100%', mt: 2 }}>
            <Box sx={{ flex: '1 1 300px', maxWidth: '350px' }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CloudUploadIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Produtos CVH</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Importe produtos da Cooperativa Veiling Holambra
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    onClick={() => navigate('/produtos/importar-cvh')}
                  >
                    Importar produtos
                  </Button>
                </CardActions>
              </Card>
            </Box>
            
            <Box sx={{ flex: '1 1 300px', maxWidth: '350px' }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <InventoryIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Gestão de Produtos</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Gerencie os produtos disponíveis para cada loja
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    onClick={() => navigate('/produtos/gestao-loja')}
                  >
                    Gerenciar produtos
                  </Button>
                </CardActions>
              </Card>
            </Box>
            
            <Box sx={{ flex: '1 1 300px', maxWidth: '350px' }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <LinkIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Associar Produtos</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Associe produtos CVH às lojas para exibição no catálogo
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    onClick={() => navigate('/produtos/associar-loja')}
                  >
                    Associar produtos
                  </Button>
                </CardActions>
              </Card>
            </Box>
          </Box>
        )}
        
        {/* Card de Gestão de Produtos para usuários usuario_loja */}
        {user?.tipo === 'usuario_loja' && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, width: '100%', mt: 2 }}>
            <Box sx={{ flex: '1 1 300px', maxWidth: '350px' }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <InventoryIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Gestão de Produtos</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Gerencie os produtos disponíveis para sua loja
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    onClick={() => navigate('/produtos/gestao-loja')}
                  >
                    Gerenciar produtos
                  </Button>
                </CardActions>
              </Card>
            </Box>
          </Box>
        )}
      </Box>
      
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
    </Box>
  );
};

export default Dashboard;
