// 날짜·금액 도우미, 시연 자료 생성, 쿠폰·주문 계산 규칙
import {
  COUPON_DEFS,
  DATA_VERSION,
  PAY,
  PRODUCTS,
  REGIONS,
  SELLERS,
  type Coupon,
  type Data,
  type Order,
  type PayKey,
  type Product,
  type Region,
  type Seller,
  type SType,
  type Status,
  type UI,
} from './data';

/* ---------- 날짜·금액 ---------- */
const pad = (n: number) => String(n).padStart(2, '0');
export const iso = (d: Date) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
export function addDays(s: string, n: number) {
  const [y, m, dd] = s.split('-').map(Number);
  const d = new Date(y, m - 1, dd);
  d.setDate(d.getDate() + n);
  return iso(d);
}
export const today = () => iso(new Date());
const WD = '일월화수목금토';
export function wd(s: string) {
  const [y, m, d] = s.split('-').map(Number);
  return WD[new Date(y, m - 1, d).getDay()];
}
export function dlabel(s: string) {
  const [, m, d] = s.split('-').map(Number);
  return m + '월 ' + d + '일(' + wd(s) + ')';
}
export function dshort(s: string) {
  const [, m, d] = s.split('-').map(Number);
  return m + '/' + d;
}
export function nowStamp() {
  const d = new Date();
  return iso(d) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}
export function stampLabel(s: string) {
  const [date, time] = s.split(' ');
  const p = date.split('-');
  return Number(p[1]) + '.' + Number(p[2]) + ' ' + time;
}
export const won = (n: number) => n.toLocaleString('ko-KR') + '원';

/** 수량은 1 이상의 정수만 허용 */
export function parseQty(raw: string): number | null {
  const t = String(raw).trim();
  if (!/^\d+$/.test(t)) return null;
  const n = Number(t);
  return n >= 1 && Number.isSafeInteger(n) ? n : null;
}

/* ---------- 조회 ---------- */
export const seller = (id: string): Seller => SELLERS.find((x) => x.id === id)!;
export const prod = (id: string): Product => PRODUCTS.find((x) => x.id === id)!;
export function shipFee(type: SType, subtotal: number) {
  if (type === 'pickup') return 0;
  if (type === 'box') return 2500;
  return subtotal >= 30000 ? 0 : 3000;
}
export const shipText = (type: SType) => (type === 'pickup' ? '픽업 무료' : type === 'box' ? '배송비 2,500원' : '배송비 3,000원 · 3만원 이상 무료');
export const placeFor = (s: Seller, region: Region) => (s.type === 'pickup' ? s.place! : REGIONS[region].addr);
export function statusLabel(st: Status, type: SType) {
  return { received: '접수', preparing: '준비 중', ready: type === 'pickup' ? '픽업 가능' : '배송 가능', done: '완료', canceled: '취소', inquiry: '문의 접수' }[st];
}
export const statusTone = (st: Status) => ({ received: 'info', preparing: 'warn', ready: 'solid', done: '', canceled: 'bad', inquiry: 'warn' })[st];
export function statusMsg(o: Order) {
  const t = o.type;
  return {
    received: '판매처가 주문을 확인하고 있어요',
    preparing: t === 'pickup' ? '점포에서 준비하고 있어요' : t === 'box' ? '꾸러미를 꾸리고 있어요' : '농가에서 포장하고 있어요',
    ready: t === 'pickup' ? '지금 픽업할 수 있어요' : '배송 준비가 끝났어요',
    done: t === 'pickup' ? '픽업을 마쳤어요' : '받기를 마쳤어요',
    canceled: '취소된 주문이에요',
    inquiry: '판매처가 취소 문의를 확인하고 있어요',
  }[o.status];
}
export const isActive = (o: Order) => o.status === 'received' || o.status === 'preparing' || o.status === 'ready' || o.status === 'inquiry';

