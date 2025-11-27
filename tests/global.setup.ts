import * as fs from 'fs/promises';
import * as path from 'path';

const folderToDelete = path.resolve(__dirname, 'tests/data');

async function globalSetup() {
    console.log('Global setup');
    try {
        await fs.rm(folderToDelete, { recursive: true, force: true });
        console.log(`Folder cleaned: ${folderToDelete}`);
    } catch (error) {
        console.error(`Error while deleting folder ${folderToDelete}:`, error);
    }
}

export default globalSetup;
