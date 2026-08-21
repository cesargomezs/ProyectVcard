require('dotenv').config(); // <--- ¡Esta línea es la que lee tu .env!
console.log("🔍 DATABASE_URL leída:", process.env.DATABASE_URL); // <--- Agregá esto
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: '10mb' }));

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// 1. RUTA PARA GUARDAR LOS DATOS (Llamada por tu frontend al hacer clic en generar)
app.post('/api/generar-vcf', async (req, res) => {
    const { name, org, phone, email, address, url, cardColor, photoBase64 } = req.body;
    const uniqueId = crypto.randomUUID();

    try {
        const query = `
            INSERT INTO contacts (id, name, org, phone, email, address, url, card_color, photo_base64)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `;
        await pool.query(query, [uniqueId, name, org, phone, email, address, url, cardColor, photoBase64]);

        res.json({
            success: true,
            // Esta es la URL permanente que irá dentro del código QR
            fileUrl: `https://generadorqr-api.onrender.com/api/contacto/${uniqueId}`,
            savedColor: cardColor
        });
    } catch (error) {
        console.error("Error guardando en BD:", error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

// 2. RUTA PARA DESCARGAR LA VCARD (Se ejecuta automáticamente al escanear el QR)
app.get('/api/contacto/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('SELECT * FROM contacts WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).send('El contacto no existe o fue eliminado.');
        }

        const user = result.rows[0];

        // Armamos el texto de la vCard directamente al vuelo desde la base de datos
        let vCard = "BEGIN:VCARD\r\nVERSION:3.0\r\n";
        vCard += `FN:${user.name}\r\n`;
        vCard += `N:;${user.name};;;\r\n`;
        if (user.org) vCard += `ORG:${user.org}\r\n`;
        if (user.phone) vCard += `TEL;TYPE=CELL:${user.phone}\r\n`;
        if (user.email) vCard += `EMAIL;TYPE=WORK:${user.email}\r\n`;
        if (user.address) vCard += `ADR;TYPE=WORK:;;${user.address};;;;\r\n`;
        if (user.url) vCard += `URL:${user.url}\r\n`;
        if (user.card_color) vCard += `X-CARD-COLOR:${user.card_color}\r\n`;
        if (user.photo_base64) vCard += `PHOTO;ENCODING=b;TYPE=JPEG:${user.photo_base64}\r\n`;
        vCard += "END:VCARD\r\n";

        // Forzamos al dispositivo a descargarlo como archivo de contacto real
        res.setHeader('Content-Type', 'text/vcard');
        res.setHeader('Content-Disposition', `attachment; filename="contacto_${id}.vcf"`);
        res.send(vCard);

    } catch (error) {
        console.error("Error consultando la BD:", error);
        res.status(500).send('Error interno del servidor');
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando con PostgreSQL en puerto ${PORT}`);
});