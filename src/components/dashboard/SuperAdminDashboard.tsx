import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/apiClient';
import {
    Container,
    Typography,
    Box,
    Paper,
    Grid,
    CircularProgress,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    TablePagination,
} from '@mui/material';
import { toast } from 'react-toastify';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import type {Company, PaginatedResponse, User } from '@/types';
import { Role } from '@/types'; // без type
import HistoryIcon from '@mui/icons-material/History';

const SuperAdminDashboard: React.FC = () => {
    const queryClient = useQueryClient();
    const [isCreateAdminModalOpen, setIsCreateAdminModalOpen] = useState(false);
    const [newAdminName, setNewAdminName] = useState('');
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [newAdminPassword, setNewAdminPassword] = useState('');
    const [editUserModalOpen, setEditUserModalOpen] = useState(false);
    const [currentUserToEdit, setCurrentUserToEdit] = useState<User | null>(null);
    const [editUserName, setEditUserName] = useState('');
    const [editUserEmail, setEditUserEmail] = useState('');
    const [editUserRole, setEditUserRole] = useState<Role>(Role.User);

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Fetch dashboard stats (companies count, total capital)
    const { data: statsData, isLoading: isLoadingStats, isError: isErrorStats } = useQuery<
        { totalCompanies: number; totalCapital: number }
    >({
        queryKey: ['dashboardStats'],
        queryFn: async () => {
            const response = await apiClient.get('/companies/dashboard/stats');
            return response.data;
        },
    });

    // Fetch all users (Admins and SuperAdmins can see all)
    const {
        data: usersData,
        isLoading: isLoadingUsers,
        isError: isErrorUsers,
    } = useQuery<PaginatedResponse<User>>({
        queryKey: ['users', page, rowsPerPage],
        queryFn: async () => {
            const response = await apiClient.get(`/users?page=${page + 1}&limit=${rowsPerPage}`);
            return response.data.users; // Бэкенд возвращает { users: [], total: N }
        },
        select: (data) => {
            // Адаптируем к формату PaginatedResponse, если бэкенд возвращает items и total
            return {
                items: data.users || data, // Если data - это сразу массив users
                total: data.total || data.length, // Если data.total нет, используем длину массива
                page: page + 1,
                limit: rowsPerPage,
            };
        },
    });

    // Fetch companies for general overview (SuperAdmin can see all)
    const {
        data: companiesData,
        isLoading: isLoadingCompanies,
        isError: isErrorCompanies,
    } = useQuery<PaginatedResponse<Company>>({
        queryKey: ['allCompanies'], // Fetch all companies regardless of owner for SuperAdmin
        queryFn: async () => {
            const response = await apiClient.get('/companies');
            return response.data.companies; // Бэкенд возвращает { companies: [], total: N }
        },
        select: (data) => {
            return {
                items: data.companies || data,
                total: data.total || data.length,
                page: 1, // Для дашборда не используем пагинацию, но адаптируем тип
                limit: 100,
            };
        },
    });

    const createAdminMutation = useMutation({
        mutationFn: (newAdmin: { fullName: string; email: string; password: string }) =>
            apiClient.post('/users/admin', newAdmin),
        onSuccess: () => {
            toast.success('New admin created successfully!');
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setIsCreateAdminModalOpen(false);
            setNewAdminName('');
            setNewAdminEmail('');
            setNewAdminPassword('');
        },
        onError: (error: any) => {
            console.error('Create admin error:', error);
            toast.error(error.response?.data?.message || 'Failed to create admin.');
        },
    });

    const updateUserMutation = useMutation({
        mutationFn: (updateData: { id: number; data: { fullName?: string; email?: string; role?: Role } }) =>
            apiClient.patch(`/users/${updateData.id}`, updateData.data),
        onSuccess: () => {
            toast.success('User updated successfully!');
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setEditUserModalOpen(false);
        },
        onError: (error: any) => {
            console.error('Update user error:', error);
            toast.error(error.response?.data?.message || 'Failed to update user.');
        },
    });

    const deleteUserMutation = useMutation({
        mutationFn: (userId: number) => apiClient.delete(`/users/${userId}`),
        onSuccess: () => {
            toast.success('User deleted successfully!');
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
        onError: (error: any) => {
            console.error('Delete user error:', error);
            toast.error(error.response?.data?.message || 'Failed to delete user.');
        },
    });

    const handleOpenCreateAdminModal = () => {
        setIsCreateAdminModalOpen(true);
    };

    const handleCloseCreateAdminModal = () => {
        setIsCreateAdminModalOpen(false);
        setNewAdminName('');
        setNewAdminEmail('');
        setNewAdminPassword('');
    };

    const handleCreateAdminSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAdminName || !newAdminEmail || !newAdminPassword) {
            toast.error('All fields are required for new admin.');
            return;
        }
        createAdminMutation.mutate({
            fullName: newAdminName,
            email: newAdminEmail,
            password: newAdminPassword,
        });
    };

    const handleOpenEditUserModal = (user: User) => {
        setCurrentUserToEdit(user);
        setEditUserName(user.fullName);
        setEditUserEmail(user.email);
        setEditUserRole(user.role);
        setEditUserModalOpen(true);
    };

    const handleCloseEditUserModal = () => {
        setEditUserModalOpen(false);
        setCurrentUserToEdit(null);
    };

    const handleEditUserSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (currentUserToEdit) {
            updateUserMutation.mutate({
                id: currentUserToEdit.id,
                data: {
                    fullName: editUserName,
                    email: editUserEmail,
                    role: editUserRole,
                },
            });
        }
    };

    const handleDeleteUser = (userId: number) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            deleteUserMutation.mutate(userId);
        }
    };

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                SuperAdmin Dashboard
            </Typography>

            {/* Статистика компаний */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h6" color="primary" gutterBottom>
                            Total Companies
                        </Typography>
                        {isLoadingStats ? (
                            <CircularProgress />
                        ) : isErrorStats ? (
                            <Alert severity="error">Failed to load company stats.</Alert>
                        ) : (
                            <Typography variant="h3">{statsData?.totalCompanies}</Typography>
                        )}
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h6" color="primary" gutterBottom>
                            Total Capital Across All Companies
                        </Typography>
                        {isLoadingStats ? (
                            <CircularProgress />
                        ) : isErrorStats ? (
                            <Alert severity="error">Failed to load capital stats.</Alert>
                        ) : (
                            <Typography variant="h3">${statsData?.totalCapital?.toFixed(2)}</Typography>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* Управление пользователями/админами */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" gutterBottom>
                    Manage Users & Admins
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleOpenCreateAdminModal}
                >
                    Create New Admin
                </Button>
            </Box>

            {isLoadingUsers ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress />
                </Box>
            ) : isErrorUsers ? (
                <Alert severity="error">Failed to load users.</Alert>
            ) : (
                <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                    <TableContainer sx={{ maxHeight: 600 }}>
                        <Table stickyHeader aria-label="users table">
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Full Name</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Role</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {usersData?.items.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>{user.id}</TableCell>
                                        <TableCell>{user.fullName}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>{user.role}</TableCell>
                                        <TableCell>
                                            <Button
                                                size="small"
                                                startIcon={<EditIcon />}
                                                onClick={() => handleOpenEditUserModal(user)}
                                                sx={{ mr: 1 }}
                                            >
                                                Edit
                                            </Button>
                                            {user.role !== Role.SuperAdmin && (
                                                <Button
                                                    size="small"
                                                    color="error"
                                                    startIcon={<DeleteIcon />}
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    disabled={deleteUserMutation.isPending}
                                                    sx={{ mr: 1 }}
                                                >
                                                    Delete
                                                </Button>
                                            )}
                                            <Button
                                                size="small"
                                                component={RouterLink}
                                                to={`/history?userId=${user.id}`}
                                                startIcon={<HistoryIcon />}
                                                color="secondary"
                                            >
                                                History
                                            </Button>
                                        </TableCell>

                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={usersData?.total || 0}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </Paper>
            )}

            {/* Отображение компаний (для SuperAdmin) */}
            <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
                All Companies Overview
            </Typography>
            {isLoadingCompanies ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress />
                </Box>
            ) : isErrorCompanies ? (
                <Alert severity="error">Failed to load companies.</Alert>
            ) : (
                <Paper sx={{ width: '100%', overflow: 'hidden', mb: 4 }}>
                    <TableContainer sx={{ maxHeight: 600 }}>
                        <Table stickyHeader aria-label="companies table">
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Service</TableCell>
                                    <TableCell align="right">Capital</TableCell>
                                    <TableCell>Owner ID</TableCell>
                                    <TableCell>Created At</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {companiesData?.items.map((company) => (
                                    <TableRow key={company.id}>
                                        <TableCell>{company.id}</TableCell>
                                        <TableCell>{company.name}</TableCell>
                                        <TableCell>{company.service || 'N/A'}</TableCell>
                                        <TableCell align="right">
                                            ${typeof company.capital === 'number'
                                            ? company.capital.toFixed(2)
                                            : Number(company.capital)?.toFixed(2) || '0.00'}
                                        </TableCell>
                                        <TableCell>{company.ownerId}</TableCell>
                                        <TableCell>{new Date(company.createdAt).toLocaleDateString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    {companiesData?.total === 0 && (
                        <Box sx={{ p: 2, textAlign: 'center' }}>
                            <Typography>No companies found.</Typography>
                        </Box>
                    )}
                </Paper>
            )}

            {/* Модальное окно создания админа */}
            <Dialog open={isCreateAdminModalOpen} onClose={handleCloseCreateAdminModal}>
                <DialogTitle>Create New Admin</DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={handleCreateAdminSubmit} sx={{ mt: 1 }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Full Name"
                            value={newAdminName}
                            onChange={(e) => setNewAdminName(e.target.value)}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Email Address"
                            type="email"
                            value={newAdminEmail}
                            onChange={(e) => setNewAdminEmail(e.target.value)}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Password"
                            type="password"
                            value={newAdminPassword}
                            onChange={(e) => setNewAdminPassword(e.target.value)}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseCreateAdminModal}>Cancel</Button>
                    <Button
                        onClick={handleCreateAdminSubmit}
                        variant="contained"
                        disabled={createAdminMutation.isPending}
                    >
                        {createAdminMutation.isPending ? <CircularProgress size={24} color="inherit" /> : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Модальное окно редактирования пользователя */}
            <Dialog open={editUserModalOpen} onClose={handleCloseEditUserModal}>
                <DialogTitle>Edit User</DialogTitle>
                <DialogContent>
                    {currentUserToEdit && (
                        <Box component="form" onSubmit={handleEditUserSubmit} sx={{ mt: 1 }}>
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                label="Full Name"
                                value={editUserName}
                                onChange={(e) => setEditUserName(e.target.value)}
                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                label="Email Address"
                                type="email"
                                value={editUserEmail}
                                onChange={(e) => setEditUserEmail(e.target.value)}
                            />
                            <TextField
                                select
                                margin="normal"
                                required
                                fullWidth
                                label="Role"
                                value={editUserRole}
                                onChange={(e) => setEditUserRole(e.target.value as Role)}
                            >
                                {Object.values(Role).map((role) => (
                                    <MenuItem key={role} value={role}>
                                        {role}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseEditUserModal}>Cancel</Button>
                    <Button
                        onClick={handleEditUserSubmit}
                        variant="contained"
                        disabled={updateUserMutation.isPending}
                    >
                        {updateUserMutation.isPending ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default SuperAdminDashboard;