import express from 'express';
import fs from 'fs';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url'; 

const config = JSON.parse(fs.readFileSync(new URL('./config.json', import.meta.url)));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

app.listen(3001, () => console.log('📡 Server läuft auf Port 3001'));
