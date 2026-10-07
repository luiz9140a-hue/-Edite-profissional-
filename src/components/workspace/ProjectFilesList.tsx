import React, { useState } from 'react';
import {
  FileCode,
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
  FileText,
  FileJson,
  File,
  Eye,
  EyeOff
} from 'lucide-react';
import { ProjectFile } from '../../types/engrenagem';

interface Props {
  files: Record<string, ProjectFile>;
  selectedFile: string;
  onSelectFile: (filePath: string) => void;
  isMobile?: boolean;
}

const ADVANCED_FILE_PATTERNS = [
  /^\.git/,
  /^\.github/,
  /node_modules/,
  /package-lock\.json/,
  /yarn\.lock/,
  /pnpm-lock\.yaml/,
  /^\.eslintrc/,
  /^\.prettier/,
  /^\.env/,
  /^\.DS_Store/,
  /tsconfig.*\.json/,
  /vite\.config/
];

export default function ProjectFilesList({
  files,
  selectedFile,
  onSelectFile,
  isMobile = false
}: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});

  const allFilePaths = Object.keys(files || {});

  // Separate clean user files from internal infrastructure
  const visibleFiles = allFilePaths.filter((path) => {
    if (showAdvanced) return true;
    for (const pattern of ADVANCED_FILE_PATTERNS) {
      if (pattern.test(path)) return false;
    }
    return true;
  });

  const toggleFolder = (folderName: string) => {
    setCollapsedFolders((prev) => ({
      ...prev,
      [folderName]: !prev[folderName]
    }));
  };

  const getFileIcon = (filePath: string) => {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
      return <FileCode className="w-4 h-4 text-sky-400 flex-shrink-0" />;
    }
    if (filePath.endsWith('.json')) {
      return <FileJson className="w-4 h-4 text-amber-400 flex-shrink-0" />;
    }
    if (filePath.endsWith('.html') || filePath.endsWith('.md')) {
      return <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0" />;
    }
    return <File className="w-4 h-4 text-slate-400 flex-shrink-0" />;
  };

  return (
    <div className="flex flex-col h-full text-xs font-sans">
      {/* Header bar with Advanced toggle */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-850 bg-slate-950/60">
        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
          Arquivos ({visibleFiles.length})
        </span>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`px-2 py-1 rounded-lg text-[10px] font-medium flex items-center gap-1 transition ${
            showAdvanced
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
          }`}
          title="Alternar visibilidade de arquivos de configuração e infraestrutura"
        >
          {showAdvanced ? <Eye className="w-3 h-3 text-blue-400" /> : <EyeOff className="w-3 h-3" />}
          <span>{showAdvanced ? 'Avançados' : 'Simples'}</span>
        </button>
      </div>

      {/* Files List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {visibleFiles.length > 0 ? (
          visibleFiles.map((filePath) => {
            const isSelected = selectedFile === filePath;
            const segments = filePath.split('/');
            const isRoot = segments.length === 1;
            const dir = isRoot ? '' : segments.slice(0, -1).join('/');
            const fileName = segments[segments.length - 1];

            return (
              <button
                key={filePath}
                onClick={() => onSelectFile(filePath)}
                className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center space-x-2.5 font-mono transition active:scale-[0.99] select-none ${
                  isMobile ? 'min-h-[44px]' : 'min-h-[32px]'
                } ${
                  isSelected
                    ? 'bg-blue-600/25 text-blue-300 font-bold border border-blue-500/40 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                {getFileIcon(filePath)}
                <div className="flex-1 min-w-0 flex items-baseline gap-1.5 truncate">
                  {!isRoot && (
                    <span className="text-[10px] text-slate-500 truncate">{dir}/</span>
                  )}
                  <span className={`text-xs truncate ${isSelected ? 'text-white font-bold' : ''}`}>
                    {fileName}
                  </span>
                </div>
              </button>
            );
          })
        ) : (
          <div className="p-4 text-center text-slate-500 font-mono text-xs">
            Nenhum arquivo relevante encontrado.
          </div>
        )}
      </div>

      {/* Helper Footer for user awareness */}
      <div className="p-2 border-t border-slate-850 bg-slate-950/40 text-[10px] text-slate-500 text-center">
        {showAdvanced ? 'Exibindo todos os arquivos do workspace' : 'Arquivos do projeto limpos para edição'}
      </div>
    </div>
  );
}
