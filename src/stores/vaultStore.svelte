<script lang="ts" module>
// Stub implementation for vault store
export const vaultStore = {
    async hasFileChangedExternally(_path: string): Promise<boolean> {
        return false;
    },
    async getFileModifiedTime(_path: string): Promise<number> {
        return Date.now();
    },
    updateFileState(_path: string, _content: string, _modifiedAt: number): void {
        // Stub
    }
};
</script>
