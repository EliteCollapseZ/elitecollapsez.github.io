const fs = require('fs');
const path = require('path');
const marked = require('marked');

// Input Markdown file path (change as needed)
const inputFile = path.resolve(__dirname, 'input.md');

// Output HTML file path (change as needed)
const outputFile = path.resolve(__dirname, 'output.html');

// Read the Markdown file
fs.readFile(inputFile, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading Markdown file:', err);
    return;
  }

  // Convert Markdown to HTML
  const htmlContent = marked(data);

  // Wrap with basic HTML structure
  const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Converted Markdown</title>
</head>
<body>
${htmlContent}
</body>
</html>
`;

  // Write HTML to output file
  fs.writeFile(outputFile, fullHtml, (err) => {
    if (err) {
      console.error('Error writing HTML file:', err);
      return;
    }
    console.log(`Markdown converted and saved to ${outputFile}`);
  });
});
