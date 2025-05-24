import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import {
    Container,
    TextField,
    Button,
    Typography,
    Box,
    Link,
    CircularProgress,
} from '@mui/material';

const SignIn: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const loginMutation = useMutation({
        mutationFn: (credentials: { email: string; password: string }) =>
            apiClient.post('/auth/login', credentials),
        onSuccess: (data) => {
            const { accessToken, refreshToken, user } = data.data;
            login(accessToken, refreshToken, user);
            toast.success('Logged in successfully!');
            navigate('/dashboard');
        },
        onError: (error: any) => {
            // Ошибка уже обрабатывается в interceptor'е apiClient, но можно добавить специфичную логику
            console.error('Login error:', error);
            toast.error(error.response?.data?.message || 'Login failed. Please check your credentials.');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        loginMutation.mutate({ email, password });
    };

    return (
        <Container maxWidth="xs">
            <Box
                sx={{
                    mt: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    p: 4,
                    boxShadow: 3,
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                }}
            >
                <Typography component="h1" variant="h5">
                    Sign In
                </Typography>
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Email Address"
                        name="email"
                        autoComplete="email"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                        disabled={loginMutation.isPending}
                    >
                        {loginMutation.isPending ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                    </Button>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Link href="/register" variant="body2">
                            Don't have an account? Sign Up
                        </Link>
                        <Link href="/reset-password" variant="body2">
                            Forgot password?
                        </Link>
                    </Box>
                </Box>
            </Box>
        </Container>
    );
};

export default SignIn;