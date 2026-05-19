import { ApiProduct } from '../types/product';

export interface ApiGroup {
  id: string;
  name: string;
  isActive: boolean;
  isCompleted: boolean;
  currentParticipants: number;
  minParticipants: number;
  progress: number;
  deadline?: string;
  discountPercent?: number;
  discountedPrice?: number;
  productId?: string;
  product?: {
    id: string;
    name: string;
    price: number | string;
    imageUrl?: string | null;
  };
}

export function mapGroupToCard(group: ApiGroup) {
  const orig = Number(group.product?.price ?? 0);
  const disc = group.discountedPrice != null ? Number(group.discountedPrice) : orig;

  return {
    id: String(group.product?.id ?? group.productId ?? group.id),
    title: group.name,
    regularPrice: orig,
    groupPrice: disc,
    joinedCount: group.currentParticipants ?? 0,
    targetCount: group.minParticipants ?? 0,
    progress: group.progress ?? 0,
    image: group.product?.imageUrl ?? '',
    endsAt: group.deadline,
  };
}

export function mapProductToCard(product: ApiProduct) {
  const activeGroup = product.groups?.find(g => g.isActive);
  const joined = activeGroup?.currentParticipants ?? 0;
  const target = activeGroup?.minParticipants ?? 0;
  const progress = target > 0 ? Math.round((joined / target) * 100) : 0;

  return {
    id: product.id,
    title: product.name,
    regularPrice: Number(product.price),
    groupPrice: Number(product.price),
    joinedCount: joined,
    targetCount: target,
    progress,
    image: product.imageUrl,
    endsAt: activeGroup?.deadline,
  };
}
