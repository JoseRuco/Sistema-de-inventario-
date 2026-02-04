const nodemailer = require('nodemailer');
const db = require('../config/database');
const path = require('path');

const getTransporter = () => {
    const config = db.prepare('SELECT clave, valor FROM configuracion').all();
    const settings = config.reduce((acc, curr) => {
        acc[curr.clave] = curr.valor;
        return acc;
    }, {});

    if (!settings.smtp_user || !settings.smtp_pass) {
        return null;
    }

    return nodemailer.createTransport({
        host: settings.smtp_host,
        port: parseInt(settings.smtp_port),
        secure: parseInt(settings.smtp_port) === 465, // true for 465, false for other ports
        auth: {
            user: settings.smtp_user,
            pass: settings.smtp_pass
        }
    });
};

const sendLowStockAlert = async (productName, aroma, presentacion, currentStock) => {
    try {
        const config = db.prepare('SELECT clave, valor FROM configuracion').all();
        const settings = config.reduce((acc, curr) => {
            acc[curr.clave] = curr.valor;
            return acc;
        }, {});

        if (!settings.alert_email || !settings.smtp_user) {
            console.log('⚠️ No hay configuración de correo para enviar alertas');
            return;
        }

        const transporter = getTransporter();
        if (!transporter) {
            console.log('⚠️ Credenciales SMTP no configuradas');
            return;
        }

        // Reemplazos dinámicos
        const subject = settings.alert_subject
            .replace('{producto}', productName)
            .replace('{aroma}', aroma || '')
            .replace('{presentacion}', presentacion || '');

        const message = settings.alert_message
            .replace('{producto}', productName)
            .replace('{aroma}', aroma || '')
            .replace('{presentacion}', presentacion || '')
            .replace('{stock}', currentStock);

        // Ruta de la imagen
        const imagePath = path.join(__dirname, '..', '..', 'assets', 'low-stock-alert.png');

        // HTML mejorado con diseño profesional
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; }
        .header img { max-width: 150px; height: auto; margin-bottom: 15px; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: bold; }
        .content { padding: 40px 30px; }
        .alert-box { background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .alert-box h2 { color: #991b1b; margin: 0 0 10px 0; font-size: 20px; }
        .alert-box p { color: #7f1d1d; margin: 5px 0; font-size: 16px; line-height: 1.6; }
        .product-info { background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .product-info table { width: 100%; border-collapse: collapse; }
        .product-info td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
        .product-info td:first-child { font-weight: bold; color: #374151; width: 40%; }
        .product-info td:last-child { color: #111827; }
        .stock-badge { display: inline-block; background-color: #ef4444; color: white; padding: 5px 15px; border-radius: 20px; font-weight: bold; font-size: 18px; }
        .footer { background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="cid:alertImage" alt="Alerta de Stock Bajo" />
            <h1>⚠️ ALERTA DE STOCK BAJO</h1>
        </div>
        
        <div class="content">
            <div class="alert-box">
                <h2>🔔 Atención Requerida</h2>
                <p>Se ha detectado que un producto ha alcanzado el nivel de stock crítico.</p>
                <p style="font-style: italic; margin-top: 10px;">"${message}"</p>
            </div>
            
            <div class="product-info">
                <table>
                    <tr>
                        <td>📦 Producto:</td>
                        <td><strong>${productName}</strong></td>
                    </tr>
                    <tr>
                        <td>🌸 Aroma:</td>
                        <td><strong>${aroma || 'No especificado'}</strong></td>
                    </tr>
                    <tr>
                        <td>📏 Presentación:</td>
                        <td><strong>${presentacion}</strong></td>
                    </tr>
                    <tr>
                        <td>📊 Stock Actual:</td>
                        <td><span class="stock-badge">${currentStock} unidades</span></td>
                    </tr>
                    <tr>
                        <td>⏰ Fecha:</td>
                        <td>${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</td>
                    </tr>
                </table>
            </div>
            
            <p style="color: #374151; line-height: 1.6;">
                <strong>Acción recomendada:</strong> Por favor, revise el inventario y realice la producción o compra necesaria para evitar el desabastecimiento.
            </p>
        </div>
        
        <div class="footer">
            <p><strong>Sistema de Inventario Jabon System</strong></p>
            <p>Este es un mensaje automático generado por el sistema.</p>
        </div>
    </div>
</body>
</html>
        `;

        const mailOptions = {
            from: `"Sistema de Inventario" <${settings.smtp_user}>`,
            to: settings.alert_email,
            subject: subject,
            text: message,
            html: htmlContent,
            attachments: [
                {
                    filename: 'low-stock-alert.png',
                    path: imagePath,
                    cid: 'alertImage' // mismo cid que en el HTML
                }
            ]
        };

        const info = await transporter.sendMail(mailOptions);

        console.log('📧 Alerta de stock bajo enviada:', info.messageId);
        return true;

    } catch (error) {
        console.error('❌ Error enviando alerta de stock:', error);
        return false;
    }
};

module.exports = {
    sendLowStockAlert
};
