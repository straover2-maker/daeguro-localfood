// 앱 상태(시연 자료 + 화면 상태)와 모든 버튼 동작. localStorage에 저장하고, 안 되면 메모리 모드로 동작.
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { DATA_VERSION, PAY, REGIONS, type Data, type Modal, type Region, type Screen, type SType, type Cat, type UI, type PayKey } from './data';
import { cartQty, computeCheckout, freshUi, nowStamp, prod, restoreOrder, seed, statusLabel, unsupportedItems } from './logic';

const KEY = 'daeguro-localfood-react-v1';
export const storageOK = (() => {
  try {
    localStorage.setItem(KEY + '-t', '1');
    localStorage.removeItem(KEY + '-t');
    return true;
  } catch {
    return false;
  }
})();

export interface AppState {
  data: Data;
  ui: UI;
  modal: Modal | null;
}
export interface Toast {
  msg: string;
  bad?: boolean;
  id: number;
}

function load(): AppState {
  if (storageOK) {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved?.data?.version === DATA_VERSION && saved.ui) return { data: saved.data, ui: { ...freshUi(), ...saved.ui }, modal: null };
      }
    } catch {
      /* 저장 자료가 깨졌으면 새로 시작 */
    }
  }
  return { data: seed(), ui: freshUi(), modal: null };
}

