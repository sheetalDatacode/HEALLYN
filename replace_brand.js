const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(path.join(dir, f));
    }
  });
}

const targetDir = path.join(__dirname, 'frontend', 'src');
const exts = ['.js', '.jsx', '.html', '.css', '.json'];

walkDir(targetDir, (filePath) => {
  const ext = path.extname(filePath);
  if (exts.includes(ext)) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let changed = false;
      
      if (content.includes('Healiinn')) {
        content = content.replace(/Healiinn/g, 'Heallyn');
        changed = true;
      }
      
      if (content.includes('healiinn.com')) {
        content = content.replace(/healiinn\.com/gi, 'heallyn.com');
        changed = true;
      }
      
      if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated: ' + filePath);
      }
    } catch (err) {
      console.error('Error reading ' + filePath + ': ' + err.message);
    }
  }
});
