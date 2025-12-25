// backend/check-files.js
const fs = require('fs');
const path = require('path');

console.log('📁 Checking required files...\n');

const requiredFiles = [
  'server.js',
  'config.js',
  'database.js',
  'setup-database.js',
  'package.json',
  'routes/boxes.js',
  'routes/riders.js',
  'routes/trips.js',
  'routes/reports.js',
  'routes/backup.js'
];

let allExist = true;

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  const exists = fs.existsSync(filePath);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allExist = false;
});

console.log('\n📂 Checking directories...');
const requiredDirs = [
  '../database',
  '../uploads',
  '../uploads/riders',
  '../backups',
  'routes'
];

requiredDirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  const exists = fs.existsSync(dirPath);
  console.log(`${exists ? '✅' : '❌'} ${dir}`);
  if (!exists) allExist = false;
});

if (allExist) {
  console.log('\n🎉 All files and directories are ready!');
} else {
  console.log('\n⚠️  Some files/directories are missing.');
  console.log('Run: node setup-database.js to create missing directories');
}