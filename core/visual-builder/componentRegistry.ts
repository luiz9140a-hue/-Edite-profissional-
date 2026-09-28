export interface RegisteredComponent {
  name: string;
  category: 'layout' | 'content' | 'form' | 'media' | 'integration';
  props: Record<string, { type: string; defaultValue?: unknown }>;
  description: string;
}

const registry: RegisteredComponent[] = [
  { name: 'Page', category: 'layout', props: {}, description: 'Raiz de uma página publicada.' },
  { name: 'Section', category: 'layout', props: {}, description: 'Seção responsiva para agrupar conteúdo.' },
  { name: 'Text', category: 'content', props: { text: { type: 'string', defaultValue: 'Texto' } }, description: 'Texto editável.' },
  { name: 'Button', category: 'form', props: { label: { type: 'string', defaultValue: 'Continuar' }, href: { type: 'string' } }, description: 'Ação ou link principal.' },
  { name: 'Image', category: 'media', props: { src: { type: 'url' }, alt: { type: 'string' } }, description: 'Imagem com alt text.' },
];

export function listRegisteredComponents() {
  return registry.map(item => ({ ...item, props: { ...item.props } }));
}

export function registerComponent(component: RegisteredComponent) {
  const index = registry.findIndex(item => item.name === component.name);
  if (index >= 0) registry[index] = component;
  else registry.push(component);
  return component;
}
