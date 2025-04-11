import React from 'react';
import { Box, Typography, Link, Container, Divider, useMediaQuery, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';

const FooterContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.grey[50],
  borderTop: `1px solid ${theme.palette.divider}`,
  paddingTop: theme.breakpoints.down('sm') ? theme.spacing(4) : theme.spacing(6),
  paddingBottom: theme.breakpoints.down('sm') ? theme.spacing(4) : theme.spacing(6),
  boxShadow: '0 -1px 3px rgba(0,0,0,0.02)',
  width: '100%',
  left: 0,
  right: 0,
  position: 'relative'
}));

const FooterLink = styled(Link)(({ theme }) => ({
  display: 'block',
  marginBottom: theme.breakpoints.down('sm') ? theme.spacing(0.75) : theme.spacing(1),
  color: theme.palette.text.secondary,
  textDecoration: 'none',
  fontSize: theme.breakpoints.down('sm') ? '0.8rem' : '0.85rem',
  opacity: 0.85,
  transition: 'opacity 0.2s',
  '&:hover': {
    opacity: 1,
    color: theme.palette.primary.main
  }
}));

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <FooterContainer sx={{ width: '100%', maxWidth: '100vw', margin: 0, padding: 0 }}>
      <Box sx={{ width: '100%', bgcolor: 'grey.50', maxWidth: '100vw', margin: 0 }}>
        <Container maxWidth={false} sx={{ width: '100%', maxWidth: '100%', paddingLeft: { xs: '24px !important', sm: '32px !important' }, paddingRight: { xs: '24px !important', sm: '32px !important' } }}>
        {/* Main Footer Content - Layout compacto */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', py: 2 }}>
          {/* Linha 1: Informações principais */}
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            width: '100%', 
            gap: isMobile ? 2 : 4,
            mb: isMobile ? 2 : 0
          }}>
            {/* Coluna Florify */}
            <Box sx={{ width: isMobile ? '100%' : '25%', mb: isMobile ? 2 : 0 }}>
              <Typography variant="h6" sx={{ 
                mb: 1, 
                fontWeight: 600,
                fontSize: isMobile ? '0.95rem' : '1rem',
                letterSpacing: '-0.01em',
                color: 'text.primary' 
              }}>
                Florify
              </Typography>
              <Typography variant="body2" sx={{ 
                mb: 1, 
                color: 'text.secondary',
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                lineHeight: 1.4
              }}>
                Plataforma completa para gestão de floriculturas, com soluções para vendas, estoque e relacionamento com clientes.
              </Typography>
            </Box>

            {/* Coluna Empresa */}
            <Box sx={{ width: isMobile ? '50%' : '15%' }}>
              <Typography variant="subtitle1" sx={{ 
                mb: 1, 
                fontWeight: 600,
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                letterSpacing: '-0.01em',
                color: 'text.primary' 
              }}>
                Empresa
              </Typography>
              <FooterLink href="#">Sobre nós</FooterLink>
              <FooterLink href="#">Contato</FooterLink>
              <FooterLink href="#">Blog</FooterLink>
              <FooterLink href="#">Carreiras</FooterLink>
            </Box>

            {/* Coluna Recursos */}
            <Box sx={{ width: isMobile ? '50%' : '15%' }}>
              <Typography variant="subtitle1" sx={{ 
                mb: 1, 
                fontWeight: 600,
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                letterSpacing: '-0.01em',
                color: 'text.primary' 
              }}>
                Recursos
              </Typography>
              <FooterLink href="#">Documentação</FooterLink>
              <FooterLink href="#">Guias</FooterLink>
              <FooterLink href="#">API</FooterLink>
              <FooterLink href="#">Suporte</FooterLink>
            </Box>

            {/* Coluna Legal */}
            <Box sx={{ width: isMobile ? '100%' : '20%', mt: isMobile ? 2 : 0 }}>
              <Typography variant="subtitle1" sx={{ 
                mb: 1, 
                fontWeight: 600,
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                letterSpacing: '-0.01em',
                color: 'text.primary'
              }}>
                Legal
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                <Box sx={{ width: isMobile ? '50%' : '100%' }}>
                  <FooterLink href="#">Termos de Serviço</FooterLink>
                  <FooterLink href="#">Política de Privacidade</FooterLink>
                </Box>
                <Box sx={{ width: isMobile ? '50%' : '100%' }}>
                  <FooterLink href="#">Cookies</FooterLink>
                  <FooterLink href="#">Licenças</FooterLink>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ mt: 2, mb: 1, opacity: 0.6 }} />
        
        {/* Footer Bottom - Simplificado */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 1,
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 1 : 0
        }}>
          <Typography variant="caption" sx={{ 
            fontSize: '0.65rem',
            color: 'text.secondary',
            opacity: 0.8,
            textAlign: isMobile ? 'center' : 'left'
          }}>
            Florify {currentYear}. Todos os direitos reservados.
          </Typography>
        </Box>
        </Container>
      </Box>
    </FooterContainer>
  );
};

export default Footer;
