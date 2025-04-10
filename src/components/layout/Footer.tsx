import React from 'react';
import { Box, Typography, Link, Container, Divider, useMediaQuery, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';

const FooterContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.grey[50],
  borderTop: `1px solid ${theme.palette.divider}`,
  paddingTop: theme.breakpoints.down('sm') ? theme.spacing(4) : theme.spacing(6),
  paddingBottom: theme.breakpoints.down('sm') ? theme.spacing(4) : theme.spacing(6),
  boxShadow: '0 -1px 3px rgba(0,0,0,0.02)'
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
    <FooterContainer>
      <Container maxWidth="lg">
        {/* Main Footer Content */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? 2 : 4 }}>
          {/* Column 1: About */}
          <Box sx={{ width: isMobile ? '100%' : '33%', mb: isMobile ? 3 : 0 }}>
            <Typography variant="h6" sx={{ 
              mb: isMobile ? 1 : 2, 
              fontWeight: 600,
              fontSize: isMobile ? '0.95rem' : '1rem',
              letterSpacing: '-0.01em',
              color: 'text.primary' 
            }}>
              Florify
            </Typography>
            <Typography variant="body2" sx={{ 
              mb: isMobile ? 1.5 : 2, 
              color: 'text.secondary',
              fontSize: isMobile ? '0.8rem' : '0.875rem',
              lineHeight: 1.6
            }}>
              Plataforma completa para gestão de floriculturas, com soluções para vendas, estoque e relacionamento com clientes.
            </Typography>
            <Typography variant="body2" sx={{ 
              color: 'text.secondary',
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              opacity: 0.8 
            }}>
              {currentYear} Florify. Todos os direitos reservados.
            </Typography>
          </Box>

          {/* Column 2: Empresa */}
          <Box sx={{ width: isMobile ? '50%' : '16.66%' }}>
            <Typography variant="subtitle1" sx={{ 
              mb: isMobile ? 1 : 2, 
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

          {/* Column 3: Recursos */}
          <Box sx={{ width: isMobile ? '50%' : '16.66%' }}>
            <Typography variant="subtitle1" sx={{ 
              mb: isMobile ? 1 : 2, 
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

          {/* Column 4: Legal */}
          <Box sx={{ width: isMobile ? '100%' : '33%', mt: isMobile ? 2 : 0 }}>
            <Typography variant="subtitle1" sx={{ 
              mb: isMobile ? 1 : 2, 
              fontWeight: 600,
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              letterSpacing: '-0.01em',
              color: 'text.primary'
            }}>
              Legal
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
              <Box sx={{ width: isMobile ? '50%' : 'auto', pr: isMobile ? 1 : 2 }}>
                <FooterLink href="#">Termos de Serviço</FooterLink>
                <FooterLink href="#">Política de Privacidade</FooterLink>
              </Box>
              <Box sx={{ width: isMobile ? '50%' : 'auto' }}>
                <FooterLink href="#">Cookies</FooterLink>
                <FooterLink href="#">Licenças</FooterLink>
              </Box>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: isMobile ? 2 : 3, opacity: 0.6 }} />
        
        {/* Footer Bottom */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          py: isMobile ? 1.5 : 2,
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 1 : 0
        }}>
          <Typography variant="caption" sx={{ 
            fontSize: isMobile ? '0.6rem' : '0.65rem',
            color: 'text.secondary',
            opacity: 0.8,
            textAlign: isMobile ? 'center' : 'left'
          }}>
            Florify {currentYear}. Todos os direitos reservados.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: isMobile ? 3 : 2, justifyContent: 'center' }}>
            <Typography 
              component="a" 
              href="#" 
              variant="caption" 
              sx={{ 
                fontSize: isMobile ? '0.6rem' : '0.65rem',
                color: 'text.secondary',
                textDecoration: 'none',
                '&:hover': { opacity: 0.8 },
                transition: 'opacity 0.2s'
              }}
            >
              Termos
            </Typography>
            <Typography 
              component="a" 
              href="#" 
              variant="caption" 
              sx={{ 
                fontSize: isMobile ? '0.6rem' : '0.65rem',
                color: 'text.secondary',
                textDecoration: 'none',
                '&:hover': { opacity: 0.8 },
                transition: 'opacity 0.2s'
              }}
            >
              Privacidade
            </Typography>
            <Typography 
              component="a" 
              href="#" 
              variant="caption" 
              sx={{ 
                fontSize: isMobile ? '0.6rem' : '0.65rem',
                color: 'text.secondary',
                textDecoration: 'none',
                '&:hover': { opacity: 0.8 },
                transition: 'opacity 0.2s'
              }}
            >
              Suporte
            </Typography>
          </Box>
        </Box>
      </Container>
    </FooterContainer>
  );
};

export default Footer;
