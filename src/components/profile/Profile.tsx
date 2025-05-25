// src/components/profile/Profile.tsx
import React, { useState} from 'react';
import type { ChangeEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import {
    Container,
    Typography,
    Box,
    Paper,
    TextField,
    Button,
    CircularProgress,
    Alert,
    Avatar,
    Tab,
    Tabs,
    InputAdornment,
    IconButton,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ChangePassword from './ChangePassword';
import {useNavigate} from 'react-router-dom';

const Profile: React.FC = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { user: authUser, updateUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [avatar, setAvatar] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedTab, setSelectedTab] = useState(0);

    const {
        data: userProfile,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ['userProfile', authUser?.id],
        queryFn: async () => {
            if (!authUser?.id) throw new Error('User not authenticated');
            const response = await apiClient.get('/users/profile');
            return response.data;
        },
        enabled: !!authUser?.id,
        onSuccess: (data) => {
            setFullName(data.fullName);
            setEmail(data.email);
            setAvatar(data.avatar || '');
        },
    });

    const updateProfileMutation = useMutation({
        mutationFn: (updatedData: { fullName?: string; email?: string; avatar?: string | null }) =>
            apiClient.patch('/users/profile', updatedData),
        onSuccess: (data) => {
            toast.success('Profile updated successfully!');
            queryClient.invalidateQueries({ queryKey: ['userProfile', authUser?.id] });
            updateUser(data.data);
            setIsEditing(false);
        },
        onError: (err: any) => {
            console.error('Update profile error:', err);
            toast.error(err.response?.data?.message || 'Failed to update profile.');
        },
    });

    const uploadAvatarMutation = useMutation({
        mutationFn: (file: File) => {
            const formData = new FormData();
            formData.append('avatar', file);
            return apiClient.post('/users/profile/avatar', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        },
        onSuccess: (data) => {
            toast.success('Avatar uploaded successfully!');
            queryClient.invalidateQueries({ queryKey: ['userProfile', authUser?.id] });
            updateUser(data.data.user);
            setAvatar(data.data.avatar);
            setSelectedFile(null);
        },
        onError: (err: any) => {
            console.error('Avatar upload error:', err);
            toast.error(err.response?.data?.message || 'Failed to upload avatar.');
        },
    });

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
        setSelectedFile(null);
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFile(event.target.files[0]);
        } else {
            setSelectedFile(null);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const profileUpdatePromise = updateProfileMutation.mutateAsync({
            fullName,
            email,
            avatar: avatar || null,
        });

        if (selectedFile) {
            await profileUpdatePromise;
            uploadAvatarMutation.mutate(selectedFile);
        } else {
            await profileUpdatePromise;
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setSelectedTab(newValue);
    };

    if (isLoading) {
        return (
            <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    if (isError) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Alert severity="error">Error loading profile: {(error as any)?.message}</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom>
                    User Profile
                </Typography>

                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={selectedTab} onChange={handleTabChange}>
                        <Tab label="My Profile" />
                        <Tab label="Change Password" />
                    </Tabs>
                </Box>

                {selectedTab === 0 && (
                    <Box sx={{ mt: 3 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                            <Avatar
                                src={
                                    selectedFile
                                        ? URL.createObjectURL(selectedFile)
                                        : avatar
                                            ? `${apiClient.defaults.baseURL}${avatar}`
                                            : undefined
                                }
                                sx={{ width: 100, height: 100, mb: 2 }}
                            >
                                {fullName ? fullName[0] : ''}
                            </Avatar>
                            <Typography variant="h6">{userProfile?.fullName}</Typography>
                            <Typography variant="body2" color="text.secondary">{userProfile?.email}</Typography>
                            <Typography variant="body2" color="text.secondary">Role: {userProfile?.role}</Typography>
                        </Box>

                        <Box component="form" onSubmit={handleSave}>
                            <TextField
                                margin="normal"
                                fullWidth
                                label="Full Name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                disabled={!isEditing || updateProfileMutation.isPending}
                                required
                            />
                            <TextField
                                margin="normal"
                                fullWidth
                                label="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={!isEditing || updateProfileMutation.isPending}
                                required
                            />
                            {isEditing && (
                                <TextField
                                    margin="normal"
                                    fullWidth
                                    label="Upload New Avatar"
                                    type="text"
                                    value={selectedFile ? selectedFile.name : ''}
                                    disabled={updateProfileMutation.isPending || uploadAvatarMutation.isPending}
                                    InputProps={{
                                        readOnly: true,
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <input
                                                    type="file"
                                                    hidden
                                                    id="avatar-upload-input"
                                                    onChange={handleFileChange}
                                                    accept="image/*"
                                                />
                                                <label htmlFor="avatar-upload-input">
                                                    <IconButton component="span" disabled={updateProfileMutation.isPending || uploadAvatarMutation.isPending}>
                                                        <CloudUploadIcon />
                                                    </IconButton>
                                                </label>
                                            </InputAdornment>
                                        ),
                                    }}
                                    helperText="Select a file to upload as your avatar. Max 5MB."
                                />
                            )}
                            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Button onClick={() => navigate('/dashboard')}>
                                    Back to Dashboard
                                </Button>

                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Button variant="outlined" onClick={handleEditToggle}>
                                        {isEditing ? 'Cancel' : 'Edit Profile'}
                                    </Button>
                                    {isEditing && (
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            disabled={updateProfileMutation.isPending}
                                        >
                                            {updateProfileMutation.isPending ? (
                                                <CircularProgress size={24} color="inherit" />
                                            ) : (
                                                'Save Changes'
                                            )}
                                        </Button>
                                    )}
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                )}

                {selectedTab === 1 && (
                    <Box sx={{ mt: 3 }}>
                        <ChangePassword />
                    </Box>
                )}
            </Paper>
        </Container>
    );
};

export default Profile;
