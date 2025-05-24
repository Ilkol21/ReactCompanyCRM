import React, { useState } from 'react';
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
} from '@mui/material';

const ResetPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const resetPasswordMutation = useMutation({
        mutationFn: (data: { email: string; newPassword: string }) =>
            apiClient.post('/auth/reset-password', data),
        onSuccess: () => {
            setSuccessMessage('Password has been reset successfully. You can now log in with your new password.');
            setError('');
            setEmail('');
            setNewPassword('');
            setConfirmPassword('');
        },
        onError: (error: any) => {
            console.error('Reset password error:', error);
            setError(error.response?.data?.message || 'Failed to reset password.');
            setSuccessMessage('');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match!');
            return;
        }
        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters long.');
            return;
        }

        resetPasswordMutation.mutate({ email, newPassword });
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
                    Reset Password
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
                        name="newPassword"
                        label="New Password"
                        type="password"
                        id="newPassword"
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="confirmPassword"
                        label="Confirm New Password"
                        type="password"
                        id="confirmPassword"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    {error && (
                        <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                            {error}
                        </Typography>
                    )}
                    {successMessage && (
                        <Typography color="success.main" variant="body2" sx={{ mt: 1 }}>
                            {successMessage}
                        </Typography>
                    )}
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                        disabled={resetPasswordMutation.isPending}
                    >
                        {resetPasswordMutation.isPending ? <CircularProgress size={24} color="inherit" /> : 'Reset Password'}
                    </Button>
                    <Link href="/login" variant="body2">
                        Back to Sign In
                    </Link>
                </Box>
            </Box>
        </Container>
    );
};

export default ResetPassword;