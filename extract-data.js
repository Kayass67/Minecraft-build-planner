const mcData = require('minecraft-data')('1.20.4');
const fs = require('fs');

fs.mkdirSync('src/lib/materials/data', {recursive: true});
fs.writeFileSync('src/lib/materials/data/items.json', JSON.stringify(mcData.items));
fs.writeFileSync('src/lib/materials/data/blocks.json', JSON.stringify(mcData.blocks));
fs.writeFileSync('src/lib/materials/data/recipes.json', JSON.stringify(mcData.recipes));
fs.writeFileSync('src/lib/materials/data/itemsByName.json', JSON.stringify(mcData.itemsByName));
fs.writeFileSync('src/lib/materials/data/blocksByName.json', JSON.stringify(mcData.blocksByName));
console.log('Extracted 1.20.4 data to JSON');
