import express from 'express';
import fs from 'fs';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url'; 

const config = JSON.parse(fs.readFileSync(new URL('./config.json', import.meta.url)));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const __dataFolder = path.resolve('./data');
const __colorsFile = path.join(__dataFolder, 'bricklink-colors.json');

const app = express();
app.use(cors());
app.use(express.text({ type: 'application/xml' }));

const resolvedPath = path.resolve(__dirname, config.outputPath);
console.log("OutputPath: " + config.outputPath);
console.log("meta: " + new URL(import.meta.url).pathname);
app.post('/save-xml', (req, res) => {
  const xmlData = req.body;

  fs.writeFile(resolvedPath, xmlData, (err) => {
    if (err) {
      console.error('❌ Fehler beim Schreiben:', err);
      return res.status(500).send('Fehler beim Schreiben');
    }
    console.log(`✅ XML gespeichert unter: ${resolvedPath}`);
    res.send('XML gespeichert');
  });
});

app.get('/colors', (req, res) => {
  fs.readFile(__colorsFile, 'utf-8', (err, data) => {
    if (err) {
      console.error('Fehler beim Lesen der Farben:', err);
      return res.status(500).json({ error: 'Fehler beim Laden der Farben' });
    }
    try {
      const colors = JSON.parse(data);
      res.json(colors);
    } catch (parseErr) {
      console.error('Fehler beim Parsen der Farben:', parseErr);
      res.status(500).json({ error: 'Fehler beim Verarbeiten der Farbdaten' });
    }
  });
});

app.listen(3001, () => console.log('📡 Server läuft auf Port 3001'));
