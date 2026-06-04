const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  if (!fs.existsSync(dir)) return filelist;
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    try {
      filelist = fs.statSync(dirFile).isDirectory()
        ? walkSync(dirFile, filelist)
        : [...filelist, dirFile];
    } catch (err) { }
  });
  return filelist;
}

const files = [
  ...walkSync(path.join(__dirname, 'src')),
  ...walkSync(path.join(__dirname, '..', 'backend'))
].filter(f => f.endsWith('.js') || f.endsWith('.jsx'));

let changed = 0;
files.forEach(file => {
  if (file.includes('node_modules')) return;
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  // Simple state machine to remove console.log() tracking balanced parentheses
  const removeConsole = (str, method) => {
    let result = '';
    let i = 0;
    const target = 'console.' + method;
    while (i < str.length) {
      if (str.substring(i, i + target.length) === target) {
        // found console.xxx
        let j = i + target.length;
        // skip whitespace
        while (j < str.length && /\\s/.test(str[j])) j++;
        if (str[j] === '(') {
          let parenCount = 1;
          j++;
          while (j < str.length && parenCount > 0) {
            // Very basic string skipping to avoid counting parentheses inside strings
            if (str[j] === "'" || str[j] === '"' || str[j] === '\`') {
              const quote = str[j];
              j++;
              while (j < str.length) {
                if (str[j] === '\\\\') j += 2; // skip escaped
                else if (str[j] === quote) {
                  j++;
                  break;
                } else j++;
              }
              continue;
            }
            if (str[j] === '(') parenCount++;
            else if (str[j] === ')') parenCount--;
            j++;
          }
          // skip optional semicolon
          let k = j;
          while (k < str.length && /[\\s]/.test(str[k])) {
            if (str[k] === '\\n') {
              // If we hit a newline, we can stop consuming whitespace to preserve line breaks
              break;
            }
            k++;
          }
          if (str[k] === ';') j = k + 1;
          else j = k;
          
          i = j; // skip the whole console.log(...)
          continue;
        }
      }
      result += str[i];
      i++;
    }
    return result;
  };

  content = removeConsole(content, 'log');
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    changed++;
    console.log(`Cleaned: ${file}`);
  }
});
console.log(`Cleaned console.log statements in ${changed} files!`);
