const fs = require('fs');
const https = require('https');

async function fetchImage(query) {
  return new Promise((resolve) => {
    const q = encodeURIComponent(query + ' face photo');
    const req = https.get('https://html.duckduckgo.com/html/?q=' + q, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // extract first image link if any, or just duckduckgo proxied image
        const imgMatch = data.match(/<img[^>]+src="(\/\/external-content\.duckduckgo\.com\/iu\/\?u=[^"]+)"/i);
        if (imgMatch) {
          resolve('https:' + imgMatch[1].replace(/&amp;/g, '&'));
        } else {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
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
      const url = await fetchImage(name);
      if (url) {
        // replace the photo line which is usually 2 lines down
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
      const url = await fetchImage(childName);
      if (url) {
        // replace photo if it exists, or add it
        if (line.includes('photo:')) {
           lines[i] = line.replace(/photo:\s*'[^']*'/, `photo: '${url}'`);
        } else {
           lines[i] = line.replace(/emoji:\s*'[^']+'/, `$&, photo: '${url}'`);
        }
      }
    }
    
    // Relationship History photos
    const rMatch = line.match(/{ name:\s*'([^']+)',\s*years.*status/);
    if (rMatch) {
      const rName = rMatch[1];
      console.log('Fetching history:', rName);
      const url = await fetchImage(rName);
      if (url) {
        if (line.includes('photo:')) {
           lines[i] = line.replace(/photo:\s*'[^']*'/, `photo: '${url}'`);
        } else {
           lines[i] = line.replace(/}/, `, photo: '${url}' }`);
        }
      }
    }
  }
  
  fs.writeFileSync('src/data/playerPersonalLife.js', lines.join('\n'));
  console.log('Done mapping images!');
}

main();
