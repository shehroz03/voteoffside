const fs = require('fs');

function fixImages() {
  let content = fs.readFileSync('src/data/playerPersonalLife.js', 'utf8');
  
  // Remove all Unsplash and broken URLs completely from children/history
  content = content.replace(/,\s*photo:\s*'https:\/\/images\.unsplash\.com[^']*'/g, '');
  content = content.replace(/photo:\s*'https:\/\/images\.unsplash\.com[^']*'/g, 'photo: null');
  
  // Fix specific partner photos with verified Wikipedia URLs
  const validPhotos = {
    'Georgina Rodríguez': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Georgina_Rodr%C3%ADguez_in_the_Oval_Office_%2854934212986%29_%28cropped%29.jpg/500px-Georgina_Rodr%C3%ADguez_in_the_Oval_Office_%2854934212986%29_%28cropped%29.jpg',
    'Antonela Roccuzzo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/LIONEL_MESSI_-_BRESH_MIAMI.jpg/500px-LIONEL_MESSI_-_BRESH_MIAMI.jpg',
    'Anna Lewandowska': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Anna_Lewandowska_%28cropped%29.jpg/500px-Anna_Lewandowska_%28cropped%29.jpg',
    'Irina Shayk': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Irina_Shayk_Met_Gala_2022_%28cropped%29.jpg/500px-Irina_Shayk_Met_Gala_2022_%28cropped%29.jpg',
    'Bruna Biancardi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Bruna_Biancardi_2022.jpg/500px-Bruna_Biancardi_2022.jpg'
  };

  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    for (const [name, url] of Object.entries(validPhotos)) {
      if (lines[i].includes(`name: '${name}'`) || lines[i].includes(`name: "${name}"`)) {
        // Look ahead to replace photo
        for (let j = i + 1; j < i + 6 && j < lines.length; j++) {
          if (lines[j].includes('photo:')) {
            lines[j] = lines[j].replace(/photo:\s*'[^']*'/, `photo: '${url}'`).replace(/photo:\s*null/, `photo: '${url}'`);
            break;
          }
        }
      }
    }
  }

  fs.writeFileSync('src/data/playerPersonalLife.js', lines.join('\n'));
}

fixImages();
