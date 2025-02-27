/* generates a base64 image url for the QR code */
/* copy the QR code and paste in some base64 => image app(https://base64.guru/converter/decode/image) and get image */
/* scan the image and get the code */

const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

const adminSecret = speakeasy.generateSecret({ name: 'LEAF-Admin' });

// Generate QR Code Once (first time when admin registers or lost his phone)
QRCode.toDataURL(adminSecret.otpauth_url, (err, url) => {
  console.log(url);
  console.log('Secret:', adminSecret.base32);
});