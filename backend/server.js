require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: '10mb' }));

// Ignorar certificado autofirmado en entorno de pruebas local si es necesario
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// RUTA 1: Guarda los datos y la URL de la foto de Supabase
app.post('/api/generar-vcf', async (req, res) => {
    const { name, org, phone, email, address, url, cardColor, photoUrl } = req.body;
    const uniqueId = crypto.randomUUID();

    try {
        const query = `
            INSERT INTO contacts (id, name, org, phone, email, address, url, card_color, photo_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `;
        await pool.query(query, [uniqueId, name, org, phone, email, address, url, cardColor, photoUrl]);

        res.json({
            success: true,
            fileUrl: `https://generadorqr-api.onrender.com/api/contacto/${uniqueId}`,
            savedColor: cardColor
        });
    } catch (error) {
        console.error("Error guardando en BD:", error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

// RUTA 2: Descarga la vCard al escanear el QR
app.get('/api/contacto/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('SELECT * FROM contacts WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).send('El contacto no existe o fue eliminado.');
        }

        const user = result.rows[0];

        // Armamos la vCard con la URL de la foto de Supabase
        let vCard = "BEGIN:VCARD\r\nVERSION:3.0\r\n";
        vCard += `FN:${user.name}\r\n`;
        vCard += `N:;${user.name};;;\r\n`;
        if (user.org) vCard += `ORG:${user.org}\r\n`;
        if (user.phone) vCard += `TEL;TYPE=CELL:${user.phone}\r\n`;
        if (user.email) vCard += `EMAIL;TYPE=WORK:${user.email}\r\n`;
        if (user.address) vCard += `ADR;TYPE=WORK:;;${user.address};;;;\r\n`;
        if (user.url) vCard += `URL:${user.url}\r\n`;
        if (user.card_color) vCard += `X-CARD-COLOR:${user.card_color}\r\n`;
        if (user.photo_url) vCard += `PHOTO;TYPE=JPEG:${user.photo_url}\r\n`;
        vCard += "END:VCARD\r\n";

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