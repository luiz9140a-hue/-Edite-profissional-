import { useMemo, useState } from 'react';
import { ImagePlus, Music2, Video, X } from 'lucide-react';
import { ProjectAsset, ProjectAssetKind } from '../../types/engrenagem';
import { budClient } from '../../lib/budClient';

interface Props { projectId?: string; initialAssets?: ProjectAsset[]; }

export default function ProjectAssetLibrary({ projectId, initialAssets = [] }: Props) {
  const [assets, setAssets] = useState(initialAssets);
  const [busy, setBusy] = useState(false);
  const totalSize = useMemo(() => assets.reduce((sum, asset) => sum + asset.size, 0), [assets]);

  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    if (!projectId) return;
    const files = Array.from(event.target.files || []).slice(0, 8);
    const next = await Promise.all(files.map(file => new Promise<ProjectAsset>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const kind: ProjectAssetKind = file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : 'image';
        resolve({ id: `upload-${Date.now()}-${file.name}`, name: file.name, kind, mimeType: file.type, size: file.size, dataUrl: String(reader.result), source: 'upload', createdAt: new Date().toISOString() });
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    })));
    setBusy(true);
    try {
      const data = await budClient.addAssets(projectId, next);
      setAssets(data.assets || [...assets, ...next]);
    } catch (error: any) { window.alert(error.message); }
    finally { setBusy(false); event.target.value = ''; }
  }

  async function removeAsset(assetId: string) {
    if (!projectId) return;
    try {
      await budClient.removeAsset(projectId, assetId);
      setAssets(current => current.filter(item => item.id !== assetId));
    } catch {
      window.alert('Não foi possível remover o arquivo.');
    }
  }

  return <section className="border-t border-slate-800 p-3">
    <div className="flex items-center justify-between gap-2 mb-2"><div><h3 className="text-xs font-bold text-slate-300">Biblioteca de mídia</h3><p className="text-[10px] text-slate-500">{assets.length} arquivo(s) · {(totalSize / 1024 / 1024).toFixed(1)} MB</p></div><label className="cursor-pointer rounded-lg bg-blue-600 hover:bg-blue-500 px-2.5 py-1.5 text-[10px] font-bold text-white"><ImagePlus className="inline w-3.5 h-3.5 mr-1" />Adicionar<input type="file" className="hidden" multiple accept="image/*,video/*,audio/*" onChange={upload} disabled={busy} /></label></div>
    <div className="space-y-1.5 max-h-36 overflow-y-auto">{assets.map(asset => <div key={asset.id} className="flex items-center gap-2 rounded-lg bg-slate-900 px-2 py-1.5 text-[10px] text-slate-300"><span className="text-blue-400">{asset.kind === 'video' ? <Video className="w-3.5 h-3.5" /> : asset.kind === 'audio' ? <Music2 className="w-3.5 h-3.5" /> : <ImagePlus className="w-3.5 h-3.5" />}</span><span className="truncate flex-1">{asset.name}</span><button onClick={() => removeAsset(asset.id)} className="text-slate-600 hover:text-red-300"><X className="w-3 h-3" /></button></div>)}</div>
  </section>;
}
