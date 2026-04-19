// Stub implementations for Tauri file operations
// In a real Tauri environment, these would use @tauri-apps/api/fs

export async function readFile(path: string): Promise<string> {
    // Stub: In real implementation, use Tauri fs.readTextFile
    console.warn('readFile stub called for', path);
    return '';
}

export async function writeFile(path: string, content: string): Promise<void> {
    // Stub: In real implementation, use Tauri fs.writeTextFile
    console.warn('writeFile stub called for', path);
}
