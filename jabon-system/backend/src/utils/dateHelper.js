// Helper para obtener fecha/hora local de Colombia (UTC-5)
const getColombiaDateTime = () => {
    // Obtener la hora actual en la zona horaria de Colombia
    const now = new Date();

    // Usar toLocaleString con la zona horaria de Colombia
    const colombiaTimeString = now.toLocaleString('en-US', {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    // Parsear el resultado (formato: MM/DD/YYYY, HH:MM:SS)
    const [datePart, timePart] = colombiaTimeString.split(', ');
    const [month, day, year] = datePart.split('/');

    // Formato: YYYY-MM-DD HH:MM:SS
    return `${year}-${month}-${day} ${timePart}`;
};

module.exports = { getColombiaDateTime };
