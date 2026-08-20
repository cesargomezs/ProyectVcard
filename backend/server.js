const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Permite peticiones de tu frontend y soporta fotos pesadas
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Carpeta temporal donde se guardarán los .vcf 
const tempFolder = path.join(__dirname, 'public');
if (!fs.existsSync(tempFolder)) {
    fs.mkdirSync(tempFolder);
}

// Expone la carpeta 'public' para que el celular pueda descargar el archivo
app.use('/descargar', express.static(tempFolder));

app.post('/api/generar-vcf', (req, res) => {
    const { name, org, phone, email, address, url, photoBase64 } = req.body;

    // Crear un nombre de archivo único
    const fileName = `contacto_${Date.now()}.vcf`;
    const filePath = path.join(tempFolder, fileName);

    // Ensamblar la vCard
    let vCard = "BEGIN:VCARD\nVERSION:3.0\n";
    vCard += `FN:${name}\nN:;${name};;;\n`;
    
    if (org) {
        vCard += `ORG:${org};\nTITLE:${org}\n`;
    }
    if (phone) vCard += `TEL;TYPE=CELL:${phone}\n`;
    if (email) vCard += `EMAIL:${email}\n`;
    if (address) vCard += `ADR:;;${address};;;;\n`;
    if (url) vCard += `URL:${url}\n`;
    
    // Inyectar la foto
    if (photoBase64) {
        vCard += `PHOTO;ENCODING=b;TYPE=JPEG:${photoBase64}\n`;
    }
    vCard += "END:VCARD";

    // Guardar el archivo físicamente
    fs.writeFileSync(filePath, vCard);

    // Autodestruir el archivo después de 5 minutos (300000 ms)
    setTimeout(() => {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Archivo temporal eliminado: ${fileName}`);
        }
    }, 300000);

    // Responder con la URL del archivo
    res.json({
        success: true,
        fileUrl: `https://generadorqr-api.onrender.com/descargar/${fileName}`
    });
});

app.listen(PORT, () => {
    console.log(`Backend rodando en http://localhost:${PORT}`);
});