import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Block as BlockIcon
} from '@mui/icons-material';
import { lojaService } from '../services/lojaService';
import { Loja } from '../types/auth';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ativo':
      return 'success';
    case 'pendente':
      return 'warning';
    case 'bloqueado':
      return 'error';
    default:
      return 'default';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'ativo':
      return 'Ativo';
    case 'pendente':
      return 'Pendente';
    case 'bloqueado':
      return 'Bloqueado';
    default:
      return status;
  }
};

const ListarLojas = () => {
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
  
  const handleAlterarStatus = async (id: string, novoStatus: 'pendente' | 'ativo' | 'bloqueado') => {
    try {
      await lojaService.alterarStatusLoja(id, novoStatus);
      
      // Atualizar a lista de lojas
      setLojas(lojas.map(loja => 
        loja.id === id ? { ...loja, status: novoStatus } : loja
      ));
    } catch (err: any) {
      console.error('Erro ao alterar status:', err);
      setError(err.message || 'Falha ao alterar status da loja');
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Lojas
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/lojas/cadastrar')}
        >
          Nova Loja
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {lojas.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">
            Nenhuma loja cadastrada. Clique no botão acima para cadastrar uma nova loja.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome Fantasia</TableCell>
                <TableCell>CNPJ</TableCell>
                <TableCell>E-mail</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lojas.map((loja) => (
                <TableRow key={loja.id}>
                  <TableCell>{loja.nome_fantasia}</TableCell>
                  <TableCell>
                    {loja.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')}
                  </TableCell>
                  <TableCell>{loja.email_contato}</TableCell>
                  <TableCell>
                    <Chip 
                      label={getStatusLabel(loja.status)} 
                      color={getStatusColor(loja.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton 
                      size="small" 
                      onClick={() => navigate(`/lojas/${loja.id}`)}
                      title="Visualizar"
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => navigate(`/lojas/editar/${loja.id}`)}
                      title="Editar"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    
                    {loja.status !== 'ativo' && (
                      <IconButton 
                        size="small" 
                        color="success"
                        onClick={() => handleAlterarStatus(loja.id, 'ativo')}
                        title="Ativar"
                      >
                        <CheckCircleIcon fontSize="small" />
                      </IconButton>
                    )}
                    
                    {loja.status !== 'pendente' && (
                      <IconButton 
                        size="small" 
                        color="warning"
                        onClick={() => handleAlterarStatus(loja.id, 'pendente')}
                        title="Marcar como pendente"
                      >
                        <CancelIcon fontSize="small" />
                      </IconButton>
                    )}
                    
                    {loja.status !== 'bloqueado' && (
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleAlterarStatus(loja.id, 'bloqueado')}
                        title="Bloquear"
                      >
                        <BlockIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default ListarLojas;
