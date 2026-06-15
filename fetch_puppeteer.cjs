const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeImages() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const content = fs.readFileSync('src/data/playerPersonalLife.js', 'utf8');
  const lines = content.split('\n');

  async function fetchImage(query) {
    try {
      console.log('Searching:', query);
      const url = `https://duckduckgo.com/?q=${encodeURIComponent(query + ' face photo')}&t=h_&iar=images&iax=images&ia=images`;
      await page.goto(url, { waitUntil: 'networkidle2' });
      // DuckDuckGo loads images into .tile--img__img
      await page.waitForSelector('.tile--img__img', { timeout: 5000 });
      const imgSrc = await page.evaluate(() => {
        const img = document.querySelector('.tile--img__img');
        return img ? img.src : null;
      });
      return imgSrc;
    } catch (e) {
      console.error('Error fetching:', query, e.message);
      return null;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Partner photos
    const pMatch = line.match(/name:\s*'([^']+)'/);
    const roleMatch = lines[i+1]?.match(/role:/);
    if (pMatch && roleMatch && !line.includes('Keeps private life private')) {
      const name = pMatch[1];
      const url = await fetchImage(name);
      if (url) {
        for (let j = i+1; j < i+5; j++) {
          if (lines[j].includes('photo:')) {
            lines[j] = lines[j].replace(/photo:\s*'[^']*'/, `photo: '${url}'`).replace(/photo:\s*null/, `photo: '${url}'`);
            break;
          }
        }
      }
    }
    
    // Children photos
    const cMatch = line.match(/{ name:\s*'([^']+)',\s*born/);
    if (cMatch) {
      const childName = cMatch[1];
      const url = await fetchImage(childName);
      if (url) {
        if (lines[i].includes('photo:')) {
           lines[i] = lines[i].replace(/photo:\s*'[^']*'/, `photo: '${url}'`);
        } else {
           lines[i] = lines[i].replace(/emoji:\s*'[^']+'/, `$&, photo: '${url}'`);
        }
      }
    }
    
    // Relationship History photos
    const rMatch = line.match(/{ name:\s*'([^']+)',\s*years.*status/);
    if (rMatch) {
      const rName = rMatch[1];
      const url = await fetchImage(rName);
      if (url) {
        if (lines[i].includes('photo:')) {
           lines[i] = lines[i].replace(/photo:\s*'[^']*'/, `photo: '${url}'`);
        } else {
           lines[i] = lines[i].replace(/}/, `, photo: '${url}' }`);
        }
      }
    }
  }
  
  fs.writeFileSync('src/data/playerPersonalLife.js', lines.join('\n'));
  console.log('Done mapping Puppeteer images!');
  await browser.close();
}

scrapeImages();
