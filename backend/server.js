const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
// Render asigna el puerto automáticamente, si no, usamos el 3000
const PORT = process.env.PORT || 3000;

// CORS permitido para cualquier origen
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: '10mb' }));

const tempFolder = path.join(__dirname, 'public');
if (!fs.existsSync(tempFolder)) {
    fs.mkdirSync(tempFolder);
}

app.use('/descargar', express.static(tempFolder));

app.post('/api/generar-vcf', (req, res) => {
    const { name, org, phone, email, address, url, photoBase64 } = req.body;
    const fileName = `contacto_${Date.now()}.vcf`;
    const filePath = path.join(tempFolder, fileName);

    let vCard = "BEGIN:VCARD\nVERSION:3.0\n";
    vCard += `FN:${name}\nN:;${name};;;\n`;
    if (org) vCard += `ORG:${org};\nTITLE:${org}\n`;
    if (phone) vCard += `TEL;TYPE=CELL:${phone}\n`;
    if (email) vCard += `EMAIL:${email}\n`;
    if (address) vCard += `ADR:;;${address};;;;\n`;
    if (url) vCard += `URL:${url}\n`;
    if (photoBase64) vCard += `PHOTO;ENCODING=b;TYPE=JPEG:${photoBase64}\n`;
    vCard += "END:VCARD";

    fs.writeFileSync(filePath, vCard);

    setTimeout(() => {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }, 300000);

    // Ajustamos la URL para que siempre apunte al dominio de Render
    res.json({
        success: true,
        fileUrl: `https://generadorqr-api.onrender.com/descargar/${fileName}`
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando en puerto ${PORT}`);
});