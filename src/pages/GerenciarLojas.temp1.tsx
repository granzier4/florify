import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Button,
  CircularProgress,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Chip,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Divider,
  useMediaQuery,
  useTheme,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Block as BlockIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { lojaService } from '../services/lojaService';
import { Loja } from '../types/auth';
import { useAuth } from '../contexts/AuthContext';
import { PostgrestError } from '@supabase/supabase-js';
