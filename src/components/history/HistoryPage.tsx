import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
    TablePagination,
    TextField,
    MenuItem,
    InputLabel,
    FormControl,
    Select,
    Grid,
    Button,
    InputAdornment,
    IconButton,
} from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import { ActionType, EntityType } from '@/types';
import type { HistoryEntry, PaginatedResponse } from '@/types';

const HistoryPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const userIdFromUrl = searchParams.get('userId') || '';

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [sortBy, setSortBy] = useState('timestamp');
    const [sortOrder, setSortOrder] = useState<'DESC' | 'ASC'>('DESC');
    const [userIdFilter, setUserIdFilter] = useState(userIdFromUrl);
    const [actionTypeFilter, setActionTypeFilter] = useState<ActionType | ''>('');
    const [entityTypeFilter, setEntityTypeFilter] = useState<EntityType | ''>('');
    const [entityIdFilter, setEntityIdFilter] = useState('');
    const [searchDetails, setSearchDetails] = useState('');

    React.useEffect(() => {
        setUserIdFilter(userIdFromUrl);
        setPage(0);
    }, [userIdFromUrl]);

    const {
        data: historyData,
        isLoading,
        isError,
        refetch,
    } = useQuery<PaginatedResponse<HistoryEntry>>({
        queryKey: [
            'history',
            page,
            rowsPerPage,
            sortBy,
            sortOrder,
            userIdFilter,
            actionTypeFilter,
            entityTypeFilter,
            entityIdFilter,
            searchDetails,
        ],
        queryFn: async () => {
            const params = {
                page: page + 1,
                limit: rowsPerPage,
                sortBy,
                sortOrder,
                ...(userIdFilter && { userId: parseInt(userIdFilter, 10) }),
                ...(actionTypeFilter && { actionType: actionTypeFilter }),
                ...(entityTypeFilter && { entityType: entityTypeFilter }),
                ...(entityIdFilter && { entityId: parseInt(entityIdFilter, 10) }),
                ...(searchDetails && { search: searchDetails }),
            };
            const response = await apiClient.get('/history', { params });
            return {
                items: response.data.history || response.data,
                total: response.data.total || response.data.history?.length || response.data.length,
                page: params.page,
                limit: params.limit,
            };
        },
    });

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
        setUserIdFilter('');
        setActionTypeFilter('');
        setEntityTypeFilter('');
        setEntityIdFilter('');
        setSearchDetails('');
        setPage(0);
        setSortBy('timestamp');
        setSortOrder('DESC');
        refetch();
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                User & Admin Activity History
            </Typography>

            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6} md={2}>
                        <TextField
                            fullWidth
                            label="User ID"
                            type="number"
                            value={userIdFilter}
                            onChange={(e) => setUserIdFilter(e.target.value)}
                            inputProps={{ min: "1" }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth>
                            <InputLabel>Action Type</InputLabel>
                            <Select
                                value={actionTypeFilter}
                                label="Action Type"
                                onChange={(e) => setActionTypeFilter(e.target.value as ActionType | '')}
                            >
                                <MenuItem value="">All</MenuItem>
                                {Object.values(ActionType).map((type) => (
                                    <MenuItem key={type} value={type}>
                                        {type.replace(/_/g, ' ')}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <FormControl fullWidth>
                            <InputLabel>Entity Type</InputLabel>
                            <Select
                                value={entityTypeFilter}
                                label="Entity Type"
                                onChange={(e) => setEntityTypeFilter(e.target.value as EntityType | '')}
                            >
                                <MenuItem value="">All</MenuItem>
                                {Object.values(EntityType).map((type) => (
                                    <MenuItem key={type} value={type}>
                                        {type}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <TextField
                            fullWidth
                            label="Entity ID"
                            type="number"
                            value={entityIdFilter}
                            onChange={(e) => setEntityIdFilter(e.target.value)}
                            inputProps={{ min: "1" }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            fullWidth
                            label="Search Details"
                            value={searchDetails}
                            onChange={(e) => setSearchDetails(e.target.value)}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        {searchDetails && (
                                            <IconButton onClick={() => setSearchDetails('')} size="small">
                                                <ClearIcon />
                                            </IconButton>
                                        )}
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <FormControl fullWidth>
                            <InputLabel>Sort By</InputLabel>
                            <Select
                                value={sortOrder === 'DESC' ? `-${sortBy}` : sortBy}
                                label="Sort By"
                                onChange={handleSortChange}
                            >
                                <MenuItem value="timestamp">Timestamp (ASC)</MenuItem>
                                <MenuItem value="-timestamp">Timestamp (DESC)</MenuItem>
                                <MenuItem value="userId">User ID (ASC)</MenuItem>
                                <MenuItem value="-userId">User ID (DESC)</MenuItem>
                                <MenuItem value="action">Action (ASC)</MenuItem>
                                <MenuItem value="-action">Action (DESC)</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <Button
                            variant="outlined"
                            fullWidth
                            onClick={handleClearFilters}
                            startIcon={<ClearIcon />}
                        >
                            Clear Filters
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress />
                </Box>
            ) : isError ? (
                <Alert severity="error">Failed to load history.</Alert>
            ) : (
                <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                    <TableContainer sx={{ maxHeight: 700 }}>
                        <Table stickyHeader aria-label="history table">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Timestamp</TableCell>
                                    <TableCell>User</TableCell>
                                    <TableCell>Action</TableCell>
                                    <TableCell>Entity Type</TableCell>
                                    <TableCell>Entity ID</TableCell>
                                    <TableCell>Details</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {historyData?.items.map((entry) => (
                                    <TableRow key={entry.id}>
                                        <TableCell>{new Date(entry.timestamp).toLocaleString()}</TableCell>
                                        <TableCell>{entry.user ? `${entry.user.fullName} (ID: ${entry.userId})` : `User ID: ${entry.userId} (Deleted)`}</TableCell>
                                        <TableCell>{entry.action}</TableCell>
                                        <TableCell>{entry.entityType}</TableCell>
                                        <TableCell>{entry.entityId || 'N/A'}</TableCell>
                                        <TableCell>{entry.details}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        component="div"
                        count={historyData?.total || 0}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </Paper>
            )}
        </Container>
    );
};

export default HistoryPage;