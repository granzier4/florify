import React from 'react';
import { Box, Container } from '@mui/material';
import Header from './Header';
import Footer from './Footer';

interface MainLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  pageTitle
}) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      bgcolor: 'background.default'
    }}>
      <Header pageTitle={pageTitle} />
      
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          py: 3, // Reduzindo o padding vertical
          px: 0 // Removendo o padding horizontal para preencher toda a largura
        }}
      >
        <Container maxWidth={false}> {/* Usando maxWidth={false} para preencher toda a largura */}
          {children}
        </Container>
      </Box>
      
      <Footer />
    </Box>
  );
};

export default MainLayout;
