import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
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
  Grid,
  SelectChangeEvent
} from '@mui/material';
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Block as BlockIcon,
  Person as PersonIcon,
  LinkOff as LinkOffIcon,
  Link as LinkIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { usuarioService, Usuario, CriarUsuarioDTO, AtualizarUsuarioDTO } from '../services/usuarioService';
import { lojaService } from '../services/lojaService';
import { Loja } from '../types/auth';

const GerenciarUsuarios = () => {
  // Estados para a lista de usuários
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para paginação
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Estados para o modal de criação/edição
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState<'criar' | 'editar'>('criar');
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null);
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
  
  // Estados para o modal de associação de loja
  const [openLojaModal, setOpenLojaModal] = useState(false);
  const [usuarioParaAssociar, setUsuarioParaAssociar] = useState<Usuario | null>(null);
  const [lojaSelecionada, setLojaSelecionada] = useState<string>('');
  const [lojaLoading, setLojaLoading] = useState(false);
  
  // Estado para mensagens de sucesso/erro
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
        
        setUsuarios(usuariosData);
        setLojas(lojasData);
        setError(null);
      } catch (err: any) {
        console.error('Erro ao carregar dados:', err);
        setError(err.message || 'Falha ao carregar dados');
      } finally {
        setLoading(false);
      }
    };
    
    carregarDados();
  }, []);
  
  // Funções de paginação
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Funções para o modal de criação/edição
  const handleOpenCreateModal = () => {
    setFormData({
      email: '',
      senha: '',
      nome: '',
      telefone: '',
      tipo: 'usuario_loja',
      loja_id: undefined
    });
    setFormErrors({});
    setModalMode('criar');
    setUsuarioSelecionado(null);
    setOpenModal(true);
  };
  
  const handleOpenEditModal = (usuario: Usuario) => {
    setFormData({
      email: usuario.email,
      senha: '', // Não preenchemos a senha ao editar
      nome: usuario.nome,
      telefone: usuario.telefone || '',
      tipo: usuario.tipo,
      loja_id: usuario.loja_id
    });
    setFormErrors({});
    setModalMode('editar');
    setUsuarioSelecionado(usuario);
    setOpenModal(true);
  };
  
  const handleCloseModal = () => {
    setOpenModal(false);
  };
  
  // Handlers separados para TextField e Select
  const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name as string]: value
    }));
  };
  
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.nome) {
      errors.nome = 'Nome é obrigatório';
    }
    
    if (modalMode === 'criar') {
      if (!formData.email) {
        errors.email = 'Email é obrigatório';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'Email inválido';
      }
      
      if (!formData.senha) {
        errors.senha = 'Senha é obrigatória';
      } else if (formData.senha.length < 6) {
        errors.senha = 'A senha deve ter pelo menos 6 caracteres';
      }
    }
    
    if (!formData.tipo) {
      errors.tipo = 'Tipo é obrigatório';
    }
    
    // Validar regras de negócio para loja_id
    if (formData.tipo === 'master_plataforma' && formData.loja_id) {
      errors.loja_id = 'Administradores da plataforma não podem estar associados a uma loja';
    }
    
    if ((formData.tipo === 'usuario_loja' || formData.tipo === 'cliente') && !formData.loja_id) {
      errors.loja_id = 'Usuários de loja e clientes devem estar associados a uma loja';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmitForm = async () => {
    if (!validateForm()) {
      return;
    }
    
    setFormLoading(true);
    
    try {
      if (modalMode === 'criar') {
        await usuarioService.criarUsuario(formData);
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
        setSnackbar({
          open: true,
          message: 'Usuário atualizado com sucesso!',
          severity: 'success'
        });
      }
      
      // Recarregar a lista de usuários
      const usuariosAtualizados = await usuarioService.listarUsuarios();
      setUsuarios(usuariosAtualizados);
      
      handleCloseModal();
    } catch (err: any) {
      console.error('Erro ao salvar usuário:', err);
      setSnackbar({
        open: true,
        message: err.message || 'Falha ao salvar usuário',
        severity: 'error'
      });
    } finally {
      setFormLoading(false);
    }
  };
  
  // Funções para alterar status do usuário
  const handleAlterarStatus = async (usuario: Usuario, novoStatus: 'ativo' | 'inativo') => {
    try {
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
      console.error('Erro ao alterar status do usuário:', err);
      setSnackbar({
        open: true,
        message: err.message || `Falha ao ${novoStatus === 'ativo' ? 'ativar' : 'desativar'} usuário`,
        severity: 'error'
      });
    }
  };
  
  // Funções para resetar senha
  const handleResetarSenha = async (email: string) => {
    try {
      await usuarioService.resetarSenha(email);
      
      setSnackbar({
        open: true,
        message: 'Email de redefinição de senha enviado com sucesso!',
        severity: 'success'
      });
    } catch (err: any) {
      console.error('Erro ao resetar senha:', err);
      setSnackbar({
        open: true,
        message: err.message || 'Falha ao enviar email de redefinição de senha',
        severity: 'error'
      });
    }
  };
  
  // Funções para o modal de associação de loja
  const handleOpenLojaModal = (usuario: Usuario) => {
    setUsuarioParaAssociar(usuario);
    setLojaSelecionada(usuario.loja_id || '');
    setOpenLojaModal(true);
  };
  
  const handleCloseLojaModal = () => {
    setOpenLojaModal(false);
    setUsuarioParaAssociar(null);
    setLojaSelecionada('');
  };
  
  const handleAssociarLoja = async () => {
    if (!usuarioParaAssociar) return;
    
    setLojaLoading(true);
    
    try {
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
        message: err.message || 'Falha ao associar/desassociar loja',
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
    setSnackbar(prev => ({ ...prev, open: false }));
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center' }}>
          <PersonIcon sx={{ mr: 1, fontSize: 30, color: 'primary.main' }} />
          Gerenciar Usuários
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateModal}
        >
          Novo Usuário
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper elevation={3}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Loja</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={40} />
                    <Typography variant="body1" sx={{ mt: 2 }}>
                      Carregando usuários...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : usuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1">
                      Nenhum usuário encontrado
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                usuarios
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((usuario) => (
                    <TableRow key={usuario.id}>
                      <TableCell>{usuario.nome}</TableCell>
                      <TableCell>{usuario.email}</TableCell>
                      <TableCell>
                        <Chip 
                          label={
                            usuario.tipo === 'master_plataforma' ? 'Administrador' :
                            usuario.tipo === 'usuario_loja' ? 'Gerente de Loja' :
                            'Cliente'
                          }
                          color={
                            usuario.tipo === 'master_plataforma' ? 'primary' :
                            usuario.tipo === 'usuario_loja' ? 'secondary' :
                            'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={
                            usuario.status === 'ativo' ? 'Ativo' :
                            usuario.status === 'inativo' ? 'Inativo' :
                            'Pendente'
                          }
                          color={
                            usuario.status === 'ativo' ? 'success' :
                            usuario.status === 'inativo' ? 'error' :
                            'warning'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{getNomeLoja(usuario.loja_id)}</TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <IconButton 
                            color="primary" 
                            onClick={() => handleOpenEditModal(usuario)}
                            title="Editar usuário"
                          >
                            <EditIcon />
                          </IconButton>
                          
                          {usuario.status === 'ativo' ? (
                            <IconButton 
                              color="error" 
                              onClick={() => handleAlterarStatus(usuario, 'inativo')}
                              title="Desativar usuário"
                            >
                              <BlockIcon />
                            </IconButton>
                          ) : (
                            <IconButton 
                              color="success" 
                              onClick={() => handleAlterarStatus(usuario, 'ativo')}
                              title="Ativar usuário"
                            >
                              <CheckIcon />
                            </IconButton>
                          )}
                          
                          <IconButton 
                            color="info" 
                            onClick={() => handleResetarSenha(usuario.email)}
                            title="Resetar senha"
                          >
                            <RefreshIcon />
                          </IconButton>
                          
                          <IconButton 
                            color="secondary" 
                            onClick={() => handleOpenLojaModal(usuario)}
                            title={usuario.loja_id ? "Alterar associação de loja" : "Associar à loja"}
                          >
                            {usuario.loja_id ? <LinkIcon /> : <LinkOffIcon />}
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={usuarios.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Itens por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Paper>
      
      {/* Modal de criação/edição de usuário */}
      <Dialog 
        open={openModal} 
        onClose={handleCloseModal}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {modalMode === 'criar' ? 'Novo Usuário' : 'Editar Usuário'}
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Nome"
                name="nome"
                value={formData.nome}
                onChange={handleTextFieldChange}
                error={!!formErrors.nome}
                helperText={formErrors.nome}
                margin="normal"
                required
              />
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleTextFieldChange}
                error={!!formErrors.email}
                helperText={formErrors.email}
                margin="normal"
                required
                disabled={modalMode === 'editar'}
              />
            </Grid>
            
            {modalMode === 'criar' && (
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Senha"
                  name="senha"
                  type="password"
                  value={formData.senha}
                  onChange={handleTextFieldChange}
                  error={!!formErrors.senha}
                  helperText={formErrors.senha}
                  margin="normal"
                  required
                />
              </Grid>
            )}
            
            <Grid size={{ xs: 12, md: modalMode === 'criar' ? 6 : 12 }}>
              <TextField
                fullWidth
                label="Telefone"
                name="telefone"
                value={formData.telefone}
                onChange={handleTextFieldChange}
                margin="normal"
              />
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth margin="normal" required error={!!formErrors.tipo}>
                <InputLabel id="tipo-label">Tipo</InputLabel>
                <Select
                  labelId="tipo-label"
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleSelectChange}
                  label="Tipo"
                >
                  <MenuItem value="master_plataforma">Administrador</MenuItem>
                  <MenuItem value="usuario_loja">Gerente de Loja</MenuItem>
                  <MenuItem value="cliente">Cliente</MenuItem>
                </Select>
                {formErrors.tipo && (
                  <Typography variant="caption" color="error">
                    {formErrors.tipo}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth margin="normal" error={!!formErrors.loja_id}>
                <InputLabel id="loja-label">Loja {formData.tipo !== 'master_plataforma' ? '(obrigatório)' : '(opcional)'}</InputLabel>
                <Select
                  labelId="loja-label"
                  name="loja_id"
                  value={formData.loja_id || ''}
                  onChange={handleSelectChange}
                  label={`Loja ${formData.tipo !== 'master_plataforma' ? '(obrigatório)' : '(opcional)'}`}
                  disabled={formData.tipo === 'master_plataforma'}
                >
                  <MenuItem value="">
                    <em>Nenhuma</em>
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
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseModal} color="inherit">
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmitForm} 
            color="primary" 
            variant="contained"
            disabled={formLoading}
            startIcon={formLoading ? <CircularProgress size={20} /> : null}
          >
            {formLoading ? 'Salvando...' : 'Salvar'}
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
          Associar Usuário à Loja
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Usuário: <strong>{usuarioParaAssociar?.nome}</strong>
          </Typography>
          
          <FormControl fullWidth margin="normal">
            <InputLabel id="associar-loja-label">Loja</InputLabel>
            <Select
              labelId="associar-loja-label"
              value={lojaSelecionada}
              onChange={(e: SelectChangeEvent) => setLojaSelecionada(e.target.value)}
              label="Loja"
              disabled={usuarioParaAssociar?.tipo === 'master_plataforma'}
            >
              <MenuItem value="">
                <em>Nenhuma (Desassociar)</em>
              </MenuItem>
              {lojas.map(loja => (
                <MenuItem key={loja.id} value={loja.id}>
                  {loja.nome_fantasia}
                </MenuItem>
              ))}
            </Select>
            {usuarioParaAssociar?.tipo === 'master_plataforma' && (
              <Typography variant="caption" color="error">
                Administradores da plataforma não podem ser associados a uma loja
              </Typography>
            )}
          </FormControl>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseLojaModal} color="inherit">
            Cancelar
          </Button>
          <Button 
            onClick={handleAssociarLoja} 
            color="primary" 
            variant="contained"
            disabled={lojaLoading || usuarioParaAssociar?.tipo === 'master_plataforma'}
            startIcon={lojaLoading ? <CircularProgress size={20} /> : null}
          >
            {lojaLoading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar para mensagens */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GerenciarUsuarios;
