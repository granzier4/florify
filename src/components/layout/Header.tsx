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
  Dashboard as DashboardIcon,
  Store as StoreIcon,
  Inventory as InventoryIcon,
  Settings as SettingsIcon,
  People as PeopleIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';

interface HeaderProps {}

const Header: React.FC<HeaderProps> = () => {
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
  
  // Definição do tipo de item de menu
  interface MenuItem {
    text: string;
    icon: React.ReactNode;
    path: string;
    roles: string[];
  }
  
  // Definindo os itens de menu baseados no tipo de usuário
  const menuItems: MenuItem[] = [
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
      path: '/gestao-produtos',
      roles: ['master_plataforma']
    },
    { 
      text: 'Produtos', 
      icon: <InventoryIcon fontSize="small" />, 
      path: '/gestao-produtos',
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
          .map((item, index) => (
            <React.Fragment key={index}>
              <ListItem disablePadding>
                <ListItemButton 
                  onClick={() => {
                    navigate(item.path);
                    setDrawerOpen(false);
                  }}
                  selected={isActive(item.path)}
                  sx={{
                    py: 1.5,
                    '&.Mui-selected': {
                      bgcolor: 'rgba(0, 0, 0, 0.04)',
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.08)'
                      }
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{ 
                      fontSize: '0.9rem',
                      fontWeight: isActive(item.path) ? 500 : 400
                    }}
                  />
                </ListItemButton>
              </ListItem>
            </React.Fragment>
          ))}
      </List>
    </Box>
  );

  return (
    <AppBar 
      position="fixed" 
      color="primary"
      sx={{
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
        width: '100vw',
        left: 0,
        right: 0,
        margin: 0,
        padding: 0,
        maxWidth: '100vw',
        zIndex: (theme) => theme.zIndex.drawer + 1 // Garante que o header fique acima de outros elementos
      }}
    >
      <Box sx={{ width: '100%', maxWidth: '100vw', bgcolor: 'primary.main', margin: 0, padding: 0 }}>
        <Toolbar sx={{ px: 0, py: 1 }}>
          <Container maxWidth={false} sx={{ px: 0, width: '100%', display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={toggleDrawer(true)}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            
            <Typography
              variant="h6"
              component="div"
              sx={{ 
                fontWeight: 600, 
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
                letterSpacing: '-0.01em',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              Florify
            </Typography>
          </Box>

          <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', ml: 'auto' }}>
            {!isMobile && (
              <Tooltip title="Notificações">
                <IconButton 
                  color="inherit" 
                  size="small"
                  sx={{ 
                    mr: 1.5,
                    opacity: 0.8,
                    '&:hover': { opacity: 1 }
                  }}
                >
                  <NotificationsIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ display: { xs: 'none', sm: 'block' }, mr: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1 }}>
                  {user?.nome || 'Usuário'}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.7, lineHeight: 1 }}>
                  {user?.email || 'email@exemplo.com'}
                </Typography>
              </Box>
              
              <Tooltip title="Conta">
                <IconButton
                  onClick={handleMenu}
                  color="inherit"
                  size="small"
                  sx={{ 
                    p: 0.5,
                    border: '2px solid',
                    borderColor: 'rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <Avatar 
                    sx={{ 
                      width: 32, 
                      height: 32,
                      bgcolor: 'primary.dark',
                      fontSize: '0.875rem',
                      fontWeight: 500
                    }}
                  >
                    {user?.nome?.charAt(0) || 'U'}
                  </Avatar>
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
          </Container>
        </Toolbar>
        
        {/* Barra de navegação secundária - visível apenas em desktop */}
        {!isMobile && (
          <Box sx={{ bgcolor: 'primary.dark', py: 0.5, width: '100%' }}>
            <Container maxWidth={false} sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <Box sx={{ display: 'flex', gap: 3 }}>
                {menuItems
                  .filter(item => item.roles.includes(user?.tipo || ''))
                  .map((item, index) => (
                    <Button
                      key={index}
                      color="inherit"
                      component={Link}
                      to={item.path}
                      sx={{ 
                        color: 'white',
                        textTransform: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        fontSize: '0.9rem'
                      }}
                    >
                      {item.icon}
                      {item.text}
                    </Button>
                  ))
                }
              </Box>
            </Container>
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
      </Box>
    </AppBar>
  );
};

export default Header;
