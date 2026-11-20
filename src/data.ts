// 시연 자료와 타입 정의 — 모든 가게·사람·가격·정책은 가상입니다.
import type { ArtKey } from './art';

export type Region = 'daegu' | 'gyeongsan';
export type SType = 'farm' | 'pickup' | 'box';
export type PayKey = Region | 'card';
export type Cat = 'fruit' | 'banchan' | 'tofu' | 'veg' | 'snack';
export type Status = 'received' | 'preparing' | 'ready' | 'done' | 'canceled' | 'inquiry';
export type Screen = 'home' | 'stores' | 'detail' | 'checkout' | 'orders' | 'supplier';

export interface Seller {
  id: string;
  name: string;
  type: SType;
  origin: string;
  home: Region | null;
  producer: string;
  art: ArtKey;
  place?: string;
}
export interface Product {
  id: string;
  sid: string;
  name: string;
  spec: string;
  price: number;
  art: ArtKey;
  cat: Cat;
  regions: Region[];
}
export type CouponTarget = { kind: 'all' } | { kind: 'type'; type: SType } | { kind: 'products'; ids: string[] };
export interface CouponDef {
  id: string;
  name: string;
  kind: 'amount' | 'rate';
  amount?: number;
  rate?: number;
  max?: number;
  target: CouponTarget;
  min: number;
  expOffset: number;
  targetLabel: string;
}
export interface Coupon extends CouponDef {
  expires: string;
}
export interface OrderLine {
  pid: string;
  name: string;
  spec: string;
  qty: number;
  price: number;
}
export interface HistoryEntry {
  at: string;
  by: '시민' | '공급자';
  text: string;
}
export interface Order {
  id: string;
  region: Region;
  sid: string;
  type: SType;
  lines: OrderLine[];
  subtotal: number;
  shipping: number;
  couponId: string | null;
  couponName: string | null;
  discount: number;
  total: number;
  payment: PayKey;
  receive: { date: string; slot: string | null; place: string };
  status: Status;
  createdAt: string;
  restored: boolean;
  restoreLog: string | null;
  history: HistoryEntry[];
}
export interface Data {
  version: number;
  seededOn: string;
  dates: Record<SType, string[]>;
  coupons: Coupon[];
  couponUsedBy: Record<string, string | null>;
  stock: Record<string, number>;
  wallet: Record<Region, number>;
  seq: number;
  orders: Order[];
}
export interface UI {
  region: Region;
  screen: Screen;
  prevScreen: Screen;
  productId: string | null;
  filter: 'all' | SType;
  cat: 'all' | Cat;
  query: string;
  bigText: boolean;
  supplier: string;
  supTab: 'new' | 'doing' | 'closed';
  ordersTab: 'active' | 'past';
  cart: { sid: string | null; items: { pid: string; qty: number }[] };
  checkout: { date: string | null; slot: string | null; coupon: string; payment: PayKey | null };
  detailQty: string;
  detailErr: string | null;
  highlight: string | null;
}
export type Modal =
  | { kind: 'region' }
  | { kind: 'menu' }
  | { kind: 'replaceCart'; pid: string; qty: number; fromDetail: boolean }
  | { kind: 'removeUnsupported' }
  | { kind: 'confirm' }
  | { kind: 'cancel'; id: string }
  | { kind: 'inquiry'; id: string }
  | { kind: 'pass'; id: string }
  | { kind: 'reset' };

export const REGIONS: Record<Region, { id: Region; name: string; cur: string; addr: string; note: string }> = {
  daegu: { id: 'daegu', name: '대구', cur: '가상 대구 지역화폐', addr: '대구 중구 시연로 12 (가상 수령지)', note: '서문시장 반찬 픽업 · 군위 사과 직송 · 하양 꾸러미 일부' },
  gyeongsan: { id: 'gyeongsan', name: '경산', cur: '가상 경산 지역화폐', addr: '경북 경산시 시연길 34 (가상 수령지)', note: '경산공설시장 두부 픽업 · 대추 직송 · 하양 꾸러미 전체' },
};
export const REGION_KEYS: Region[] = ['daegu', 'gyeongsan'];
export const TYPES: Record<SType, { label: string }> = { farm: { label: '산지 직송' }, pickup: { label: '시장 픽업' }, box: { label: '정기 꾸러미' } };
export const CATS: ['all' | Cat, string][] = [
  ['all', '전체'],
  ['fruit', '과일'],
  ['banchan', '반찬·김치'],
  ['tofu', '두부·콩'],
  ['veg', '채소 꾸러미'],
  ['snack', '간식·가공'],
];
export const SLOTS = ['10:00–12:00', '14:00–16:00', '17:00–19:00'];
export const PAY: Record<PayKey, string> = { daegu: '가상 대구 지역화폐', gyeongsan: '가상 경산 지역화폐', card: '가상 일반결제' };

