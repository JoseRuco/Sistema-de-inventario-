const db = require('../config/database');

exports.getConfig = (req, res) => {
    try {
        const config = db.prepare('SELECT clave, valor FROM configuracion').all();
        const settings = config.reduce((acc, curr) => {
            acc[curr.clave] = curr.valor;
            return acc;
        }, {});

        // No enviar la contraseña real por seguridad
        if (settings.smtp_pass) {
            settings.smtp_pass = '********';
        }

        res.json(settings);
    } catch (error) {
        console.error('Error obteniendo configuración:', error);
        res.status(500).json({ error: 'Error al obtener la configuración' });
    }
};

exports.updateConfig = (req, res) => {
    try {
        const {
            alert_email,
            alert_subject,
            alert_message,
            smtp_host,
            smtp_port,
            smtp_user,
            smtp_pass
        } = req.body;

        const update = db.prepare('INSERT OR REPLACE INTO configuracion (clave, valor) VALUES (?, ?)');

        const updates = [
            ['alert_email', alert_email],
            ['alert_subject', alert_subject],
            ['alert_message', alert_message],
            ['smtp_host', smtp_host],
            ['smtp_port', smtp_port],
            ['smtp_user', smtp_user]
        ];

        // Solo actualizar contraseña si se proporciona una nueva (no es '********')
        if (smtp_pass && smtp_pass !== '********') {
            updates.push(['smtp_pass', smtp_pass]);
        }

        const runTransaction = db.transaction((items) => {
            for (const [key, value] of items) {
                if (value !== undefined) {
                    update.run(key, String(value));
                }
            }
        });

        runTransaction(updates);

        res.json({ success: true, message: 'Configuración actualizada correctamente' });

    } catch (error) {
        console.error('Error actualizando configuración:', error);
        res.status(500).json({ error: 'Error al actualizar la configuración' });
    }
};
