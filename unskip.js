const fs = require('fs');
const path = require('path');

const testDir = path.join(__dirname, 'tests');

fs.readdirSync(testDir).forEach(file => {
  if (file.endsWith('.spec.ts')) {
    const filePath = path.join(testDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove the skipped line
    const searchString = '\n    test.skip(); // UI undergoing polish MVP';
    if (content.includes(searchString)) {
      content = content.split(searchString).join('');
      fs.writeFileSync(filePath, content);
      console.log(`Unskipped tests in ${file}`);
    }
  }
});
