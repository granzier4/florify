import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Snackbar,
  SelectChangeEvent,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  CardActions,
  Divider
} from '@mui/material';
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Block as BlockIcon,
  LinkOff as LinkOffIcon,
  Link as LinkIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { usuarioService, Usuario, CriarUsuarioDTO, AtualizarUsuarioDTO } from '../services/usuarioService';
import { lojaService } from '../services/lojaService';
import { Loja } from '../types/auth';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../contexts/AuthContext';

const GerenciarUsuarios = () => {
  // Contexto de autenticação
  const { user } = useAuth();
  
  // Verificar tipo de usuário
  const isMasterPlataforma = user?.tipo === 'master_plataforma';
  const isAdminLoja = user?.tipo === 'usuario_loja';
  
  // Responsividade
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Estados para a lista de usuários
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para paginação
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Estados para modais
  const [openModal, setOpenModal] = useState(false);
  const [openLojaModal, setOpenLojaModal] = useState(false);
  const [modalMode, setModalMode] = useState<'criar' | 'editar'>('criar');
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null);
  
  // Estados para o modal de associação de loja
  const [usuarioParaAssociar, setUsuarioParaAssociar] = useState<Usuario | null>(null);
  const [lojaSelecionada, setLojaSelecionada] = useState<string>('');
  
  // Estados para formulário
  const [formData, setFormData] = useState<CriarUsuarioDTO>({
    email: '',
    senha: '',
    nome: '',
    telefone: '',
    tipo: 'usuario_loja',
    loja_id: undefined
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formLoading, setFormLoading] = useState(false);
  const [lojaLoading, setLojaLoading] = useState(false);
  
  // Estados para feedback
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Carregar dados iniciais
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);
        const [usuariosData, lojasData] = await Promise.all([
          usuarioService.listarUsuarios(),
          lojaService.listarLojas()
        ]);
        
        // Filtrar usuários se for admin de loja
        if (isAdminLoja && user?.loja_id) {
          const usuariosFiltrados = usuariosData.filter(
            u => u.loja_id === user.loja_id || u.id === user.id
          );
          setUsuarios(usuariosFiltrados);
        } else {
          setUsuarios(usuariosData);
        }
        
        setLojas(lojasData);
      } catch (err: any) {
        console.error('Erro ao carregar dados:', err);
        setError(err.message || 'Erro ao carregar usuários');
      } finally {
        setLoading(false);
      }
    };
    
    carregarDados();
  }, [isAdminLoja, user?.loja_id]);

  // Funções de paginação
  const handleChangePage = (_: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Funções para o modal de criação/edição
  const handleOpenCreateModal = () => {
    setModalMode('criar');
    setUsuarioSelecionado(null);
    setFormData({
      email: '',
      senha: '',
      nome: '',
      telefone: '',
      tipo: 'usuario_loja',
      loja_id: undefined
    });
    setFormErrors({});
    setOpenModal(true);
  };

  const handleOpenEditModal = (usuario: Usuario) => {
    setModalMode('editar');
    setUsuarioSelecionado(usuario);
    setFormData({
      email: usuario.email,
      senha: '',
      nome: usuario.nome,
      telefone: usuario.telefone || '',
      tipo: usuario.tipo,
      loja_id: usuario.loja_id
    });
    setFormErrors({});
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  // Funções para o formulário
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpar erro quando o campo é alterado
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.email) errors.email = 'E-mail é obrigatório';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'E-mail inválido';
    
    if (modalMode === 'criar' && !formData.senha) errors.senha = 'Senha é obrigatória';
    
    if (!formData.nome) errors.nome = 'Nome é obrigatório';
    
    // Verificar se é necessário selecionar uma loja para usuários do tipo administrador de loja e clientes
    if ((formData.tipo === 'usuario_loja' || formData.tipo === 'cliente') && !formData.loja_id && isMasterPlataforma) {
      errors.loja_id = 'Loja é obrigatória para usuários do tipo Administrador de Loja e Cliente';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setFormLoading(true);
      
      if (modalMode === 'criar') {
        await usuarioService.criarUsuario(formData);
        
        // Adicionar o novo usuário à lista
        const novoUsuario: Usuario = {
          id: Date.now().toString(), // Temporário até obter o ID real
          email: formData.email,
          nome: formData.nome,
          telefone: formData.telefone,
          tipo: formData.tipo,
          loja_id: formData.loja_id,
          status: 'ativo'
        };
        
        setUsuarios(prev => [...prev, novoUsuario]);
        
        setSnackbar({
          open: true,
          message: 'Usuário criado com sucesso!',
          severity: 'success'
        });
      } else if (usuarioSelecionado) {
        const dadosAtualizacao: AtualizarUsuarioDTO = {
          nome: formData.nome,
          telefone: formData.telefone,
          tipo: formData.tipo,
          loja_id: formData.loja_id
        };
        
        await usuarioService.atualizarUsuario(usuarioSelecionado.id, dadosAtualizacao);
        
        // Atualizar o usuário na lista
        setUsuarios(prev => prev.map(u => 
          u.id === usuarioSelecionado.id ? { ...u, ...dadosAtualizacao } : u
        ));
        
        setSnackbar({
          open: true,
          message: 'Usuário atualizado com sucesso!',
          severity: 'success'
        });
      }
      
      handleCloseModal();
    } catch (err: any) {
      console.error('Erro ao salvar usuário:', err);
      setSnackbar({
        open: true,
        message: err.message || 'Erro ao salvar usuário',
        severity: 'error'
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Funções para alterar status do usuário
  const handleAlterarStatus = async (usuario: Usuario, novoStatus: 'ativo' | 'inativo') => {
    try {
      setLoading(true);
      await usuarioService.alterarStatusUsuario(usuario.id, novoStatus);
      
      // Atualizar o usuário na lista
      setUsuarios(prev => prev.map(u => 
        u.id === usuario.id ? { ...u, status: novoStatus } : u
      ));
      
      setSnackbar({
        open: true,
        message: `Usuário ${novoStatus === 'ativo' ? 'ativado' : 'desativado'} com sucesso!`,
        severity: 'success'
      });
    } catch (err: any) {
      console.error('Erro ao alterar status:', err);
      setSnackbar({
        open: true,
        message: err.message || 'Erro ao alterar status do usuário',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Funções para resetar senha
  const handleResetarSenha = async (email: string) => {
    try {
      setLoading(true);
      await usuarioService.resetarSenha(email);
      
      setSnackbar({
        open: true,
        message: 'Senha resetada com sucesso! Um e-mail foi enviado ao usuário.',
        severity: 'success'
      });
    } catch (err: any) {
      console.error('Erro ao resetar senha:', err);
      setSnackbar({
        open: true,
        message: err.message || 'Erro ao resetar senha',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Funções para o modal de associação de loja
  const handleOpenLojaModal = (usuario: Usuario) => {
    setUsuarioParaAssociar(usuario);
    setLojaSelecionada(usuario.loja_id || '');
    setOpenLojaModal(true);
  };

  const handleCloseLojaModal = () => {
    setUsuarioParaAssociar(null);
    setLojaSelecionada('');
    setOpenLojaModal(false);
  };

  const handleAssociarLoja = async () => {
    if (!usuarioParaAssociar) return;
    
    try {
      setLojaLoading(true);
      
      if (lojaSelecionada) {
        await usuarioService.associarUsuarioLoja(usuarioParaAssociar.id, lojaSelecionada);
        
        // Atualizar o usuário na lista
        setUsuarios(prev => prev.map(u => 
          u.id === usuarioParaAssociar.id ? { ...u, loja_id: lojaSelecionada } : u
        ));
        
        setSnackbar({
          open: true,
          message: 'Usuário associado à loja com sucesso!',
          severity: 'success'
        });
      } else {
        await usuarioService.desassociarUsuarioLoja(usuarioParaAssociar.id);
        
        // Atualizar o usuário na lista
        setUsuarios(prev => prev.map(u => 
          u.id === usuarioParaAssociar.id ? { ...u, loja_id: undefined } : u
        ));
        
        setSnackbar({
          open: true,
          message: 'Usuário desassociado da loja com sucesso!',
          severity: 'success'
        });
      }
      
      handleCloseLojaModal();
    } catch (err: any) {
      console.error('Erro ao associar/desassociar loja:', err);
      setSnackbar({
        open: true,
        message: err.message || 'Erro ao associar/desassociar loja',
        severity: 'error'
      });
    } finally {
      setLojaLoading(false);
    }
  };
  
  // Função para obter o nome da loja pelo ID
  const getNomeLoja = (lojaId?: string) => {
    if (!lojaId) return '-';
    const loja = lojas.find(l => l.id === lojaId);
    return loja ? loja.nome_fantasia : 'Loja não encontrada';
  };
  
  // Função para fechar o snackbar
  const handleCloseSnackbar = () => {
    setSnackbar((prevSnackbar) => ({ ...prevSnackbar, open: false }));
  };

  // Função para renderizar usuários em formato de card (para mobile)
  const renderUsuarioCard = (usuario: Usuario) => (
    <Card key={usuario.id || usuario.email} sx={{ mb: 2, boxShadow: 2 }}>
      <CardContent>
        <Typography variant="h6" component="div">
          {usuario.nome}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {usuario.email}
        </Typography>
        <Divider sx={{ my: 1 }} />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2">
              <strong>Tipo:</strong> {usuario.tipo === 'master_plataforma' ? 'Admin Plataforma' : 
                      usuario.tipo === 'usuario_loja' ? 'Admin Loja' : 'Cliente'}
            </Typography>
            
            <Box>
            <Chip
              label={usuario.status === 'ativo' ? 'Ativo' : 'Inativo'}
              color={usuario.status === 'ativo' ? 'success' : 'default'}
              size="small"
              sx={{ fontWeight: 'medium' }}
            />
            </Box>
          </Box>
          <Typography variant="body2">
            <strong>Loja:</strong> {getNomeLoja(usuario.loja_id) || 'Não associado'}
          </Typography>
        </Box>
      </CardContent>
      <CardActions>
        <IconButton size="small" color="primary" onClick={() => handleOpenEditModal(usuario)}>
          <EditIcon fontSize="small" />
        </IconButton>
        {usuario.status === 'ativo' ? (
          <IconButton size="small" color="error" onClick={() => handleAlterarStatus(usuario, 'inativo')}>
            <BlockIcon fontSize="small" />
          </IconButton>
        ) : (
          <IconButton size="small" color="success" onClick={() => handleAlterarStatus(usuario, 'ativo')}>
            <CheckIcon fontSize="small" />
          </IconButton>
        )}
        <IconButton size="small" color="primary" onClick={() => handleResetarSenha(usuario.email)}>
          <RefreshIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          color="primary"
          onClick={() => handleOpenLojaModal(usuario)}
          disabled={usuario.tipo === 'master_plataforma'}
        >
          {usuario.loja_id ? <LinkOffIcon fontSize="small" /> : <LinkIcon fontSize="small" />}
        </IconButton>
      </CardActions>
    </Card>
  );

  return (
    <MainLayout pageTitle="Gerenciar Usuários">
      <Box sx={{ width: '100%', padding: { xs: 1, sm: 2, md: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" sx={{ alignSelf: { xs: 'flex-start', sm: 'auto' } }}>
            Gerenciar Usuários
          </Typography>

          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateModal}
            fullWidth={isMobile}
            sx={{ maxWidth: { xs: '100%', sm: 'auto' } }}
          >
            Novo Usuário
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : (
          <>
            {/* Versão mobile: Cards */}
            {isMobile ? (
              <Box sx={{ mt: 2 }}>
                {usuarios
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map(renderUsuarioCard)}
              </Box>
            ) : (
              /* Versão desktop: Cards em grid */
              <>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
                  {usuarios
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((usuario) => (
                      <Card key={usuario.id || usuario.email} sx={{ height: '100%' }}>
                        <CardContent>
                          <Typography variant="h6" component="div" noWrap>
                            {usuario.nome}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {usuario.email}
                          </Typography>
                          <Divider sx={{ my: 1 }} />
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                            <Typography variant="body2">
                              <strong>Tipo:</strong> {usuario.tipo === 'master_plataforma' ? 'Admin Plataforma' : usuario.tipo === 'usuario_loja' ? 'Admin Loja' : 'Cliente'}
                            </Typography>
                            <Chip
                              label={usuario.status === 'ativo' ? 'Ativo' : 'Inativo'}
                              color={usuario.status === 'ativo' ? 'success' : 'default'}
                              size="small"
                              sx={{ fontWeight: 'medium' }}
                            />
                          </Box>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>Loja:</strong> {getNomeLoja(usuario.loja_id) || 'Não associado'}
                          </Typography>
                        </CardContent>
                        <CardActions>
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, width: '100%' }}>
                            <IconButton size="small" color="primary" onClick={() => handleOpenEditModal(usuario)}>
                              <EditIcon fontSize="small" />
                            </IconButton>

                            {usuario.status === 'ativo' ? (
                              <IconButton size="small" color="error" onClick={() => handleAlterarStatus(usuario, 'inativo')}>
                                <BlockIcon fontSize="small" />
                              </IconButton>
                            ) : (
                              <IconButton size="small" color="success" onClick={() => handleAlterarStatus(usuario, 'ativo')}>
                                <CheckIcon fontSize="small" />
                              </IconButton>
                            )}

                            <IconButton size="small" color="primary" onClick={() => handleResetarSenha(usuario.email)}>
                              <RefreshIcon fontSize="small" />
                            </IconButton>

                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenLojaModal(usuario)}
                              disabled={usuario.tipo === 'master_plataforma'}
                            >
                              {usuario.loja_id ? <LinkOffIcon fontSize="small" /> : <LinkIcon fontSize="small" />}
                            </IconButton>
                          </Box>
                        </CardActions>
                      </Card>
                    ))}
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button 
                      disabled={page === 0} 
                      onClick={() => handleChangePage(null, page - 1)}
                      variant="outlined"
                    >
                      Anterior
                    </Button>
                    <Typography>
                      Página {page + 1} de {Math.ceil(usuarios.length / rowsPerPage)}
                    </Typography>
                    <Button 
                      disabled={page >= Math.ceil(usuarios.length / rowsPerPage) - 1} 
                      onClick={() => handleChangePage(null, page + 1)}
                      variant="outlined"
                    >
                      Próxima
                    </Button>
                  </Box>
                </Box>
              </>
            )}
          </>
        )}
      </Box>

      {/* Modal de criação/edição */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        fullWidth
        maxWidth="md"
        sx={{ '& .MuiDialog-paper': { width: '100%', margin: { xs: '16px', sm: '32px' } } }}
      >
        <DialogTitle>
          {modalMode === 'criar' ? 'Novo Usuário' : 'Editar Usuário'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Nome"
              name="nome"
              value={formData.nome}
              onChange={handleInputChange}
              fullWidth
              error={!!formErrors.nome}
              helperText={formErrors.nome}
            />
            
            <TextField
              label="E-mail"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              fullWidth
              error={!!formErrors.email}
              helperText={formErrors.email}
              disabled={modalMode === 'editar'}
            />
            
            {modalMode === 'criar' && (
              <TextField
                label="Senha"
                name="senha"
                type="password"
                value={formData.senha}
                onChange={handleInputChange}
                fullWidth
                error={!!formErrors.senha}
                helperText={formErrors.senha}
              />
            )}
            
            <TextField
              label="Telefone"
              name="telefone"
              value={formData.telefone}
              onChange={handleInputChange}
              fullWidth
            />
            
            <FormControl fullWidth>
              <InputLabel>Tipo de Usuário</InputLabel>
              <Select
                name="tipo"
                value={formData.tipo}
                onChange={handleSelectChange}
                label="Tipo de Usuário"
                disabled={!isMasterPlataforma}
              >
                <MenuItem value="usuario_loja">Administrador de Loja</MenuItem>
                <MenuItem value="master_plataforma">Administrador da Plataforma</MenuItem>
                <MenuItem value="cliente">Cliente</MenuItem>
              </Select>
            </FormControl>
            
            {/* Mostrar campo de seleção de loja para administradores de loja e clientes */}
            {(formData.tipo === 'usuario_loja' || formData.tipo === 'cliente') && isMasterPlataforma && (
              <FormControl fullWidth error={!!formErrors.loja_id}>
                <InputLabel>Loja</InputLabel>
                <Select
                  name="loja_id"
                  value={formData.loja_id || ''}
                  onChange={handleSelectChange}
                  label="Loja"
                >
                  <MenuItem value="">
                    <em>Selecione uma loja</em>
                  </MenuItem>
                  {lojas.map(loja => (
                    <MenuItem key={loja.id} value={loja.id}>
                      {loja.nome_fantasia}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.loja_id && (
                  <Typography variant="caption" color="error">
                    {formErrors.loja_id}
                  </Typography>
                )}
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseModal} color="inherit">
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={formLoading}
          >
            {formLoading ? <CircularProgress size={24} /> : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de associação de loja */}
      <Dialog
        open={openLojaModal}
        onClose={handleCloseLojaModal}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {usuarioParaAssociar?.loja_id ? 'Alterar Associação de Loja' : 'Associar à Loja'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              Usuário: <strong>{usuarioParaAssociar?.nome}</strong>
            </Typography>
            
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Loja</InputLabel>
              <Select
                value={lojaSelecionada}
                onChange={(e) => setLojaSelecionada(e.target.value)}
                label="Loja"
              >
                <MenuItem value="">
                  <em>Nenhuma (Remover associação)</em>
                </MenuItem>
                {lojas.map(loja => (
                  <MenuItem key={loja.id} value={loja.id}>
                    {loja.nome_fantasia}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseLojaModal} color="inherit">
            Cancelar
          </Button>
          <Button 
            onClick={handleAssociarLoja} 
            variant="contained" 
            color="primary"
            disabled={lojaLoading}
          >
            {lojaLoading ? <CircularProgress size={24} /> : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </MainLayout>
  );
};

export default GerenciarUsuarios;
