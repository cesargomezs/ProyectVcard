require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: '10mb' }));

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Inicializamos Supabase en el backend usando las variables de entorno seguras de Render

/*const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);*/

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

// RUTA 1: Recibe los datos, sube/actualiza la foto y guarda en la BD
app.post('/api/generar-vcf', async (req, res) => {
    const { name, org, phone, email, address, url, cardColor, photoBase64 } = req.body;
    
    try {
        let uniqueId;
        let photoUrl = null;
        let isUpdate = false;

        // 1. Buscamos si el usuario ya existe usando su email
        if (email) {
            const checkQuery = await pool.query('SELECT id, photo_url FROM contacts WHERE email = $1', [email]);
            if (checkQuery.rows.length > 0) {
                uniqueId = checkQuery.rows[0].id; // Reutilizamos el ID viejo
                photoUrl = checkQuery.rows[0].photo_url; // Guardamos la URL de la foto vieja por si no sube una nueva
                isUpdate = true;
            }
        }

        // Si no existía, le creamos un ID nuevo
        if (!uniqueId) {
            uniqueId = crypto.randomUUID();
        }

        // 2. Subimos la imagen a Supabase (si mandó una foto en el formulario)
        if (photoBase64 && photoBase64.startsWith('data:image')) {
            try {
                const matches = photoBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                if (matches && matches.length === 3) {
                    const buffer = Buffer.from(matches[2], 'base64');
                    // Como usamos el mismo uniqueId, Supabase sobreescribirá el archivo viejo automáticamente
                    const fileName = `${uniqueId}.jpg`; 
        
                    console.log("🚀 Subiendo/Actualizando imagen en Supabase...");
                    
                    const { error } = await supabase.storage
                        .from('vcard-images')
                        .upload(fileName, buffer, {
                            contentType: 'image/jpeg',
                            upsert: true // ¡ESTO ES LO QUE REEMPLAZA LA FOTO VIEJA!
                        });
        
                    if (error) {
                        console.error("⚠️ Error de Supabase:", error.message);
                    } else {
                        const { data: publicURLData } = supabase.storage
                            .from('vcard-images')
                            .getPublicUrl(fileName);
                        
                        photoUrl = publicURLData.publicUrl; // Actualizamos a la nueva URL
                        console.log("✅ ¡Foto actualizada con éxito!");
                    }
                }
            } catch (err) {
                console.error("❌ Excepción procesando la imagen:", err);
            }
        }

        // 3. Guardamos o actualizamos en la Base de Datos PostgreSQL
        if (isUpdate) {
            // Si ya existía, hacemos un UPDATE
            const updateQuery = `
                UPDATE contacts 
                SET name = $1, org = $2, phone = $3, address = $4, url = $5, card_color = $6, photo_url = $7
                WHERE id = $8
            `;
            await pool.query(updateQuery, [name, org, phone, address, url, cardColor, photoUrl, uniqueId]);
            console.log(`🔄 Registro actualizado para el email: ${email}`);
        } else {
            // Si es nuevo, hacemos un INSERT
            const insertQuery = `
                INSERT INTO contacts (id, name, org, phone, email, address, url, card_color, photo_url)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `;
            await pool.query(insertQuery, [uniqueId, name, org, phone, email, address, url, cardColor, photoUrl]);
            console.log(`✨ Nuevo registro creado para el email: ${email}`);
        }

        // Respondemos al frontend
        res.json({
            success: true,
            fileUrl: `https://generadorqr-api.onrender.com/api/contacto/${uniqueId}`,
            savedColor: cardColor
        });

    } catch (error) {
        console.error("❌ Error en el servidor:", error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

// RUTA 2: Descarga la vCard al escanear el QR con la foto incluida
app.get('/api/contacto/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('SELECT * FROM contacts WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).send('El contacto no existe o fue eliminado.');
        }

        const user = result.rows[0];

        let vCard = "BEGIN:VCARD\r\nVERSION:3.0\r\n";
        vCard += `FN:${user.name}\r\n`;
        vCard += `N:;${user.name};;;\r\n`;
        if (user.org) vCard += `ORG:${user.org}\r\n`;
        if (user.phone) vCard += `TEL;TYPE=CELL:${user.phone}\r\n`;
        if (user.email) vCard += `EMAIL;TYPE=WORK:${user.email}\r\n`;
        if (user.address) vCard += `ADR;TYPE=WORK:;;${user.address};;;;\r\n`;
        if (user.url) vCard += `URL:${user.url}\r\n`;
        
        // 🔥 EL TRUCO PARA iOS: Descargar la imagen y meterla en Base64 🔥
        if (user.photo_url) {
            try {
                // El servidor descarga la foto de Supabase rápidamente
                const imgResponse = await fetch(user.photo_url);
                const arrayBuffer = await imgResponse.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const base64Photo = buffer.toString('base64');
                
                // La inyectamos directamente en el archivo VCF (Apple no podrá ignorarla)
                vCard += `PHOTO;ENCODING=b;TYPE=JPEG:${base64Photo}\r\n`;
            } catch (imgError) {
                console.error("Error descargando la foto para la vCard:", imgError);
                // Si algo falla, ponemos la URL como plan B
                vCard += `PHOTO;TYPE=JPEG;VALUE=URI:${user.photo_url}\r\n`;
            }
        }
        
        vCard += "END:VCARD\r\n";

        res.setHeader('Content-Type', 'text/vcard; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="contacto_${id}.vcf"`);
        res.send(vCard);

    } catch (error) {
        console.error("Error consultando la BD:", error);
        res.status(500).send('Error interno del servidor');
    }
});