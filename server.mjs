import express from 'express';
import fs from 'fs';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url'; 
import { parseStringPromise, Builder } from 'xml2js';

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

function deepEqual(obj1, obj2) {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) return false;

  return keys1.every(key => {
    const val1 = obj1[key];
    const val2 = obj2[key];

    if (Array.isArray(val1) && Array.isArray(val2)) {
      return val1.length === val2.length && val1.every((v, i) => v === val2[i]);
    }

    return val1 === val2;
  });
}

// Route zum Löschen eines Items anhand aller Eigenschaften
app.post('/delete-item', async (req, res) => {
  const itemToDelete = req.body;

  try {
    const xmlData = fs.readFileSync(resolvedPath, 'utf8');
    const parsedXml = await parseStringPromise(xmlData);

    const items = parsedXml?.BrickStore?.Items?.[0]?.Item || [];

    const filteredItems = items.filter(item => !deepEqual(item, itemToDelete));

    parsedXml.BrickStore.Items[0].Item = filteredItems;

    const builder = new Builder();
    const updatedXml = builder.buildObject(parsedXml);

    fs.writeFileSync(resolvedPath, updatedXml, 'utf8');

    res.send({ success: true, message: 'Eintrag gelöscht (wenn vorhanden).' });
  } catch (err) {
    console.error('Fehler beim Löschen aus XML:', err);
    res.status(500).send({ success: false, error: 'Fehler beim Löschen.' });
  }
});

app.listen(3001, () => console.log('📡 Server läuft auf Port 3001'));
