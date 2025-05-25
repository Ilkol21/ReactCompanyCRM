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
import HistoryIcon from '@mui/icons-material/History';
import type { Company, PaginatedResponse, User } from '@/types';
import { Role } from '@/types'; // без type

const SuperAdminDashboard: React.FC = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

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

    // Запросы данных
    const { data: statsData, isLoading: isLoadingStats, isError: isErrorStats } = useQuery<
        { totalCompanies: number; totalCapital: number }
    >({
        queryKey: ['dashboardStats'],
        queryFn: async () => {
            const response = await apiClient.get('/companies/dashboard/stats');
            return response.data;
        },
    });

    const {
        data: usersData,
        isLoading: isLoadingUsers,
        isError: isErrorUsers,
    } = useQuery<PaginatedResponse<User>>({
        queryKey: ['users', page, rowsPerPage],
        queryFn: async () => {
            const response = await apiClient.get(`/users?page=${page + 1}&limit=${rowsPerPage}`);
            return response.data;
        },
        select: (data) => ({
            items: data.users || data,
            total: data.total || data.length,
            page: page + 1,
            limit: rowsPerPage,
        }),
    });

    const {
        data: companiesData,
        isLoading: isLoadingCompanies,
        isError: isErrorCompanies,
    } = useQuery<PaginatedResponse<Company>>({
        queryKey: ['allCompanies'],
        queryFn: async () => {
            const response = await apiClient.get('/companies');
            return response.data;
        },
        select: (data) => ({
            items: data.companies || data,
            total: data.total || data.length,
            page: 1,
            limit: 100,
        }),
    });

    // Мутации
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

    // Logout мутация
    const logoutMutation = useMutation({
        mutationFn: () => apiClient.post('/auth/logout'),
        onSuccess: () => {
            queryClient.clear();
            navigate('/login');
            toast.info('Logged out successfully.');
        },
        onError: (error: any) => {
            console.error('Logout error:', error);
            toast.error('Failed to logout.');
        },
    });

    // Обработчики
    const handleOpenCreateAdminModal = () => setIsCreateAdminModalOpen(true);
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

    const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
    const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setPage(0);
    };

    const handleLogoutClick = () => {
        logoutMutation.mutate();
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" gutterBottom>
                    SuperAdmin Dashboard
                </Typography>
                <Button variant="outlined" color="error" onClick={handleLogoutClick} disabled={logoutMutation.isLoading}>
                    {logoutMutation.isLoading ? <CircularProgress size={20} /> : 'Logout'}
                </Button>
            </Box>

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
                            Total Capital
                        </Typography>
                        {isLoadingStats ? (
                            <CircularProgress />
                        ) : isErrorStats ? (
                            <Alert severity="error">Failed to load company stats.</Alert>
                        ) : (
                            <Typography variant="h3">${statsData?.totalCapital.toLocaleString()}</Typography>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* Пользователи */}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5">Users</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenCreateAdminModal}
                    disabled={createAdminMutation.isLoading}
                >
                    Create Admin
                </Button>
            </Box>

            {isLoadingUsers ? (
                <CircularProgress />
            ) : isErrorUsers ? (
                <Alert severity="error">Failed to load users.</Alert>
            ) : (
                <Paper>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Full Name</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Role</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {usersData?.items.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>{user.id}</TableCell>
                                        <TableCell>{user.fullName}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>{user.role}</TableCell>
                                        <TableCell align="right">
                                            <Button
                                                size="small"
                                                startIcon={<EditIcon />}
                                                onClick={() => handleOpenEditUserModal(user)}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                size="small"
                                                color="error"
                                                startIcon={<DeleteIcon />}
                                                onClick={() => handleDeleteUser(user.id)}
                                            >
                                                Delete
                                            </Button>
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
                        component="div"
                        count={usersData?.total || 0}
                        page={page}
                        onPageChange={handleChangePage}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </Paper>
            )}

            {/* Companies List */}
            <Box sx={{ mt: 6 }}>
                <Typography variant="h5" gutterBottom>
                    Companies ({companiesData?.total || 0})
                </Typography>
                {isLoadingCompanies ? (
                    <CircularProgress />
                ) : isErrorCompanies ? (
                    <Alert severity="error">Failed to load companies.</Alert>
                ) : (
                    <TableContainer component={Paper}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Capital</TableCell>
                                    <TableCell>Owner</TableCell>
                                    <TableCell>Employees</TableCell>
                                    <TableCell>Created At</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {companiesData?.items.map((company) => (
                                    <TableRow key={company.id}>
                                        <TableCell>{company.id}</TableCell>
                                        <TableCell>
                                            <RouterLink to={`/companies/${company.id}`} style={{ textDecoration: 'none' }}>
                                                {company.name}
                                            </RouterLink>
                                        </TableCell>
                                        <TableCell>${company.capital.toLocaleString()}</TableCell>
                                        <TableCell>{company.owner?.fullName || '-'}</TableCell>
                                        <TableCell>{company.employeesCount || 0}</TableCell>
                                        <TableCell>{new Date(company.createdAt).toLocaleDateString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Box>

            {/* Create Admin Modal */}
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
                            label="Email"
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
                    <Button onClick={handleCloseCreateAdminModal} disabled={createAdminMutation.isLoading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreateAdminSubmit}
                        disabled={createAdminMutation.isLoading}
                        variant="contained"
                    >
                        {createAdminMutation.isLoading ? <CircularProgress size={24} /> : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit User Modal */}
            <Dialog open={editUserModalOpen} onClose={handleCloseEditUserModal}>
                <DialogTitle>Edit User</DialogTitle>
                <DialogContent>
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
                            label="Email"
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
                            <MenuItem value={Role.User}>User</MenuItem>
                            <MenuItem value={Role.Admin}>Admin</MenuItem>
                            <MenuItem value={Role.SuperAdmin}>SuperAdmin</MenuItem>
                        </TextField>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseEditUserModal} disabled={updateUserMutation.isLoading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleEditUserSubmit}
                        disabled={updateUserMutation.isLoading}
                        variant="contained"
                    >
                        {updateUserMutation.isLoading ? <CircularProgress size={24} /> : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default SuperAdminDashboard;
