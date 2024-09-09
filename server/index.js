const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');

const app = express();
app.use(express.json());
app.use(cors());

// Define multer storage and upload middleware
const upload = multer({ dest: 'uploads/' });

async function readConfig() {
    try {
        console.log('Reading configuration file...');
        const data = await fs.readFile(path.join(__dirname, 'config.json'), 'utf8');
        const config = JSON.parse(data);
        console.log('Configuration read successfully:', config);
        return config;
    } catch (error) {
        console.error('Error reading config:', error);
        return {};
    }
}

async function writeConfig(config) {
    try {
        console.log('Writing configuration file...');
        await fs.writeFile(path.join(__dirname, 'config.json'), JSON.stringify(config, null, 2));
        console.log('Configuration written successfully:', config);
    } catch (error) {
        console.error('Error writing config:', error);
    }
}

// Route definitions
app.get('/api/get-text/:type', async (req, res) => {
    const { type } = req.params;
    console.log(`GET /api/get-text/${type} request received`);
    try {
        const config = await readConfig();
        if (config[type] && config[type].text) {
            console.log(`Sending ${type} text:`, config[type].text);
            res.json({ text: config[type].text });
        } else {
            res.status(404).json({ error: `Text for content type ${type} not found` });
        }
    } catch (error) {
        console.error('Error handling GET /api/get-text request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/update-text/:type', async (req, res) => {
    const { type } = req.params;
    const { text } = req.body;
    console.log(`POST /api/update-text/${type} request received with body:`, req.body);

    if (!text) {
        console.log('Text is missing in the request body');
        return res.status(400).json({ error: 'Text is required' });
    }

    try {
        const config = await readConfig();
        if (!config[type]) {
            config[type] = {};
        }
        config[type].text = text;
        await writeConfig(config);
        console.log(`${type} text updated successfully to:`, config[type].text);
        res.json({ message: `${type} text updated successfully`, newText: config[type].text });
    } catch (error) {
        console.error('Error handling POST /api/update-text request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/upload-video', async (req, res) => {
    const { url, type } = req.body;
    console.log(`POST /api/upload-video request received with body:`, req.body);

    if (!url || !type) {
        return res.status(400).json({ error: 'URL and type are required' });
    }

    try {
        const config = await readConfig();
        if (!config[type]) {
            config[type] = {};
        }
        config[type].videoUrl = url;
        await writeConfig(config);
        res.json({ message: 'Video URL saved successfully', videoUrl: url });
    } catch (error) {
        console.error('Error handling POST /api/upload-video request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/upload-video/:type', upload.single('video'), async (req, res) => {
    const { type } = req.params;
    const { file } = req;

    if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const newFileName = `${type}_video${path.extname(file.originalname)}`;
    const newPath = path.join(__dirname, 'uploads', newFileName);

    try {
        await fs.rename(file.path, newPath);

        const config = await readConfig();
        if (!config[type]) {
            config[type] = {};
        }
        config[type].videoPath = newPath;
        await writeConfig(config);

        res.json({ message: 'Video uploaded successfully', videoPath: newPath });
    } catch (error) {
        console.error('Error handling video upload:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/get-video/:type', async (req, res) => {
    const { type } = req.params;
    try {
        const config = await readConfig();
        const videoPath = config[type]?.videoPath;
        console.log('Requested videoPath:', videoPath); // Debug log

        if (videoPath && await fs.access(videoPath).then(() => true).catch(() => false)) {
            res.sendFile(path.resolve(videoPath)); // Ensure path is absolute
        } else {
            res.status(404).json({ error: `Video for ${type} not found` });
        }
    } catch (error) {
        console.error('Error handling GET /api/get-video request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/download-video', async (req, res) => {
    const { url, type } = req.body;
    console.log(`POST /api/download-video request received with body:`, req.body);

    if (!url || !type) {
        return res.status(400).json({ error: 'URL and type are required' });
    }

    const fileName = `${type}_video.mp4`;
    const filePath = path.join(__dirname, 'uploads', fileName);

    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream',
        });

        const writer = response.data.pipe(require('fs').createWriteStream(filePath));

        writer.on('finish', async () => {
            const config = await readConfig();
            if (!config[type]) {
                config[type] = {};
            }
            config[type].videoPath = filePath;
            await writeConfig(config);

            res.json({ message: 'Video downloaded and saved successfully', videoPath: filePath });
        });

        writer.on('error', (err) => {
            console.error('Error writing video to disk:', err);
            res.status(500).json({ error: 'Error saving the video' });
        });
    } catch (error) {
        console.error('Error downloading video:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/update-url/:type', async (req, res) => {
    const { type } = req.params;
    const { url } = req.body;
    console.log(`POST /api/update-url/${type} request received with body:`, req.body);

    if (!url) {
        console.log('URL is missing in the request body');
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        const config = await readConfig();
        if (!config[type]) {
            config[type] = {};
        }
        config[type].url = url;
        await writeConfig(config);
        console.log(`${type} URL updated successfully to:`, config[type].url);
        res.json({ message: `${type} URL updated successfully`, newUrl: config[type].url });
    } catch (error) {
        console.error('Error handling POST /api/update-url request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/get-url/:type', async (req, res) => {
    const { type } = req.params;
    console.log(`GET /api/get-url/${type} request received`);
    try {
        const config = await readConfig();
        if (config[type] && config[type].url) {
            console.log(`Sending ${type} URL:`, config[type].url);
            res.json({ url: config[type].url });
        } else {
            res.status(404).json({ error: `URL for content type ${type} not found` });
        }
    } catch (error) {
        console.error('Error handling GET /api/get-url request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = process.env.PORT || 5004;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
