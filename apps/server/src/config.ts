// Secrets JWT - à remplacer par des variables d'environnement en production
export const JWT_SECRET =
    process.env.JWT_SECRET || 'apic-box-secret-key-change-in-production';
export const JWT_REFRESH_SECRET =
    process.env.JWT_REFRESH_SECRET ||
    'apic-box-refresh-secret-key-change-in-production';
