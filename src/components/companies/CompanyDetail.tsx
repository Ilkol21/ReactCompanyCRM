// src/components/companies/CompanyDetail.tsx
import React, { useState, ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/apiClient';
import {  Role, type Company } from '../../types';
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
    Grid,
    InputAdornment,
    IconButton,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'; // Import Leaflet components
import 'leaflet/dist/leaflet.css'; // Import Leaflet CSS
import L from 'leaflet'; // Import Leaflet itself for custom icons

// Fix for default Leaflet icon issue with Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});


const CompanyDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user, isOwner, hasRole } = useAuth();
    const companyId = parseInt(id || '', 10);

    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState('');
    const [service, setService] = useState('');
    const [capital, setCapital] = useState<string>('');
    const [logo, setLogo] = useState('');
    const [locationLat, setLocationLat] = useState<string>('');
    const [locationLon, setLocationLon] = useState<string>('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const {
        data: company,
        isLoading,
        isError,
    } = useQuery<Company>({
        queryKey: ['company', companyId, user?.id],
        queryFn: async () => {
            const response = await apiClient.get(`/companies/${companyId}`);
            return response.data;
        },
        enabled: !isNaN(companyId),
        onSuccess: (data) => {
            setName(data.name);
            setService(data.service || '');
            setCapital(data.capital?.toString() || '');
            setLogo(data.logo || '');
            setLocationLat(data.locationLat?.toString() || '');
            setLocationLon(data.locationLon?.toString() || '');
        },
        onError: (err: any) => {
            console.error('Failed to fetch company:', err);
            toast.error(err.response?.data?.message || 'Failed to load company details.');
            navigate('/companies');
        },
    });

    const updateCompanyMutation = useMutation({
        mutationFn: (updatedData: Partial<Company>) =>
            apiClient.patch(`/companies/${companyId}`, updatedData),
        onSuccess: (data) => {
            toast.success('Company updated successfully!');
            queryClient.invalidateQueries({ queryKey: ['company', companyId] });
            queryClient.invalidateQueries({ queryKey: ['companies'] });
            setIsEditing(false);
        },
        onError: (error: any) => {
            console.error('Update company error:', error);
            toast.error(error.response?.data?.message || 'Failed to update company.');
        },
    });

    const uploadLogoMutation = useMutation({
        mutationFn: (file: File) => {
            const formData = new FormData();
            formData.append('logo', file);
            return apiClient.post(`/companies/${companyId}/logo`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        },
        onSuccess: (data) => {
            toast.success('Company logo uploaded successfully!');
            queryClient.invalidateQueries({ queryKey: ['company', companyId] });
            queryClient.invalidateQueries({ queryKey: ['companies'] });
            setLogo(data.data.logo);
            setSelectedFile(null);
        },
        onError: (err: any) => {
            console.error('Logo upload error:', err);
            toast.error(err.response?.data?.message || 'Failed to upload logo.');
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
        if (!company) return;

        const parsedCapital = capital ? parseFloat(capital) : undefined;
        const parsedLat = locationLat ? parseFloat(locationLat) : null; // Use null if empty string
        const parsedLon = locationLon ? parseFloat(locationLon) : null; // Use null if empty string

        const companyUpdateData: Partial<Company> = {
            name,
            service: service || null,
            capital: parsedCapital,
            logo: logo || null,
            locationLat: parsedLat,
            locationLon: parsedLon,
        };

        const profileUpdatePromise = updateCompanyMutation.mutateAsync(companyUpdateData);

        if (selectedFile) {
            await profileUpdatePromise;
            uploadLogoMutation.mutate(selectedFile);
        } else {
            await profileUpdatePromise;
        }
    };

    const canEdit = company && (isOwner(company.ownerId) || hasRole(Role.Admin) || hasRole(Role.SuperAdmin));

    if (isLoading) {
        return (
            <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    if (isError || !company) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Alert severity="error">Error loading company details or company not found.</Alert>
                <Button onClick={() => navigate('/companies')} sx={{ mt: 2 }}>Back to Companies</Button>
            </Container>
        );
    }

    const hasLocation = company.locationLat !== null && company.locationLon !== null;
    const position: [number, number] = hasLocation
        ? [company.locationLat!, company.locationLon!]
        : [0, 0]; // Default to [0,0] if no location

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" gutterBottom>
                        Company Details: {company.name}
                    </Typography>
                    {canEdit && (
                        <Button
                            variant="contained"
                            onClick={handleEditToggle}
                            disabled={updateCompanyMutation.isPending}
                        >
                            {isEditing ? 'Cancel Edit' : 'Edit Company'}
                        </Button>
                    )}
                </Box>

                <Box component="form" onSubmit={handleSave}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                margin="normal"
                                fullWidth
                                label="Company Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={!isEditing || updateCompanyMutation.isPending}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                margin="normal"
                                fullWidth
                                label="Service Type"
                                value={service}
                                onChange={(e) => setService(e.target.value)}
                                disabled={!isEditing || updateCompanyMutation.isPending}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                margin="normal"
                                fullWidth
                                label="Capital ($)"
                                type="number"
                                value={capital}
                                onChange={(e) => setCapital(e.target.value)}
                                disabled={!isEditing || updateCompanyMutation.isPending}
                                inputProps={{ min: "0", step: "0.01" }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                margin="normal"
                                fullWidth
                                label="Location Latitude"
                                type="number"
                                value={locationLat}
                                onChange={(e) => setLocationLat(e.target.value)}
                                disabled={!isEditing || updateCompanyMutation.isPending}
                                inputProps={{ step: "any" }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                margin="normal"
                                fullWidth
                                label="Location Longitude"
                                type="number"
                                value={locationLon}
                                onChange={(e) => setLocationLon(e.target.value)}
                                disabled={!isEditing || updateCompanyMutation.isPending}
                                inputProps={{ step: "any" }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                            {selectedFile ? (
                                <Avatar
                                    src={URL.createObjectURL(selectedFile)}
                                    alt="Company Logo Preview"
                                    sx={{ width: 80, height: 80, mr: 2 }}
                                />
                            ) : logo ? (
                                <Avatar
                                    src={`${apiClient.defaults.baseURL}${logo}`}
                                    alt="Company Logo"
                                    sx={{ width: 80, height: 80, mr: 2 }}
                                />
                            ) : null}

                            {isEditing && (
                                <TextField
                                    fullWidth
                                    label="Upload New Logo"
                                    type="text"
                                    value={selectedFile ? selectedFile.name : ''}
                                    disabled={updateCompanyMutation.isPending || uploadLogoMutation.isPending}
                                    InputProps={{
                                        readOnly: true,
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <input
                                                    type="file"
                                                    hidden
                                                    id="logo-upload-input"
                                                    onChange={handleFileChange}
                                                    accept="image/*"
                                                />
                                                <label htmlFor="logo-upload-input">
                                                    <IconButton component="span" disabled={updateCompanyMutation.isPending || uploadLogoMutation.isPending}>
                                                        <CloudUploadIcon />
                                                    </IconButton>
                                                </label>
                                            </InputAdornment>
                                        ),
                                    }}
                                    helperText="Select a file to upload as company logo. Max 5MB, JPG/PNG/GIF."
                                />
                            )}
                            {isEditing && !selectedFile && (
                                <TextField
                                    fullWidth
                                    label="Logo URL (Overrides uploaded file if both present)"
                                    value={logo}
                                    onChange={(e) => setLogo(e.target.value)}
                                    disabled={!isEditing || updateCompanyMutation.isPending}
                                />
                            )}
                        </Grid>
                    </Grid>

                    {isEditing && (
                        <Button
                            type="submit"
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                            disabled={updateCompanyMutation.isPending || uploadLogoMutation.isPending}
                        >
                            {updateCompanyMutation.isPending || uploadLogoMutation.isPending ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
                        </Button>
                    )}
                </Box>

                {/* Map Integration */}
                {hasLocation ? (
                    <Box sx={{ mt: 4, height: 400, width: '100%' }}>
                        <Typography variant="h6" gutterBottom>
                            Company Location
                        </Typography>
                        <MapContainer
                            center={position}
                            zoom={13}
                            scrollWheelZoom={false}
                            style={{ height: '100%', width: '100%' }}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <Marker position={position}>
                                <Popup>
                                    {company.name} <br /> Located at {company.locationLat}, {company.locationLon}.
                                </Popup>
                            </Marker>
                        </MapContainer>
                    </Box>
                ) : (
                    <Box sx={{ mt: 4, p: 2, border: '1px dashed #ccc', borderRadius: 1, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            No location data available for this company.
                        </Typography>
                    </Box>
                )}

                <Button onClick={() => navigate('/companies')} sx={{ mt: 3 }}>
                    Back to Companies List
                </Button>
            </Paper>
        </Container>
    );
};

export default CompanyDetail;