function makeActions(get: () => AppState, commit: (s: AppState) => void, toast: (msg: string, bad?: boolean) => void) {
  const edit = (fn: (s: AppState) => void) => {
    const s = structuredClone(get());
    fn(s);
    commit(s);
  };
  const go = (s: AppState, screen: Screen) => {
    if (screen === 'detail' && s.ui.screen !== 'detail') s.ui.prevScreen = s.ui.screen;
    s.ui.screen = screen;
    s.modal = null;
  };
  const resetCheckout = (u: UI) => {
    u.checkout = { date: null, slot: null, coupon: 'auto', payment: null };
  };
  const findOrder = (s: AppState, id: string) => s.data.orders.find((o) => o.id === id)!;

  function addToCart(pid: string, q: number | null, force: boolean, fromDetail: boolean) {
    const cur = get();
    const p = prod(pid), st = cur.data.stock[pid], r = cur.ui.region;
    const fail = (msg: string) => {
      edit((s) => {
        s.ui.detailErr = fromDetail ? msg : null;
        s.modal = null;
      });
      if (!fromDetail) toast(msg, true);
    };
    if (q === null) return fail('수량은 1 이상의 정수로 입력해 주세요.');
    if (!p.regions.includes(r)) return fail(REGIONS[r].name + ' 생활권에서는 받을 수 없는 상품이에요.');
    if (st === 0) return fail('품절된 상품이에요.');
    const cart = cur.ui.cart;
    const otherSeller = cart.items.length > 0 && cart.sid !== p.sid;
    if (otherSeller && !force) {
      edit((s) => {
        s.ui.detailErr = null;
        s.modal = { kind: 'replaceCart', pid, qty: q, fromDetail };
      });
      return;
    }
    const have = otherSeller ? 0 : cartQty(cur.ui, pid);
    if (have + q > st) return fail('가상 재고는 ' + st + '개예요.' + (have ? ' 이미 ' + have + '개 담겨 있어요.' : ''));
    edit((s) => {
      if (otherSeller) {
        s.ui.cart = { sid: null, items: [] };
        resetCheckout(s.ui);
      }
      if (!s.ui.cart.items.length) {
        s.ui.cart.sid = p.sid;
        resetCheckout(s.ui);
      }
      const ex = s.ui.cart.items.find((i) => i.pid === pid);
      if (ex) ex.qty += q;
      else s.ui.cart.items.push({ pid, qty: q });
      if (fromDetail) s.ui.detailQty = '1';
      s.ui.detailErr = null;
      s.modal = null;
    });
    toast(p.name + ' ' + q + '개를 담았어요');
  }

  return {
    nav: (screen: Screen) => edit((s) => go(s, screen)),
    back: () => edit((s) => go(s, s.ui.prevScreen === 'detail' ? 'home' : s.ui.prevScreen)),
    role: (to: 'citizen' | 'supplier') => edit((s) => go(s, to === 'supplier' ? 'supplier' : 'home')),
    sheet: (kind: 'region' | 'menu') => edit((s) => void (s.modal = { kind })),
    close: () => edit((s) => void (s.modal = null)),
    toggleBig: () => edit((s) => void (s.ui.bigText = !s.ui.bigText)),
    askReset: () => edit((s) => void (s.modal = { kind: 'reset' })),
    doReset: () => {
      const big = get().ui.bigText;
      commit({ data: seed(), ui: { ...freshUi(), bigText: big }, modal: null });
      toast('시연 초기값으로 돌렸어요');
    },
    setRegion: (r: Region) => {
      const cur = get();
      if (cur.ui.region === r) return edit((s) => void (s.modal = null));
      edit((s) => {
        s.ui.region = r;
        s.modal = null;
      });
      const n = unsupportedItems(cur.ui, r).length;
      toast(REGIONS[r].name + ' 생활권으로 바꿨어요' + (n ? ' · 받을 수 없는 상품 ' + n + '개' : ''), n > 0);
    },
    setFilter: (f: 'all' | SType, toggle: boolean) => {
      edit((s) => void (s.ui.filter = toggle && s.ui.filter === f ? 'all' : f));
      if (toggle && f !== 'all') requestAnimationFrame(() => document.getElementById('rec')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    },
    setCat: (c: 'all' | Cat) => edit((s) => void (s.ui.cat = c)),
    setQuery: (q: string) => edit((s) => void (s.ui.query = q)),
    clearFilters: () => edit((s) => Object.assign(s.ui, { filter: 'all', cat: 'all', query: '' })),
    openProduct: (pid: string) =>
      edit((s) => {
        s.ui.productId = pid;
        s.ui.detailQty = '1';
        s.ui.detailErr = null;
        go(s, 'detail');
      }),
    setDetailQty: (v: string) => edit((s) => void (s.ui.detailQty = v)),
    stepDetailQty: (d: number) =>
      edit((s) => {
        const q = Math.max(1, (Number.parseInt(s.ui.detailQty, 10) || 1) + d);
        s.ui.detailQty = String(q);
        s.ui.detailErr = null;
      }),
    addCart: (pid: string, q: number | null) => addToCart(pid, q, false, true),
    quickAdd: (pid: string) => addToCart(pid, 1, false, false),
    replaceCart: () => {
      const m = get().modal;
      if (m?.kind === 'replaceCart') addToCart(m.pid, m.qty, true, m.fromDetail);
    },
    cartStep: (pid: string, d: number) => {
      const cur = get();
      const it = cur.ui.cart.items.find((i) => i.pid === pid);
      if (!it) return;
      const n = it.qty + d;
      if (n < 1) {
        edit((s) => {
          s.ui.cart.items = s.ui.cart.items.filter((i) => i.pid !== pid);
          if (!s.ui.cart.items.length) {
            s.ui.cart.sid = null;
            resetCheckout(s.ui);
          }
        });
        return toast(prod(pid).name + '을(를) 뺐어요');
      }
      if (n > cur.data.stock[pid]) return toast('가상 재고는 ' + cur.data.stock[pid] + '개예요', true);
      edit((s) => void (s.ui.cart.items.find((i) => i.pid === pid)!.qty = n));
    },
    askRemoveUnsupported: () => edit((s) => void (s.modal = { kind: 'removeUnsupported' })),
    removeUnsupported: () => {
      const n = unsupportedItems(get().ui, get().ui.region).length;
      edit((s) => {
        s.ui.cart.items = s.ui.cart.items.filter((i) => prod(i.pid).regions.includes(s.ui.region));
        if (!s.ui.cart.items.length) {
          s.ui.cart.sid = null;
          resetCheckout(s.ui);
        }
        s.modal = null;
      });
      toast('받을 수 없는 상품 ' + n + '개를 뺐어요');
    },
    setCheckout: (k: 'date' | 'slot' | 'coupon' | 'payment', v: string) => edit((s) => void ((s.ui.checkout as Record<string, unknown>)[k] = v as PayKey)),
    payCard: () => {
      edit((s) => void (s.ui.checkout.payment = 'card'));
      toast('가상 일반결제로 바꿨어요');
    },
    openConfirm: () => {
      const c = computeCheckout(get().data, get().ui);
      if (c && !c.blockers.length) edit((s) => void (s.modal = { kind: 'confirm' }));
    },
    placeOrder: () => {
      const cur = get();
      const c = computeCheckout(cur.data, cur.ui);
      if (!c || c.blockers.length) {
        edit((s) => void (s.modal = null));
        return toast('주문 조건이 바뀌었어요. 표시된 항목을 확인해 주세요.', true);
      }
      let id = '';
      edit((s) => {
        if (c.pay !== 'card') s.data.wallet[c.pay] -= c.total;
        c.lines.forEach((l) => (s.data.stock[l.pid] -= l.qty));
        s.data.seq += 1;
        id = 'O-' + s.data.seq;
        if (c.applied) s.data.couponUsedBy[c.applied.c.id] = id;
        const at = nowStamp();
        s.data.orders.push({
          id, region: c.region, sid: c.s.id, type: c.type,
          lines: c.lines.map((l) => ({ pid: l.pid, name: l.p.name, spec: l.p.spec, qty: l.qty, price: l.price })),
          subtotal: c.subtotal, shipping: c.shipping, couponId: c.applied ? c.applied.c.id : null, couponName: c.applied ? c.applied.c.name : null,
          discount: c.discount, total: c.total, payment: c.pay,
          receive: { date: s.ui.checkout.date!, slot: c.type === 'pickup' ? s.ui.checkout.slot : null, place: c.place },
          status: 'received', createdAt: at, restored: false, restoreLog: null,
          history: [{ at, by: '시민', text: '주문 접수 (모의 결제' + (c.applied ? ', 쿠폰 ' + c.applied.c.name + ' 사용' : '') + ')' }],
        });
        s.ui.cart = { sid: null, items: [] };
        resetCheckout(s.ui);
        s.ui.highlight = id;
        s.ui.ordersTab = 'active';
        go(s, 'orders');
      });
      toast(id + ' 모의 주문을 접수했어요');
    },
    ordersTab: (t: 'active' | 'past') => edit((s) => void (s.ui.ordersTab = t)),
    pass: (id: string) => edit((s) => void (s.modal = { kind: 'pass', id })),
    askCancel: (id: string) => {
      if (findOrder(get(), id).status !== 'received') return toast('이미 처리된 주문이에요', true);
      edit((s) => void (s.modal = { kind: 'cancel', id }));
    },
    doCancel: (id: string) => {
      const o = findOrder(get(), id);
      if (o.status !== 'received' && o.status !== 'canceled') {
        edit((s) => void (s.modal = null));
        return toast('판매처가 이미 수락해 바로 취소할 수 없어요', true);
      }
      let ok = false;
      edit((s) => {
        ok = restoreOrder(s.data, findOrder(s, id), '시민', '수락 전 취소');
        s.modal = null;
      });
      toast(ok ? id + ' 주문을 취소하고 복원했어요' : '이미 취소된 주문이에요. 재고·잔액·쿠폰은 다시 복원하지 않아요.', !ok);
    },
    askInquiry: (id: string) => edit((s) => void (s.modal = { kind: 'inquiry', id })),
    doInquiry: (id: string) => {
      if (findOrder(get(), id).status !== 'preparing') {
        edit((s) => void (s.modal = null));
        return toast('지금 상태에서는 문의를 남길 수 없어요', true);
      }
      edit((s) => {
        const o = findOrder(s, id);
        o.status = 'inquiry';
        o.history.push({ at: nowStamp(), by: '시민', text: '준비 중 취소 요청 → 문의 접수' });
        s.modal = null;
      });
      toast('취소 문의를 남겼어요');
    },
    setSupplier: (sid: string) => edit((s) => void (s.ui.supplier = sid)),
    supTab: (t: 'new' | 'doing' | 'closed') => edit((s) => void (s.ui.supTab = t)),
    advance: (id: string, from: 'received' | 'preparing' | 'ready') => {
      const o = findOrder(get(), id);
      if (o.status !== from) return toast('이미 처리된 단계예요', true);
      const next = ({ received: 'preparing', preparing: 'ready', ready: 'done' } as const)[from];
      edit((s) => {
        const so = findOrder(s, id);
        so.status = next;
        so.history.push({ at: nowStamp(), by: '공급자', text: statusLabel(from, so.type) + ' → ' + statusLabel(next, so.type) });
      });
      toast(id + ' → ' + statusLabel(next, o.type) + ' · ' + (next === 'done' ? '완료·취소' : '진행 중') + ' 탭으로 옮겼어요');
    },
    approveCancel: (id: string) => {
      if (findOrder(get(), id).status !== 'inquiry') return toast('이미 처리된 문의예요', true);
      edit((s) => void restoreOrder(s.data, findOrder(s, id), '공급자', '취소 문의 승인'));
      toast(id + ' 취소를 승인하고 복원했어요');
    },
    resume: (id: string) => {
      if (findOrder(get(), id).status !== 'inquiry') return;
      edit((s) => {
        const o = findOrder(s, id);
        o.status = 'preparing';
        o.history.push({ at: nowStamp(), by: '공급자', text: '취소 문의 확인 → 준비 계속' });
      });
      toast('준비를 계속해요');
    },
    stock: (pid: string, d: number) => {
      if (get().data.stock[pid] + d < 0) return;
      edit((s) => void (s.data.stock[pid] += d));
    },
    soldOut: (pid: string) => {
      edit((s) => void (s.data.stock[pid] = 0));
      toast(prod(pid).name + ' 품절 처리');
    },
  };
}
export type Actions = ReturnType<typeof makeActions>;

interface Ctx {
  s: AppState;
  A: Actions;
  toast: Toast | null;
}
const StoreCtx = createContext<Ctx | null>(null);
export const useStore = () => useContext(StoreCtx)!;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<AppState>(load);
  const ref = useRef(s);
  const [toast, setToast] = useState<Toast | null>(null);

  const A = useMemo(
    () =>
      makeActions(
        () => ref.current,
        (next) => {
          ref.current = next;
          setS(next);
        },
        (msg, bad) => setToast({ msg, bad, id: Date.now() }),
      ),
    [],
  );

  useEffect(() => {
    if (!storageOK) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ data: s.data, ui: s.ui }));
    } catch {
      /* 저장 실패는 무시하고 메모리로 계속 */
    }
  }, [s.data, s.ui]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    document.documentElement.classList.toggle('big', s.ui.bigText);
  }, [s.ui.bigText]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [s.ui.screen]);

  // 시연·점검용 (브라우저 콘솔에서 window.__demo 로 상태 확인)
  (window as unknown as { __demo: unknown }).__demo = { get: () => ref.current, A };

  return <StoreCtx.Provider value={{ s, A, toast }}>{children}</StoreCtx.Provider>;
}

export { PAY };
