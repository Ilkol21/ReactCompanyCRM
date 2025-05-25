import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
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

import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';

import type { Company, PaginatedResponse, User } from '@/types';
import { Role } from '@/types';
import { Link as RouterLink } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const [editUserModalOpen, setEditUserModalOpen] = useState(false);
    const [currentUserToEdit, setCurrentUserToEdit] = useState<User | null>(null);
    const [editUserName, setEditUserName] = useState('');
    const [editUserEmail, setEditUserEmail] = useState('');
    const [editUserRole, setEditUserRole] = useState<Role>(Role.User);

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const handleLogout = () => {
        localStorage.removeItem('authToken'); // очистка токена
        queryClient.clear(); // очистка кэша react-query
        navigate('/login'); // редирект на страницу входа
    };

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

    // Запрос всех компаний
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
            if (editUserRole === Role.SuperAdmin) {
                toast.error('Admins cannot set user role to SuperAdmin.');
                return;
            }
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

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" gutterBottom>
                    Admin Dashboard
                </Typography>
                <Button variant="outlined" color="error" onClick={handleLogout}>
                    Logout
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

            {/* Просмотр и редактирование пользователей */}
            <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
                View & Edit Users
            </Typography>
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
                                            {user.role !== Role.SuperAdmin && (
                                                <Button
                                                    size="small"
                                                    startIcon={<EditIcon />}
                                                    onClick={() => handleOpenEditUserModal(user)}
                                                >
                                                    Edit
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
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {companiesData?.items.map((company) => (
                                    <TableRow key={company.id}>
                                        <TableCell>{company.id}</TableCell>
                                        <TableCell>{company.name}</TableCell>
                                        <TableCell>{company.service}</TableCell>
                                        <TableCell align="right">${Number(company.capital).toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {/* Модальное окно редактирования пользователя */}
            <Dialog open={editUserModalOpen} onClose={handleCloseEditUserModal} maxWidth="sm" fullWidth>
                <DialogTitle>Edit User</DialogTitle>
                <form onSubmit={handleEditUserSubmit}>
                    <DialogContent dividers>
                        <TextField
                            label="Full Name"
                            fullWidth
                            margin="normal"
                            value={editUserName}
                            onChange={(e) => setEditUserName(e.target.value)}
                            required
                        />
                        <TextField
                            label="Email"
                            type="email"
                            fullWidth
                            margin="normal"
                            value={editUserEmail}
                            onChange={(e) => setEditUserEmail(e.target.value)}
                            required
                        />
                        <TextField
                            select
                            label="Role"
                            fullWidth
                            margin="normal"
                            value={editUserRole}
                            onChange={(e) => setEditUserRole(e.target.value as Role)}
                            required
                        >
                            <MenuItem value={Role.User}>User</MenuItem>
                            <MenuItem value={Role.Admin}>Admin</MenuItem>
                            {/* Не даём ставить SuperAdmin */}
                        </TextField>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseEditUserModal}>Cancel</Button>
                        <Button type="submit" disabled={updateUserMutation.isLoading} variant="contained" color="primary">
                            Save
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Container>
    );
};

export default AdminDashboard;
