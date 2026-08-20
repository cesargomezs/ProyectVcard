const express = require('express');
const fs = require('fs');
const path = path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

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

    // Usamos \r\n que es el estándar oficial de vCard para evitar conflictos en iOS
    let vCard = "BEGIN:VCARD\r\nVERSION:3.0\r\n";
    vCard += `FN:${name}\r\n`;
    
    // Arreglamos la estructura N (Apellido;Nombre;;;) para que iOS no mezcle campos
    vCard += `N:;${name};;;\r\n`;
    
    if (org && org.trim() !== "") {
        vCard += `ORG:${org.trim()}\r\n`;
    }
    
    if (phone) vCard += `TEL;TYPE=CELL:${phone}\r\n`;
    if (email) vCard += `EMAIL;TYPE=WORK:${email}\r\n`;
    if (address) vCard += `ADR;TYPE=WORK:;;${address};;;;\r\n`;
    if (url) vCard += `URL:${url}\r\n`;
    
    if (photoBase64) {
        vCard += `PHOTO;ENCODING=b;TYPE=JPEG:${photoBase64}\r\n`;
    }
    vCard += "END:VCARD\r\n";

    fs.writeFileSync(filePath, vCard, 'utf8');

    // Autodestrucción a los 5 minutos
    setTimeout(() => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }, 300000);

    res.json({
        success: true,
        fileUrl: `https://generadorqr-api.onrender.com/descargar/${fileName}`
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando en puerto ${PORT}`);
});