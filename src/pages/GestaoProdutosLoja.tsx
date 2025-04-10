import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Container, Typography, Box, Button, FormControl, InputLabel, 
  Select, MenuItem, TextField, Chip, CircularProgress, Alert, Snackbar,
  InputAdornment, IconButton, Tooltip, Modal,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import CheckIcon from '@mui/icons-material/Check';
import { useAuth } from '../contexts/AuthContext';
import produtosLojaCvhService, { ProdutoLojaCvhCompleto, FiltrosProdutosLoja } from '../services/produtosLojaCvhService';
import { lojaService } from '../services/lojaService';

// Interface para operações em lote de produtos
interface OperacaoProdutoLoja {
  codbarra: string;
  operacao: 'ativar' | 'desativar';
  motivo: string;
  ativo: boolean;
}

// Interface para lojas
interface Loja {
  id: string;
  razao_social: string;
  nome_fantasia: string;
}

const GestaoProdutosLoja: React.FC = () => {
  const { user } = useAuth();
  
  // Estados para carregamento
  const [carregando, setCarregando] = useState<boolean>(false);
  const [carregandoProdutos, setCarregandoProdutos] = useState<boolean>(false);
  const [carregandoDiagnostico, setCarregandoDiagnostico] = useState<boolean>(false);
  
  // Estados para dados
  const [lojaSelecionada, setLojaSelecionada] = useState<string>('');
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [produtosFiltrados, setProdutosFiltrados] = useState<ProdutoLojaCvhCompleto[]>([]);
  const [contagem, setContagem] = useState({ ativos: 0, inativos: 0, total: 0 });
  
  // Estados para opções de filtro
  const [opcoesCategorias, setOpcoesCategorias] = useState<string[]>([]);
  const [opcoesCores, setOpcoesCores] = useState<string[]>([]);
  
  // Estados para feedback
  const [feedbackVisivel, setFeedbackVisivel] = useState(false);
  const [feedbackMensagem, setFeedbackMensagem] = useState('');
  const [feedbackTipo, setFeedbackTipo] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  
  // Estado para modal de edição
  const [modalEdicaoVisivel, setModalEdicaoVisivel] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoLojaCvhCompleto | null>(null);

  // Estado para filtros aplicados (usados na consulta)
  const [filtros, setFiltros] = useState<FiltrosProdutosLoja>({
    descricao: '',
    codbarra: '',
    item_code: '',
    categoria: [],
    cor: [],
    ativo: null
  });
  
  // Estado para filtros temporários (usados nos inputs)
  const [filtrosTemp, setFiltrosTemp] = useState<FiltrosProdutosLoja>({
    descricao: '',
    codbarra: '',
    item_code: '',
    categoria: [],
    cor: [],
    ativo: null
  });
  
  // Referências para os campos de texto
  const descricaoRef = useRef<HTMLInputElement>(null);
  const codbarraRef = useRef<HTMLInputElement>(null);
  const itemCodeRef = useRef<HTMLInputElement>(null);
  
  // Referência para timeout de debounce
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Verificar permissões do usuário
  const isMasterPlataforma = user?.tipo === 'master_plataforma';
  const isUsuarioLoja = user?.tipo === 'usuario_loja';
  
  // Função para mostrar feedback ao usuário
  const mostrarFeedback = useCallback((mensagem: string, tipo: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setFeedbackMensagem(mensagem);
    setFeedbackTipo(tipo);
    setFeedbackVisivel(true);
  }, []);
  
  // Função para fechar o feedback
  const handleCloseFeedback = useCallback(() => {
    setFeedbackVisivel(false);
  }, []);
  
  // Efeito para carregar lojas quando o componente montar
  useEffect(() => {
    const carregarLojas = async () => {
      try {
        setCarregando(true);
        const lojasData = await lojaService.listarLojas();
        setLojas(lojasData);
        
        // Se o usuário for do tipo "usuario_loja", selecionar automaticamente a loja associada
        if (isUsuarioLoja && user?.loja_id) {
          setLojaSelecionada(user.loja_id);
          
          // Carregar produtos da loja automaticamente
          try {
            setCarregandoProdutos(true);
            const filtrosLimpos: FiltrosProdutosLoja = {
              descricao: '',
              codbarra: '',
              item_code: '',
              categoria: [],
              cor: [],
              ativo: null
            };
            
            const produtosLoja = await produtosLojaCvhService.listarProdutos(user.loja_id, filtrosLimpos);
            setProdutosFiltrados(produtosLoja);
            
            // Atualizar contagem
            const ativos = produtosLoja.filter(p => p.ativo).length;
            const total = produtosLoja.length;
            setContagem({
              ativos,
              inativos: total - ativos,
              total
            });
          } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            mostrarFeedback('Erro ao carregar produtos. Tente novamente.', 'error');
          } finally {
            setCarregandoProdutos(false);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar lojas:', error);
        mostrarFeedback('Erro ao carregar lojas. Tente novamente.', 'error');
      } finally {
        setCarregando(false);
      }
    };

    carregarLojas();
  }, [mostrarFeedback, isUsuarioLoja, user, produtosLojaCvhService]);

  // Efeito para carregar opções de filtro quando a loja for selecionada
  useEffect(() => {
    const carregarOpcoesFiltro = async () => {
      if (!lojaSelecionada) return;

      try {
        const opcoes = await produtosLojaCvhService.obterOpcoesFiltro(lojaSelecionada);
        setOpcoesCategorias(opcoes.categorias);
        setOpcoesCores(opcoes.cores);
      } catch (error) {
        console.error('Erro ao carregar opções de filtro:', error);
      }
    };

    if (lojaSelecionada) {
      carregarOpcoesFiltro();
    }
  }, [lojaSelecionada]);

  // Função para carregar produtos com base na loja selecionada e filtros
  const carregarProdutos = useCallback(async () => {
    if (!lojaSelecionada) {
      mostrarFeedback('Selecione uma loja para carregar produtos', 'warning');
      return;
    }

    try {
      setCarregandoProdutos(true);

      // Carregar produtos da loja selecionada usando o serviço
      const produtosLoja = await produtosLojaCvhService.listarProdutos(lojaSelecionada, filtrosTemp);
      setProdutosFiltrados(produtosLoja);

      // Atualizar contagem
      const ativos = produtosLoja.filter(p => p.ativo).length;
      const total = produtosLoja.length;
      setContagem({
        ativos,
        inativos: total - ativos,
        total
      });
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      mostrarFeedback('Erro ao carregar produtos. Tente novamente.', 'error');
    } finally {
      setCarregandoProdutos(false);
    }
  }, [lojaSelecionada, filtrosTemp, mostrarFeedback]);

  // Função para lidar com mudança de texto nos campos de filtro
  const handleChangeTexto = useCallback((campo: keyof FiltrosProdutosLoja) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;

    // Atualizar estado temporário imediatamente para manter o campo atualizado
    setFiltrosTemp(prev => ({
      ...prev,
      [campo]: valor
    }));

    // Cancelar timeout anterior se existir
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Configurar novo timeout para aplicar o filtro após um atraso
    debounceTimeoutRef.current = setTimeout(() => {
      carregarProdutos();
    }, 500); // 500ms de debounce
  }, [carregarProdutos]);

  // Função para aplicar filtros
  const aplicarFiltros = useCallback(() => {
    setFiltros(filtrosTemp);
    carregarProdutos();
  }, [filtrosTemp, carregarProdutos]);

  // Função para lidar com mudança de status (ativo/inativo)
  const handleChangeStatus = useCallback((e: SelectChangeEvent<string>) => {
    const valor = e.target.value;
    let ativoValue: boolean | null = null;

    if (valor === 'ativos') {
      ativoValue = true;
    } else if (valor === 'inativos') {
      ativoValue = false;
    }

    // Atualizar estado temporário imediatamente para manter o campo atualizado
    setFiltrosTemp(prev => ({
      ...prev,
      ativo: ativoValue
    }));
    
    // Chamar aplicarFiltros para garantir que os filtros sejam aplicados corretamente
    // Isso irá atualizar filtros com filtrosTemp e chamar carregarProdutos()
    aplicarFiltros();
  }, [aplicarFiltros]);

  // Função para limpar filtros
  const limparFiltros = useCallback(() => {
    const filtrosLimpos: FiltrosProdutosLoja = {
      descricao: '',
      codbarra: '',
      item_code: '',
      categoria: [],
      cor: [],
      ativo: null
    };

    setFiltrosTemp(filtrosLimpos);

    // Limpar campos de texto manualmente
    if (descricaoRef.current) descricaoRef.current.value = '';
    if (codbarraRef.current) codbarraRef.current.value = '';
    if (itemCodeRef.current) itemCodeRef.current.value = '';

    carregarProdutos();
  }, [carregarProdutos]);

  // Função para lidar com mudança de loja
  const handleChangeLoja = useCallback(async (event: SelectChangeEvent<string>) => {
    const novaLoja = event.target.value;
    setLojaSelecionada(novaLoja);
    
    // Limpar filtros sem chamar carregarProdutos
    const filtrosLimpos: FiltrosProdutosLoja = {
      descricao: '',
      codbarra: '',
      item_code: '',
      categoria: [],
      cor: [],
      ativo: null
    };
    
    setFiltrosTemp(filtrosLimpos);
    setFiltros(filtrosLimpos);
    
    // Limpar campos de texto manualmente
    if (descricaoRef.current) descricaoRef.current.value = '';
    if (codbarraRef.current) codbarraRef.current.value = '';
    if (itemCodeRef.current) itemCodeRef.current.value = '';
    
    // Carregar produtos com a nova loja selecionada
    try {
      setCarregandoProdutos(true);
      const produtosLoja = await produtosLojaCvhService.listarProdutos(novaLoja, filtrosLimpos);
      setProdutosFiltrados(produtosLoja);
      
      // Atualizar contagem
      const ativos = produtosLoja.filter(p => p.ativo).length;
      const total = produtosLoja.length;
      setContagem({
        ativos,
        inativos: total - ativos,
        total
      });
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      mostrarFeedback('Erro ao carregar produtos. Tente novamente.', 'error');
    } finally {
      setCarregandoProdutos(false);
    }
  }, [mostrarFeedback]);

  // Função para carregar produtos com filtros para o modo de associação
  const carregarProdutosParaAssociacao = useCallback(async () => {
    if (!lojaSelecionada) return;

    try {
      setCarregandoProdutos(true);

      // Buscar produtos CVH com informação de associação
      const produtosCvh = await produtosLojaCvhService.listarProdutos(
        lojaSelecionada,
        filtrosTemp
      );
      setProdutosFiltrados(produtosCvh);
    } catch (error: any) {
      console.error('Erro ao carregar produtos para associação:', error);
      mostrarFeedback(`Erro ao carregar produtos: ${error.message}`, 'error');
    } finally {
      setCarregandoProdutos(false);
    }
  }, [lojaSelecionada, filtrosTemp, mostrarFeedback]);

  // Função para atualizar associações em lote
  const handleAtualizarAssociacoes = useCallback(async (operacao: 'ativar' | 'desativar', produtos: ProdutoLojaCvhCompleto[]) => {
    if (!lojaSelecionada || !user?.id || produtos.length === 0) return;

    try {
      setCarregandoProdutos(true);

      const operacoes: OperacaoProdutoLoja[] = produtos.map(produto => ({
        codbarra: produto.codbarra,
        operacao,
        motivo: `Operação em lote: ${operacao === 'ativar' ? 'Ativação' : 'Desativação'} de produtos`,
        ativo: operacao === 'ativar'
      }));

      await produtosLojaCvhService.atualizarProdutosEmLote(lojaSelecionada, operacoes, user.id);
      mostrarFeedback(`${produtos.length} produtos ${operacao === 'ativar' ? 'ativados' : 'desativados'} com sucesso!`, 'success');

      // Recarregar produtos
      await carregarProdutos();
    } catch (error: any) {
      console.error(`Erro ao ${operacao} produtos:`, error);
      mostrarFeedback(`Erro ao ${operacao} produtos: ${error.message}`, 'error');
    } finally {
      setCarregandoProdutos(false);
    }
  }, [lojaSelecionada, user?.id, carregarProdutos, mostrarFeedback]);

  // Função para desassociar todos os produtos
  const handleDesassociarTodos = useCallback(async () => {
    if (!lojaSelecionada || !user?.id) {
      mostrarFeedback('Selecione uma loja para desassociar produtos', 'warning');
      return;
    }

    try {
      setCarregandoProdutos(true);
      mostrarFeedback('Desassociando todos os produtos...', 'info');

      // Obter todos os produtos ativos
      const produtosAtivos = await produtosLojaCvhService.listarProdutos(lojaSelecionada, { ativo: true as unknown as boolean | null | undefined });

      if (produtosAtivos.length === 0) {

        // Se não houver produtos ativos, não há nada para desassociar
        mostrarFeedback('Nenhum produto ativo encontrado para desassociar', 'info');
        return;
      }

      const operacoes: OperacaoProdutoLoja[] = produtosAtivos.map(produto => ({
        codbarra: produto.codbarra,
        operacao: 'desativar',
        motivo: 'Desassociação de todos os produtos',
        ativo: false
      }));

      await produtosLojaCvhService.atualizarProdutosEmLote(lojaSelecionada, operacoes, user.id);
      mostrarFeedback(`${operacoes.length} produtos foram desassociados com sucesso!`, 'success');
      await carregarProdutos();
    } catch (error: any) {
      console.error('Erro ao desassociar todos os produtos:', error);
      mostrarFeedback(`Erro ao desassociar produtos: ${error.message}`, 'error');
    } finally {
      setCarregandoProdutos(false);
    }
  }, [lojaSelecionada, user?.id, carregarProdutos, mostrarFeedback]);

  // Função para desassociar um produto
  const handleDesassociarProduto = useCallback(async (produto: ProdutoLojaCvhCompleto) => {
    if (!lojaSelecionada || !user?.id) {
      mostrarFeedback('Selecione uma loja para desassociar produtos', 'warning');
      return;
    }

    try {
      setCarregandoProdutos(true);
      mostrarFeedback('Desassociando produto...', 'info');

      const operacao: OperacaoProdutoLoja = {
        codbarra: produto.codbarra,
        operacao: 'desativar',
        motivo: 'Desassociação de produto',
        ativo: false
      };

      await produtosLojaCvhService.atualizarProdutosEmLote(lojaSelecionada, [operacao], user.id);
      mostrarFeedback(`Produto desassociado com sucesso!`, 'success');
      await carregarProdutos();
    } catch (error: any) {
      console.error('Erro ao desassociar produto:', error);
      mostrarFeedback(`Erro ao desassociar produto: ${error.message}`, 'error');
    } finally {
      setCarregandoProdutos(false);
    }
  }, [lojaSelecionada, user?.id, carregarProdutos, mostrarFeedback]);

  // Função para ativar um produto
  const handleAtivarProduto = useCallback(async (produto: ProdutoLojaCvhCompleto) => {
    if (!lojaSelecionada || !user?.id) {
      mostrarFeedback('Selecione uma loja para ativar produtos', 'warning');
      return;
    }

    try {
      setCarregandoProdutos(true);
      mostrarFeedback('Ativando produto...', 'info');

      const operacao: OperacaoProdutoLoja = {
        codbarra: produto.codbarra,
        operacao: 'ativar',
        motivo: 'Ativação de produto',
        ativo: true
      };

      await produtosLojaCvhService.atualizarProdutosEmLote(lojaSelecionada, [operacao], user.id);
      mostrarFeedback(`Produto ativado com sucesso!`, 'success');
      await carregarProdutos();
    } catch (error: any) {
      if (error.response) {
        console.error('Erro ao ativar produto:', error.response.data);
        mostrarFeedback(`Erro ao ativar produto: ${error.response.data.message}`, 'error');
      } else {
        console.error('Erro ao ativar produto:', error);
        mostrarFeedback(`Erro ao ativar produto: ${error.message}`, 'error');
      }
    } finally {
      setCarregandoProdutos(false);
    }
  }, [lojaSelecionada, user?.id, carregarProdutos, mostrarFeedback]);

  // Função para salvar alterações no produto
  const handleSalvarAlteracoes = useCallback(async () => {
    if (!produtoSelecionado || !lojaSelecionada || !user?.id) {
      mostrarFeedback('Erro ao salvar alterações', 'error');
      return;
    }

    try {
      setCarregandoProdutos(true);
      mostrarFeedback('Salvando alterações...', 'info');

      if (produtoSelecionado) {
        // Criar ou atualizar o metadata com informações de associação
        // Garantir que estamos usando o email do usuário e não o ID
        console.log('[DEBUG] Email do usuário:', user.email);
        
        // Importante: O metadata deve ser um objeto para o tipo OperacaoProdutoLoja
        const metadata = {
          associado_em: new Date().toISOString(),
          associado_por: user.email || 'Sistema'
        };
        
        await produtosLojaCvhService.atualizarProduto({
          loja_id: lojaSelecionada,
          codbarra: produtoSelecionado.codbarra,
          ativo: produtoSelecionado.ativo,
          atualizado_por: user.id,
          motivo_alteracao: produtoSelecionado.motivo_alteracao,
          destaque: produtoSelecionado.destaque,
          ordem_exibicao: produtoSelecionado.ordem_exibicao,
          metadata: metadata
        });
      }
      mostrarFeedback('Alterações salvas com sucesso!', 'success');
      await carregarProdutos();
      setModalEdicaoVisivel(false);
    } catch (error: any) {
      console.error('Erro ao salvar alterações:', error);
      mostrarFeedback(`Erro ao salvar alterações: ${error.message}`, 'error');
    } finally {
      setCarregandoProdutos(false);
    }
  }, [lojaSelecionada, produtoSelecionado, user?.id, carregarProdutos, mostrarFeedback]);

  return (
    <>
      <Container maxWidth={false} sx={{ mt: 2, mb: 2, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 'medium', color: '#1976d2' }}>
          Gestão de Produtos da Loja
        </Typography>
      </Box>

      {/* Verificar se o usuário tem permissão para acessar esta tela */}
      {(isMasterPlataforma || isUsuarioLoja) ? (
        <>
          {/* Seletor de loja */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Selecione uma Loja</InputLabel>
            <Select
              value={lojaSelecionada}
              onChange={handleChangeLoja}
              label="Selecione uma Loja"
              size="small"
              disabled={isUsuarioLoja} // Desabilitar o seletor se o usuário for do tipo "usuario_loja"
            >
          {lojas.map(loja => (
            <MenuItem key={loja.id} value={loja.id}>
              {loja.nome_fantasia} ({loja.razao_social})
            </MenuItem>
          ))}
            </Select>
          </FormControl>
        </>
      ) : (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="subtitle1" color="error" gutterBottom>
            Acesso Restrito
          </Typography>
          <Typography variant="body1">
            Você não tem permissão para acessar esta página.
          </Typography>
        </Box>
      )}

      {/* Filtros */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '3fr 2fr 2fr 2fr 2fr' }, gap: 2, alignItems: 'center' }}>
          <TextField
            fullWidth
            size="small"
            label="Descrição"
            value={filtrosTemp.descricao}
            onChange={handleChangeTexto('descricao')}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              )
            }}
          />
          
          <TextField
            fullWidth
            size="small"
            label="Código de Barras"
            value={filtrosTemp.codbarra}
            onChange={handleChangeTexto('codbarra')}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              )
            }}
          />
          
          <TextField
            fullWidth
            size="small"
            label="Item Code"
            value={filtrosTemp.item_code}
            onChange={handleChangeTexto('item_code')}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              )
            }}
          />
          
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={filtrosTemp.ativo === true ? 'ativos' : filtrosTemp.ativo === false ? 'inativos' : 'todos'}
              onChange={handleChangeStatus}
              label="Status"
            >
              <MenuItem value="todos">Todos</MenuItem>
              <MenuItem value="ativos">Ativos</MenuItem>
              <MenuItem value="inativos">Inativos</MenuItem>
            </Select>
          </FormControl>
          
          <Button 
            fullWidth 
            variant="contained" 
            color="primary" 
            onClick={aplicarFiltros}
            startIcon={<FilterListIcon />}
            sx={{ height: '40px' }}
          >
            FILTRAR
          </Button>
        </Box>
      </Box>

      {/* Contagem de produtos */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip 
          label={`${contagem.total} produtos encontrados`} 
          color="primary" 
          variant="outlined"
          size="small"
        />
        <Chip 
          label={`${contagem.ativos} ativos`} 
          color="success" 
          variant="outlined"
          size="small"
        />
        <Chip 
          label={`${contagem.inativos} inativos`} 
          color="default" 
          variant="outlined"
          size="small"
        />
      </Box>

      {/* Tabela de produtos */}
      <Box sx={{ flex: '1 0 auto', alignSelf: 'stretch' }}>
        <TableContainer sx={{ border: '1px solid #e0e0e0', borderRadius: 1, boxShadow: 1, minHeight: produtosFiltrados.length === 0 ? '300px' : 'auto' }}>
          {carregandoProdutos ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '20px', position: 'relative' }}>
              <CircularProgress />
            </Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell sx={{ width: '15%', fontWeight: 'bold' }}>Código de Barras</TableCell>
                <TableCell sx={{ width: '15%', fontWeight: 'bold' }}>Item Code</TableCell>
                <TableCell sx={{ width: '30%', fontWeight: 'bold' }}>Descrição</TableCell>
                <TableCell sx={{ width: '15%', fontWeight: 'bold' }}>Categoria</TableCell>
                <TableCell sx={{ width: '10%', fontWeight: 'bold' }}>Cor</TableCell>
                <TableCell sx={{ width: '8%', fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ width: '7%', fontWeight: 'bold', textAlign: 'center' }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {produtosFiltrados.map((produto: ProdutoLojaCvhCompleto) => (
                <TableRow 
                  key={produto.codbarra}
                  sx={{ '&:hover': { backgroundColor: '#f9f9f9' } }}
                >
                  <TableCell sx={{ fontSize: '0.875rem' }}>{produto.codbarra}</TableCell>
                  <TableCell sx={{ fontSize: '0.875rem' }}>{produto.item_code}</TableCell>
                  <TableCell sx={{ fontSize: '0.875rem' }}>{produto.descricao}</TableCell>
                  <TableCell sx={{ fontSize: '0.875rem' }}>{produto.categoria}</TableCell>
                  <TableCell sx={{ fontSize: '0.875rem' }}>{produto.cor}</TableCell>
                  <TableCell>
                    <Chip 
                      label={produto.ativo ? 'Ativo' : 'Inativo'}
                      color={produto.ativo ? 'success' : 'default'}
                      size="small"
                      sx={{ 
                        fontWeight: 'bold', 
                        minWidth: '70px',
                        fontSize: '0.75rem'
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                      <Tooltip title={produto.ativo ? "Desassociar produto" : "Produto já desassociado"} arrow>
                        <span>
                          <IconButton 
                            size="small" 
                            color="warning"
                            onClick={() => handleDesassociarProduto(produto)}
                            disabled={!produto.ativo}
                            sx={{
                              opacity: produto.ativo ? 1 : 0.5,
                              backgroundColor: produto.ativo ? 'rgba(237, 108, 2, 0.08)' : 'transparent',
                              borderRadius: '4px',
                              padding: '5px',
                              minWidth: '34px',
                              border: produto.ativo ? '1px solid #ed6c02' : '1px solid transparent',
                              '&:hover': {
                                backgroundColor: produto.ativo ? 'rgba(237, 108, 2, 0.15)' : 'transparent'
                              }
                            }}
                          >
                            <ClearIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title={!produto.ativo ? "Associar produto" : "Produto já associado"} arrow>
                        <span>
                          <IconButton 
                            size="small" 
                            color="success"
                            onClick={() => handleAtivarProduto(produto)}
                            disabled={produto.ativo}
                            sx={{
                              opacity: produto.ativo ? 0.5 : 1,
                              backgroundColor: !produto.ativo ? 'rgba(46, 125, 50, 0.08)' : 'transparent',
                              borderRadius: '4px',
                              padding: '5px',
                              minWidth: '34px',
                              border: !produto.ativo ? '1px solid #2e7d32' : '1px solid transparent',
                              '&:hover': {
                                backgroundColor: !produto.ativo ? 'rgba(46, 125, 50, 0.15)' : 'transparent'
                              }
                            }}
                          >
                            <CheckIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>
      </Box>
    </Container>
      {/* Feedback */}
      <Snackbar open={feedbackVisivel} autoHideDuration={6000} onClose={handleCloseFeedback}>
        <Alert onClose={handleCloseFeedback} severity={feedbackTipo} sx={{ width: '100%' }}>
          {feedbackMensagem}
        </Alert>
      </Snackbar>

      {/* Modal de edição */}
      {modalEdicaoVisivel && (
        <Modal
          open={modalEdicaoVisivel}
          onClose={() => setModalEdicaoVisivel(false)}
          aria-labelledby="modal-edicao"
          aria-describedby="modal-edicao"
        >
          <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '50%', bgcolor: 'background.paper', border: '1px solid #ddd', boxShadow: 24, p: 4 }}>
            <Typography variant="h6" component="h2">
              Edição de Produto
            </Typography>
            <Box sx={{ mt: 2 }}>
              <TextField
                label="Descrição"
                value={produtoSelecionado?.descricao ?? ''}
                onChange={(e) => produtoSelecionado && setProdutoSelecionado({ ...produtoSelecionado, descricao: e.target.value, associado: produtoSelecionado.associado })}
                fullWidth
              />
              <TextField
                label="Código de Barras"
                value={produtoSelecionado?.codbarra ?? ''}
                onChange={(e) => produtoSelecionado && setProdutoSelecionado({ ...produtoSelecionado, codbarra: e.target.value, associado: produtoSelecionado.associado })}
                fullWidth
                sx={{ mt: 2 }}
              />
              <TextField
                label="Item Code"
                value={produtoSelecionado?.item_code ?? ''}
                onChange={(e) => produtoSelecionado && setProdutoSelecionado({ ...produtoSelecionado, item_code: e.target.value, associado: produtoSelecionado.associado })}
                fullWidth
                sx={{ mt: 2 }}
              />
              <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={handleSalvarAlteracoes}>
                Salvar Alterações
              </Button>
            </Box>
          </Box>
        </Modal>
      )}
    </>
  );
 };

export default GestaoProdutosLoja;
