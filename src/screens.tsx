// 화면: 홈, 가게, 상품 상세, 장바구니(주문 확인), 주문내역, 공급자 관리 + 화면 아래 고정 막대
import type { ReactNode } from 'react';
import { Art, ArtSvg, HeroArt, Ico } from './art';
import { CATS, PAY, PRODUCTS, REGIONS, REGION_KEYS, SELLERS, SLOTS, TYPES, type Order, type Product, type Seller, type SType } from './data';
import {
  cartCount, cartQty, computeCheckout, dlabel, dshort, isActive, localCurFor, parseQty, prod, recRank, sellerAvail, seller,
  shipText, stampLabel, statusLabel, statusMsg, statusTone, unsupportedItems, wd, won,
} from './logic';
import { useStore } from './store';

const STEPS = ['received', 'preparing', 'ready', 'done'] as const;
const stepIndex = (o: Order) => (o.status === 'inquiry' ? 1 : STEPS.indexOf(o.status as (typeof STEPS)[number]));

/* ---------- 공통 조각 ---------- */
export function RegionNotice() {
  const { s, A } = useStore();
  const uns = unsupportedItems(s.ui, s.ui.region);
  if (!uns.length) return null;
  const r = REGIONS[s.ui.region], other = s.ui.region === 'daegu' ? 'gyeongsan' : 'daegu';
  return (
    <div className="alert warn" role="status">
      <b>{r.name} 생활권에서는 장바구니 상품 {uns.length}개를 받을 수 없어요</b>
      <ul>
        {uns.map((i) => {
          const p = prod(i.pid);
          return <li key={i.pid}>{p.name} — {p.regions.map((x) => REGIONS[x].name).join('·')} 생활권 전용</li>;
        })}
      </ul>
      <span className="small">장바구니에서 지우지 않았어요. 생활권을 되돌리거나 직접 빼 주세요.</span>
      <div className="row">
        <button className="btn sm ghost" onClick={() => A.setRegion(other)}>{REGIONS[other].name}으로 되돌리기</button>
        <button className="btn sm danger" onClick={A.askRemoveUnsupported}>받을 수 없는 상품 빼기</button>
      </div>
    </div>
  );
}

function AddCtl({ p }: { p: Product }) {
  const { s, A } = useStore();
  const q = cartQty(s.ui, p.id);
  if (s.data.stock[p.id] === 0) return null;
  if (q)
    return (
      <div className="stepper">
        <button aria-label={p.name + ' 하나 빼기'} onClick={() => A.cartStep(p.id, -1)}><Ico n="minus" /></button>
        <span>{q}</span>
        <button aria-label={p.name + ' 하나 더'} onClick={() => A.cartStep(p.id, 1)}><Ico n="plus" /></button>
      </div>
    );
  return <button className="addbtn" data-act="quickAdd" data-v={p.id} aria-label={p.name + ' 담기'} onClick={() => A.quickAdd(p.id)}><Ico n="plus" /></button>;
}

function ProductRow({ p }: { p: Product }) {
  const { s, A } = useStore();
  const sl = seller(p.sid), st = s.data.stock[p.id];
  return (
    <div className={'pr' + (st === 0 ? ' out' : '')}>
      <button className="pr-hit" data-act="openProduct" data-v={p.id} onClick={() => A.openProduct(p.id)}>
        <Art k={p.art} type={sl.type} />
        <span className="t">
          <b>{p.name}</b>
          <span className="sp">{sl.name} · {p.spec}</span>
          <span className="chips">
            <span className="chip teal">{TYPES[sl.type].label}</span>
            {st === 0 ? <span className="chip bad">품절</span> : st <= 3 ? <span className="chip orange">{st}개 남음</span> : null}
            {localCurFor(sl.id, s.ui.region) && <span className="chip">지역화폐</span>}
          </span>
        </span>
      </button>
      <div className="pr-r">
        <span className="price">{won(p.price)}</span>
        <AddCtl p={p} />
      </div>
    </div>
  );
}

function ProductCard({ p }: { p: Product }) {
  const { s, A } = useStore();
  const st = s.data.stock[p.id], sl = seller(p.sid);
  return (
    <article className={'pc' + (st === 0 ? ' out' : '')}>
      <button className="pc-hit" data-act="openProduct" data-v={p.id} onClick={() => A.openProduct(p.id)}>
        <span className={'art t-' + sl.type}>
          <ArtSvg k={p.art} />
          {st === 0 ? <span className="chip bad flag">품절</span> : st <= 3 ? <span className="chip orange flag">{st}개 남음</span> : null}
        </span>
        <span className="pc-name">{p.name}</span>
        <span className="pc-price">{won(p.price)}</span>
      </button>
      <AddCtl p={p} />
    </article>
  );
}

