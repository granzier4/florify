import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Button,
  CircularProgress,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Chip,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Divider,
  useMediaQuery,
  useTheme,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Block as BlockIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { lojaService } from '../services/lojaService';
import { Loja } from '../types/auth';
import { useAuth } from '../contexts/AuthContext';
import { PostgrestError } from '@supabase/supabase-js';
import MainLayout from '../components/layout/MainLayout';

// Interfaces
interface TemaLoja {
  corPrimaria: string;
  corSecundaria: string;
  corFundo: string;
  corTexto: string;
  corDestaque: string;
}

interface LojaComTema extends Omit<Loja, 'tema' | 'status'> {
  tema: TemaLoja;
  status: 'pendente' | 'ativo' | 'bloqueado';
}

interface FormDataType {
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  email_contato: string;
  telefone: string;
  endereco: string;
  slug: string;
  tema: TemaLoja;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

const GerenciarLojas: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Estados
  const [lojas, setLojas] = useState<LojaComTema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados do modal
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState<'criar' | 'editar'>('criar');
  const [lojaSelecionada, setLojaSelecionada] = useState<LojaComTema | null>(null);

  // Estado do formulário
  const [formData, setFormData] = useState<FormDataType>({
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    email_contato: '',
    telefone: '',
    endereco: '',
    slug: '',
    tema: {
      corPrimaria: '#2E7D32',
      corSecundaria: '#A5D6A7',
      corFundo: '#F8F9FA',
      corTexto: '#212121',
      corDestaque: '#FFC107'
    }
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formLoading, setFormLoading] = useState(false);

  // Estado do snackbar
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Verificar tipo de usuário
  const isMasterPlataforma = user?.tipo === 'master_plataforma';

  // Funções utilitárias
  const formatarCNPJ = (cnpj: string): string => {
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    return cnpjLimpo.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };
  
  const normalizarCNPJ = (cnpj: string): string => {
    return cnpj.replace(/\D/g, '');
  };
  
  const validarCNPJ = (cnpj: string): boolean => {
    const cnpjLimpo = normalizarCNPJ(cnpj);
    return cnpjLimpo.length === 14;
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'ativo': return 'success';
      case 'pendente': return 'warning';
      case 'bloqueado': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'ativo': return 'Ativo';
      case 'pendente': return 'Pendente';
      case 'bloqueado': return 'Bloqueado';
      default: return 'Desconhecido';
    }
  };

