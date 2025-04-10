import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import RegisterMaster from './pages/RegisterMaster';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DashboardNew from './pages/DashboardNew';
import CadastrarLoja from './pages/CadastrarLoja';
import ListarLojas from './pages/ListarLojas';
import GerenciarUsuarios from './pages/GerenciarUsuarios';
import ImportarProdutosCvh from './pages/ImportarProdutosCvh';
import GestaoProdutosLoja from './pages/GestaoProdutosLoja';
import AssociarProdutosLoja from './pages/AssociarProdutosLoja';
import { useAuth } from './contexts/AuthContext';
import React from 'react';

// Componente para rotas protegidas
const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Carregando...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Tema personalizado com as cores do Florify e fonte Inter
const theme = createTheme({
  palette: {
    primary: {
      main: '#2E7D32', // Cor primária
    },
    secondary: {
      main: '#A5D6A7', // Cor secundária
    },
    background: {
      default: '#F8F9FA', // Fundo neutro
    },
    text: {
      primary: '#212121', // Texto principal
    },
    warning: {
      main: '#FFC107', // Destaques
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'Arial',
      'sans-serif'
    ].join(','),
    h5: {
      fontWeight: 600, // Semelhante ao estilo Apple
    },
    h6: {
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 500, // Peso médio para subtítulos
    },
    button: {
      textTransform: 'none', // Estilo Apple não usa texto todo em maiúsculas
      fontWeight: 500,
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/register" element={<RegisterMaster />} />
            <Route path="/login" element={<Login />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/lojas" 
              element={
                <ProtectedRoute>
                  <ListarLojas />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/lojas/cadastrar" 
              element={
                <ProtectedRoute>
                  <CadastrarLoja />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/usuarios" 
              element={
                <ProtectedRoute>
                  <GerenciarUsuarios />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/produtos/importar-cvh" 
              element={
                <ProtectedRoute>
                  <ImportarProdutosCvh />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/produtos/gestao-loja" 
              element={
                <ProtectedRoute>
                  <GestaoProdutosLoja />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/produtos/associar-loja" 
              element={
                <ProtectedRoute>
                  <AssociarProdutosLoja />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard-new" 
              element={
                <ProtectedRoute>
                  <DashboardNew />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/register" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