function Prog({ o }: { o: Order }) {
  const at = stepIndex(o);
  return (
    <ol className="prog">
      {STEPS.map((st, i) => (
        <li key={st} className={(i <= at ? 'on' : '') + (i === at ? ' now' : '')}>{statusLabel(st, o.type)}</li>
      ))}
    </ol>
  );
}

function DetailsBlock({ o }: { o: Order }) {
  return (
    <details className="more">
      <summary>주문 상세 · 변경 이력 {o.history.length}건<Ico n="right" /></summary>
      <div className="in">
        <dl className="calc" style={{ fontSize: '.8125rem' }}>
          {o.lines.map((l) => [<dt key={l.pid + 't'}>{l.name} × {l.qty}</dt>, <dd key={l.pid + 'd'}>{won(l.price * l.qty)}</dd>])}
          <dt>배송비</dt><dd>{won(o.shipping)}</dd>
          <dt>쿠폰{o.couponName ? ' (' + o.couponName + ')' : ''}</dt><dd className="sale">−{won(o.discount)}</dd>
          <dt>결제수단</dt><dd>{PAY[o.payment]}</dd>
          <dt className="tot">결제 금액</dt><dd className="tot">{won(o.total)}</dd>
        </dl>
        <div className="sub">{o.type === 'pickup' ? '픽업' : '수령'} {dlabel(o.receive.date)}{o.receive.slot ? ' ' + o.receive.slot : ''} · {o.receive.place}</div>
        {o.restoreLog && <div className="alert ok"><span><b>복원 기록</b> · {o.restoreLog}</span></div>}
        <ol>{o.history.map((h, i) => <li key={i}>{stampLabel(h.at)} · {h.by} · {h.text}</li>)}</ol>
      </div>
    </details>
  );
}

/* ---------- 홈 ---------- */
function LiveCard() {
  const { s, A } = useStore();
  const act = s.data.orders.filter(isActive).slice().reverse();
  if (!act.length) return null;
  const o = act[0], sl = seller(o.sid), at = stepIndex(o);
  return (
    <button className="live" onClick={() => A.nav('orders')}>
      <Art k={sl.art} type={sl.type} />
      <span className="t">
        <small>진행 중인 주문{act.length > 1 ? ' ' + act.length + '건' : ''} · {sl.name}</small>
        <b>{statusMsg(o)}</b>
        <span className="bar">{STEPS.map((x, i) => <i key={x} className={i <= at ? 'on' : ''} />)}</span>
      </span>
      <Ico n="right" />
    </button>
  );
}

function RecList() {
  const { s, A } = useStore();
  const { data, ui } = s;
  const r = ui.region, q = ui.query.trim().toLowerCase();
  const list = PRODUCTS.map((p, i) => ({ p, i }))
    .filter(({ p }) => {
      const sl = seller(p.sid);
      return p.regions.includes(r) && (ui.filter === 'all' || sl.type === ui.filter) && (ui.cat === 'all' || p.cat === ui.cat) &&
        (!q || (p.name + p.spec + sl.name + sl.origin).toLowerCase().includes(q));
    })
    .sort((a, b) => recRank(data, ui, a.p) * 100 + a.i - (recRank(data, ui, b.p) * 100 + b.i))
    .map(({ p }) => p);
  const hidden = PRODUCTS.filter((p) => !p.regions.includes(r)).length;
  return (
    <>
      {list.length ? (
        <div className="rlist">{list.map((p) => <ProductRow key={p.id} p={p} />)}</div>
      ) : (
        <div className="empty">
          <p className="muted">조건에 맞는 상품이 {REGIONS[r].name} 생활권에 없어요.</p>
          <button className="btn sm ghost" onClick={A.clearFilters}>조건 지우기</button>
        </div>
      )}
      <p className="rule">추천 순서: 재고 있음 → {REGIONS[r].name} 지역화폐 가맹 판매처 → 시장 픽업·산지 직송·꾸러미 순. 다른 생활권 전용 상품 {hidden}개는 숨겼어요.</p>
    </>
  );
}

