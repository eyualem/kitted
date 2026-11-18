// Builds the style-game mockup from its parts.
//   node tasks/style-quiz/src/build.js [artifact.html]
// Writes tasks/style-quiz/design.html (a full page you can open from the repo). With a path, also writes the same
// page without its <!doctype>/<html> wrapper, which is the form the Artifact tool publishes.
//
// Parts (see README.md for who owns which):
//   page.html     the page's CSS and its words around the phones
//   logic.js      the looks, their order, and how each game ranks them
//   views.js      every screen, gesture and page control
//   drawings.json every look's two outfits as SVG, light and dark (made by drawings.ts from the app's own drawing code)
const fs = require('fs');
const path = require('path');

const here = __dirname;
const read = (f) => fs.readFileSync(path.join(here, f), 'utf8');
const drawings = read('drawings.json').trim().replace(/<\//g, '<\\/');

const body = read('page.html')
  + '<script id="svgs" type="application/json">' + drawings + '</script>\n'
  + '<script>\n(() => {\n'
  + "  const SVG = JSON.parse(document.getElementById('svgs').textContent);\n"
  + read('logic.js').replace(/^(\/\/[^\n]*\n)+/, '')
  + read('views.js').replace(/^(\/\/[^\n]*\n)+/, '')
  + '})();\n</script>\n';

fs.writeFileSync(path.join(here, '..', 'design.html'),
  '<!doctype html>\n<html lang="en">\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' + body + '\n</html>\n');
if (process.argv[2]) fs.writeFileSync(process.argv[2], body);
console.log('built tasks/style-quiz/design.html' + (process.argv[2] ? ' and ' + process.argv[2] : ''));