/* ---------- 시연 자료 ---------- */
export function seed(): Data {
  const t = today();
  const A = (n: number) => addDays(t, n);
  const data: Data = {
    version: DATA_VERSION,
    seededOn: t,
    dates: { farm: [A(2), A(3), A(5)], box: [A(4), A(6)], pickup: [A(1), A(2)] },
    coupons: COUPON_DEFS.map((c) => ({ ...c, expires: A(c.expOffset) })),
    couponUsedBy: { c1: 'O-1008' },
    stock: { p01: 12, p02: 0, p03: 5, p04: 8, p05: 3, p06: 10, p07: 2, p08: 6, p09: 4, p10: 3, p11: 8, p12: 5, p13: 6, p14: 4, p15: 3 },
    wallet: { daegu: 22000, gyeongsan: 15000 },
    seq: 1008,
    orders: [],
  };
  const H = (day: number, hm: string, by: '시민' | '공급자', text: string) => ({ at: A(day) + ' ' + hm, by, text });
  type Seed = { id: string; region: Region; sid: string; items: [string, number][]; payment: PayKey; status: Status; date: string; slot?: string; coupon?: string; discount?: number; restored?: boolean; restoreLog?: string; history: Order['history'] };
  const mk = (o: Seed): Order => {
    const s = seller(o.sid);
    const lines = o.items.map(([pid, qty]) => {
      const p = prod(pid);
      return { pid, name: p.name, spec: p.spec, qty, price: p.price };
    });
    const sub = lines.reduce((a, l) => a + l.price * l.qty, 0);
    const ship = shipFee(s.type, sub);
    const dis = o.discount || 0;
    const c = o.coupon ? COUPON_DEFS.find((x) => x.id === o.coupon) : undefined;
    return {
      id: o.id, region: o.region, sid: o.sid, type: s.type, lines, subtotal: sub, shipping: ship,
      couponId: o.coupon || null, couponName: c ? c.name : null, discount: dis, total: sub + ship - dis, payment: o.payment,
      receive: { date: o.date, slot: o.slot || null, place: placeFor(s, o.region) },
      status: o.status, createdAt: o.history[0].at, restored: !!o.restored, restoreLog: o.restoreLog || null, history: o.history,
    };
  };
  data.orders = [
    mk({ id: 'O-1001', region: 'daegu', sid: 's4', items: [['p08', 1]], payment: 'daegu', status: 'done', date: A(-6), slot: '17:00–19:00',
      history: [H(-7, '09:12', '시민', '주문 접수 (모의 결제)'), H(-7, '10:03', '공급자', '접수 → 준비 중'), H(-6, '15:40', '공급자', '준비 중 → 픽업 가능'), H(-6, '17:25', '공급자', '픽업 가능 → 완료')] }),
    mk({ id: 'O-1002', region: 'daegu', sid: 's1', items: [['p01', 1]], payment: 'card', status: 'done', date: A(-3),
      history: [H(-6, '20:31', '시민', '주문 접수 (모의 결제)'), H(-5, '08:10', '공급자', '접수 → 준비 중'), H(-4, '07:55', '공급자', '준비 중 → 배송 가능'), H(-3, '16:02', '공급자', '배송 가능 → 완료')] }),
    mk({ id: 'O-1003', region: 'gyeongsan', sid: 's2', items: [['p04', 2]], payment: 'card', status: 'ready', date: A(2),
      history: [H(-2, '13:20', '시민', '주문 접수 (모의 결제)'), H(-1, '09:00', '공급자', '접수 → 준비 중'), H(0, '08:30', '공급자', '준비 중 → 배송 가능')] }),
    mk({ id: 'O-1004', region: 'gyeongsan', sid: 's5', items: [['p11', 2]], payment: 'gyeongsan', status: 'preparing', date: A(1), slot: '10:00–12:00',
      history: [H(-1, '18:44', '시민', '주문 접수 (모의 결제)'), H(0, '07:30', '공급자', '접수 → 준비 중')] }),
    mk({ id: 'O-1005', region: 'daegu', sid: 's3', items: [['p06', 1]], payment: 'card', status: 'canceled', date: A(3), restored: true,
      restoreLog: '재고 건대추 +1 · 가상 일반결제 25,000원 모의 환불 (1회 처리)',
      history: [H(-2, '11:05', '시민', '주문 접수 (모의 결제)'), H(-2, '11:20', '시민', '수락 전 취소 → 재고·결제 복원 1회')] }),
    mk({ id: 'O-1006', region: 'gyeongsan', sid: 's6', items: [['p13', 1]], payment: 'gyeongsan', status: 'received', date: A(4),
      history: [H(0, '08:15', '시민', '주문 접수 (모의 결제)')] }),
    mk({ id: 'O-1007', region: 'daegu', sid: 's4', items: [['p09', 1]], payment: 'daegu', status: 'received', date: A(1), slot: '14:00–16:00',
      history: [H(0, '09:02', '시민', '주문 접수 (모의 결제)')] }),
    mk({ id: 'O-1008', region: 'daegu', sid: 's6', items: [['p15', 1]], payment: 'card', status: 'received', date: A(4), coupon: 'c1', discount: 3000,
      history: [H(0, '09:40', '시민', '주문 접수 (모의 결제, 쿠폰 첫 장보기 3,000원 사용)')] }),
  ];
  return data;
}