export function Home() {
  const { s, A } = useStore();
  const { data, ui } = s;
  const R = REGIONS[ui.region], f = ui.filter;
  const hero = (t: SType, title: string, d: ReactNode) => (
    <button className={'hero t-' + t + (t === 'box' ? ' wide' : '')} aria-pressed={f === t} onClick={() => A.setFilter(t, true)}>
      {t === 'box' ? (
        <span className="tx"><b>{title}<Ico n="right" /></b><span className="d">{d}</span></span>
      ) : (
        <><b>{title}<Ico n="right" /></b><span className="d">{d}</span></>
      )}
      <HeroArt kind={t} />
    </button>
  );
  return (
    <>
      <LiveCard />
      <RegionNotice />
      <label className="search">
        <Ico n="search" />
        <span className="sr">상품 검색</span>
        <input id="q" type="search" placeholder="사과, 반찬, 두부, 농가 이름 검색" value={ui.query} onChange={(e) => A.setQuery(e.target.value)} />
      </label>
      <div className="heroes">
        {hero('farm', '산지 직송', <>농가에서<br />바로 받아요</>)}
        {hero('pickup', '시장 픽업', <>동네 시장에서<br />찾아가요</>)}
        {hero('box', '정기 꾸러미', '이번 회차 1회만 주문 · 자동 정기결제 없음')}
      </div>
      <button className="walletline" onClick={() => A.sheet('region')}>
        <span className="wl"><small>{R.cur} · {R.name} 판매처에서 사용</small><b>{won(data.wallet[ui.region])}</b></span>
        <Ico n="right" />
      </button>
      <div className="cats" role="group" aria-label="카테고리">
        {CATS.map(([k, l]) => <button key={k} aria-pressed={ui.cat === k} onClick={() => A.setCat(k)}>{l}</button>)}
      </div>
      <section id="rec" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="sec-h">
          <h2>지금, <em>{R.name}</em>의 {f === 'all' ? '' : TYPES[f].label + ' '}장보기 추천</h2>
          {f !== 'all' && <button className="link" onClick={() => A.setFilter('all', false)}>전체 보기</button>}
        </div>
        <RecList />
      </section>
      <details className="fold">
        <summary>시연 순서 (완료 기준)</summary>
        <ol>
          <li><b>시장 반찬 픽업</b> · 반찬 3종 세트 담기 → 장바구니에서 날짜·시간 선택 → 주문 → 공급자 탭에서 수락·준비 완료 → 주문내역에 픽업 안내</li>
          <li><b>생활권 변경</b> · 반찬을 담은 채 위쪽에서 경산으로 바꾸면 안내가 뜨고 장바구니는 그대로 남아요</li>
          <li><b>품절</b> · 사과즙은 품절이에요. 공급자 탭에서 다른 상품도 품절 처리할 수 있어요</li>
          <li><b>잔액 부족</b> · 대구에서 부사 사과(배송비 포함 27,000원)를 지역화폐로 결제하면 주문이 멈춰요</li>
          <li><b>주문 취소</b> · 접수 상태 취소는 재고·잔액·쿠폰을 한 번만 복원, 준비 중이면 문의 접수로 남아요</li>
        </ol>
      </details>
      <p className="foot">실제 사이소·지역화폐 발행사 API, 합포장 물류, 지자체 위탁·바우처 정산, B2B 식권·모빌리티는 후속 연계 단계예요. 바우처 수혜 자격이나 정부 인증은 만들지 않아요.</p>
    </>
  );
}

/* ---------- 가게 둘러보기 ---------- */
function StoreSection({ sl }: { sl: Seller }) {
  const { s } = useStore();
  const r = s.ui.region;
  const ps = PRODUCTS.filter((p) => p.sid === sl.id && p.regions.includes(r));
  const first = s.data.dates[sl.type][0];
  return (
    <section className="store">
      <div className="store-head">
        <Art k={sl.art} type={sl.type} />
        <div className="t">
          <b>{sl.name}</b>
          <span className="m">{TYPES[sl.type].label} · {sl.origin}</span>
          <div className="chips">
            <span className="chip teal"><Ico n={sl.type === 'pickup' ? 'clock' : 'truck'} />{dshort(first)}({wd(first)})부터 {sl.type === 'pickup' ? '픽업' : '도착'}</span>
            <span className="chip">{shipText(sl.type)}</span>
            {localCurFor(sl.id, r) && <span className="chip orange">지역화폐</span>}
          </div>
        </div>
      </div>
      <div className="hscroll">{ps.map((p) => <ProductCard key={p.id} p={p} />)}</div>
    </section>
  );
}

export function Stores() {
  const { s, A } = useStore();
  const { data, ui } = s;
  const r = ui.region, f = ui.filter;
  const stores = SELLERS.filter((x) => sellerAvail(x.id, r) && (f === 'all' || x.type === f));
  const reorder: Product[] = [];
  data.orders.filter((o) => o.status === 'done').forEach((o) => o.lines.forEach((l) => {
    const p = prod(l.pid);
    if (p.regions.includes(r) && !reorder.includes(p)) reorder.push(p);
  }));
  return (
    <>
      <div className="between"><h1 className="h1">{REGIONS[r].name} 가게 둘러보기</h1><span className="sub">{stores.length}곳</span></div>
      <RegionNotice />
      <div className="cats" role="group" aria-label="수령 방식">
        {([['all', '전체'], ['farm', '산지 직송'], ['pickup', '시장 픽업'], ['box', '정기 꾸러미']] as const).map(([k, l]) => (
          <button key={k} aria-pressed={f === k} onClick={() => A.setFilter(k, false)}>{l}</button>
        ))}
      </div>
      {f === 'all' && reorder.length > 0 && (
        <section className="store">
          <div className="between"><h2 className="h2">다시 담기</h2><span className="sub">지난 주문에서</span></div>
          <div className="hscroll">{reorder.map((p) => <ProductCard key={p.id} p={p} />)}</div>
        </section>
      )}
      {stores.map((x) => <StoreSection key={x.id} sl={x} />)}
      <p className="rule">{REGIONS[r].name} 생활권으로 보낼 수 있는 가게만 보여요. 한 주문은 한 가게, 한 수령 방식만 담을 수 있어요.</p>
    </>
  );
}

