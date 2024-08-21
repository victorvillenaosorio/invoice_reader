const express = require('express');
const multer = require('multer');
require('dotenv').config();
const { DocumentProcessorServiceClient } = require('@google-cloud/documentai').v1;

const app = express();
// Configurar multer para almacenamiento en memoria
const upload = multer({
    storage: multer.memoryStorage(),
});

const projectId = '111826428225';
const location = 'eu';
const processorId = 'b36a7139fa2d6949';

const client = new DocumentProcessorServiceClient({
    apiEndpoint: `${location}-documentai.googleapis.com`
});

app.use(express.static('public'));

app.post('/api/upload', upload.single('document'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;
    const encodedImage = req.file.buffer.toString('base64'); // Convertir el buffer directamente a base64

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
    }
});

app.post('/update-entity', async (req, res) => {
    const { index, type, newValue, boundingBox } = req.body;

    const updateRequest = {
        name: `projects/${projectId}/locations/${location}/processors/${processorId}`,
        document: {
            text: newValue,
            boundingBox: boundingBox, // Añade la información del bounding box si es relevante
        },
    };

    try {
        const [response] = await client.processDocument(updateRequest);
        res.json(response);
    } catch (error) {
        console.error('Error updating entity:', error);
        res.status(500).json({ error: 'Error updating entity' });
    }
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
    console.log(`GOOGLE_APPLICATION_CREDENTIALS: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
});
