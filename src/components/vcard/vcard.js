    const form = document.getElementById("vcard-form");
    const qrContainer = document.getElementById("qrcode");

    form.addEventListener("submit", function(e) {
      e.preventDefault();

      // Recoge los datos del formulario
      const name = document.getElementById("name").value;
      const org = document.getElementById("org").value;
      const phone = document.getElementById("phone").value;
      const email = document.getElementById("email").value;
      const address = document.getElementById("address").value;
      const url = document.getElementById("url").value;
      
      const vCard = 
          `BEGIN:VCARD\n` +
          `VERSION:3.0\n` +
          `N:${name.split(" ").slice(-1)[0]};${name.split(" ").slice(0, -1).join(" ")};;;\n` +
          `FN:${name}\n` +
          (org ? `ORG:${org}\n` : "") +
          (phone ? `TEL;TYPE=CELL:${phone}\n` : "") +
          (email ? `EMAIL;TYPE=INTERNET:${email}\n` : "") +
          (address ? `ADR;TYPE=home:;;${address};;;;\n` : "") +
          (url ? `URL:${url}\n` : "") +
          //(country ? `COUNTRY:${country}\n` : "") +
          
          `END:VCARD`;

      // Limpia el QR anterior
      qrContainer.innerHTML = "";

      // Genera el nuevo QR con vCard
      
      new QRCode(qrContainer, {
        text: vCard,
        width: 256,
        height: 256,
        colorDark : "#000000",
        colorLight : "#ffffff",
        textAlign: "center",
        correctLevel : QRCode.CorrectLevel.H
      });


    });