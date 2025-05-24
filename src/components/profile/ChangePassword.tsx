import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/apiClient';
import { toast } from 'react-toastify';
import {
    TextField,
    Button,
    Typography,
    Box,
    CircularProgress,
} from '@mui/material';

const ChangePassword: React.FC = () => {
    const queryClient = useQueryClient();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const changePasswordMutation = useMutation({
        mutationFn: (data: { currentPassword: string; newPassword: string; confirmNewPassword: string }) =>
            apiClient.patch('/users/profile/change-password', data),
        onSuccess: () => {
            setSuccessMessage('Password successfully changed!');
            setError('');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            queryClient.invalidateQueries({ queryKey: ['userProfile'] }); // Опционально: обновить профиль
        },
        onError: (err: any) => {
            console.error('Change password error:', err);
            setError(err.response?.data?.message || 'Failed to change password.');
            setSuccessMessage('');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (newPassword !== confirmNewPassword) {
            setError('New passwords do not match!');
            return;
        }
        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters long.');
            return;
        }

        changePasswordMutation.mutate({ currentPassword, newPassword, confirmNewPassword });
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
                Change Your Password
            </Typography>
            <TextField
                margin="normal"
                required
                fullWidth
                name="currentPassword"
                label="Current Password"
                type="password"
                id="currentPassword"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
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
                name="confirmNewPassword"
                label="Confirm New Password"
                type="password"
                id="confirmNewPassword"
                autoComplete="new-password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
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
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={changePasswordMutation.isPending}
            >
                {changePasswordMutation.isPending ? <CircularProgress size={24} color="inherit" /> : 'Change Password'}
            </Button>
        </Box>
    );
};

export default ChangePassword;