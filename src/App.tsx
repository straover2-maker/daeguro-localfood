// 앱 뼈대: 헤더(로고·생활권 토글·하단 탭), 화면 전환, 시트(확인 창), 알림
import { useEffect, useRef, type ReactNode } from 'react';
import { Ico, type IconName } from './art';
import { PAY, PRODUCTS, REGIONS, REGION_KEYS, SELLERS, TYPES, type Screen } from './data';
import { cartCount, computeCheckout, dlabel, prod, seller, unsupportedItems, won } from './logic';
import { Checkout, Detail, Dock, Home, Orders, Stores, Supplier } from './screens';
import { StoreProvider, storageOK, useStore } from './store';

function Header() {
  const { s, A } = useStore();
  const { ui } = s;
  const sup = ui.screen === 'supplier';
  const cur = ui.screen === 'detail' ? 'home' : ui.screen;
  const n = cartCount(ui);
  const tabs: [Screen, string, IconName][] = [
    ['home', '홈', 'home'],
    ['stores', '가게', 'store'],
    ['checkout', '장바구니', 'bag'],
    ['orders', '주문내역', 'receipt'],
    ['supplier', '공급자', 'box'],
  ];
  return (
    <header className="hd">
      <div className="wrap">
        <div className="hd-row">
          <button className="brandmark" aria-label="대구로 홈" onClick={() => A.nav('home')}>
            <span className="wordmark">대구로</span>
            <small>로컬푸드</small>
          </button>
          <div className="hd-right">
            {!sup && (
              <div className="rseg" role="group" aria-label="생활권">
                <span className="pin"><Ico n="pin" /></span>
                {REGION_KEYS.map((k) => (
                  <button key={k} data-act="setRegion" data-v={k} aria-pressed={ui.region === k} onClick={() => A.setRegion(k)}>{REGIONS[k].name}</button>
                ))}
              </div>
            )}
            <button className="icon-btn" aria-pressed={ui.bigText} aria-label="큰글씨 모드" title="큰글씨" onClick={A.toggleBig}>가</button>
            <button className="icon-btn" aria-label="메뉴" data-act="menu" onClick={() => A.sheet('menu')}><Ico n="more" /></button>
          </div>
        </div>
        <nav className="tabs" aria-label="화면">
          {tabs.map(([k, label, icon]) => (
            <button key={k} data-act="nav" data-v={k} aria-current={cur === k ? 'page' : undefined} onClick={() => A.nav(k)}>
              <span className="ib"><Ico n={icon} /></span>
              <span>{label}</span>
              {k === 'checkout' && n > 0 && <span className="badge">{n}</span>}
            </button>
          ))}
        </nav>
      </div>
      {storageOK ? (
        <div className="demo-line"><div className="wrap"><span className="dot" />시연용 · 가게·가격·잔액은 모두 가상이고 결제는 모의 처리돼요</div></div>
      ) : (
        <div className="demo-line mem"><div className="wrap">메모리 모드 · 이 브라우저에 저장할 수 없어 새로고침하면 처음 상태로 돌아가요</div></div>
      )}
      {sup && (
        <div className="rolebar">
          <div className="wrap">
            <span>공급자 모드 · 같은 브라우저에서 역할만 바꾼 시연이에요</span>
            <button data-act="toCitizen" onClick={() => A.role('citizen')}>시민 화면으로</button>
          </div>
        </div>
      )}
    </header>
  );
}

function Sheet({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  const { A } = useStore();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const btns = ref.current?.querySelectorAll<HTMLButtonElement>('.acts .btn');
    btns?.[btns.length - 1]?.focus({ preventScroll: true });
  }, [title]);
  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="sh-t" ref={ref}>
      <h2 id="sh-t">{title}</h2>
      {children}
      <div className="acts">{actions ?? <button className="btn ghost" onClick={A.close}>닫기</button>}</div>
    </div>
  );
}

