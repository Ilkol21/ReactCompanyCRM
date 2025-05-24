import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import apiClient from '../../api/apiClient';
import { toast } from 'react-toastify';
import {
    Container,
    TextField,
    Button,
    Typography,
    Box,
    Link,
    CircularProgress,
    MenuItem,
    Select,
    InputLabel,
    FormControl,
} from '@mui/material';

const roles = [
    { value: 'User', label: 'User' },
    { value: 'Admin', label: 'Admin' },
    { value: 'SuperAdmin', label: 'SuperAdmin' },
];


const SignUp: React.FC = () => {
    const navigate = useNavigate();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('User'); // по умолчанию 'user'

    const registerMutation = useMutation({
        mutationFn: (userData: { fullName: string; email: string; password: string; role: string }) =>
            apiClient.post('/auth/register', userData),
        onSuccess: () => {
            toast.success('Registration successful! Please sign in.');
            navigate('/login');
        },
        onError: (error: any) => {
            console.error('Registration error:', error);
            console.log('Server response:', error.response?.data);
            toast.error(error.response?.data?.message || 'Registration failed.');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        registerMutation.mutate({ fullName, email, password, role });
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
                    Sign Up
                </Typography>
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="fullName"
                        label="Full Name"
                        name="fullName"
                        autoComplete="name"
                        autoFocus
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Email Address"
                        name="email"
                        autoComplete="email"
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
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <FormControl fullWidth margin="normal" required>
                        <InputLabel id="role-label">Role</InputLabel>
                        <Select
                            labelId="role-label"
                            id="role"
                            value={role}
                            label="Role"
                            onChange={(e) => setRole(e.target.value)}
                        >
                            {roles.map(({ value, label }) => (
                                <MenuItem key={value} value={value}>
                                    {label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                        disabled={registerMutation.isLoading}
                    >
                        {registerMutation.isLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign Up'}
                    </Button>
                    <Link href="/login" variant="body2">
                        Already have an account? Sign In
                    </Link>
                </Box>
            </Box>
        </Container>
    );
};

export default SignUp;