  // Carregar lojas
  const carregarLojas = async () => {
    try {
      setLoading(true);
      const data = await lojaService.listarLojas();
      // Garantir que todas as lojas tenham a propriedade tema
      const lojasComTema = data.map((loja: Loja) => {
        if (!loja.tema) {
          return {
            ...loja,
            tema: {
              corPrimaria: '#2E7D32',
              corSecundaria: '#A5D6A7',
              corFundo: '#F8F9FA',
              corTexto: '#212121',
              corDestaque: '#FFC107'
            }
          };
        }
        return loja;
      });
      setLojas(lojasComTema as LojaComTema[]);
    } catch (err: any) {
      console.error('Erro ao carregar lojas:', err);
      setError(err.message || 'Falha ao carregar lojas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarLojas();
  }, []);

  // Funções para o modal de criação/edição
  const handleOpenCreateModal = () => {
    setFormData({
      razao_social: '',
      nome_fantasia: '',
      cnpj: '',
      email_contato: '',
      telefone: '',
      endereco: '',
      slug: '',
      tema: {
        corPrimaria: '#2E7D32',
        corSecundaria: '#A5D6A7',
        corFundo: '#F8F9FA',
        corTexto: '#212121',
        corDestaque: '#FFC107'
      }
    });
    setFormErrors({});
    setModalMode('criar');
    setOpenModal(true);
  };

  const handleOpenEditModal = (loja: LojaComTema) => {
    setLojaSelecionada(loja);
    setFormData({
      razao_social: loja.razao_social,
      nome_fantasia: loja.nome_fantasia,
      cnpj: loja.cnpj,
      email_contato: loja.email_contato,
      telefone: loja.telefone || '',
      endereco: loja.endereco || '',
      slug: loja.slug || '',
      tema: loja.tema
    });
    setFormErrors({});
    setModalMode('editar');
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  // Validação do formulário
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;

    if (!formData.razao_social.trim()) {
      errors.razao_social = 'Razão social é obrigatória';
      isValid = false;
    }

    if (!formData.nome_fantasia.trim()) {
      errors.nome_fantasia = 'Nome fantasia é obrigatório';
      isValid = false;
    }

    if (!formData.cnpj.trim()) {
      errors.cnpj = 'CNPJ é obrigatório';
      isValid = false;
    } else if (!validarCNPJ(formData.cnpj)) {
      errors.cnpj = 'CNPJ inválido';
      isValid = false;
    }

    if (!formData.email_contato.trim()) {
      errors.email_contato = 'Email é obrigatório';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email_contato)) {
      errors.email_contato = 'Email inválido';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  // Submissão do formulário
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setFormLoading(true);

    try {
      const formDataToSubmit = {
        ...formData,
        cnpj: normalizarCNPJ(formData.cnpj)
      };

      let result;
      if (modalMode === 'criar') {
        result = await lojaService.criarLoja(formDataToSubmit);
        
        setSnackbar({
          open: true,
          message: 'Loja criada com sucesso!',
          severity: 'success'
        });
      } else {
        if (!lojaSelecionada) {
          throw new Error('Nenhuma loja selecionada para edição');
        }
        
        result = await lojaService.atualizarLoja(lojaSelecionada.id, formDataToSubmit);
        
        setSnackbar({
          open: true,
          message: 'Loja atualizada com sucesso!',
          severity: 'success'
        });
      }

      // Fechar o modal e recarregar a lista de lojas
      handleCloseModal();
      carregarLojas();
    } catch (err: any) {
      console.error('Erro ao salvar loja:', err);
      
      let errorMessage = 'Falha ao salvar loja';
      
      if (err instanceof PostgrestError) {
        if (err.code === '23505') {
          errorMessage = 'Já existe uma loja com este CNPJ ou slug';
        } else {
          errorMessage = err.message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Função para fechar o snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Funções para alterar status da loja
  const handleAlterarStatus = async (loja: LojaComTema, novoStatus: 'ativo' | 'pendente' | 'bloqueado') => {
    try {
      await lojaService.alterarStatusLoja(loja.id, novoStatus);
      
      // Atualizar a lista de lojas
      setLojas(lojas.map(l => 
        l.id === loja.id ? { ...l, status: novoStatus } : l
      ));
      
      setSnackbar({
        open: true,
        message: `Status da loja alterado para ${getStatusLabel(novoStatus)}`,
        severity: 'success'
      });
    } catch (err: any) {
      console.error('Erro ao alterar status:', err);
      
      setSnackbar({
        open: true,
        message: err.message || 'Falha ao alterar status da loja',
        severity: 'error'
      });
    }
  };

  // Função para lidar com mudanças no formulário
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'cnpj') {
      // Formatar CNPJ enquanto digita
      let cnpjFormatado = value.replace(/\D/g, '');
      if (cnpjFormatado.length > 14) {
        cnpjFormatado = cnpjFormatado.slice(0, 14);
      }
      
      if (cnpjFormatado.length > 0) {
        cnpjFormatado = cnpjFormatado.replace(/^(\d{2})(\d{0,3})/, '$1.$2');
        cnpjFormatado = cnpjFormatado.replace(/^(\d{2})\.(\d{3})(\d{0,3})/, '$1.$2.$3');
        cnpjFormatado = cnpjFormatado.replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d{0,4})/, '$1.$2.$3/$4');
        cnpjFormatado = cnpjFormatado.replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5');
      }
      
      setFormData({ ...formData, [name]: cnpjFormatado });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    // Limpar erro quando o usuário começa a digitar
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
  };

  // Componente para renderizar as ações da loja (botões de editar, visualizar, alterar status)
  const renderAcoesLoja = (loja: LojaComTema) => {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <IconButton size="small" color="primary" onClick={() => navigate(`/lojas/${loja.id}`)}>
          <VisibilityIcon fontSize="small" />
        </IconButton>
        
        {isMasterPlataforma && (
          <>
            <IconButton size="small" color="primary" onClick={() => handleOpenEditModal(loja)}>
              <EditIcon fontSize="small" />
            </IconButton>
            
            {loja.status !== 'ativo' && (
              <IconButton size="small" color="success" onClick={() => handleAlterarStatus(loja, 'ativo')}>
                <CheckCircleIcon fontSize="small" />
              </IconButton>
            )}
            
            {loja.status !== 'pendente' && (
              <IconButton size="small" color="warning" onClick={() => handleAlterarStatus(loja, 'pendente')}>
                <CancelIcon fontSize="small" />
              </IconButton>
            )}
            
            {loja.status !== 'bloqueado' && (
              <IconButton size="small" color="error" onClick={() => handleAlterarStatus(loja, 'bloqueado')}>
                <BlockIcon fontSize="small" />
              </IconButton>
            )}
          </>
        )}
      </Box>
    );
  };

  // Renderização de lojas em formato de card (para mobile)
  const renderLojaCard = (loja: LojaComTema) => {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" component="div">
            {loja.nome_fantasia}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {formatarCNPJ(loja.cnpj)}
          </Typography>
          <Typography variant="body2">
            Email: {loja.email_contato}
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Chip
              label={getStatusLabel(loja.status)}
              color={getStatusColor(loja.status)}
              size="small"
            />
          </Box>
        </CardContent>
        <Divider />
        <CardActions>
          {renderAcoesLoja(loja)}
        </CardActions>
      </Card>
    );
  };