function Modals() {
  const { s, A } = useStore();
  const m = s.modal;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && A.close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [A]);
  if (!m) return null;
  let body: ReactNode = null;
  if (m.kind === 'region') {
    body = (
      <Sheet title="생활권과 지역화폐">
        <div className="rg">
          {REGION_KEYS.map((k) => {
            const x = REGIONS[k];
            return (
              <button key={k} aria-pressed={s.ui.region === k} onClick={() => A.setRegion(k)}>
                <span><b>{x.name} 생활권</b><small>{x.note}</small></span>
                <span className="bal"><small>{x.cur}</small>{won(s.data.wallet[k])}</span>
              </button>
            );
          })}
        </div>
        <p className="small">지역화폐는 고른 생활권의 화폐만, 같은 지역 판매처 상품에만 쓸 수 있어요. 두 지역 잔액은 따로 관리하고 합산하지 않아요.</p>
        <details className="fold" style={{ padding: 0, background: 'transparent' }}>
          <summary>생활권은 이렇게 이어져요</summary>
          <p className="sub" style={{ margin: '8px 0' }}>산지 직송은 두 생활권 모두에 보내고, 시장 픽업은 점포가 있는 생활권에서만 받아요. 생활권을 넓히면 이 표에 칸이 늘어나요.</p>
          <div className="tbl">
            <table>
              <thead><tr><th>판매처 (가상)</th><th className="c">대구</th><th className="c">경산</th><th>지역화폐</th></tr></thead>
              <tbody>
                {SELLERS.map((sl) => {
                  const ps = PRODUCTS.filter((p) => p.sid === sl.id);
                  const cell = (k: 'daegu' | 'gyeongsan') => {
                    const n = ps.filter((p) => p.regions.includes(k)).length;
                    return n === ps.length ? <span className="yes">전체</span> : n ? <span className="yes">{n}/{ps.length}</span> : '—';
                  };
                  return <tr key={sl.id}><td>{sl.name}</td><td className="c">{cell('daegu')}</td><td className="c">{cell('gyeongsan')}</td><td>{sl.home ? REGIONS[sl.home].name : '없음'}</td></tr>;
                })}
              </tbody>
            </table>
          </div>
        </details>
      </Sheet>
    );
  } else if (m.kind === 'menu') {
    const sup = s.ui.screen === 'supplier';
    body = (
      <Sheet title="설정">
        <div className="menu-list">
          <button onClick={A.toggleBig}><span>큰글씨 모드</span><span className={'switch' + (s.ui.bigText ? ' on' : '')} /></button>
          <button onClick={() => A.role(sup ? 'citizen' : 'supplier')}><span>{sup ? '시민 화면으로 전환' : '공급자 화면으로 전환'}</span><Ico n="right" /></button>
          <button data-act="askReset" onClick={A.askReset}><span>데모 초기화</span><Ico n="right" /></button>
        </div>
        <p className="small">이 앱은 시연용이에요. 가게·사람·가격·쿠폰·잔액은 모두 가상이고, 결제와 충전은 모의 처리돼요. 개인정보는 받지 않아요. 시민·공급자 전환은 같은 브라우저 안의 시연이에요.</p>
      </Sheet>
    );
  } else if (m.kind === 'replaceCart') {
    const cs = s.ui.cart.sid ? seller(s.ui.cart.sid) : null, p = prod(m.pid);
    body = (
      <Sheet title="장바구니를 비울까요?" actions={<><button className="btn ghost" onClick={A.close}>그대로 두기</button><button className="btn" data-act="replaceCart" onClick={A.replaceCart}>비우고 담기</button></>}>
        <p>한 주문은 한 가게, 한 수령 방식만 담을 수 있어요. <b>{p.name}</b>을(를) 담으려면 <b>{cs?.name}</b> 상품을 비워야 해요.</p>
      </Sheet>
    );
  } else if (m.kind === 'removeUnsupported') {
    const uns = unsupportedItems(s.ui, s.ui.region);
    body = (
      <Sheet title="받을 수 없는 상품을 뺄까요?" actions={<><button className="btn ghost" onClick={A.close}>취소</button><button className="btn danger" onClick={A.removeUnsupported}>빼기</button></>}>
        <p>{uns.map((i) => prod(i.pid).name + ' × ' + i.qty).join(', ')}</p>
      </Sheet>
    );
  } else if (m.kind === 'confirm') {
    const c = computeCheckout(s.data, s.ui);
    if (!c) return null;
    body = (
      <Sheet title="주문 내용을 확인해 주세요" actions={<><button className="btn ghost" onClick={A.close}>돌아가기</button><button className="btn" data-act="placeOrder" onClick={A.placeOrder}>모의 주문 확정</button></>}>
        <div className="receipt">
          <div className="rh"><b>{c.s.name}</b><span>시연용 · 실제 결제 없음</span></div>
          <dl>
            <div><dt>상품</dt><dd>{c.lines.map((l) => <div key={l.pid}>{l.p.name} × {l.qty} · {won(l.amount)}</div>)}</dd></div>
            <div><dt>수령</dt><dd>{TYPES[c.type].label} · {REGIONS[c.region].name} 생활권</dd></div>
            <div><dt>위치</dt><dd>{c.place}</dd></div>
            <div><dt>날짜</dt><dd>{dlabel(s.ui.checkout.date!)}{c.type === 'pickup' ? ' ' + s.ui.checkout.slot : ''}</dd></div>
            <div><dt>쿠폰</dt><dd>{c.applied ? c.applied.c.name + ' −' + won(c.discount) : '없음'}</dd></div>
            <div><dt>결제</dt><dd>{PAY[c.pay]}{c.balance !== null && <><br /><span className="sub">잔액 {won(c.balance)} → {won(c.balance - c.total)}</span></>}</dd></div>
            <div><dt>계산</dt><dd>{won(c.subtotal)} + 배송비 {won(c.shipping)} − 쿠폰 {won(c.discount)}</dd></div>
          </dl>
          <div className="rt"><span>결제할 금액</span><b>{won(c.total)}</b></div>
        </div>
      </Sheet>
    );
  } else if (m.kind === 'cancel') {
    const o = s.data.orders.find((x) => x.id === m.id)!;
    body = (
      <Sheet title={o.id + ' 주문을 취소할까요?'} actions={<><button className="btn ghost" onClick={A.close}>유지하기</button><button className="btn danger" data-act="doCancel" onClick={() => A.doCancel(o.id)}>주문 취소</button></>}>
        <p>아직 판매처가 수락하지 않아 바로 취소돼요. 아래 항목은 <b>한 번만</b> 복원돼요.</p>
        <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
          <li>재고 {o.lines.map((l) => l.name + ' +' + l.qty).join(', ')}</li>
          <li>{o.payment === 'card' ? '가상 일반결제 ' + won(o.total) + ' 모의 환불' : PAY[o.payment] + ' +' + won(o.total)}</li>
          {o.couponId && <li>쿠폰 반환 · {o.couponName}</li>}
        </ul>
      </Sheet>
    );
  } else if (m.kind === 'inquiry') {
    body = (
      <Sheet title="취소 문의를 남길까요?" actions={<><button className="btn ghost" onClick={A.close}>그만두기</button><button className="btn teal" data-act="doInquiry" onClick={() => A.doInquiry(m.id)}>문의 남기기</button></>}>
        <p>{m.id} 주문은 판매처가 준비를 시작해서 바로 취소할 수 없어요. 문의를 남기면 ‘문의 접수’ 상태가 되고, 판매처가 승인할 때 재고·잔액·쿠폰이 복원돼요.</p>
      </Sheet>
    );
  } else if (m.kind === 'pass') {
    const o = s.data.orders.find((x) => x.id === m.id)!;
    body = (
      <Sheet title="픽업 화면">
        <div className="pass">
          <span className="sub">점포에 이 화면을 보여주세요</span>
          <span className="no">{o.id.replace('O-', '')}</span>
          <b>{seller(o.sid).name}</b>
          <span className="small">{dlabel(o.receive.date)} {o.receive.slot}</span>
          <span className="small">{o.receive.place}</span>
        </div>
        <div className="receipt"><dl>{o.lines.map((l) => <div key={l.pid}><dt>× {l.qty}</dt><dd>{l.name}</dd></div>)}</dl></div>
        <p className="sub">시연 안내예요. 픽업 완료는 공급자 화면에서 처리해요.</p>
      </Sheet>
    );
  } else if (m.kind === 'reset') {
    body = (
      <Sheet title="데모를 처음 상태로 돌릴까요?" actions={<><button className="btn ghost" onClick={A.close}>취소</button><button className="btn danger" data-act="doReset" onClick={A.doReset}>초기화</button></>}>
        <p>새로 만든 주문과 바뀐 재고·잔액·쿠폰, 장바구니가 모두 시연 초기값으로 돌아가요.</p>
      </Sheet>
    );
  }
  return (
    <div id="modal" onClick={(e) => e.target === e.currentTarget && A.close()}>
      {body}
    </div>
  );
}

function ToastView() {
  const { toast } = useStore();
  return <div id="toast" aria-live="polite">{toast && <div key={toast.id} className={'toast' + (toast.bad ? ' bad' : '')}>{toast.msg}</div>}</div>;
}

function Shell() {
  const { s } = useStore();
  const sc = s.ui.screen;
  return (
    <>
      <Header />
      <main className="wrap main" id="main">
        {sc === 'detail' ? <Detail /> : sc === 'stores' ? <Stores /> : sc === 'checkout' ? <Checkout /> : sc === 'orders' ? <Orders /> : sc === 'supplier' ? <Supplier /> : <Home />}
      </main>
      <Dock />
      <Modals />
      <ToastView />
    </>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
