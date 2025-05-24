import React, { useState, ChangeEvent, FormEvent } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../../api/apiClient'; // проверь путь к apiClient.ts

interface CreateCompanyForm {
    name: string;
    service: string;
    capital: string;
}

const CreateCompany: React.FC = () => {
    const [form, setForm] = useState<CreateCompanyForm>({
        name: '',
        service: '',
        capital: '',
    });

    const [loading, setLoading] = useState<boolean>(false);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const validate = (): boolean => {
        if (!form.name.trim()) {
            toast.error('Название компании обязательно');
            return false;
        }
        if (!form.service.trim()) {
            toast.error('Услуга обязательна');
            return false;
        }
        if (!form.capital || isNaN(Number(form.capital))) {
            toast.error('Капитал должен быть числом');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);

        try {
            await apiClient.post('/companies', {
                name: form.name,
                service: form.service,
                capital: Number(form.capital),
            });

            toast.success('Компания успешно создана!');
            setForm({ name: '', service: '', capital: '' });
        } catch (error: any) {
            toast.error(
                error.response?.data?.message || error.message || 'Ошибка при создании компании',
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <form onSubmit={handleSubmit} style={styles.form}>
                <h2 style={styles.title}>Создать компанию</h2>

                <label style={styles.label} htmlFor="name">
                    Название компании
                </label>
                <input
                    id="name"
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    disabled={loading}
                    style={styles.input}
                    placeholder="Введите название"
                    required
                />

                <label style={styles.label} htmlFor="service">
                    Услуга
                </label>
                <input
                    id="service"
                    type="text"
                    name="service"
                    value={form.service}
                    onChange={handleChange}
                    disabled={loading}
                    style={styles.input}
                    placeholder="Введите услугу"
                    required
                />

                <label style={styles.label} htmlFor="capital">
                    Капитал
                </label>
                <input
                    id="capital"
                    type="number"
                    name="capital"
                    value={form.capital}
                    onChange={handleChange}
                    disabled={loading}
                    style={styles.input}
                    placeholder="Введите капитал"
                    required
                    min="0"
                    step="0.01"
                />

                <button type="submit" disabled={loading} style={styles.button}>
                    {loading ? 'Создаем...' : 'Создать компанию'}
                </button>
            </form>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    container: {
        maxWidth: 420,
        margin: '40px auto',
        padding: 20,
        boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
        borderRadius: 8,
        backgroundColor: '#fff',
        fontFamily: 'Arial, sans-serif',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
    },
    title: {
        marginBottom: 24,
        textAlign: 'center',
        color: '#333',
    },
    label: {
        marginBottom: 6,
        fontWeight: 'bold',
        color: '#555',
    },
    input: {
        padding: '10px 12px',
        marginBottom: 20,
        borderRadius: 4,
        border: '1px solid #ccc',
        fontSize: 16,
        outline: 'none',
        transition: 'border-color 0.2s',
    },
    button: {
        padding: '12px',
        backgroundColor: '#007bff',
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        border: 'none',
        borderRadius: 4,
        cursor: 'pointer',
        transition: 'background-color 0.2s',
    },
};

export default CreateCompany;
