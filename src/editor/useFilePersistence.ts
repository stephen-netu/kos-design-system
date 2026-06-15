import { EditorView } from '@codemirror/view';
import { getMtimeMs, isTauri, readTextFile, writeTextFile } from '../t0-transport/fs';

export interface UseFilePersistenceOptions {
  getFilePath: () => string | null;
  getContent: () => string;
  getIsDirty: () => boolean;
  getIsSaving: () => boolean;
  getIsCheckingExternalChanges: () => boolean;
  getShowExternalChangeDialog: () => boolean;
  getLastKnownMtimeMs: () => number | null;
  getEditorView: () => EditorView | null;
  setContent: (content: string) => void;
  setIsDirty: (dirty: boolean) => void;
  setIsSaving: (saving: boolean) => void;
  setSaveError: (error: string | null) => void;
  setShowExternalChangeDialog: (show: boolean) => void;
  setIsCheckingExternalChanges: (checking: boolean) => void;
  setLastKnownMtimeMs: (mtime: number | null) => void;
  onChange?: (content: string) => void;
  onSave?: () => void;
  onExternalChange?: (content: string) => void;
}

export interface UseFilePersistenceApi {
  persistenceAvailable: boolean;
  startExternalChangeMonitoring: () => () => void;
  stopExternalChangeMonitoring: () => void;
  checkExternalChanges: () => Promise<void>;
  saveContent: () => Promise<void>;
  reloadFromDisk: () => Promise<void>;
  keepCurrent: () => void;
}

export function useFilePersistence(options: UseFilePersistenceOptions): UseFilePersistenceApi {
  const persistenceAvailable = isTauri();
  let interval: ReturnType<typeof setInterval> | null = null;
  let focusHandler: (() => void) | null = null;

  async function refreshLastKnownMtime() {
    const filePath = options.getFilePath();
    if (!filePath || !persistenceAvailable) return;
    try {
      options.setLastKnownMtimeMs(await getMtimeMs(filePath));
    } catch {
      return;
    }
  }

  async function checkExternalChanges() {
    const filePath = options.getFilePath();
    if (!filePath || !persistenceAvailable || options.getIsCheckingExternalChanges() || options.getShowExternalChangeDialog() || !options.getIsDirty()) {
      return;
    }

    options.setIsCheckingExternalChanges(true);
    try {
      const mtime = await getMtimeMs(filePath);
      const lastKnownMtimeMs = options.getLastKnownMtimeMs();
      if (mtime !== null && lastKnownMtimeMs !== null && mtime > lastKnownMtimeMs) {
        options.setShowExternalChangeDialog(true);
      }
    } catch (err) {
      console.debug('External change check failed:', err);
    } finally {
      options.setIsCheckingExternalChanges(false);
    }
  }

  async function saveContent() {
    const filePath = options.getFilePath();
    if (!options.getIsDirty() || options.getIsSaving() || !filePath || !persistenceAvailable) return;

    options.setIsSaving(true);
    options.setSaveError(null);
    try {
      await writeTextFile(filePath, options.getContent());
      options.setIsDirty(false);
      options.onSave?.();
      await refreshLastKnownMtime();
    } catch (err) {
      options.setSaveError(err instanceof Error ? err.message : String(err));
      console.error('Failed to save file:', err);
    } finally {
      options.setIsSaving(false);
    }
  }

  async function reloadFromDisk() {
    const filePath = options.getFilePath();
    if (!filePath) return;

    try {
      const newContent = await readTextFile(filePath);
      const view = options.getEditorView();
      if (view) {
        view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: newContent } });
      }
      options.setContent(newContent);
      options.setIsDirty(false);
      options.setSaveError(null);
      options.onExternalChange?.(newContent);
      options.onChange?.(newContent);
      await refreshLastKnownMtime();
    } catch (err) {
      console.error('Failed to reload file:', err);
      options.setSaveError(err instanceof Error ? err.message : 'Failed to reload file');
    } finally {
      options.setShowExternalChangeDialog(false);
    }
  }

  function keepCurrent() {
    options.setShowExternalChangeDialog(false);
    options.setIsDirty(true);
  }

  function startExternalChangeMonitoring() {
    if (!persistenceAvailable) return () => {};
    const filePath = options.getFilePath();
    if (filePath) {
      getMtimeMs(filePath).then((m) => options.setLastKnownMtimeMs(m)).catch(() => {});
    }
    interval = setInterval(() => { void checkExternalChanges(); }, 2000);
    focusHandler = () => { void checkExternalChanges(); };
    window.addEventListener('focus', focusHandler);
    return stopExternalChangeMonitoring;
  }

  function stopExternalChangeMonitoring() {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
    if (focusHandler) {
      window.removeEventListener('focus', focusHandler);
      focusHandler = null;
    }
  }

  return {
    persistenceAvailable,
    startExternalChangeMonitoring,
    stopExternalChangeMonitoring,
    checkExternalChanges,
    saveContent,
    reloadFromDisk,
    keepCurrent
  };
}
