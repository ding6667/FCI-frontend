import type { LevelInfo, LevelKey } from '@/types'

export const LEVELS: Record<LevelKey, LevelInfo> = {
  NORMAL: { name: '普通会员', short: '普通', discount: 1, threshold: 0, pointsRate: 1, cls: 'level-normal' },
  SILVER: { name: '银卡会员', short: '银卡', discount: 0.95, threshold: 300, pointsRate: 1, cls: 'level-silver' },
  GOLD: { name: '金卡会员', short: '金卡', discount: 0.9, threshold: 800, pointsRate: 1.2, cls: 'level-gold' },
  PLATINUM: { name: '铂金会员', short: '铂金', discount: 0.85, threshold: 2000, pointsRate: 1.5, cls: 'level-platinum' },
}

export const LEVEL_ORDER: LevelKey[] = ['NORMAL', 'SILVER', 'GOLD', 'PLATINUM']

/** 商品图底色，保持与原设计稿一致 */
const TINTS: Record<string, string> = {
  strawberry: '#F6E4DA',
  cherry: '#F1DFDE',
  mango: '#F7EACB',
  apple: '#F3E3DA',
  orange: '#F8EBCF',
  grape: '#E8EEDC',
  watermelon: '#E2EDD8',
  blueberry: '#E5E7EC',
  cut: '#FBE8D4',
  durian: '#F7ECCB',
  pear: '#EDF0D9',
  tomato: '#F7E1D9',
  gift: '#EFE4D3',
}

export function tint(icon: string): string {
  return TINTS[icon] ?? '#F1F3F0'
}
