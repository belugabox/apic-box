import * as fs from 'fs/promises';
import * as path from 'path';

const folderToDelete = path.resolve(__dirname, 'data');
const sourceFolder = path.resolve(__dirname, 'fixtures/data_f');

async function copyDirectory(src: string, dest: string): Promise<void> {
    // Créer le répertoire destination
    await fs.mkdir(dest, { recursive: true });

    // Lire le contenu du répertoire source
    const files = await fs.readdir(src, { withFileTypes: true });

    for (const file of files) {
        const srcPath = path.join(src, file.name);
        const destPath = path.join(dest, file.name);

        if (file.isDirectory()) {
            // Copier récursivement les répertoires
            await copyDirectory(srcPath, destPath);
        } else {
            // Copier les fichiers
            await fs.copyFile(srcPath, destPath);
        }
    }
}

async function globalSetup() {
    console.log('Global setup');

    // Supprimer le dossier 'data' s'il existe
    //await fs.rm(folderToDelete, { recursive: true, force: true });
    console.log(`Folder cleaned: ${folderToDelete}`);

    // Recréer le dossier 'data' à partir du dossier 'fixtures/data_f'
    await copyDirectory(sourceFolder, folderToDelete);
    console.log(`Folder copied from ${sourceFolder} to ${folderToDelete}`);
}

export default globalSetup;
