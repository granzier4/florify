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
      width: '100%',
      bgcolor: 'background.default'
    }}>
      <Header pageTitle={pageTitle} />
      
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          py: 3,
          px: 0,
          width: '100%'
        }}
      >
        <Container maxWidth={false} sx={{ width: '100%', px: { xs: 2, sm: 3 } }}>
          {children}
        </Container>
      </Box>
      
      <Footer />
    </Box>
  );
};

export default MainLayout;
