const { image_search } = require('duckduckgo-images-api');
const fs = require('fs');

async function fetchImage(query) {
  try {
    const results = await image_search({ query: query + " face photo", moderate: true, iterations: 1 });
    if (results && results.length > 0) {
      // Find a working looking URL (not blocked by obvious hotlinkers)
      for (let res of results) {
        if (res.image && !res.image.includes('getty') && !res.image.includes('alamy')) {
          return res.image;
        }
      }
      return results[0].image;
    }
  } catch (e) {
    console.error(e);
  }
  return null;
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
  console.log('Done mapping DDG API images!');
}

main();
