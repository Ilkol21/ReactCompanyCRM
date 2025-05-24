import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/apiClient';
import {
    Container,
    Typography,
    Box,
    CircularProgress,
    Alert,
    List,
    ListItem,
    ListItemText,
    Paper,
    Divider,
    Button,
} from '@mui/material';

import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import type { Company, PaginatedResponse } from '@/types';

// Импорты для Recharts
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts';

const UserDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const {
        data: userCompaniesData,
        isLoading: isLoadingUserCompanies,
        isError: isErrorUserCompanies,
    } = useQuery<PaginatedResponse<Company>>({
        queryKey: ['userCompanies', user?.id],
        queryFn: async () => {
            const response = await apiClient.get('/companies');
            return response.data.companies;
        },
        enabled: !!user?.id,
        select: (data) => ({
            items: data.companies || data,
            total: data.total || data.length,
            page: 1,
            limit: 100,
        }),
    });

    // Подготовка данных для графика
    // Допустим, у company есть поле priceHistory: Array<{ date: string, capital: number }>
    // Если нет, сделаем упрощённый график по текущему капиталу компаний с именами по оси X

    const chartData = userCompaniesData?.items.map(company => ({
        name: company.name,
        capital: company.capital ?? 0,
    })) || [];

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                Welcome, {user?.fullName}!
            </Typography>

            {/* Навигация */}
            <Box sx={{ mb: 3 }}>
                <Button variant="contained" onClick={() => navigate('/profile')} sx={{ mr: 2 }}>
                    Profile
                </Button>
                <Button variant="contained" onClick={() => navigate('/companies')}>
                    Companies List
                </Button>
                <Button variant="contained" onClick={() => navigate('/companies/create')} sx={{ ml: 2 }}>
                    Create Company
                </Button>
            </Box>

            <Paper sx={{ p: 3, mb: 4 }}>
                <Typography variant="h5" gutterBottom>
                    Your Companies
                </Typography>
                {isLoadingUserCompanies ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <CircularProgress />
                    </Box>
                ) : isErrorUserCompanies ? (
                    <Alert severity="error">Failed to load your companies.</Alert>
                ) : userCompaniesData?.total === 0 ? (
                    <Typography variant="body1">You don't own any companies yet.</Typography>
                ) : (
                    <List>
                        {userCompaniesData?.items.map(company => (
                            <React.Fragment key={company.id}>
                                <ListItem button component={Link} to={`/companies/${company.id}`}>
                                    <ListItemText
                                        primary={company.name}
                                        secondary={`Service: ${company.service || 'N/A'} | Capital: $${typeof company.capital === 'number' ? company.capital.toFixed(2) : Number(company.capital || 0).toFixed(2)}`}
                                    />
                                    {company.logo && (
                                        <Box
                                            component="img"
                                            src={company.logo}
                                            alt={`${company.name} logo`}
                                            sx={{ width: 50, height: 50, borderRadius: '50%', ml: 2, objectFit: 'cover' }}
                                        />
                                    )}
                                </ListItem>
                                <Divider component="li" />
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </Paper>

            {/* График капитала компаний */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Company Capital Overview
                </Typography>
                {chartData.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                        No data to display chart.
                    </Typography>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart
                            data={chartData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="capital" stroke="#8884d8" activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </Paper>
        </Container>
    );
};

export default UserDashboard;