export function freshUi(): UI {
  return {
    region: 'daegu', screen: 'home', prevScreen: 'home', productId: null, filter: 'all', cat: 'all', query: '', bigText: false,
    supplier: 's4', supTab: 'new', ordersTab: 'active', cart: { sid: null, items: [] },
    checkout: { date: null, slot: null, coupon: 'auto', payment: null }, detailQty: '1', detailErr: null, highlight: null,
  };
}

/* ---------- 장바구니·생활권 ---------- */
export const cartCount = (ui: UI) => ui.cart.items.reduce((a, i) => a + i.qty, 0);
export const cartQty = (ui: UI, pid: string) => ui.cart.items.find((i) => i.pid === pid)?.qty ?? 0;
export const unsupportedItems = (ui: UI, region: Region) => ui.cart.items.filter((i) => !prod(i.pid).regions.includes(region));
/** 선택한 생활권의 지역화폐는 같은 지역 판매처 상품에만 쓸 수 있음 */
export function localCurFor(sid: string, region: Region): Region | null {
  const s = seller(sid);
  return s.home && s.home === region ? region : null;
}
export const sellerAvail = (sid: string, region: Region) => PRODUCTS.some((p) => p.sid === sid && p.regions.includes(region));

/* ---------- 쿠폰 ---------- */
export interface CouponEval {
  c: Coupon;
  ok: boolean;
  discount: number;
  why: string;
}
export function evalCoupon(data: Data, c: Coupon, lines: { pid: string; price: number; qty: number }[], type: SType): CouponEval {
  if (c.expires < today()) return { c, ok: false, discount: 0, why: '만료됨 · ' + dlabel(c.expires) + '까지' };
  const used = data.couponUsedBy[c.id];
  if (used) return { c, ok: false, discount: 0, why: '다른 주문(' + used + ')에 사용 중' };
  const t = c.target;
  const elig = lines
    .filter((l) => (t.kind === 'all' ? true : t.kind === 'type' ? type === t.type : t.ids.includes(l.pid)))
    .reduce((a, l) => a + l.price * l.qty, 0);
  if (elig === 0) return { c, ok: false, discount: 0, why: '대상 아님 · ' + c.targetLabel };
  if (elig < c.min) return { c, ok: false, discount: 0, why: '대상 상품 ' + won(c.min) + ' 이상부터 (지금 ' + won(elig) + ')' };
  let d = c.kind === 'amount' ? c.amount! : Math.min(Math.floor((elig * c.rate!) / 100 / 10) * 10, c.max!);
  d = Math.min(d, elig); // 상품할인은 상품합계를 넘지 않음
  return { c, ok: true, discount: d, why: c.targetLabel + ' · ' + dlabel(c.expires) + '까지' };
}

