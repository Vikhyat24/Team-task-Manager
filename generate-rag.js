const fs = require('fs');
const path = require('path');

const EXCLUDE_DIRS = ['node_modules', '.git', 'dist', 'build', '.prisma'];
const EXCLUDE_EXTENSIONS = ['.db', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.lock'];
const EXCLUDE_FILES = ['package-lock.json', 'dev.db'];

const OUTPUT_FILE = 'rag_context.md';
let outputContent = '# Team Task Manager - Full Project Context\n\n';

function shouldExclude(itemPath, isDirectory) {
  const baseName = path.basename(itemPath);
  
  if (isDirectory) {
    return EXCLUDE_DIRS.includes(baseName);
  } else {
    if (EXCLUDE_FILES.includes(baseName)) return true;
    const ext = path.extname(baseName).toLowerCase();
    return EXCLUDE_EXTENSIONS.includes(ext);
  }
}

function processDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stats = fs.statSync(fullPath);

    if (shouldExclude(fullPath, stats.isDirectory())) {
      continue;
    }

    if (stats.isDirectory()) {
      processDirectory(fullPath);
    } else {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const relativePath = path.relative(__dirname, fullPath);
        
        outputContent += `\n\n---\n## File: \`${relativePath}\`\n\`\`\`\n${content}\n\`\`\`\n`;
      } catch (err) {
        console.error(`Could not read file ${fullPath}:`, err.message);
      }
    }
  }
}

console.log('Generating RAG file...');
processDirectory(__dirname);
fs.writeFileSync(OUTPUT_FILE, outputContent, 'utf8');
console.log(`Successfully created ${OUTPUT_FILE} with size ${(outputContent.length / 1024 / 1024).toFixed(2)} MB.`);
