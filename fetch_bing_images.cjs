const fs = require('fs');
const https = require('https');

async function fetchBingThumbnail(query) {
  return new Promise((resolve) => {
    const q = encodeURIComponent(query + ' face photo');
    https.get('https://www.bing.com/images/search?q=' + q, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // Extract the first high-quality Bing thumbnail
        const match = data.match(/src="(https:\/\/th\.bing\.com\/th\/id\/OIP\.[^"]+)"/i);
        if (match) {
          resolve(match[1]);
        } else {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function main() {
  const content = fs.readFileSync('src/data/playerPersonalLife.js', 'utf8');
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Partner photos
    const pMatch = line.match(/name:\s*'([^']+)'/);
    const roleMatch = lines[i+1]?.match(/role:/);
    if (pMatch && roleMatch && !line.includes('Keeps private life private')) {
      const name = pMatch[1];
      console.log('Fetching partner:', name);
      const url = await fetchBingThumbnail(name);
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
      console.log('Fetching child:', childName);
      const url = await fetchBingThumbnail(childName);
      if (url) {
        // Must match single quotes correctly
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
      console.log('Fetching history:', rName);
      const url = await fetchBingThumbnail(rName);
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
  console.log('Done mapping Bing images!');
}

main();
