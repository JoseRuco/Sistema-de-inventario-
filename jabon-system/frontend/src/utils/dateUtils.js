export const getColombiaDate = () => {
    const now = new Date();
    const colombiaTime = now.toLocaleString('en-US', { timeZone: 'America/Bogota' });
    const colombiaDate = new Date(colombiaTime);
    
    // Formato YYYY-MM-DD
    const year = colombiaDate.getFullYear();
    const month = String(colombiaDate.getMonth() + 1).padStart(2, '0');
    const day = String(colombiaDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const getColombiaDateTime = () => {
    const now = new Date();
    return now.toLocaleString('es-CO', { 
        timeZone: 'America/Bogota',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export const getColombiaDateObject = () => {
    const now = new Date();
    const colombiaTime = now.toLocaleString('en-US', { timeZone: 'America/Bogota' });
    return new Date(colombiaTime);
};
