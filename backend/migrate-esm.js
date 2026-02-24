import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (f !== 'node_modules') {
        walkDir(dirPath, callback);
      }
    } else {
      if (f.endsWith('.js') && f !== 'migrate-esm.js') {
        callback(path.join(dir, f));
      }
    }
  });
}

function convertToEsm(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace const module = require('module') with import module from 'module'
  // Handles: const express = require('express');
  content = content.replace(/const\s+([a-zA-Z0-9_]+)\s*=\s*require\((['"])(.*?)\2\);?/g, "import $1 from '$3';");
  
  // Replace const { a, b } = require('module') with import { a, b } from 'module'
  content = content.replace(/const\s+\{\s*([^}]+)\s*\}\s*=\s*require\((['"])(.*?)\2\);?/g, "import { $1 } from '$3';");
  
  // Replace require('dotenv').config() with import 'dotenv/config'
  content = content.replace(/require\(['"]dotenv['"]\)\.config\(\);?/g, "import 'dotenv/config';");

  // Replace standalone require('module') with import 'module'
  // content = content.replace(/require\((['"])(.*?)\1\);?/g, "import '$2';");

  // Add .js extension to relative imports
  content = content.replace(/from\s+['"](\..*?)['"]/g, (match, p1) => {
    if (!p1.endsWith('.js') && !p1.endsWith('.json')) {
      return `from '${p1}.js'`;
    }
    return match;
  });

  content = content.replace(/import\s+([a-zA-Z0-9_\{\}\s,]+)\s+from\s+['"](\..*?)['"]/g, (match, p1, p2) => {
    if (!p2.endsWith('.js') && !p2.endsWith('.json')) {
      return `import ${p1} from '${p2}.js'`;
    }
    return match;
  });

  // Replace module.exports = with export default
  content = content.replace(/module\.exports\s*=\s*/g, "export default ");

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Converted: ${filePath}`);
}

walkDir(path.join(__dirname, 'src'), convertToEsm);
// Also convert files in root except config/scripts if any.
const rootFiles = ['app.js', 'seed.js']; 
rootFiles.forEach(file => {
   const f = path.join(__dirname, 'src', file);
   if (fs.existsSync(f)) {
     // Already handled via src recursion.
   } else if (fs.existsSync(path.join(__dirname, file))) {
      convertToEsm(path.join(__dirname, file));
   }
});

console.log("Migration script complete. Please review any manual adjustments needed.");