/* ---------- 상품 상세 ---------- */
function receiveText(dates: string[], type: SType) {
  const d = dates.map((x) => dshort(x) + '(' + wd(x) + ')').join(', ');
  if (type === 'pickup') return d + ' 중 하루 · ' + SLOTS.join(', ');
  if (type === 'box') return d + ' 중 하루 · 이번 회차 1회만 (자동 정기결제 없음)';
  return d + ' 중 하루';
}

export function Detail() {
  const { s, A } = useStore();
  const p = s.ui.productId ? prod(s.ui.productId) : null;
  if (!p) return <Home />;
  const sl = seller(p.sid), st = s.data.stock[p.id], r = s.ui.region, avail = p.regions.includes(r), local = localCurFor(p.sid, r);
  return (
    <div className="pd">
      <div className={'pd-hero t-' + sl.type}>
        <button className="back" data-act="back" aria-label="뒤로" onClick={A.back}><Ico n="back" /></button>
        <ArtSvg k={p.art} />
      </div>
      <div className="pd-body">
        <div className="pd-store">
          <Art k={sl.art} type={sl.type} />
          <div><b>{sl.name}</b><div className="sub">{sl.producer} (가상) · {sl.origin}</div></div>
        </div>
        <div><h1 className="h1">{p.name}</h1><p className="sub" style={{ fontSize: '.9375rem' }}>{p.spec}</p></div>
        <p className="pd-price">{won(p.price)}</p>
        {!avail ? (
          <div className="alert warn"><b>{REGIONS[r].name} 생활권에서는 받을 수 없어요</b><span className="small">{p.regions.map((x) => REGIONS[x].name).join('·')} 생활권 전용 상품이에요.</span></div>
        ) : st === 0 ? (
          <div className="alert bad"><b>품절이에요</b><span className="small">공급자가 재고를 채우면 다시 담을 수 있어요.</span></div>
        ) : null}
        <div className="facts">
          <div className="fact"><small>수령</small><b>{TYPES[sl.type].label}</b></div>
          <div className="fact"><small>가상 재고</small><b>{st === 0 ? '품절' : st + '개'}</b></div>
          <div className="fact"><small>배송 생활권</small><b>{p.regions.map((x) => REGIONS[x].name).join('·')}</b></div>
        </div>
        <dl className="info">
          <div><dt>생산자</dt><dd>{sl.producer} (가상)</dd></div>
          <div><dt>산지·위치</dt><dd>{sl.origin}</dd></div>
          <div><dt>규격</dt><dd>{p.spec}</dd></div>
          <div><dt>{sl.type === 'pickup' ? '픽업일' : '도착일'}</dt><dd>{receiveText(s.data.dates[sl.type], sl.type)}</dd></div>
          {sl.type === 'pickup' && <div><dt>픽업 장소</dt><dd>{sl.place}</dd></div>}
          <div><dt>배송비</dt><dd>{shipText(sl.type)}</dd></div>
          <div>
            <dt>결제</dt>
            <dd>
              {local ? PAY[local] + ' 또는 ' : ''}가상 일반결제
              {!local && <><br /><span className="sub">{sl.home ? PAY[sl.home] + '는 ' + REGIONS[sl.home].name + ' 생활권에서만 쓸 수 있어요' : '청도 소재 판매처라 지역화폐 대상이 아니에요 (시연 규칙)'}</span></>}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

/* ---------- 장바구니(주문 확인) ---------- */
export function Checkout() {
  const { s, A } = useStore();
  const c = computeCheckout(s.data, s.ui);
  if (!c)
    return (
      <div className="narrow">
        <div className="empty">
          <Art k="vegbox" type="box" style={{ width: 88, height: 88 }} />
          <h1 className="h2">장바구니가 비어 있어요</h1>
          <p className="sub">상품을 담으면 여기서 받을 날짜와 쿠폰, 결제수단을 정해요.</p>
          <button className="btn" onClick={() => A.nav('home')}>장보러 가기</button>
        </div>
      </div>
    );
  const R = REGIONS[c.region];
  const appliedId = c.applied ? c.applied.c.id : null;
  const usableN = c.evals.filter((e) => e.ok).length;
  return (
    <div className="narrow co">
      <div className="between"><h1 className="h1">장바구니</h1><span className="chip teal"><Ico n="pin" />{R.name} 생활권</span></div>
      <RegionNotice />
      <div className="box">
        <div className="store-head">
          <Art k={c.s.art} type={c.s.type} />
          <div className="t"><b>{c.s.name}</b><span className="m">{TYPES[c.type].label} · 한 주문은 한 가게, 한 수령 방식만</span></div>
        </div>
        {c.lines.map((l) => (
          <div className="ln" key={l.pid}>
            <Art k={l.p.art} type={c.type} />
            <div className="t">
              <b>{l.p.name}</b>
              <span>{l.p.spec}</span>
              {!l.supported ? <span><span className="chip warn">{R.name} 배송 불가</span></span> : l.stock === 0 ? <span><span className="chip bad">품절</span></span> : l.qty > l.stock ? <span><span className="chip bad">재고 {l.stock}개</span></span> : null}
            </div>
            <div className="r">
              <b>{won(l.amount)}</b>
              <div className="stepper">
                <button aria-label="수량 줄이기" onClick={() => A.cartStep(l.pid, -1)}><Ico n="minus" /></button>
                <span>{l.qty}</span>
                <button aria-label="수량 늘리기" onClick={() => A.cartStep(l.pid, 1)}><Ico n="plus" /></button>
              </div>
            </div>
          </div>
        ))}
        <button className="link" style={{ alignSelf: 'flex-start' }} onClick={() => A.nav('stores')}><Ico n="plus" /> 이 가게 상품 더 담기</button>
      </div>

      <div className="box">
        <div className="box-h"><h2><Ico n={c.type === 'pickup' ? 'clock' : 'truck'} />{c.type === 'pickup' ? '픽업 날짜·시간' : c.type === 'box' ? '이번 회차 받을 날짜' : '받을 날짜'}</h2></div>
        <div className="place"><Ico n="pin" /><span>{c.place}</span></div>
        <div className="chips-sel" role="radiogroup" aria-label="날짜">
          {c.dates.map((d, i) => (
            <span className="cs" key={d}>
              <input type="radio" name="rdate" id={'rdate' + i} value={d} checked={s.ui.checkout.date === d} onChange={() => A.setCheckout('date', d)} />
              <label htmlFor={'rdate' + i}><small>{wd(d)}요일</small>{dshort(d)}</label>
            </span>
          ))}
        </div>
        {c.type === 'pickup' && (
          <div className="chips-sel" role="radiogroup" aria-label="픽업 시간대">
            {SLOTS.map((sl, i) => (
              <span className="cs" key={sl}>
                <input type="radio" name="rslot" id={'rslot' + i} value={sl} checked={s.ui.checkout.slot === sl} onChange={() => A.setCheckout('slot', sl)} />
                <label htmlFor={'rslot' + i}>{sl}</label>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="box">
        <details className="acc" open={!!c.couponNote || undefined}>
          <summary>
            <span className="box-h"><h2><Ico n="ticket" />쿠폰 <span className="chip">{usableN}장 사용 가능</span></h2></span>
            <span className="v">{c.applied ? '−' + won(c.discount) : <span className="muted">선택 안 함</span>}<Ico n="right" /></span>
          </summary>
          {c.couponNote && <p className="small" style={{ color: 'var(--warn)', marginTop: 8 }}>{c.couponNote}</p>}
          <p className="sub" style={{ marginTop: 8 }}>대상 상품·최소금액·만료일을 확인해 지금 가장 많이 할인되는 1장을 추천해요.</p>
          <div className="opts">
            {c.evals.map((e) => (
              <label key={e.c.id} className={'opt' + (e.ok ? '' : ' dis')}>
                <input type="radio" name="cp" value={e.c.id} checked={e.ok && appliedId === e.c.id} disabled={!e.ok} onChange={() => A.setCheckout('coupon', e.c.id)} />
                <span className="n">{e.c.name}{c.rec && c.rec.c.id === e.c.id && <span className="chip orange">추천</span>}</span>
                <span className={'a' + (e.ok ? ' sale' : '')}>{e.ok ? '−' + won(e.discount) : '사용 불가'}</span>
                <span className="why">{e.why}</span>
              </label>
            ))}
            <label className="opt">
              <input type="radio" name="cp" value="none" checked={!appliedId} onChange={() => A.setCheckout('coupon', 'none')} />
              <span className="n">쿠폰 쓰지 않기</span>
              <span />
            </label>
          </div>
        </details>
      </div>

      <div className="box">
        <div className="box-h"><h2><Ico n="wallet" />결제수단</h2></div>
        <div className="opts" style={{ marginTop: 0 }}>
          {c.payOpts.map((k) => (
            <label key={k} className="opt">
              <input type="radio" name="pay" value={k} checked={c.pay === k} onChange={() => A.setCheckout('payment', k)} />
              <span className="n">{PAY[k]}</span>
              <span className="a">{k !== 'card' && s.data.wallet[k] < c.total && <span className="chip bad">부족</span>}</span>
              <span className="why">{k === 'card' ? '모의 처리 · 실제 결제 없음' : '잔액 ' + won(s.data.wallet[k]) + ' · 충전 혜택은 이미 잔액에 포함'}</span>
            </label>
          ))}
        </div>
        {!c.local && <p className="sub">{c.s.home ? PAY[c.s.home] + '는 ' + REGIONS[c.s.home].name + ' 생활권에서만 쓸 수 있고, 두 지역 잔액은 합산하지 않아요.' : '이 판매처는 지역화폐 대상이 아니에요 (시연 규칙).'}</p>}
        {c.short && c.balance !== null && (
          <div className="alert bad" role="alert">
            <b>잔액이 부족해 주문을 멈췄어요</b>
            <span className="small">{PAY[c.pay]} 잔액 {won(c.balance)} · 결제할 금액 {won(c.total)} ({won(c.total - c.balance)} 부족)</span>
            <div><button className="btn sm teal" data-act="payCard" onClick={A.payCard}>가상 일반결제로 바꾸기</button></div>
          </div>
        )}
      </div>

      <div className="box">
        <dl className="calc">
          <dt>상품 금액</dt><dd>{won(c.subtotal)}</dd>
          <dt>배송비</dt><dd>{won(c.shipping)}</dd>
          <dt>쿠폰 할인</dt><dd className="sale">−{won(c.discount)}</dd>
          <dt className="tot">결제할 금액</dt><dd className="tot">{won(c.total)}</dd>
        </dl>
      </div>
    </div>
  );
}

/* ---------- 주문내역 ---------- */
function Guide({ o }: { o: Order }) {
  const { A } = useStore();
  if (o.status !== 'ready') return null;
  return (
    <div className="guide" role="status">
      <div className="gl"><Ico n={o.type === 'pickup' ? 'clock' : 'truck'} /><span><b>{dlabel(o.receive.date)} {o.type === 'pickup' ? o.receive.slot : '도착 예정'}</b></span></div>
      <div className="gl"><Ico n="pin" /><span>{o.receive.place}</span></div>
      {o.type === 'pickup' && <button className="btn teal block" onClick={() => A.pass(o.id)}>픽업 화면 열기</button>}
    </div>
  );
}

function CitizenOrder({ o }: { o: Order }) {
  const { s, A } = useStore();
  const sl = seller(o.sid);
  const items = o.lines[0].name + (o.lines.length > 1 ? ' 외 ' + (o.lines.length - 1) + '개' : ' × ' + o.lines[0].qty);
  return (
    <article className={'oc' + (s.ui.highlight === o.id ? ' hl' : '')} id={'o-' + o.id}>
      <div className="oc-top">
        <Art k={sl.art} type={sl.type} />
        <div className="t"><b>{sl.name}</b><small>{o.id} · {stampLabel(o.createdAt)} · {REGIONS[o.region].name} 생활권</small></div>
        <span className={'chip ' + statusTone(o.status)}>{statusLabel(o.status, o.type)}</span>
      </div>
      <p className="oc-msg">{statusMsg(o)}</p>
      {o.status !== 'canceled' && <Prog o={o} />}
      <Guide o={o} />
      {o.status === 'inquiry' && <div className="alert warn"><span className="small">준비가 시작된 주문이라 바로 취소되지 않아요. 판매처가 승인하면 재고·잔액·쿠폰이 복원돼요.</span></div>}
      <div className="oc-sum"><span>{items}</span><b>{won(o.total)}</b></div>
      <DetailsBlock o={o} />
      {o.status === 'received' && <div className="row"><button className="btn sm danger" data-act="askCancel" data-v={o.id} onClick={() => A.askCancel(o.id)}>주문 취소</button></div>}
      {o.status === 'preparing' && <div className="row"><button className="btn sm ghost" data-act="askInquiry" data-v={o.id} onClick={() => A.askInquiry(o.id)}>취소 문의하기</button></div>}
    </article>
  );
}

export function Orders() {
  const { s, A } = useStore();
  const all = s.data.orders.slice().reverse();
  const act = all.filter(isActive), past = all.filter((o) => !isActive(o));
  const tab = s.ui.ordersTab, list = tab === 'active' ? act : past;
  return (
    <div className="narrow" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h1 className="h1">주문내역</h1>
      <div className="seg" role="group" aria-label="주문 구분">
        <button aria-pressed={tab === 'active'} onClick={() => A.ordersTab('active')}>진행 중 {act.length}</button>
        <button aria-pressed={tab === 'past'} onClick={() => A.ordersTab('past')}>지난 주문 {past.length}</button>
      </div>
      <p className="sub">공급자 화면에서 바꾼 상태가 바로 반영돼요. 접수 단계에서는 취소, 준비 중에는 취소 문의만 할 수 있어요.</p>
      {list.length ? <div className="ol">{list.map((o) => <CitizenOrder key={o.id} o={o} />)}</div> : <div className="empty"><p className="muted">{tab === 'active' ? '진행 중인 주문이 없어요.' : '지난 주문이 없어요.'}</p></div>}
    </div>
  );
}

/* ---------- 공급자 ---------- */
function SupplierOrder({ o }: { o: Order }) {
  const { A } = useStore();
  return (
    <article className="so">
      <div className="so-top"><b>{o.id}</b><span className={'chip ' + statusTone(o.status)}>{statusLabel(o.status, o.type)}</span><span className="time">{stampLabel(o.createdAt)}</span></div>
      <div className="what">{o.lines.map((l) => l.name + ' × ' + l.qty).join(', ')} · {won(o.total)}</div>
      <div className="when">{o.type === 'pickup' ? '픽업 ' : '도착 '}{dlabel(o.receive.date)}{o.receive.slot ? ' ' + o.receive.slot : ''} · {REGIONS[o.region].name} 생활권 시민 (가상)</div>
      {o.status === 'inquiry' && <div className="alert warn"><span className="small">시민이 준비 중 취소를 요청했어요. 승인하면 재고·결제·쿠폰이 한 번만 복원돼요.</span></div>}
      <div className="acts">
        {o.status === 'received' && <button className="btn sm teal" data-act="advance" data-v={o.id} onClick={() => A.advance(o.id, 'received')}>주문 수락</button>}
        {o.status === 'preparing' && <button className="btn sm teal" data-act="advance" data-v={o.id} onClick={() => A.advance(o.id, 'preparing')}>준비 완료 · {statusLabel('ready', o.type)}</button>}
        {o.status === 'ready' && <button className="btn sm teal" data-act="advance" data-v={o.id} onClick={() => A.advance(o.id, 'ready')}>{o.type === 'pickup' ? '픽업 완료' : '수령 완료'}</button>}
        {o.status === 'inquiry' && (
          <>
            <button className="btn sm danger" onClick={() => A.approveCancel(o.id)}>취소 승인</button>
            <button className="btn sm ghost" onClick={() => A.resume(o.id)}>준비 계속</button>
          </>
        )}
      </div>
      <DetailsBlock o={o} />
    </article>
  );
}

export function Supplier() {
  const { s, A } = useStore();
  const sid = s.ui.supplier, sl = seller(sid), tab = s.ui.supTab;
  const os = s.data.orders.filter((o) => o.sid === sid).slice().reverse();
  const groups = {
    new: os.filter((o) => o.status === 'received' || o.status === 'inquiry'),
    doing: os.filter((o) => o.status === 'preparing' || o.status === 'ready'),
    closed: os.filter((o) => o.status === 'done' || o.status === 'canceled'),
  };
  const done = os.filter((o) => o.status === 'done'), canceled = os.filter((o) => o.status === 'canceled');
  const doneAmt = done.reduce((a, o) => a + o.total, 0);
  const list = groups[tab];
  return (
    <div className="narrow" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="store-head">
        <Art k={sl.art} type={sl.type} />
        <div className="t" style={{ flex: 1 }}>
          <label>
            <span className="sr">판매처 선택</span>
            <select className="sel" id="supSel" value={sid} onChange={(e) => A.setSupplier(e.target.value)}>
              {SELLERS.map((x) => {
                const n = s.data.orders.filter((o) => o.sid === x.id && (o.status === 'received' || o.status === 'inquiry')).length;
                return <option key={x.id} value={x.id}>{x.name}{n ? ' · 새 주문 ' + n : ''}</option>;
              })}
            </select>
          </label>
        </div>
      </div>
      <p className="sub">{TYPES[sl.type].label} · {sl.origin} · {sl.producer} (가상)</p>
      <div className="kpis">
        <div className="kpi"><b>{groups.new.length}</b><small>새 주문·문의</small></div>
        <div className="kpi"><b>{groups.doing.length}</b><small>진행 중</small></div>
        <div className="kpi"><b>{done.length}</b><small>완료 건수</small></div>
        <div className="kpi"><b>{canceled.length}</b><small>취소 건수</small></div>
        <div className="kpi wide"><small>완료 주문금액 · 완료된 주문의 거래금액 합계 (플랫폼 매출·이익 아님)</small><b>{won(doneAmt)}</b></div>
      </div>
      <div className="seg" role="group" aria-label="주문 단계">
        <button data-act="supTab" data-v="new" aria-pressed={tab === 'new'} onClick={() => A.supTab('new')}>새 주문 {groups.new.length}</button>
        <button data-act="supTab" data-v="doing" aria-pressed={tab === 'doing'} onClick={() => A.supTab('doing')}>진행 중 {groups.doing.length}</button>
        <button data-act="supTab" data-v="closed" aria-pressed={tab === 'closed'} onClick={() => A.supTab('closed')}>완료·취소 {groups.closed.length}</button>
      </div>
      {list.length ? <div className="ol">{list.map((o) => <SupplierOrder key={o.id} o={o} />)}</div> : <div className="empty"><p className="muted">이 단계의 주문이 없어요.</p></div>}
      <div className="box">
        <div className="box-h"><h2>가상 재고</h2><span className="sub">0이면 품절로 보여요</span></div>
        <div>
          {PRODUCTS.filter((p) => p.sid === sid).map((p) => {
            const st = s.data.stock[p.id];
            return (
              <div className="stk" key={p.id}>
                <div className="t"><b>{p.name}{st === 0 && <> <span className="chip bad">품절</span></>}</b><small>{p.spec} · {won(p.price)}</small></div>
                <div className="row">
                  <div className="stepper">
                    <button aria-label="재고 줄이기" onClick={() => A.stock(p.id, -1)}><Ico n="minus" /></button>
                    <span>{st}</span>
                    <button aria-label="재고 늘리기" onClick={() => A.stock(p.id, 1)}><Ico n="plus" /></button>
                  </div>
                  <button className="btn sm ghost" disabled={st === 0} onClick={() => A.soldOut(p.id)}>품절</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------- 화면 아래 고정 막대 ---------- */
export function Dock() {
  const { s, A } = useStore();
  const sc = s.ui.screen;
  if (sc === 'detail') {
    const p = s.ui.productId ? prod(s.ui.productId) : null;
    if (!p) return null;
    const st = s.data.stock[p.id], avail = p.regions.includes(s.ui.region);
    if (!avail || st === 0)
      return <div className="dock"><div className="actionbar"><div className="r"><button className="btn ghost" onClick={A.back}>다른 상품 보기</button></div></div></div>;
    const q = parseQty(s.ui.detailQty), have = cartQty(s.ui, p.id);
    return (
      <div className="dock">
        <div className="actionbar">
          {s.ui.detailErr ? <p className="why" role="alert">{s.ui.detailErr}</p> : have ? <p className="sub" style={{ padding: '0 4px' }}>장바구니에 {have}개 담겨 있어요</p> : null}
          <div className="r">
            <div className="stepper lg">
              <button aria-label="수량 줄이기" onClick={() => A.stepDetailQty(-1)}><Ico n="minus" /></button>
              <input id="dqty" inputMode="numeric" value={s.ui.detailQty} aria-label="수량" onChange={(e) => A.setDetailQty(e.target.value)} />
              <button aria-label="수량 늘리기" onClick={() => A.stepDetailQty(1)}><Ico n="plus" /></button>
            </div>
            <button className="btn" data-act="addCart" data-v={p.id} onClick={() => A.addCart(p.id, q)}>{q ? won(p.price * q) + ' 담기' : '담기'}</button>
          </div>
        </div>
      </div>
    );
  }
  if (sc === 'checkout') {
    const c = computeCheckout(s.data, s.ui);
    if (!c) return null;
    return (
      <div className="dock">
        <div className="actionbar">
          {c.blockers.length > 0 && <p className="why">{c.blockers[0]}{c.blockers.length > 1 ? ' 외 ' + (c.blockers.length - 1) + '건' : ''}</p>}
          <div className="r"><button className="btn" data-act="openConfirm" disabled={c.blockers.length > 0} onClick={A.openConfirm}>{won(c.total)} 주문하기</button></div>
        </div>
      </div>
    );
  }
  if (sc === 'home' || sc === 'stores') {
    const n = cartCount(s.ui);
    if (!n || !s.ui.cart.sid) return null;
    const c = computeCheckout(s.data, s.ui)!;
    const sl = seller(s.ui.cart.sid);
    const first = prod(s.ui.cart.items[0].pid).name, more = s.ui.cart.items.length - 1;
    const warn = unsupportedItems(s.ui, s.ui.region).length > 0;
    return (
      <div className="dock">
        <button className={'cartbar' + (warn ? ' warn' : '')} data-act="cartbar" onClick={() => A.nav('checkout')}>
          <span className="cnt">{n}</span>
          <span className="t"><small>{sl.name} · {first}{more ? ' 외 ' + more + '개' : ''}</small><b>{warn ? '받을 수 없는 상품이 있어요' : won(c.subtotal) + ' 장바구니 보기'}</b></span>
          <Ico n="right" />
        </button>
      </div>
    );
  }
  return null;
}

export { REGION_KEYS };
