import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Alert, 
  Snackbar,
  InputAdornment,
  CircularProgress,
  Grid
} from '@mui/material';
import { 
  Store as StoreIcon, 
  ColorLens as ColorLensIcon 
} from '@mui/icons-material';
import { lojaService } from '../services/lojaService';

const CadastrarLoja = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
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
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.razao_social) {
      newErrors.razao_social = 'Razão social é obrigatória';
    }
    
    if (!formData.nome_fantasia) {
      newErrors.nome_fantasia = 'Nome fantasia é obrigatório';
    }
    
    if (!formData.cnpj) {
      newErrors.cnpj = 'CNPJ é obrigatório';
    } else if (!/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(formData.cnpj)) {
      newErrors.cnpj = 'CNPJ inválido. Use o formato: 00.000.000/0000-00';
    }
    
    if (!formData.email_contato) {
      newErrors.email_contato = 'Email de contato é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email_contato)) {
      newErrors.email_contato = 'Email inválido';
    }
    
    if (!formData.telefone) {
      newErrors.telefone = 'Telefone é obrigatório';
    }
    
    if (!formData.endereco) {
      newErrors.endereco = 'Endereço é obrigatório';
    }
    
    if (!formData.slug) {
      newErrors.slug = 'Slug é obrigatório';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug deve conter apenas letras minúsculas, números e hífens';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('tema.')) {
      const temaField = name.split('.')[1];
      setFormData({
        ...formData,
        tema: {
          ...formData.tema,
          [temaField]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setErrorMessage(null);
    
    try {
      await lojaService.criarLoja(formData);
      setSuccess(true);
      
      // Limpar o formulário após sucesso
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
      
      // Redirecionar para a lista de lojas após 2 segundos
      setTimeout(() => {
        navigate('/lojas');
      }, 2000);
    } catch (error: any) {
      console.error('Erro ao cadastrar loja:', error);
      setErrorMessage(error.message || 'Falha ao cadastrar loja');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCloseSnackbar = () => {
    setSuccess(false);
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <StoreIcon sx={{ mr: 1, fontSize: 30, color: 'primary.main' }} />
        <Typography variant="h4">
          Cadastrar Nova Loja
        </Typography>
      </Box>
      
      <Paper elevation={3} sx={{ p: 3 }}>
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errorMessage}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Razão Social"
                name="razao_social"
                value={formData.razao_social}
                onChange={handleChange}
                error={!!errors.razao_social}
                helperText={errors.razao_social}
                required
              />
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Nome Fantasia"
                name="nome_fantasia"
                value={formData.nome_fantasia}
                onChange={handleChange}
                error={!!errors.nome_fantasia}
                helperText={errors.nome_fantasia}
                required
              />
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="CNPJ"
                name="cnpj"
                value={formData.cnpj}
                onChange={handleChange}
                error={!!errors.cnpj}
                helperText={errors.cnpj || 'Formato: 00.000.000/0000-00'}
                required
              />
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Email de Contato"
                name="email_contato"
                type="email"
                value={formData.email_contato}
                onChange={handleChange}
                error={!!errors.email_contato}
                helperText={errors.email_contato}
                required
              />
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Telefone"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                error={!!errors.telefone}
                helperText={errors.telefone}
                required
              />
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Endereço"
                name="endereco"
                value={formData.endereco}
                onChange={handleChange}
                error={!!errors.endereco}
                helperText={errors.endereco}
                required
              />
            </Grid>
            
            <Grid size={12}>
              <TextField
                fullWidth
                label="Slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                error={!!errors.slug}
                helperText={errors.slug || 'URL da loja: florify.com/lojas/seu-slug'}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">florify.com/lojas/</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid size={12}>
              <Box sx={{ mt: 2, mb: 3 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <ColorLensIcon sx={{ mr: 1 }} />
                  Cores da Loja
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Personalize as cores da sua loja
                </Typography>
              </Box>
            </Grid>
            
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Cor Primária"
                name="tema.corPrimaria"
                value={formData.tema.corPrimaria}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box 
                        sx={{ 
                          width: 20, 
                          height: 20, 
                          bgcolor: formData.tema.corPrimaria,
                          borderRadius: 1,
                          border: '1px solid #ccc'
                        }} 
                      />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Cor Secundária"
                name="tema.corSecundaria"
                value={formData.tema.corSecundaria}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box 
                        sx={{ 
                          width: 20, 
                          height: 20, 
                          bgcolor: formData.tema.corSecundaria,
                          borderRadius: 1,
                          border: '1px solid #ccc'
                        }} 
                      />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Cor de Destaque"
                name="tema.corDestaque"
                value={formData.tema.corDestaque}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box 
                        sx={{ 
                          width: 20, 
                          height: 20, 
                          bgcolor: formData.tema.corDestaque,
                          borderRadius: 1,
                          border: '1px solid #ccc'
                        }} 
                      />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Cor de Fundo"
                name="tema.corFundo"
                value={formData.tema.corFundo}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box 
                        sx={{ 
                          width: 20, 
                          height: 20, 
                          bgcolor: formData.tema.corFundo,
                          borderRadius: 1,
                          border: '1px solid #ccc'
                        }} 
                      />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Cor de Texto"
                name="tema.corTexto"
                value={formData.tema.corTexto}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box 
                        sx={{ 
                          width: 20, 
                          height: 20, 
                          bgcolor: formData.tema.corTexto,
                          borderRadius: 1,
                          border: '1px solid #ccc'
                        }} 
                      />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid size={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button 
                  variant="outlined" 
                  onClick={() => navigate(-1)}
                  sx={{ mr: 2 }}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <StoreIcon />}
                >
                  {loading ? 'Cadastrando...' : 'Cadastrar Loja'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
      
      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          Loja cadastrada com sucesso! Redirecionando...
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CadastrarLoja;
