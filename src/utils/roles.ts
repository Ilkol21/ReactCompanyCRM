import { Role } from '@/types';

export function normalizeRole(roleStr: string): Role {
    switch (roleStr.toLowerCase()) {
        case 'superadmin':
            return Role.SuperAdmin;
        case 'admin':
            return Role.Admin;
        case 'user':
            return Role.User;
        default:
            return Role.User; // или кинуть ошибку, если хочешь строго
    }
}
