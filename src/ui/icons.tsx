// Тонкая обёртка над @phosphor-icons/react: начертание regular зафиксировано,
// размеры только 18 (в интерфейсе) и 20 (в шапке). Разделы импортируют отсюда,
// а не из пакета напрямую.
import {
  Globe,
  ArrowsLeftRight,
  LinkSimple,
  ChartLineUp,
  Sparkle,
  Buildings,
  Factory,
  Package,
  Handshake,
  Cpu,
  MagnifyingGlass,
  X,
  ArrowRight,
  ArrowLeft,
  CaretDown,
  Info,
  TrendUp,
  TrendDown,
  ArrowsClockwise
} from '@phosphor-icons/react';
import type { ComponentType, CSSProperties } from 'react';
import type { NodeKind, EcoNode } from '../types';
import { KIND_TONE, nodeCode } from './glyphs';

export type IconSize = 18 | 20;

type PhosphorIcon = ComponentType<{ size?: number; weight?: 'regular'; color?: string; 'aria-hidden'?: boolean }>;

function wrap(Base: PhosphorIcon) {
  return function Icon({ size = 18 }: { size?: IconSize }) {
    return <Base size={size} weight="regular" color="currentColor" aria-hidden />;
  };
}

export const IconOverview = wrap(Globe);
export const IconFlows = wrap(ArrowsLeftRight);
export const IconChains = wrap(LinkSimple);
export const IconTimeline = wrap(ChartLineUp);
export const IconAi = wrap(Sparkle);
export const IconMarket = wrap(Buildings);
export const IconSearch = wrap(MagnifyingGlass);
export const IconClose = wrap(X);
export const IconNext = wrap(ArrowRight);
export const IconPrev = wrap(ArrowLeft);
export const IconCaret = wrap(CaretDown);
export const IconInfo = wrap(Info);
export const IconUp = wrap(TrendUp);
export const IconDown = wrap(TrendDown);
export const IconTransform = wrap(ArrowsClockwise);

const KIND_ICON: Record<NodeKind, PhosphorIcon> = {
  country: Globe,
  sector: Factory,
  product: Package,
  service: Handshake,
  tech: Cpu
};

/** Иконка по виду узла. Смысла в одиночку не несёт — рядом всегда текст. */
export function KindIcon({ kind, size = 18 }: { kind: NodeKind; size?: number }) {
  const Base = KIND_ICON[kind];
  return <Base size={size} weight="regular" color="currentColor" aria-hidden />;
}

/** Обозначение узла: страна — моно-код, прочее — иконка вида плюс точка цвета вида. */
export function NodeGlyph({ node, size = 18 }: { node: EcoNode; size?: number }) {
  const code = nodeCode(node.id);
  if (code) return <span className="code">{code}</span>;
  return (
    <span className="glyph">
      <KindIcon kind={node.kind} size={size} />
      <span className="dot" style={{ '--k': KIND_TONE[node.kind] } as CSSProperties} />
    </span>
  );
}
