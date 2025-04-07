import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import RegisterMaster from './pages/RegisterMaster';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CadastrarLoja from './pages/CadastrarLoja';
import ListarLojas from './pages/ListarLojas';
import GerenciarUsuarios from './pages/GerenciarUsuarios';
import ImportarProdutosCvh from './pages/ImportarProdutosCvh';
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

// Tema personalizado com as cores do Florify
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
            <Route path="*" element={<Navigate to="/register" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