  // Renderização do modal de criação/edição
  const renderModal = () => {
    return (
      <Dialog 
        open={openModal} 
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {modalMode === 'criar' ? 'Criar Nova Loja' : 'Editar Loja'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                name="razao_social"
                label="Razão Social"
                fullWidth
                value={formData.razao_social}
                onChange={handleFormChange}
                error={!!formErrors.razao_social}
                helperText={formErrors.razao_social}
                disabled={formLoading}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="nome_fantasia"
                label="Nome Fantasia"
                fullWidth
                value={formData.nome_fantasia}
                onChange={handleFormChange}
                error={!!formErrors.nome_fantasia}
                helperText={formErrors.nome_fantasia}
                disabled={formLoading}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="cnpj"
                label="CNPJ"
                fullWidth
                value={formData.cnpj}
                onChange={handleFormChange}
                error={!!formErrors.cnpj}
                helperText={formErrors.cnpj}
                disabled={formLoading}
                InputProps={{
                  inputProps: {
                    maxLength: 18
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="email_contato"
                label="Email de Contato"
                type="email"
                fullWidth
                value={formData.email_contato}
                onChange={handleFormChange}
                error={!!formErrors.email_contato}
                helperText={formErrors.email_contato}
                disabled={formLoading}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="telefone"
                label="Telefone"
                fullWidth
                value={formData.telefone}
                onChange={handleFormChange}
                disabled={formLoading}
                InputProps={{
                  startAdornment: <InputAdornment position="start">+55</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="endereco"
                label="Endereço"
                fullWidth
                value={formData.endereco}
                onChange={handleFormChange}
                disabled={formLoading}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="slug"
                label="Slug (URL da loja)"
                fullWidth
                value={formData.slug}
                onChange={handleFormChange}
                disabled={formLoading}
                helperText="Identificador único para a URL da loja"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                Tema da Loja
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                name="tema.corPrimaria"
                label="Cor Primária"
                fullWidth
                value={formData.tema.corPrimaria}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setFormData({
                    ...formData,
                    tema: {
                      ...formData.tema,
                      corPrimaria: e.target.value
                    }
                  });
                }}
                disabled={formLoading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: 1,
                          bgcolor: formData.tema.corPrimaria,
                          border: '1px solid #ccc'
                        }}
                      />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                name="tema.corSecundaria"
                label="Cor Secundária"
                fullWidth
                value={formData.tema.corSecundaria}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setFormData({
                    ...formData,
                    tema: {
                      ...formData.tema,
                      corSecundaria: e.target.value
                    }
                  });
                }}
                disabled={formLoading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: 1,
                          bgcolor: formData.tema.corSecundaria,
                          border: '1px solid #ccc'
                        }}
                      />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                name="tema.corDestaque"
                label="Cor de Destaque"
                fullWidth
                value={formData.tema.corDestaque}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setFormData({
                    ...formData,
                    tema: {
                      ...formData.tema,
                      corDestaque: e.target.value
                    }
                  });
                }}
                disabled={formLoading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: 1,
                          bgcolor: formData.tema.corDestaque,
                          border: '1px solid #ccc'
                        }}
                      />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="tema.corFundo"
                label="Cor de Fundo"
                fullWidth
                value={formData.tema.corFundo}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setFormData({
                    ...formData,
                    tema: {
                      ...formData.tema,
                      corFundo: e.target.value
                    }
                  });
                }}
                disabled={formLoading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: 1,
                          bgcolor: formData.tema.corFundo,
                          border: '1px solid #ccc'
                        }}
                      />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="tema.corTexto"
                label="Cor de Texto"
                fullWidth
                value={formData.tema.corTexto}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setFormData({
                    ...formData,
                    tema: {
                      ...formData.tema,
                      corTexto: e.target.value
                    }
                  });
                }}
                disabled={formLoading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: 1,
                          bgcolor: formData.tema.corTexto,
                          border: '1px solid #ccc'
                        }}
                      />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCloseModal} 
            color="inherit"
            disabled={formLoading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={formLoading}
            startIcon={formLoading ? <CircularProgress size={20} /> : null}
          >
            {formLoading ? 'Processando...' : (modalMode === 'criar' ? 'Criar' : 'Salvar')}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <MainLayout pageTitle="Gerenciar Lojas">
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Gerenciar Lojas
          </Typography>
          {isMasterPlataforma && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenCreateModal}
            >
              Nova Loja
            </Button>
          )}
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {lojas.length === 0 ? (
              <Alert severity="info">
                Nenhuma loja cadastrada.
              </Alert>
            ) : isMobile ? (
              // Visualização em cards para dispositivos móveis
              <Box sx={{ mt: 2 }}>
                {lojas.map(loja => (
                  <div key={loja.id}>
                    {renderLojaCard(loja)}
                  </div>
                ))}
              </Box>
            ) : (
              // Visualização em tabela para desktop
              <Box sx={{ width: '100%', overflow: 'auto' }}>
                <Box sx={{ minWidth: 800 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                        <th style={{ padding: '16px 8px', textAlign: 'left' }}>Nome</th>
                        <th style={{ padding: '16px 8px', textAlign: 'left' }}>CNPJ</th>
                        <th style={{ padding: '16px 8px', textAlign: 'left' }}>Email</th>
                        <th style={{ padding: '16px 8px', textAlign: 'left' }}>Status</th>
                        <th style={{ padding: '16px 8px', textAlign: 'center' }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lojas.map((loja) => (
                        <tr key={loja.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                          <td style={{ padding: '16px 8px' }}>{loja.nome_fantasia}</td>
                          <td style={{ padding: '16px 8px' }}>{formatarCNPJ(loja.cnpj)}</td>
                          <td style={{ padding: '16px 8px' }}>{loja.email_contato}</td>
                          <td style={{ padding: '16px 8px' }}>
                            <Chip
                              label={getStatusLabel(loja.status)}
                              color={getStatusColor(loja.status)}
                              size="small"
                            />
                          </td>
                          <td style={{ padding: '16px 8px', textAlign: 'center' }}>
                            {renderAcoesLoja(loja)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              </Box>
            )}
          </>
        )}
        
        {/* Modal de criação/edição */}
        {renderModal()}
        
        {/* Snackbar para feedback */}
        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={6000} 
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </MainLayout>
  );
};

export default GerenciarLojas;
