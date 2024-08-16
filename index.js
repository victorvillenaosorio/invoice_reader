const express = require('express');
const multer = require('multer');
require('dotenv').config();
const { DocumentProcessorServiceClient } = require('@google-cloud/documentai').v1;
const fs = require('fs').promises;
const path = require('path');
const fs2 = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

const projectId = '111826428225';
const location = 'eu';
const processorId = 'b36a7139fa2d6949';

const client = new DocumentProcessorServiceClient({
    apiEndpoint: `${location}-documentai.googleapis.com`
});

app.use(express.static('public'));

app.post('/upload', upload.single('document'), async (req, res) => {
    const filePath = req.file.path;

    const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;
    const imageFile = await fs.readFile(filePath);
    const encodedImage = Buffer.from(imageFile).toString('base64');

   /*  try {
      const data = await fs.readFile(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8');
      console.log(data);
    } catch (err) {
      console.error(err);
    } */
    const request = {
        name,
        rawDocument: {
            content: encodedImage,
            mimeType: req.file.mimetype,
        },
    };

    try {
        const [result] = await client.processDocument(request);
        const { document } = result;
        const { text } = document;
        const { entities } = document;

        res.json({ entities });
    } catch (error) {
        console.error('Error processing document:', error);
        res.status(500).send('Error processing document.');
    } finally {
        await fs.unlink(filePath); // Borra el archivo temporal
    }
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
    console.log(`GOOGLE_APPLICATION_CREDENTIALS: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
});
