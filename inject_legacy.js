const fs = require('fs');

const legacyPath = './public/legacy.html';
const generatedPath = './generated_committees.html';

const legacyContent = fs.readFileSync(legacyPath, 'utf8');
const generatedContent = fs.readFileSync(generatedPath, 'utf8');

// Find the start of the sections
const startMarker = '<!-- ══════════════════════════════════════════════\n         CURRENT COMMAND 2025-26';
const fallbackStartMarker = '<!-- ══════════════════════════════════════════════';

const startIndex = legacyContent.indexOf(startMarker) !== -1 
    ? legacyContent.indexOf(startMarker) 
    : legacyContent.indexOf(fallbackStartMarker, legacyContent.indexOf('<section class="legacy-hero">'));

// Find the footer
const endMarker = '<!-- Footer -->';
const endIndex = legacyContent.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    const newContent = legacyContent.substring(0, startIndex) + generatedContent + '\n    ' + legacyContent.substring(endIndex);
    fs.writeFileSync(legacyPath, newContent);
    console.log('Successfully injected generated HTML into legacy.html');
} else {
    console.error('Could not find markers to inject HTML.', {startIndex, endIndex});
}
