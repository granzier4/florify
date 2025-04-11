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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  pageTitle
}) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      width: '100%',
      maxWidth: '100%',
      overflow: 'hidden',
      bgcolor: 'background.default'
    }}>
      <Header />
      
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          pt: 8, // Aumentado o padding top para dar mais espaço abaixo do header
          pb: 3,
          px: 0,
          width: '100%',
          maxWidth: '100%',
          mt: { xs: '64px', sm: '70px' } // Adiciona margem superior para evitar sobreposição com o header
        }}
      >
        <Container maxWidth={false} sx={{ width: '100%', maxWidth: '100%', paddingLeft: { xs: '24px !important', sm: '32px !important' }, paddingRight: { xs: '24px !important', sm: '32px !important' }, overflowX: 'hidden' }}>
          {children}
        </Container>
      </Box>
      
      <Footer />
    </Box>
  );
};

export default MainLayout;
