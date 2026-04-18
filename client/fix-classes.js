const fs = require('fs');
const path = require('path');

const directory = './src';

const replacements = [
  { regex: /glass-panel/g, replacement: "bg-card text-card-foreground border rounded-xl shadow-sm" },
  { regex: /text-gray-200/g, replacement: "text-foreground" },
  { regex: /text-gray-300/g, replacement: "text-muted-foreground" },
  { regex: /text-gray-400/g, replacement: "text-muted-foreground" },
  { regex: /text-red-200/g, replacement: "text-destructive" },
  { regex: /text-pink-300/g, replacement: "text-primary" },
  { regex: /text-purple-300\/70/g, replacement: "text-muted-foreground" },
  { regex: /text-purple-200\/70/g, replacement: "text-muted-foreground" },
  { regex: /text-purple-200\/60/g, replacement: "text-muted-foreground" },
  { regex: /text-purple-300/g, replacement: "text-primary" },
  { regex: /text-cyan-300/g, replacement: "text-accent" },
  { regex: /border-white\/10/g, replacement: "border-border" },
  { regex: /border-white\/20/g, replacement: "border-border" },
  { regex: /border-white\/5/g, replacement: "border-border" },
  { regex: /bg-white\/5/g, replacement: "bg-muted" },
  { regex: /bg-white\/10/g, replacement: "bg-muted/80" },
  { regex: /bg-[#0a0c16]/g, replacement: "bg-popover text-popover-foreground" },
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;

      // Special conditional text-white replacement to avoid messing up gradients:
      // Only replace text-white if it's an isolated utility class (not inside from-white, to-white)
      const textWhiteRegex = /(?<![a-zA-Z0-9-])text-white(?![a-zA-Z0-9-])/g;
      if (textWhiteRegex.test(content)) {
        content = content.replace(textWhiteRegex, "text-foreground font-semibold");
        modified = true;
      }

      for (const { regex, replacement } of replacements) {
        if (regex.test(content)) {
          content = content.replace(regex, replacement);
          modified = true;
        }
      }

      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(directory);
console.log("Migration complete!");
