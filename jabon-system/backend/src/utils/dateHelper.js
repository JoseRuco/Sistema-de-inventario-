const getColombiaDateTime = () => {
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    const parts = formatter.formatToParts(new Date());
    const p = parts.reduce((acc, part) => {
        acc[part.type] = part.value;
        return acc;
    }, {});

    // Retorna formato ISO-like: YYYY-MM-DDTHH:MM:SS (con T para mejor compatibilidad con new Date())
    return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`;
};

const getColombiaDate = () => {
    return getColombiaDateTime().split('T')[0];
};

const getColombiaYearMonth = () => {
    return getColombiaDate().substring(0, 7);
};

module.exports = { 
    getColombiaDateTime,
    getColombiaDate,
    getColombiaYearMonth
};
