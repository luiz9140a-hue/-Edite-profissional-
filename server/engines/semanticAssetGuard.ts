import { IntentContract } from '../../src/types/engrenagem';

export interface VerifiedAsset {
  id: string;
  category: string;
  semanticTags: string[];
  url: string;
  alt: string;
  width: number;
  height: number;
}

const VERIFIED_ASSET_LIBRARY: VerifiedAsset[] = [
  // Food & Burgers
  {
    id: 'burger-hero-1',
    category: 'food_delivery',
    semanticTags: ['burger', 'hamburguer', 'artesanal', 'cheddar', 'bacon', 'lanche'],
    url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80',
    alt: 'Hambúrguer artesanal suculento com queijo derretido e bacon crocante',
    width: 1200,
    height: 800
  },
  {
    id: 'burger-smash-2',
    category: 'food_delivery',
    semanticTags: ['burger', 'smash', 'picles', 'batata'],
    url: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80',
    alt: 'Smash burger com molho especial em pão brioche',
    width: 800,
    height: 800
  },
  {
    id: 'fries-crispy-3',
    category: 'food_delivery',
    semanticTags: ['batata', 'fries', 'fritas', 'crocante'],
    url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80',
    alt: 'Batatas rústicas douradas com alecrim e sal marinho',
    width: 800,
    height: 600
  },
  {
    id: 'shake-soda-4',
    category: 'food_delivery',
    semanticTags: ['bebida', 'refrigerante', 'milkshake', 'suco'],
    url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80',
    alt: 'Milkshake cremoso artesanal de chocolate belga',
    width: 800,
    height: 800
  },

  // Dental & Healthcare
  {
    id: 'dental-hero-1',
    category: 'healthcare',
    semanticTags: ['dentist', 'dentista', 'consultorio', 'clinica', 'sorriso'],
    url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80',
    alt: 'Consultório odontológico moderno com iluminação e tecnologia de ponta',
    width: 1200,
    height: 800
  },
  {
    id: 'dentist-doctor-2',
    category: 'healthcare',
    semanticTags: ['dentista', 'doutor', 'medico', 'especialista'],
    url: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80',
    alt: 'Dentista profissional sorrindo com equipamentos odontológicos',
    width: 800,
    height: 800
  },
  {
    id: 'patient-smile-3',
    category: 'healthcare',
    semanticTags: ['sorriso', 'paciente', 'clareamento', 'ortodontia'],
    url: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=800&q=80',
    alt: 'Sorriso perfeito e saudável após tratamento odontológico estético',
    width: 800,
    height: 600
  },

  // Adega & Beverages
  {
    id: 'wine-cellar-1',
    category: 'beverage_delivery',
    semanticTags: ['adega', 'vinho', 'garrafas', 'tinto'],
    url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1200&q=80',
    alt: 'Adega climatizada com seleção de vinhos tintos selecionados',
    width: 1200,
    height: 800
  },
  {
    id: 'beer-ice-2',
    category: 'beverage_delivery',
    semanticTags: ['cerveja', 'gelada', 'gelo', 'chopp'],
    url: 'https://images.unsplash.com/photo-1608270114061-070868f0c5a3?auto=format&fit=crop&w=800&q=80',
    alt: 'Garrafas de cerveja artesanal cobertas por gelo triturado',
    width: 800,
    height: 800
  },
  {
    id: 'charcoal-bbq-3',
    category: 'beverage_delivery',
    semanticTags: ['carvão', 'churrasco', 'gelo', 'copos'],
    url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
    alt: 'Brasa viva e churrasco para confraternização com amigos',
    width: 800,
    height: 600
  },

  // Fitness & Gym
  {
    id: 'gym-hero-1',
    category: 'fitness',
    semanticTags: ['academia', 'fitness', 'musculacao', 'treino', 'pesos'],
    url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80',
    alt: 'Espaço fitness com halteres modernos e iluminação motivadora',
    width: 1200,
    height: 800
  },
  {
    id: 'gym-athlete-2',
    category: 'fitness',
    semanticTags: ['atleta', 'treinador', 'crossfit', 'força'],
    url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    alt: 'Atleta concentrado durante sessão de treino de alta intensidade',
    width: 800,
    height: 800
  },

  // General SaaS / Tech
  {
    id: 'saas-hero-1',
    category: 'b2b_saas',
    semanticTags: ['dashboard', 'software', 'analytics', 'dados', 'crm'],
    url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    alt: 'Dashboard analítico com métricas em tempo real e visualização de dados',
    width: 1200,
    height: 800
  }
];

export function validateAndGetSemanticAssets(intent: IntentContract): {
  assets: VerifiedAsset[];
  rejectedReasons: string[];
} {
  const rejectedReasons: string[] = [];

  // Filter out any assets containing forbidden tags
  const validAssets = VERIFIED_ASSET_LIBRARY.filter(asset => {
    // Check forbidden
    const isForbidden = intent.forbiddenAssets.some(forbidden =>
      asset.semanticTags.some(tag => tag.toLowerCase().includes(forbidden.toLowerCase())) ||
      asset.category.toLowerCase().includes(forbidden.toLowerCase())
    );

    if (isForbidden) {
      rejectedReasons.push(`Asset '${asset.id}' rejeitado pelo SemanticGuard: viola a regra '${intent.forbiddenAssets.join(', ')}' do domínio '${intent.domain}'`);
      return false;
    }

    // Match domain or general
    return asset.category === intent.domain || asset.category === 'general';
  });

  return {
    assets: validAssets.length > 0 ? validAssets : VERIFIED_ASSET_LIBRARY.filter(a => a.category === 'b2b_saas'),
    rejectedReasons
  };
}