export const SELLERS: Seller[] = [
  { id: 's1', name: '팔공 햇살사과농원', type: 'farm', origin: '대구 군위군', home: 'daegu', producer: '김○○ 농부', art: 'apple' },
  { id: 's2', name: '청도 감골농가', type: 'farm', origin: '경북 청도군', home: null, producer: '박○○ 농부', art: 'persimmon' },
  { id: 's3', name: '경산 대추마을농원', type: 'farm', origin: '경북 경산시', home: 'gyeongsan', producer: '이○○ 농부', art: 'jujube' },
  { id: 's4', name: '서문시장 할매반찬', type: 'pickup', origin: '대구 중구 서문시장', home: 'daegu', producer: '최○○ 사장', art: 'banchan', place: '서문시장 2지구 1층 반찬골목 14호 (가상)' },
  { id: 's5', name: '경산공설시장 콩두부방', type: 'pickup', origin: '경북 경산시 공설시장', home: 'gyeongsan', producer: '정○○ 사장', art: 'tofu', place: '경산공설시장 동문 입구 7호 (가상)' },
  { id: 's6', name: '하양 들녘꾸러미 협동조합', type: 'box', origin: '경북 경산시 하양읍', home: 'gyeongsan', producer: '조합원 12농가', art: 'vegbox' },
];

export const PRODUCTS: Product[] = [
  { id: 'p01', sid: 's1', name: '부사 사과', spec: '3kg (11~13과)', price: 24000, art: 'apple', cat: 'fruit', regions: ['daegu', 'gyeongsan'] },
  { id: 'p02', sid: 's1', name: '사과즙', spec: '100ml × 30포', price: 18000, art: 'pouch', cat: 'snack', regions: ['daegu', 'gyeongsan'] },
  { id: 'p03', sid: 's1', name: '못난이 사과', spec: '5kg (흠과 포함)', price: 19000, art: 'apple2', cat: 'fruit', regions: ['daegu'] },
  { id: 'p04', sid: 's2', name: '청도 반시', spec: '2kg (20과 내외)', price: 16000, art: 'persimmon', cat: 'fruit', regions: ['daegu', 'gyeongsan'] },
  { id: 'p05', sid: 's2', name: '감말랭이', spec: '500g', price: 12000, art: 'dried', cat: 'snack', regions: ['gyeongsan'] },
  { id: 'p06', sid: 's3', name: '건대추', spec: '1kg (상품)', price: 22000, art: 'jujube', cat: 'fruit', regions: ['daegu', 'gyeongsan'] },
  { id: 'p07', sid: 's3', name: '대추칩', spec: '300g', price: 9000, art: 'jchip', cat: 'snack', regions: ['gyeongsan'] },
  { id: 'p08', sid: 's4', name: '반찬 3종 세트', spec: '멸치볶음·콩자반·무말랭이 각 200g', price: 12000, art: 'banchan', cat: 'banchan', regions: ['daegu'] },
  { id: 'p09', sid: 's4', name: '제철 나물 모둠', spec: '400g (시금치·고사리·도라지)', price: 8000, art: 'namul', cat: 'banchan', regions: ['daegu'] },
  { id: 'p10', sid: 's4', name: '배추김치', spec: '1kg', price: 15000, art: 'kimchi', cat: 'banchan', regions: ['daegu'] },
  { id: 'p11', sid: 's5', name: '손두부', spec: '2모 (모당 550g)', price: 7000, art: 'tofu', cat: 'tofu', regions: ['gyeongsan'] },
  { id: 'p12', sid: 's5', name: '검은콩 콩물', spec: '1L', price: 5000, art: 'bottle', cat: 'tofu', regions: ['gyeongsan'] },
  { id: 'p13', sid: 's6', name: '제철 채소 꾸러미 (소)', spec: '4~5종, 1~2인분', price: 15000, art: 'vegbox', cat: 'veg', regions: ['daegu', 'gyeongsan'] },
  { id: 'p14', sid: 's6', name: '가족 꾸러미 (대)', spec: '7~8종, 3~4인분', price: 28000, art: 'bigbox', cat: 'veg', regions: ['gyeongsan'] },
  { id: 'p15', sid: 's6', name: '과일 꾸러미', spec: '사과·반시·대추 혼합 2.5kg', price: 25000, art: 'fruitbox', cat: 'fruit', regions: ['daegu', 'gyeongsan'] },
];

export const COUPON_DEFS: CouponDef[] = [
  { id: 'c1', name: '첫 장보기 3,000원', kind: 'amount', amount: 3000, target: { kind: 'all' }, min: 15000, expOffset: 30, targetLabel: '전체 상품' },
  { id: 'c2', name: '시장 픽업 20%', kind: 'rate', rate: 20, max: 4000, target: { kind: 'type', type: 'pickup' }, min: 10000, expOffset: 14, targetLabel: '시장 픽업 상품 (최대 4,000원)' },
  { id: 'c3', name: '산지 과일 5,000원', kind: 'amount', amount: 5000, target: { kind: 'products', ids: ['p01', 'p03', 'p04', 'p15'] }, min: 30000, expOffset: 21, targetLabel: '부사 사과·못난이 사과·청도 반시·과일 꾸러미' },
  { id: 'c4', name: '가을 꾸러미 2,000원', kind: 'amount', amount: 2000, target: { kind: 'type', type: 'box' }, min: 10000, expOffset: -3, targetLabel: '정기 꾸러미 상품' },
];

export const DATA_VERSION = 1;
