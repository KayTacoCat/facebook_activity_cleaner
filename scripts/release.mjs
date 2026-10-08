import { readdir, readFile, mkdir, copyFile, rm, writeFile } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const release = resolve(root, 'release/facebook-activity-cleaner-extension');
const check = process.argv.includes('--check');
async function filesAt(directory, prefix = '') {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = join(prefix, entry.name);
    if (entry.isDirectory()) files.push(...await filesAt(join(directory, entry.name), relative));
    else files.push(relative);
  }
  return files.sort();
}
const sourceFiles = await filesAt(dist);
if (check) {
  const releaseFiles = (await filesAt(release)).filter(file => file !== 'README.md');
  if (JSON.stringify(sourceFiles) !== JSON.stringify(releaseFiles)) {
    throw new Error('Release file list differs from dist. Run npm run release.');
  }
  for (const file of sourceFiles) {
    const [source, target] = await Promise.all([readFile(join(dist, file)), readFile(join(release, file))]);
    if (!source.equals(target)) throw new Error(`Release differs from tested source: ${file}`);
  }
  console.log('Release matches the tested build.');
} else {
  // The fixed, repository-contained release path contains generated assets only.
  const readme = await readFile(join(release, 'README.md'), 'utf8');
  await rm(release, { recursive: true, force: true });
  await mkdir(release, { recursive: true });
  await writeFile(join(release, 'README.md'), readme);
  for (const file of sourceFiles) {
    await mkdir(dirname(join(release, file)), { recursive: true });
    await copyFile(join(dist, file), join(release, file));
  }
  console.log('Regenerated release from dist.');
}
