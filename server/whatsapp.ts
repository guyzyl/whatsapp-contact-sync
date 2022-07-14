const { Client, MessageMedia } = require("whatsapp-web.js");

function initWhatsApp(): void {
  const client = new Client();

  client.on("qr", (qr) => {
    qrcode.generate(qr, { small: true });
    // TODO: Set for session and return somehow
  });

  client.on("ready", () => {
    loadContacts(client);
  });

  client.initialize();
}

function loadContacts(client: Client): void {
  var contacts: Array<WhatsAppContact> = [];

  client.getContacts().then((contacts) => {
    for (const contact of contacts) {
      if (
        contact.isMe === true ||
        contact.isGroup === true ||
        contact.isMyContact === false ||
        contact.number === null
      ) {
        continue;
      }

      var photoUrl;
      client.getProfilePicUrl(contact.id._serialized).then((url) => {
        photoUrl = url;
      });

      const simpleContact: WhatsAppContact = {
        whatsappId: contact.id,
        number: contact.number,
        name: contact.name,
        photoUrl: photoUrl,
      };
    }
  });

  // TODO: Do something with the contacts
}
