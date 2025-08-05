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
app.use(express.json());

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

app.delete('/delete-item', async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Keine ID angegeben' });
  }

  try {
    const xmlContent = fs.readFileSync(resolvedPath, 'utf-8');
    const parsed = await parseStringPromise(xmlContent);

    if (!parsed["BrickStoreXML"]["Inventory"][0]["Item"]) {
      return res.status(404).json({ error: 'Keine Items in XML gefunden' });
    }

    const items = parsed["BrickStoreXML"]["Inventory"][0]["Item"];

    const remainingItems = items.filter(item => item.$?.id !== id);

    const wasDeleted = items.length !== remainingItems.length;

    parsed["BrickStoreXML"]["Inventory"][0]["Item"] = remainingItems;

    const builder = new Builder({ headless: true, renderOpts: { pretty: true } });
    const updatedXml = builder.buildObject(parsed);

    fs.writeFileSync(resolvedPath, updatedXml);
    
    if (wasDeleted) {
      console.log(`🗑️ Item mit ID "${id}" gelöscht.`);
      res.send(`Item mit ID "${id}" gelöscht.`);
    } else {
      res.status(404).send(`Kein Item mit ID "${id}" gefunden.`);
    }
  } catch (err) {
    console.error('Fehler beim Löschen des Items:', err);
    res.status(500).json({ error: 'Fehler beim Löschen des Items' });
  }
});

app.listen(3001, () => console.log('📡 Server läuft auf Port 3001'));
