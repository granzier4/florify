import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Paper, Button, CircularProgress, Alert, Snackbar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Checkbox
} from '@mui/material';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

// Interface para produtos
interface ProdutoCvh {
  codbarra: string;
  descricao: string;
  categoria: string;
  cor: string;
  associado: boolean;
}

const AssociarProdutosLoja: React.FC = () => {
  const { user } = useAuth();
  const [carregando, setCarregando] = useState<boolean>(true);
  const [produtos, setProdutos] = useState<ProdutoCvh[]>([]);
  const [lojaSelecionada, setLojaSelecionada] = useState<string>('');
  const [salvando, setSalvando] = useState<boolean>(false);
  const [feedbackVisivel, setFeedbackVisivel] = useState(false);
  const [feedbackMensagem, setFeedbackMensagem] = useState('');
  const [feedbackTipo, setFeedbackTipo] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  
  // Verificar tipo de usuário
  const isMasterPlataforma = user?.tipo === 'master_plataforma';
  const isUsuarioLoja = user?.tipo === 'usuario_loja';

  // Carregar produtos e verificar associações
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setCarregando(true);
        
        // Obter loja do usuário ou primeira loja disponível
        let lojaId = '';
        
        if (user?.loja_id) {
          lojaId = user.loja_id;
        } else {
          // Para usuários master, buscar primeira loja
          const { data: lojas } = await supabase
            .from('lojas')
            .select('id')
            .limit(1);
          
          if (lojas && lojas.length > 0) {
            lojaId = lojas[0].id;
          }
        }
        
        if (!lojaId) {
          mostrarFeedback('Nenhuma loja encontrada. Crie uma loja primeiro.', 'error');
          setCarregando(false);
          return;
        }
        
        setLojaSelecionada(lojaId);
        
        // Buscar produtos CVH
        const { data: produtosCvh, error: erroProdutos } = await supabase
          .from('produtos_cvh')
          .select('codbarra, descricao, categoria, cor')
          .limit(20);
        
        if (erroProdutos) {
          console.error('Erro ao buscar produtos:', erroProdutos);
          mostrarFeedback('Erro ao carregar produtos', 'error');
          setCarregando(false);
          return;
        }
        
        // Buscar produtos já associados à loja
        const { data: produtosLoja, error: erroProdutosLoja } = await supabase
          .from('produtos_loja_cvh')
          .select('codbarra')
          .eq('loja_id', lojaId);
        
        if (erroProdutosLoja) {
          console.error('Erro ao buscar produtos da loja:', erroProdutosLoja);
        }
        
        // Criar um Set com os códigos de barras dos produtos já associados
        const produtosAssociados = new Set(produtosLoja?.map(p => p.codbarra) || []);
        
        // Mapear produtos com flag de associação
        const produtosComAssociacao = produtosCvh?.map(produto => ({
          ...produto,
          associado: produtosAssociados.has(produto.codbarra)
        })) || [];
        
        setProdutos(produtosComAssociacao);
        setCarregando(false);
        
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        mostrarFeedback('Erro ao carregar dados', 'error');
        setCarregando(false);
      }
    };
    
    carregarDados();
  }, [user]);
  
  // Função para mostrar feedback
  const mostrarFeedback = (mensagem: string, tipo: 'success' | 'error' | 'info' | 'warning') => {
    setFeedbackMensagem(mensagem);
    setFeedbackTipo(tipo);
    setFeedbackVisivel(true);
  };
  
  // Função para fechar feedback
  const handleCloseFeedback = () => {
    setFeedbackVisivel(false);
  };
  
  // Função para alternar associação de produto
  const toggleAssociacao = (codbarra: string) => {
    setProdutos(produtos.map(produto => 
      produto.codbarra === codbarra 
        ? { ...produto, associado: !produto.associado } 
        : produto
    ));
  };
  
  // Função para associar todos os produtos
  const associarTodos = () => {
    setProdutos(produtos.map(produto => ({ ...produto, associado: true })));
  };
  
  // Função para desassociar todos os produtos
  const desassociarTodos = () => {
    setProdutos(produtos.map(produto => ({ ...produto, associado: false })));
  };
  
  // Função para salvar associações
  const salvarAssociacoes = async () => {
    if (!lojaSelecionada) {
      mostrarFeedback('Nenhuma loja selecionada', 'error');
      return;
    }
    
    try {
      setSalvando(true);
      
      // Produtos para associar (que estão marcados como associados mas não estão no banco)
      const produtosParaAssociar = produtos
        .filter(p => p.associado)
        .map(p => ({
          loja_id: lojaSelecionada,
          codbarra: p.codbarra,
          ativo: true,
          destaque: false,
          ordem_exibicao: 1,
          ativado_por: user?.id,
          atualizado_por: user?.id,
          motivo_alteracao: 'Associação inicial de produto à loja',
          metadata: {
            associado_em: new Date().toISOString(),
            associado_por: user?.email || 'Sistema'
          }
        }));
      
      // Produtos para desassociar (que estão desmarcados mas estão no banco)
      const codbarrasParaDesassociar = produtos
        .filter(p => !p.associado)
        .map(p => p.codbarra);
      
      // Inserir novas associações
      if (produtosParaAssociar.length > 0) {
        const { error: erroInsercao } = await supabase
          .from('produtos_loja_cvh')
          .upsert(produtosParaAssociar, { onConflict: 'loja_id,codbarra' });
        
        if (erroInsercao) {
          console.error('Erro ao associar produtos:', erroInsercao);
          mostrarFeedback('Erro ao associar produtos', 'error');
          setSalvando(false);
          return;
        }
      }
      
      // Remover associações
      if (codbarrasParaDesassociar.length > 0) {
        const { error: erroRemocao } = await supabase
          .from('produtos_loja_cvh')
          .delete()
          .eq('loja_id', lojaSelecionada)
          .in('codbarra', codbarrasParaDesassociar);
        
        if (erroRemocao) {
          console.error('Erro ao desassociar produtos:', erroRemocao);
          mostrarFeedback('Erro ao desassociar produtos', 'error');
          setSalvando(false);
          return;
        }
      }
      
      mostrarFeedback('Associações salvas com sucesso', 'success');
      setSalvando(false);
      
    } catch (error) {
      console.error('Erro ao salvar associações:', error);
      mostrarFeedback('Erro ao salvar associações', 'error');
      setSalvando(false);
    }
  };
  
  return (
    <Container maxWidth={false} sx={{ mt: 2, mb: 2 }}>
      {/* Verificar se o usuário tem permissão para acessar esta tela */}
      {(isMasterPlataforma || isUsuarioLoja) ? (
        <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Associar Produtos à Loja
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={salvarAssociacoes} 
            disabled={salvando}
            size="small"
            sx={{ mr: 1 }}
          >
            {salvando ? 'Salvando...' : 'Salvar Associações'}
          </Button>
          
          <Button 
            variant="outlined" 
            onClick={associarTodos} 
            size="small"
            sx={{ mr: 1 }}
          >
            Selecionar Todos
          </Button>
          
          <Button 
            variant="outlined" 
            onClick={desassociarTodos}
            size="small"
          >
            Desmarcar Todos
          </Button>
        </Box>
        
        {carregando ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : produtos.length === 0 ? (
          <Alert severity="info">
            Nenhum produto encontrado. Importe produtos primeiro.
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Associar</TableCell>
                  <TableCell>Código de Barras</TableCell>
                  <TableCell>Descrição</TableCell>
                  <TableCell>Categoria</TableCell>
                  <TableCell>Cor</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {produtos.map((produto) => (
                  <TableRow key={produto.codbarra}>
                    <TableCell>
                      <Checkbox 
                        checked={produto.associado} 
                        onChange={() => toggleAssociacao(produto.codbarra)} 
                      />
                    </TableCell>
                    <TableCell>{produto.codbarra}</TableCell>
                    <TableCell>{produto.descricao}</TableCell>
                    <TableCell>{produto.categoria}</TableCell>
                    <TableCell>{produto.cor}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        </Paper>
      ) : (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            Acesso Restrito
          </Typography>
          <Typography variant="body1">
            Você não tem permissão para acessar esta página.
          </Typography>
        </Box>
      )}
      
      <Snackbar open={feedbackVisivel} autoHideDuration={6000} onClose={handleCloseFeedback}>
        <Alert onClose={handleCloseFeedback} severity={feedbackTipo} sx={{ width: '100%' }}>
          {feedbackMensagem}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AssociarProdutosLoja;
