import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import RegisterMaster from './pages/RegisterMaster';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CadastrarLoja from './pages/CadastrarLoja';
import ListarLojas from './pages/ListarLojas';
import GerenciarLojas from './pages/GerenciarLojas';
import GerenciarUsuarios from './pages/GerenciarUsuarios';
import ImportarProdutosCvh from './pages/ImportarProdutosCvh';
import GestaoProdutosLoja from './pages/GestaoProdutosLoja';
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

// Tema personalizado
const theme = createTheme({
  palette: {
    primary: {
      main: '#2E7D32',
    },
    secondary: {
      main: '#FFC107',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      'Arial',
      'sans-serif'
    ].join(','),
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        html, body, #root {
          width: 100%;
          max-width: 100vw;
          overflow-x: hidden;
          margin: 0;
          padding: 0;
        }
        .MuiContainer-root {
          padding-left: 0 !important;
          padding-right: 0 !important;
          max-width: 100vw !important;
          width: 100% !important;
        }
        .MuiAppBar-root {
          width: 100vw !important;
          left: 0 !important;
          right: 0 !important;
          margin: 0 !important;
        }
      `,
    },
    MuiContainer: {
      defaultProps: {
        disableGutters: true,
        maxWidth: false
      },
      styleOverrides: {
        root: {
          paddingLeft: 0,
          paddingRight: 0,
          maxWidth: '100vw',
          width: '100%'
        }
      }
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          paddingLeft: '16px',
          paddingRight: '16px',
          width: '100%'
        }
      }
    }
  }
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
                  <GerenciarLojas />
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
              path="/importar-produtos" 
              element={
                <ProtectedRoute>
                  <ImportarProdutosCvh />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/gestao-produtos" 
              element={
                <ProtectedRoute>
                  <GestaoProdutosLoja />
                </ProtectedRoute>
              } 
            />

            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