/* ---------- 주문 확인 계산 ---------- */
export interface CLine {
  pid: string;
  p: Product;
  qty: number;
  price: number;
  amount: number;
  stock: number;
  supported: boolean;
}
export interface CheckoutState {
  s: Seller;
  type: SType;
  region: Region;
  lines: CLine[];
  subtotal: number;
  shipping: number;
  evals: CouponEval[];
  rec: CouponEval | null;
  applied: CouponEval | null;
  discount: number;
  total: number;
  couponNote: string | null;
  local: Region | null;
  payOpts: PayKey[];
  pay: PayKey;
  balance: number | null;
  short: boolean;
  dates: string[];
  blockers: string[];
  place: string;
}
export function computeCheckout(data: Data, ui: UI): CheckoutState | null {
  const cart = ui.cart, region = ui.region;
  if (!cart.items.length || !cart.sid) return null;
  const s = seller(cart.sid), type = s.type;
  const lines: CLine[] = cart.items.map((i) => {
    const p = prod(i.pid);
    return { pid: p.id, p, qty: i.qty, price: p.price, amount: p.price * i.qty, stock: data.stock[p.id], supported: p.regions.includes(region) };
  });
  const subtotal = lines.reduce((a, l) => a + l.amount, 0);
  const shipping = shipFee(type, subtotal);
  const evals = data.coupons.map((c) => evalCoupon(data, c, lines, type));
  const usable = evals.filter((e) => e.ok).sort((a, b) => b.discount - a.discount || (a.c.expires < b.c.expires ? -1 : 1));
  const rec = usable[0] || null;
  const ch = ui.checkout.coupon;
  let applied: CouponEval | null = null, couponNote: string | null = null;
  if (ch === 'auto') applied = rec;
  else if (ch !== 'none') {
    applied = usable.find((e) => e.c.id === ch) || null;
    if (!applied) {
      couponNote = '고른 쿠폰을 더 이상 쓸 수 없어 추천 쿠폰으로 바꿨어요.';
      applied = rec;
    }
  }
  const discount = applied ? applied.discount : 0;
  const total = subtotal + shipping - discount;
  const local = localCurFor(cart.sid, region);
  const payOpts: PayKey[] = [...(local ? [local] : []), 'card'];
  let pay = ui.checkout.payment;
  if (!pay || !payOpts.includes(pay)) pay = local || 'card';
  const balance = pay === 'card' ? null : data.wallet[pay];
  const short = balance !== null && balance < total;
  const dates = data.dates[type];
  const blockers: string[] = [];
  const uns = lines.filter((l) => !l.supported);
  if (uns.length) blockers.push(REGIONS[region].name + ' 생활권에서 받을 수 없는 상품 ' + uns.length + '개를 빼야 해요');
  lines.forEach((l) => {
    if (l.stock === 0) blockers.push(l.p.name + ' 품절');
    else if (l.qty > l.stock) blockers.push(l.p.name + ' 재고 ' + l.stock + '개뿐이에요');
  });
  if (!ui.checkout.date || !dates.includes(ui.checkout.date)) blockers.push(type === 'pickup' ? '픽업 날짜를 골라주세요' : '받을 날짜를 골라주세요');
  if (type === 'pickup' && !ui.checkout.slot) blockers.push('픽업 시간대를 골라주세요');
  if (short) blockers.push(PAY[pay] + ' 잔액이 부족해요');
  return { s, type, region, lines, subtotal, shipping, evals, rec, applied, discount, total, couponNote, local, payOpts, pay, balance, short, dates, blockers, place: placeFor(s, region) };
}

/** 추천 순서: 재고 있음 → 선택 생활권 지역화폐 가맹 판매처 → 시장 픽업·산지 직송·꾸러미 */
export function recRank(data: Data, ui: UI, p: Product) {
  const s = seller(p.sid);
  return (data.stock[p.id] === 0 ? 100 : 0) + (localCurFor(s.id, ui.region) ? 0 : 10) + (s.type === 'pickup' ? 0 : s.type === 'farm' ? 1 : 2);
}

/** 취소 복원 — 재고·결제·쿠폰을 한 번만 되돌림. 이미 복원했으면 false */
export function restoreOrder(data: Data, o: Order, by: '시민' | '공급자', how: string): boolean {
  if (o.restored || o.status === 'canceled') return false;
  o.restored = true;
  o.lines.forEach((l) => (data.stock[l.pid] += l.qty));
  const parts = ['재고 ' + o.lines.map((l) => l.name + ' +' + l.qty).join(', ')];
  if (o.payment === 'card') parts.push('가상 일반결제 ' + won(o.total) + ' 모의 환불');
  else {
    data.wallet[o.payment] += o.total;
    parts.push(PAY[o.payment] + ' +' + won(o.total));
  }
  if (o.couponId && data.couponUsedBy[o.couponId] === o.id) {
    data.couponUsedBy[o.couponId] = null;
    parts.push('쿠폰 ' + o.couponName + ' 반환');
  }
  o.restoreLog = parts.join(' · ') + ' (1회 처리)';
  o.status = 'canceled';
  o.history.push({ at: nowStamp(), by, text: how + ' → 재고·결제·쿠폰 복원 1회' });
  return true;
}
