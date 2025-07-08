import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  try {
    await page.goto('https://www.bricklink.com/catalogColors.asp', {
      waitUntil: 'networkidle2',
      timeout: 0
    });

    // Versuche Cookie-Banner zu akzeptieren
    try {
      const accepted = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('a, button'));

        const btn = buttons.find(b =>
          b.textContent?.toLowerCase().includes('accept all')
        );

        if (btn) {
          btn.click();
          return true;
        }

        return false;
      });

      if (accepted) {
        console.log('✅ Cookie-Banner akzeptiert');
        await new Promise(resolve => setTimeout(resolve, 1500)); // Warte auf Neuladen
      } else {
        console.warn('⚠️ Kein Cookie-Banner gefunden');
      }
    } catch (err) {
      console.warn('⚠️ Fehler beim Klicken des Cookie-Banners:', err.message);
    }

    page.on('console', msg => {
      console.log('📢 Browser-Console:', msg.text());
    });
    // Farben extrahieren
    const colors = await page.evaluate(() => {
    const result = [];
    // Alle <table bgcolor="#FFFFFF"> durchsuchen
    const whiteTables = Array.from(document.querySelectorAll('table[bgcolor="#FFFFFF"]'));
    whiteTables.forEach((whiteTable, index) => {
      if (index == 0) {
        return;
      }
      const center = whiteTable.querySelector('td > center');
      if (!center) return;

      const innerTables = Array.from(center.querySelectorAll('table'));
      innerTables.forEach(table => {
        const rows = Array.from(table.querySelectorAll('tr'));
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length < 4) return;

          const id = cells[0].querySelector('font')?.textContent?.trim();
          // Header Zeilen überspringen
          if (id==="ID") {
            return;
          }
          const color = "#" + cells[1].getAttribute('bgcolor');
          const name = cells[3].querySelector('font')?.textContent?.trim();

          if (id && name && color) {
            console.log(`${id}, ${name}, ${color}`);
            result.push({ id, name, color });
          }
        });
      });
    });

    return result;
  });


    console.log(`🎨 ${colors.length} Farben gefunden`);
    fs.writeFileSync('../data/bricklink-colors.json', JSON.stringify(colors, null, 2), 'utf-8');
    console.log('📁 Farben gespeichert in colors.json');
  } catch (err) {
    console.error('❌ Fehler beim Abrufen oder Verarbeiten:', err);
  } finally {
    await browser.close();
  }
})();
