import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/apiClient';
import {
    Container,
    Typography,
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Alert,
    Button,
    TextField,
    InputAdornment,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TablePagination,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    Grid,
} from '@mui/material';
import { Link } from 'react-router-dom';

import { toast } from 'react-toastify';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { useAuth } from '../../context/AuthContext';
import type { Company, PaginatedResponse } from '@/types';
// Предполагается, что Role импортирован где-то
import InfoIcon from '@mui/icons-material/Info';

const CompaniesList: React.FC = () => {
    const queryClient = useQueryClient();
    const { user, isOwner, hasRole } = useAuth();
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
    const [nameSearch, setNameSearch] = useState('');
    const [serviceSearch, setServiceSearch] = useState('');
    const [capitalMin, setCapitalMin] = useState<string>('');
    const [capitalMax, setCapitalMax] = useState<string>('');
    const [createdAtStart, setCreatedAtStart] = useState('');
    const [createdAtEnd, setCreatedAtEnd] = useState('');

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newCompanyName, setNewCompanyName] = useState('');
    const [newCompanyService, setNewCompanyService] = useState('');
    const [newCompanyCapital, setNewCompanyCapital] = useState<string>('');
    const [newCompanyLogoFile, setNewCompanyLogoFile] = useState<File | null>(null);
    const [newCompanyLat, setNewCompanyLat] = useState<string>('');
    const [newCompanyLon, setNewCompanyLon] = useState<string>('');

    const {
        data: companiesData,
        isLoading,
        isError,
        refetch,
    } = useQuery<PaginatedResponse<Company>>({
        queryKey: [
            'companies',
            page,
            rowsPerPage,
            sortBy,
            sortOrder,
            nameSearch,
            serviceSearch,
            capitalMin,
            capitalMax,
            createdAtStart,
            createdAtEnd,
            user?.id,
        ],
        queryFn: async () => {
            const params = {
                page: page + 1,
                limit: rowsPerPage,
                sortBy,
                sortOrder,
                ...(nameSearch && { nameSearch }),
                ...(serviceSearch && { serviceSearch }),
                ...(capitalMin && { capitalMin: parseFloat(capitalMin) }),
                ...(capitalMax && { capitalMax: parseFloat(capitalMax) }),
                ...(createdAtStart && { createdAtStart }),
                ...(createdAtEnd && { createdAtEnd }),
            };
            const response = await apiClient.get('/companies', { params });
            return {
                items: response.data.companies || response.data,
                total: response.data.total || response.data.companies?.length || response.data.length,
                page: params.page,
                limit: params.limit,
            };
        },
        enabled: !!user?.id,
    });

    const createCompanyMutation = useMutation({
        mutationFn: (formData: FormData) => apiClient.post('/companies', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
        onSuccess: () => {
            toast.success('Company created successfully!');
            queryClient.invalidateQueries({ queryKey: ['companies'] });
            queryClient.invalidateQueries({ queryKey: ['dashboardStats'] }); // Обновить статистику
            setIsCreateModalOpen(false);
            setNewCompanyName('');
            setNewCompanyService('');
            setNewCompanyCapital('');
            setNewCompanyLogoFile(null);
            setNewCompanyLat('');
            setNewCompanyLon('');
        },
        onError: (error: any) => {
            console.error('Create company error:', error);
            toast.error(error.response?.data?.message || 'Failed to create company.');
        },
    });

    const deleteCompanyMutation = useMutation({
        mutationFn: (companyId: number) => apiClient.delete(`/companies/${companyId}`),
        onSuccess: () => {
            toast.success('Company deleted successfully!');
            queryClient.invalidateQueries({ queryKey: ['companies'] });
            queryClient.invalidateQueries({ queryKey: ['dashboardStats'] }); // Обновить статистику
        },
        onError: (error: any) => {
            console.error('Delete company error:', error);
            toast.error(error.response?.data?.message || 'Failed to delete company.');
        },
    });

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!newCompanyName) {
            toast.error('Company name is required.');
            return;
        }

        const formData = new FormData();
        formData.append('name', newCompanyName);
        if (newCompanyService) formData.append('service', newCompanyService);
        if (newCompanyCapital) formData.append('capital', newCompanyCapital);
        if (newCompanyLogoFile) formData.append('logo', newCompanyLogoFile);
        if (newCompanyLat) formData.append('locationLat', newCompanyLat);
        if (newCompanyLon) formData.append('locationLon', newCompanyLon);

        createCompanyMutation.mutate(formData);
    };

    const handleDelete = (id: number) => {
        if (window.confirm('Are you sure you want to delete this company?')) {
            deleteCompanyMutation.mutate(id);
        }
    };

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleSortChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        if (value.startsWith('-')) {
            setSortBy(value.substring(1));
            setSortOrder('DESC');
        } else {
            setSortBy(value);
            setSortOrder('ASC');
        }
    };

    const handleClearFilters = () => {
        setNameSearch('');
        setServiceSearch('');
        setCapitalMin('');
        setCapitalMax('');
        setCreatedAtStart('');
        setCreatedAtEnd('');
        setPage(0); // Сбросить пагинацию при сбросе фильтров
        setSortBy('createdAt');
        setSortOrder('DESC');
        refetch(); // Обновить данные после сброса фильтров
    };

    const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setNewCompanyLogoFile(e.target.files[0]);
        } else {
            setNewCompanyLogoFile(null);
        }
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Companies List
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => setIsCreateModalOpen(true)}
                >
                    Create Company
                </Button>
            </Box>

            {/* Filters and Search */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            fullWidth
                            label="Search by Name"
                            value={nameSearch}
                            onChange={(e) => setNameSearch(e.target.value)}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        {nameSearch && (
                                            <IconButton onClick={() => setNameSearch('')} size="small">
                                                <ClearIcon />
                                            </IconButton>
                                        )}
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            fullWidth
                            label="Search by Service"
                            value={serviceSearch}
                            onChange={(e) => setServiceSearch(e.target.value)}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        {serviceSearch && (
                                            <IconButton onClick={() => setServiceSearch('')} size="small">
                                                <ClearIcon />
                                            </IconButton>
                                        )}
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>
                    <Grid item xs={6} sm={3} md={1.5}>
                        <TextField
                            fullWidth
                            label="Capital Min"
                            type="number"
                            value={capitalMin}
                            onChange={(e) => setCapitalMin(e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={6} sm={3} md={1.5}>
                        <TextField
                            fullWidth
                            label="Capital Max"
                            type="number"
                            value={capitalMax}
                            onChange={(e) => setCapitalMax(e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={6} sm={3} md={1.5}>
                        <TextField
                            fullWidth
                            label="Created After"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                            value={createdAtStart}
                            onChange={(e) => setCreatedAtStart(e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={6} sm={3} md={1.5}>
                        <TextField
                            fullWidth
                            label="Created Before"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                            value={createdAtEnd}
                            onChange={(e) => setCreatedAtEnd(e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} sm={12} md={12} sx={{ textAlign: 'right' }}>
                        <Button onClick={handleClearFilters} color="secondary" variant="outlined">
                            Clear Filters
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* Table */}
            <Paper>
                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                    </Box>
                ) : isError ? (
                    <Alert severity="error">Failed to load companies.</Alert>
                ) : (
                    <>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>
                                            <FormControl fullWidth size="small">
                                                <InputLabel>Sort By</InputLabel>
                                                <Select
                                                    value={sortOrder === 'DESC' ? `-${sortBy}` : sortBy}
                                                    label="Sort By"
                                                    onChange={handleSortChange}
                                                >
                                                    <MenuItem value="-createdAt">Created At (desc)</MenuItem>
                                                    <MenuItem value="createdAt">Created At (asc)</MenuItem>
                                                    <MenuItem value="-capital">Capital (desc)</MenuItem>
                                                    <MenuItem value="capital">Capital (asc)</MenuItem>
                                                    <MenuItem value="-name">Name (desc)</MenuItem>
                                                    <MenuItem value="name">Name (asc)</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </TableCell>
                                        <TableCell>Name</TableCell>
                                        <TableCell>Service</TableCell>
                                        <TableCell>Capital</TableCell>
                                        <TableCell>Logo</TableCell>
                                        <TableCell>Location</TableCell>
                                        <TableCell>Created At</TableCell>
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {companiesData?.items.map((company) => (
                                        <TableRow key={company.id}>
                                            <TableCell>{company.id}</TableCell>
                                            <TableCell>
                                                <Link to={`/companies/${company.id}`}>{company.name}</Link>
                                            </TableCell>
                                            <TableCell>{company.service}</TableCell>
                                            <TableCell>{company.capital?.toLocaleString()}</TableCell>
                                            <TableCell>
                                                {company.logo ? (
                                                    <img
                                                        src={company.logo}
                                                        alt={`${company.name} logo`}
                                                        style={{ width: 50, height: 50, objectFit: 'contain' }}
                                                    />
                                                ) : (
                                                    <InfoIcon color="disabled" />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {company.locationLat && company.locationLon
                                                    ? `${company.locationLat}, ${company.locationLon}`
                                                    : '-'}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(company.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                {(isOwner || hasRole('Admin')) && (
                                                    <>
                                                        <IconButton
                                                            component={Link}
                                                            to={`/companies/${company.id}/edit`}
                                                            color="primary"
                                                        >
                                                            <EditIcon />
                                                        </IconButton>
                                                        <IconButton
                                                            onClick={() => handleDelete(company.id)}
                                                            color="error"
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            component="div"
                            count={companiesData?.total ?? 0}
                            page={page}
                            onPageChange={handleChangePage}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            rowsPerPageOptions={[5, 10, 25]}
                        />
                    </>
                )}
            </Paper>

            {/* Create Company Modal */}
            <Dialog open={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Create New Company</DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={handleCreateSubmit} sx={{ mt: 1 }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Company Name"
                            value={newCompanyName}
                            onChange={(e) => setNewCompanyName(e.target.value)}
                            autoFocus
                        />
                        <TextField
                            margin="normal"
                            fullWidth
                            label="Service"
                            value={newCompanyService}
                            onChange={(e) => setNewCompanyService(e.target.value)}
                        />
                        <TextField
                            margin="normal"
                            fullWidth
                            label="Capital"
                            type="number"
                            inputProps={{ min: 0, step: 'any' }}
                            value={newCompanyCapital}
                            onChange={(e) => setNewCompanyCapital(e.target.value)}
                        />
                        <Box sx={{ mt: 2 }}>
                            <InputLabel>Logo (Image file)</InputLabel>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoFileChange}
                                style={{ marginTop: 8 }}
                            />
                            {newCompanyLogoFile && <Typography variant="body2" sx={{ mt: 1 }}>{newCompanyLogoFile.name}</Typography>}
                        </Box>
                        <TextField
                            margin="normal"
                            fullWidth
                            label="Location Latitude"
                            type="number"
                            inputProps={{ step: 'any' }}
                            value={newCompanyLat}
                            onChange={(e) => setNewCompanyLat(e.target.value)}
                        />
                        <TextField
                            margin="normal"
                            fullWidth
                            label="Location Longitude"
                            type="number"
                            inputProps={{ step: 'any' }}
                            value={newCompanyLon}
                            onChange={(e) => setNewCompanyLon(e.target.value)}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            setIsCreateModalOpen(false);
                            setNewCompanyName('');
                            setNewCompanyService('');
                            setNewCompanyCapital('');
                            setNewCompanyLogoFile(null);
                            setNewCompanyLat('');
                            setNewCompanyLon('');
                        }}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleCreateSubmit} variant="contained" color="primary">
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default CompaniesList;
