import fs from 'fs';
import path from 'path';

const ITEMS_DIR = path.join(process.cwd(), 'public', 'textures', 'items');
const BLOCKS_DIR = path.join(process.cwd(), 'public', 'textures', 'blocks');

fs.mkdirSync(ITEMS_DIR, { recursive: true });
fs.mkdirSync(BLOCKS_DIR, { recursive: true });

async function downloadCategory(category, targetDir) {
  console.log(`Fetching list for ${category}...`);
  const res = await fetch(`https://api.github.com/repos/PrismarineJS/minecraft-assets/contents/data/1.20.2/${category}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch file list: ${res.status}`);
  }
  const files = await res.json();
  const pngFiles = files.filter(f => f.name.endsWith('.png'));
  console.log(`Found ${pngFiles.length} ${category} textures. Downloading in parallel...`);

  const concurrency = 25;
  let index = 0;
  let downloaded = 0;

  async function worker() {
    while (index < pngFiles.length) {
      const file = pngFiles[index++];
      const filePath = path.join(targetDir, file.name);
      if (fs.existsSync(filePath)) {
        downloaded++;
        continue;
      }
      try {
        const fileRes = await fetch(`https://cdn.jsdelivr.net/gh/PrismarineJS/minecraft-assets@master/data/1.20.2/${category}/${file.name}`);
        if (fileRes.ok) {
          const buf = await fileRes.arrayBuffer();
          fs.writeFileSync(filePath, Buffer.from(buf));
          downloaded++;
        }
      } catch (e) {
        console.error(`Failed ${file.name}:`, e.message);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  console.log(`Finished ${category}: ${downloaded}/${pngFiles.length} saved to ${targetDir}`);
}

async function main() {
  await downloadCategory('items', ITEMS_DIR);
  await downloadCategory('blocks', BLOCKS_DIR);
  console.log('All textures downloaded successfully!');
}

main().catch(console.error);
