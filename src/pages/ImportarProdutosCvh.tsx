import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Stepper, 
  Step, 
  StepLabel,
  CircularProgress,
  Alert,
  Snackbar,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { 
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  ArrowRightAlt as ArrowRightAltIcon
} from '@mui/icons-material';
import { produtosCvhService, ResultadoAnalise, ImportacaoCvh, ProdutoAlterado } from '../services/produtosCvhService';
import { useAuth } from '../contexts/AuthContext';

const ImportarProdutosCvh = () => {
  const { user } = useAuth();
  
  // Estados para o stepper
  const [activeStep, setActiveStep] = useState(0);
  const steps = ['Selecionar Arquivo', 'Analisar Dados', 'Confirmar Importação'];
  
  // Estados para o arquivo
  const [file, setFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Estados para a análise
  const [analiseResult, setAnaliseResult] = useState<ResultadoAnalise | null>(null);
  const [isAnalisando, setIsAnalisando] = useState(false);
  const [analiseError, setAnaliseError] = useState<string | null>(null);
  
  // Estados para a importação
  const [importacaoId, setImportacaoId] = useState<string | null>(null);
  const [isImportando, setIsImportando] = useState(false);
  const [importacaoError, setImportacaoError] = useState<string | null>(null);
  const [importacaoConcluida, setImportacaoConcluida] = useState(false);
  
  // Estados para paginação das tabelas
  const [pageNovos, setPageNovos] = useState(0);
  const [rowsPerPageNovos, setRowsPerPageNovos] = useState(5);
  const [pageAlterados, setPageAlterados] = useState(0);
  const [rowsPerPageAlterados, setRowsPerPageAlterados] = useState(5);
  const [pageSemAlteracao, setPageSemAlteracao] = useState(0);
  const [rowsPerPageSemAlteracao, setRowsPerPageSemAlteracao] = useState(5);
  
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
  
  // Estado para controlar quais produtos serão importados
  const [produtosSelecionados, setProdutosSelecionados] = useState<{
    novos: string[]; // item_code dos produtos novos selecionados
    alterados: string[]; // item_code dos produtos alterados selecionados
  }>({
    novos: [],
    alterados: []
  });
  
  // Estado para controle de seleção geral
  const [selecionarTodosNovos, setSelecionarTodosNovos] = useState(true);
  const [selecionarTodosAlterados, setSelecionarTodosAlterados] = useState(true);
  
  // Verificar se o usuário é master_plataforma
  useEffect(() => {
    if (user && user.tipo !== 'master_plataforma') {
      setSnackbar({
        open: true,
        message: 'Apenas administradores da plataforma podem acessar esta página',
        severity: 'error'
      });
    }
  }, [user]);
  
  // Inicializar a seleção de produtos quando o resultado da análise estiver disponível
  useEffect(() => {
    if (analiseResult) {
      // Por padrão, selecionar todos os produtos novos e alterados
      setProdutosSelecionados({
        novos: analiseResult.novos.map(produto => produto.item_code),
        alterados: analiseResult.alterados.map(produto => produto.atual.item_code)
      });
    }
  }, [analiseResult]);
  
  // Funções para o stepper
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };
  
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  
  const handleReset = () => {
    setActiveStep(0);
    setFile(null);
    setAnaliseResult(null);
    setImportacaoId(null);
    setImportacaoConcluida(false);
    setUploadError(null);
    setAnaliseError(null);
    setImportacaoError(null);
  };
  
  // Função para selecionar arquivo
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const selectedFile = event.target.files[0];
      
      // Verificar se é um arquivo CSV
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        setUploadError('Por favor, selecione um arquivo CSV válido');
        return;
      }
      
      setFile(selectedFile);
      setUploadError(null);
    }
  };
  
  // Função para analisar o arquivo
  const handleAnalisarArquivo = async () => {
    if (!file) {
      setAnaliseError('Nenhum arquivo selecionado');
      return;
    }
    
    setIsAnalisando(true);
    setAnaliseError(null);
    
    try {
      const resultado = await produtosCvhService.analisarArquivoCsv(file);
      setAnaliseResult(resultado);
      handleNext();
    } catch (error: any) {
      console.error('Erro ao analisar arquivo:', error);
      setAnaliseError(error.message || 'Erro ao analisar arquivo');
    } finally {
      setIsAnalisando(false);
    }
  };
  
  // Função para confirmar a importação
  const handleConfirmarImportacao = async () => {
    if (!analiseResult || !file || !user) return;
    
    setIsImportando(true);
    setImportacaoError(null);
    
    try {
      // 1. Salvar o arquivo no Storage
      const arquivoPath = await produtosCvhService.salvarArquivoStorage(file, user.id);
      
      // 2. Criar registro de importação
      const importacao: ImportacaoCvh = {
        nome_arquivo: file.name,
        total_linhas: analiseResult.novos.length + analiseResult.alterados.length + analiseResult.semAlteracao.length,
        novos: produtosSelecionados.novos.length,
        alterados: produtosSelecionados.alterados.length,
        usuario_id: user.id,
        status: 'pendente',
        diff_preview: {
          novos: produtosSelecionados.novos.length,
          alterados: analiseResult.alterados
            .filter(item => produtosSelecionados.alterados.includes(item.atual.item_code))
            .map(item => ({
              item_cod: item.atual.item_code,
              codbarra: item.atual.codbarra,
              diferencas: item.diferencas
            })),
          erros: analiseResult.erros
        },
        arquivo_path: arquivoPath
      };
      
      const id = await produtosCvhService.criarImportacao(importacao);
      setImportacaoId(id);
      
      // 3. Confirmar a importação (inserir/atualizar produtos)
      await produtosCvhService.confirmarImportacao(
        id,
        analiseResult.novos.filter(produto => produtosSelecionados.novos.includes(produto.item_code)),
        analiseResult.alterados.filter(produto => produtosSelecionados.alterados.includes(produto.atual.item_code))
      );
      
      setImportacaoConcluida(true);
      handleNext();
      
      setSnackbar({
        open: true,
        message: 'Importação concluída com sucesso!',
        severity: 'success'
      });
    } catch (error: any) {
      console.error('Erro ao confirmar importação:', error);
      setImportacaoError(error.message || 'Erro ao confirmar importação');
      
      setSnackbar({
        open: true,
        message: error.message || 'Erro ao confirmar importação',
        severity: 'error'
      });
    } finally {
      setIsImportando(false);
    }
  };
  
  // Funções para paginação
  const handleChangePageNovos = (_: unknown, newPage: number) => {
    setPageNovos(newPage);
  };
  
  const handleChangeRowsPerPageNovos = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPageNovos(parseInt(event.target.value, 10));
    setPageNovos(0);
  };
  
  const handleChangePageAlterados = (_: unknown, newPage: number) => {
    setPageAlterados(newPage);
  };
  
  const handleChangeRowsPerPageAlterados = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPageAlterados(parseInt(event.target.value, 10));
    setPageAlterados(0);
  };
  
  const handleChangePageSemAlteracao = (_: unknown, newPage: number) => {
    setPageSemAlteracao(newPage);
  };
  
  const handleChangeRowsPerPageSemAlteracao = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPageSemAlteracao(parseInt(event.target.value, 10));
    setPageSemAlteracao(0);
  };
  
  // Função para fechar o snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };
  
  // Função para renderizar as alterações de forma mais clara
  const renderAlteracoes = (item: ProdutoAlterado) => {
    const { diferencas } = item;
    
    // Mapeamento de nomes de campos para exibição mais amigável
    const nomesAmigaveis: Record<string, string> = {
      'item_code': 'Código',
      'descricao': 'Descrição',
      'descricao_curta': 'Descrição Curta',
      'cod_categoria': 'Código Categoria',
      'descricao_categoria': 'Categoria',
      'cod_grupo': 'Código Grupo',
      'descricao_grupo': 'Grupo',
      'ncm': 'NCM',
      'class_cond': 'Classificação',
      'grupo_com': 'Grupo Comercial',
      'grupo_log': 'Grupo Logístico',
      'cst_sp': 'CST SP',
      'peso': 'Peso',
      'cpc': 'CPC',
      'epc': 'EPC',
      'upc': 'UPC',
      'cor': 'Cor'
    };
    
    // Filtrar apenas diferenças significativas
    const diferencasSignificativas = Object.entries(diferencas).filter(([_campo, valores]) => {
      const { de, para } = valores;
      
      // Ignorar diferenças entre null/undefined e string vazia
      if ((de === null || de === undefined) && (para === '' || para === null || para === undefined)) {
        return false;
      }
      if ((para === null || para === undefined) && (de === '' || de === null || de === undefined)) {
        return false;
      }
      
      // Ignorar diferenças entre números e strings numéricas
      if (typeof de === 'number' && typeof para === 'string' && de.toString() === para) {
        return false;
      }
      if (typeof para === 'number' && typeof de === 'string' && para.toString() === de) {
        return false;
      }
      
      return true;
    });
    
    if (diferencasSignificativas.length === 0) {
      return <Typography color="text.secondary">Sem alterações significativas</Typography>;
    }
    
    return (
      <Box>
        {diferencasSignificativas.map(([campo, valores]) => (
          <Box key={campo} sx={{ mb: 1 }}>
            <Typography variant="caption" fontWeight="bold">
              {nomesAmigaveis[campo] || campo}:
            </Typography>
            <Box display="flex" alignItems="center">
              <Box 
                sx={{ 
                  bgcolor: 'error.light', 
                  p: 0.5, 
                  borderRadius: 1, 
                  mr: 1,
                  maxWidth: '45%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                <Typography variant="body2">{valores.de === null || valores.de === undefined ? '(vazio)' : valores.de.toString()}</Typography>
              </Box>
              <ArrowRightAltIcon />
              <Box 
                sx={{ 
                  bgcolor: 'success.light', 
                  p: 0.5, 
                  borderRadius: 1, 
                  ml: 1,
                  maxWidth: '45%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                <Typography variant="body2">{valores.para === null || valores.para === undefined ? '(vazio)' : valores.para.toString()}</Typography>
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
    );
  };
  
  // Renderizar o conteúdo do step atual
  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Selecione o arquivo CSV com os produtos da CVH
            </Typography>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              O arquivo deve estar no formato CSV com os seguintes campos: itemcode, descricao, categoria, cor, detalhes, preco_unitario, unidade_medida, embalagem, cvh_data_atual
            </Typography>
            
            <Box sx={{ mt: 2, mb: 3 }}>
              <input
                accept=".csv"
                style={{ display: 'none' }}
                id="upload-csv-file"
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="upload-csv-file">
                <Button
                  variant="contained"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                >
                  Selecionar Arquivo
                </Button>
              </label>
              
              {file && (
                <Box sx={{ mt: 2 }}>
                  <Chip 
                    label={file.name}
                    color="primary"
                    icon={<CheckCircleIcon />}
                    onDelete={() => setFile(null)}
                  />
                </Box>
              )}
              
              {uploadError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {uploadError}
                </Alert>
              )}
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={handleAnalisarArquivo}
                disabled={!file || isAnalisando}
                startIcon={isAnalisando ? <CircularProgress size={20} /> : null}
              >
                {isAnalisando ? 'Analisando...' : 'Analisar Arquivo'}
              </Button>
            </Box>
          </Box>
        );
      
      case 1:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Análise do Arquivo
            </Typography>
            
            {analiseError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {analiseError}
              </Alert>
            )}
            
            {analiseResult && (
              <>
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" color="primary" gutterBottom>
                          Novos Produtos
                        </Typography>
                        <Typography variant="h4">
                          {analiseResult.novos.length}
                        </Typography>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent>
                        <Typography variant="h6" color="secondary" gutterBottom>
                          Produtos Alterados
                        </Typography>
                        <Typography variant="h4">
                          {analiseResult.alterados.length}
                        </Typography>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          Sem Alteração
                        </Typography>
                        <Typography variant="h4">
                          {analiseResult.semAlteracao.length}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>
                </Box>
                
                {analiseResult.erros.length > 0 && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" color="error" gutterBottom>
                      Erros Encontrados
                    </Typography>
                    
                    <List>
                      {analiseResult.erros.map((erro, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={`Erro na linha ${erro.linha}`}
                            secondary={erro.erro}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
                
                {analiseResult.novos.length > 0 && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" color="primary" gutterBottom>
                      Novos Produtos ({analiseResult.novos.length})
                    </Typography>
                    
                    <TableContainer component={Paper}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={selecionarTodosNovos}
                                    onChange={(event) => {
                                      setSelecionarTodosNovos(event.target.checked);
                                      setProdutosSelecionados(prev => ({
                                        ...prev,
                                        novos: event.target.checked ? analiseResult.novos.map(produto => produto.item_code) : []
                                      }));
                                    }}
                                  />
                                }
                                label="Selecionar Todos"
                              />
                            </TableCell>
                            <TableCell>Código</TableCell>
                            <TableCell>Código de Barras</TableCell>
                            <TableCell>Descrição</TableCell>
                            <TableCell>Categoria</TableCell>
                            <TableCell>Grupo</TableCell>
                            <TableCell>Preço</TableCell>
                            <TableCell>Unidade</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {analiseResult.novos
                            .slice(pageNovos * rowsPerPageNovos, pageNovos * rowsPerPageNovos + rowsPerPageNovos)
                            .map((produto) => (
                              <TableRow key={produto.item_code}>
                                <TableCell>
                                  <Checkbox
                                    checked={produtosSelecionados.novos.includes(produto.item_code)}
                                    onChange={(event) => {
                                      if (event.target.checked) {
                                        setProdutosSelecionados(prev => ({
                                          ...prev,
                                          novos: [...prev.novos, produto.item_code]
                                        }));
                                      } else {
                                        setProdutosSelecionados(prev => ({
                                          ...prev,
                                          novos: prev.novos.filter(item_code => item_code !== produto.item_code)
                                        }));
                                      }
                                    }}
                                  />
                                </TableCell>
                                <TableCell>{produto.item_code}</TableCell>
                                <TableCell>{produto.codbarra}</TableCell>
                                <TableCell>{produto.descricao}</TableCell>
                                <TableCell>{produto.descricao_categoria || produto.cod_categoria || '-'}</TableCell>
                                <TableCell>{produto.descricao_grupo || produto.cod_grupo || '-'}</TableCell>
                                <TableCell>R$ {produto.preco_unitario.toFixed(2)}</TableCell>
                                <TableCell>{produto.unidade_medida}</TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                      
                      <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={analiseResult.novos.length}
                        rowsPerPage={rowsPerPageNovos}
                        page={pageNovos}
                        onPageChange={handleChangePageNovos}
                        onRowsPerPageChange={handleChangeRowsPerPageNovos}
                        labelRowsPerPage="Itens por página:"
                        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                      />
                    </TableContainer>
                  </Box>
                )}
                
                {analiseResult.alterados.length > 0 && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" color="secondary" gutterBottom>
                      Produtos Alterados ({analiseResult.alterados.length})
                    </Typography>
                    
                    <TableContainer component={Paper}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={selecionarTodosAlterados}
                                    onChange={(event) => {
                                      setSelecionarTodosAlterados(event.target.checked);
                                      setProdutosSelecionados(prev => ({
                                        ...prev,
                                        alterados: event.target.checked ? analiseResult.alterados.map(produto => produto.atual.item_code) : []
                                      }));
                                    }}
                                  />
                                }
                                label="Selecionar Todos"
                              />
                            </TableCell>
                            <TableCell>Código</TableCell>
                            <TableCell>Código de Barras</TableCell>
                            <TableCell>Descrição</TableCell>
                            <TableCell>Categoria</TableCell>
                            <TableCell>Grupo</TableCell>
                            <TableCell>Alterações</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {analiseResult.alterados
                            .slice(pageAlterados * rowsPerPageAlterados, pageAlterados * rowsPerPageAlterados + rowsPerPageAlterados)
                            .map((item) => (
                              <TableRow key={item.atual.item_code}>
                                <TableCell>
                                  <Checkbox
                                    checked={produtosSelecionados.alterados.includes(item.atual.item_code)}
                                    onChange={(event) => {
                                      if (event.target.checked) {
                                        setProdutosSelecionados(prev => ({
                                          ...prev,
                                          alterados: [...prev.alterados, item.atual.item_code]
                                        }));
                                      } else {
                                        setProdutosSelecionados(prev => ({
                                          ...prev,
                                          alterados: prev.alterados.filter(item_code => item_code !== item.atual.item_code)
                                        }));
                                      }
                                    }}
                                  />
                                </TableCell>
                                <TableCell>{item.atual.item_code}</TableCell>
                                <TableCell>{item.atual.codbarra}</TableCell>
                                <TableCell>{item.atual.descricao}</TableCell>
                                <TableCell>{item.atual.descricao_categoria || item.atual.cod_categoria || '-'}</TableCell>
                                <TableCell>{item.atual.descricao_grupo || item.atual.cod_grupo || '-'}</TableCell>
                                <TableCell>
                                  {renderAlteracoes(item)}
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                      
                      <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={analiseResult.alterados.length}
                        rowsPerPage={rowsPerPageAlterados}
                        page={pageAlterados}
                        onPageChange={handleChangePageAlterados}
                        onRowsPerPageChange={handleChangeRowsPerPageAlterados}
                        labelRowsPerPage="Itens por página:"
                        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                      />
                    </TableContainer>
                  </Box>
                )}
                
                {analiseResult.semAlteracao.length > 0 && (
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Produtos Sem Alteração ({analiseResult.semAlteracao.length})
                      </Typography>
                      <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                        <Table size="small" stickyHeader>
                          <TableHead>
                            <TableRow>
                              <TableCell>Código</TableCell>
                              <TableCell>Código de Barras</TableCell>
                              <TableCell>Descrição</TableCell>
                              <TableCell>Categoria</TableCell>
                              <TableCell>Grupo</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {analiseResult.semAlteracao
                              .slice(pageSemAlteracao * rowsPerPageSemAlteracao, pageSemAlteracao * rowsPerPageSemAlteracao + rowsPerPageSemAlteracao)
                              .map((produto) => (
                                <TableRow key={produto.item_code}>
                                  <TableCell>{produto.item_code}</TableCell>
                                  <TableCell>{produto.codbarra}</TableCell>
                                  <TableCell>{produto.descricao}</TableCell>
                                  <TableCell>{produto.descricao_categoria || produto.cod_categoria || '-'}</TableCell>
                                  <TableCell>{produto.descricao_grupo || produto.cod_grupo || '-'}</TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={analiseResult.semAlteracao.length}
                        rowsPerPage={rowsPerPageSemAlteracao}
                        page={pageSemAlteracao}
                        onPageChange={handleChangePageSemAlteracao}
                        onRowsPerPageChange={handleChangeRowsPerPageSemAlteracao}
                      />
                    </CardContent>
                  </Card>
                )}
              </>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button onClick={handleBack}>
                Voltar
              </Button>
              <Button
                variant="contained"
                onClick={handleConfirmarImportacao}
                disabled={!analiseResult || isImportando || (produtosSelecionados.novos.length === 0 && produtosSelecionados.alterados.length === 0)}
                startIcon={isImportando ? <CircularProgress size={20} /> : null}
              >
                {isImportando ? 'Importando...' : 'Confirmar Importação'}
              </Button>
            </Box>
          </Box>
        );
      
      case 2:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Resultado da Importação
            </Typography>
            
            {importacaoError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {importacaoError}
              </Alert>
            )}
            
            {importacaoConcluida && analiseResult && (
              <Box sx={{ mb: 3 }}>
                <Alert severity="success" sx={{ mb: 3 }}>
                  Importação concluída com sucesso!
                </Alert>
                
                <Paper sx={{ p: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Resumo da Importação
                  </Typography>
                  
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Arquivo"
                        secondary={file?.name}
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText
                        primary="Produtos Novos"
                        secondary={produtosSelecionados.novos.length}
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText
                        primary="Produtos Alterados"
                        secondary={produtosSelecionados.alterados.length}
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText
                        primary="Total de Produtos Processados"
                        secondary={produtosSelecionados.novos.length + produtosSelecionados.alterados.length}
                      />
                    </ListItem>
                    {importacaoId && (
                      <>
                        <Divider />
                        <ListItem>
                          <ListItemText
                            primary="ID da Importação"
                            secondary={importacaoId}
                          />
                        </ListItem>
                      </>
                    )}
                  </List>
                </Paper>
              </Box>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button
                variant="contained"
                onClick={handleReset}
                startIcon={<RefreshIcon />}
              >
                Nova Importação
              </Button>
            </Box>
          </Box>
        );
      
      default:
        return 'Passo desconhecido';
    }
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <CloudUploadIcon sx={{ mr: 1, fontSize: 30, color: 'primary.main' }} />
        <Typography variant="h4">
          Importar Produtos CVH
        </Typography>
      </Box>
      
      <Paper elevation={3} sx={{ mb: 4 }}>
        <Stepper activeStep={activeStep} sx={{ p: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {getStepContent(activeStep)}
      </Paper>
      
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

export default ImportarProdutosCvh;
