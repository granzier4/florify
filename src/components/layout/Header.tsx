import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Box, 
  Container,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { 
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  ArrowDropDown as ArrowDropDownIcon,
  Dashboard as DashboardIcon,
  Store as StoreIcon,
  Inventory as InventoryIcon,
  Settings as SettingsIcon,
  People as PeopleIcon,
  ChevronRight as ChevronRightIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface HeaderProps {
  pageTitle?: string;
}

const Header: React.FC<HeaderProps> = ({ pageTitle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    logout();
  };

  const handleProfile = () => {
    handleClose();
    // Navegar para a página de perfil quando estiver disponível
    // navigate('/profile');
  };
  
  const toggleDrawer = (open: boolean) => (
    event: React.KeyboardEvent | React.MouseEvent,
  ) => {
    if (
      event.type === 'keydown' &&
      ((event as React.KeyboardEvent).key === 'Tab' ||
        (event as React.KeyboardEvent).key === 'Shift')
    ) {
      return;
    }

    setDrawerOpen(open);
  };
  
  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.includes(path);
  };
  
  // Definindo os itens de menu baseados no tipo de usuário
  const menuItems = [
    { 
      text: 'Dashboard', 
      icon: <DashboardIcon fontSize="small" />, 
      path: '/dashboard',
      roles: ['master_plataforma', 'usuario_loja', 'cliente']
    },
    { 
      text: 'Lojas', 
      icon: <StoreIcon fontSize="small" />, 
      path: '/lojas',
      roles: ['master_plataforma']
    },
    { 
      text: 'Gestão de Produtos', 
      icon: <InventoryIcon fontSize="small" />, 
      path: '/produtos/gestao-loja',
      roles: ['master_plataforma']
    },
    { 
      text: 'Produtos', 
      icon: <InventoryIcon fontSize="small" />, 
      path: '/produtos/gestao-loja',
      roles: ['usuario_loja']
    },
    { 
      text: 'Configurações', 
      icon: <SettingsIcon fontSize="small" />, 
      path: '/configuracoes',
      roles: ['master_plataforma']
    },
    { 
      text: 'Usuários', 
      icon: <PeopleIcon fontSize="small" />, 
      path: '/usuarios',
      roles: ['master_plataforma', 'usuario_loja']
    }
  ];

  // Drawer para navegação em dispositivos móveis
  const drawerContent = (
    <Box
      sx={{ width: 280 }}
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        p: 2,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, letterSpacing: '-0.01em' }}>
          Menu
        </Typography>
        <IconButton onClick={toggleDrawer(false)} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      
      <List sx={{ pt: 1 }}>
        {menuItems
          .filter(item => item.roles.includes(user?.tipo || ''))
          .map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton 
                onClick={() => navigate(item.path)}
                selected={isActive(item.path)}
                sx={{
                  py: 1.25,
                  '&.Mui-selected': {
                    bgcolor: 'rgba(46, 125, 50, 0.08)',
                    '&:hover': {
                      bgcolor: 'rgba(46, 125, 50, 0.12)',
                    }
                  },
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.04)',
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: isActive(item.path) ? 'primary.main' : 'text.secondary' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{ 
                    fontSize: '0.9rem',
                    fontWeight: isActive(item.path) ? 500 : 400
                  }}
                />
                <ChevronRightIcon 
                  fontSize="small" 
                  sx={{ 
                    opacity: 0.5,
                    color: isActive(item.path) ? 'primary.main' : 'text.secondary'
                  }} 
                />
              </ListItemButton>
            </ListItem>
          ))}
      </List>
      
      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ p: 2 }}>
        <Button 
          variant="outlined" 
          color="primary" 
          fullWidth 
          onClick={handleLogout}
          sx={{ 
            textTransform: 'none',
            borderRadius: '8px',
            py: 0.75
          }}
        >
          Sair
        </Button>
      </Box>
    </Box>
  );

  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{ 
        backgroundColor: 'primary.main',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
      }}
    >
      <Container maxWidth={false}>
        <Toolbar sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          minHeight: { xs: '52px', md: '56px' },
          py: { xs: 0.5, md: 0.75 },
        }}>
          {/* Logo e título */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={toggleDrawer(true)}
              sx={{ 
                mr: 1.5,
                '&:hover': { 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)' 
                },
                transition: 'background-color 0.2s'
              }}
            >
              <MenuIcon fontSize="small" />
            </IconButton>
            <Typography
              variant="subtitle1"
              component="div"
              sx={{ 
                fontWeight: 600,
                letterSpacing: '-0.01em',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              Florify
            </Typography>
          </Box>

          {/* Título da página */}
          {pageTitle && (
            <Typography
              variant="subtitle1"
              component="div"
              sx={{ 
                display: { xs: 'none', md: 'block' },
                fontWeight: 'medium'
              }}
            >
              {pageTitle}
            </Typography>
          )}

          {/* Ações do usuário */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {!isMobile && (
              <Tooltip title="Notificações">
                <IconButton 
                  color="inherit" 
                  sx={{ 
                    mr: 1.5,
                    '&:hover': { 
                      backgroundColor: 'rgba(255, 255, 255, 0.1)' 
                    },
                    transition: 'background-color 0.2s'
                  }}
                >
                  <NotificationsIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  mr: 1.5, 
                  display: { xs: 'none', sm: 'block' },
                  fontWeight: 500,
                  opacity: 0.95
                }}
              >
                {user?.nome || user?.email}
              </Typography>
              
              <Tooltip title="Configurações da conta">
                <IconButton
                  onClick={handleMenu}
                  color="inherit"
                  sx={{ 
                    p: 0,
                    '&:hover': { 
                      backgroundColor: 'transparent' 
                    }
                  }}
                >
                  <Avatar 
                    alt={user?.nome || 'Usuário'} 
                    src="/static/images/avatar/1.jpg" 
                    sx={{ 
                      width: { xs: 28, md: 32 }, 
                      height: { xs: 28, md: 32 }, 
                      bgcolor: 'secondary.main', 
                      color: 'primary.main',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}
                  >
                    {(user?.nome?.charAt(0) || user?.email?.charAt(0) || 'U').toUpperCase()}
                  </Avatar>
                  <ArrowDropDownIcon sx={{ opacity: 0.9, display: { xs: 'none', sm: 'block' } }} />
                </IconButton>
              </Tooltip>
              
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                  elevation: 2,
                  sx: {
                    borderRadius: '10px',
                    mt: 0.5,
                    minWidth: '180px',
                    overflow: 'hidden',
                    '& .MuiMenuItem-root': {
                      px: 2,
                      py: 1.2,
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                      }
                    }
                  }
                }}
              >
                <MenuItem onClick={handleProfile}>Meu Perfil</MenuItem>
                <MenuItem onClick={() => { handleClose(); navigate('/dashboard'); }}>Dashboard</MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>Sair</MenuItem>
              </Menu>
            </Box>
          </Box>
        </Toolbar>
        
        {/* Barra de navegação secundária - visível apenas em desktop */}
        {!isMobile && (
          <Box 
            sx={{ 
              bgcolor: 'rgba(0, 0, 0, 0.08)',
              display: 'flex',
              overflowX: 'auto',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            {menuItems
              .filter(item => item.roles.includes(user?.tipo || ''))
              .map((item) => (
                <Button 
                  key={item.text}
                  color="inherit"
                  onClick={() => navigate(item.path)}
                  sx={{ 
                    py: 0.75,
                    px: 2,
                    opacity: isActive(item.path) ? 1 : 0.75,
                    borderBottom: isActive(item.path) ? '2px solid white' : 'none',
                    borderRadius: 0,
                    fontSize: '0.875rem',
                    letterSpacing: '-0.01em',
                    transition: 'all 0.2s',
                    '&:hover': { opacity: 1, bgcolor: 'rgba(255, 255, 255, 0.08)' },
                    whiteSpace: 'nowrap'
                  }}
                >
                  {item.text}
                </Button>
              ))
            }
          </Box>
        )}
        
        {/* Drawer para navegação em dispositivos móveis */}
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={toggleDrawer(false)}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              borderRadius: '0 12px 12px 0',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </Container>
    </AppBar>
  );
};

export default Header;
