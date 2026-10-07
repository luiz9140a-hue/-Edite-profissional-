import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { budClient, buildPreviewDocument } from '../../lib/budClient';

export default function IsolatedPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    if (budClient.mode() === 'convex') {
      budClient
        .getProject(id)
        .then((project) => {
          if (!project) throw new Error('Projeto não encontrado ou ainda não gerado.');
          setHtmlContent(buildPreviewDocument(project as never));
          setLoading(false);
        })
        .catch((err: Error) => {
          setError(err.message);
          setLoading(false);
        });
      return;
    }

    fetch(`/api/projects/${id}/preview-html`)
      .then(res => {
        if (!res.ok) throw new Error('Projeto não encontrado ou ainda não gerado.');
        return res.text();
      })
      .then(html => {
        setHtmlContent(html);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090E] text-slate-400 flex items-center justify-center font-mono text-sm">
        Carregando preview isolado...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#07090E] text-red-400 flex flex-col items-center justify-center p-6 text-center font-sans">
        <h2 className="text-xl font-bold mb-2">Erro ao carregar preview</h2>
        <p className="text-xs text-slate-500 max-w-sm mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <iframe
      srcDoc={htmlContent}
      title="Standalone Preview"
      className="w-screen h-screen border-none bg-black"
      sandbox="allow-scripts allow-forms allow-popups allow-modals"
    />
  );
}
