/**
 * Fabric Data Components
 * 
 * Data visualization and management components.
 */

// IMPLEMENTATION_REQUIRED(sovra-983): FileTree component implementation pending
export interface FileEntry {
  id: string;
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: FileEntry[];
  isExpanded?: boolean;
  isSelected?: boolean;
}
