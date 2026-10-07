import CodeMirror from '@uiw/react-codemirror';
import { html as htmlLang } from '@codemirror/lang-html';
import { css as cssLang } from '@codemirror/lang-css';
import { javascript as jsLang } from '@codemirror/lang-javascript';

export default function Editor({
  value,
  filename,
  onChange,
}: {
  value: string;
  filename: string;
  onChange: (v: string) => void;
}) {
  const ext = filename.split('.').pop() || '';
  const extensions =
    ext === 'css' ? [cssLang()] :
    ext === 'tsx' || ext === 'ts' || ext === 'jsx' || ext === 'js'
      ? [jsLang({ jsx: true, typescript: ext.startsWith('ts') })]
      : [htmlLang()];

  return (
    <div className="editor-wrap">
      <CodeMirror
        value={value}
        height="100%"
        theme="dark"
        extensions={extensions}
        onChange={onChange}
        basicSetup={{ lineNumbers: true, foldGutter: true, autocompletion: true }}
      />
    </div>
  );
}

