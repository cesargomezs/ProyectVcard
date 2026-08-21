require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: '10mb' })); // Acepta la imagen en base64 de forma segura

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Inicializamos Supabase de forma segura en el BACKEND con las credenciales ocultas
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

app.post('/api/generar-vcf', async (req, res) => {
    const { name, org, phone, email, address, url, cardColor, photoBase64 } = req.body;
    const uniqueId = crypto.randomUUID();
    let photoUrl = null;

    try {
        // Si el usuario envió una foto, el servidor la sube a Supabase de forma segura
        if (photoBase64) {
            // Convertimos el base64 a Buffer
            const buffer = Buffer.from(photoBase64.split(',')[1], 'base64');
            const fileName = `images/${uniqueId}.jpg`;

            const { data, error } = await supabase.storage
                .from('QRCode')
                .upload(fileName, buffer, {
                    contentType: 'image/jpeg',
                    upsert: true
                });

            if (!error) {
                const { data: publicURLData } = supabase.storage
                    .from('QRCode')
                    .getPublicUrl(fileName);
                photoUrl = publicURLData.publicUrl;
            }
        }

        // Guardamos los datos y la URL limpia en PostgreSQL
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
        console.error("Error en el servidor:", error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

// Ruta para descargar la vCard
app.get('/api/contacto/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM contacts WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).send('Contacto no encontrado.');

        const user = result.rows[0];
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
        res.status(500).send('Error interno');
    }
});

app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));