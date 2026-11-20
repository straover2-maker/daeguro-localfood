// 상품·서비스 일러스트 (직접 그린 SVG, 외부 이미지 없음)
import type { CSSProperties } from 'react';
import type { SType } from './data';

const BOWL = '<path d="M10 34h44a22 17 0 0 1-44 0z" fill="#EFE7DA"/><path d="M10 34h44" stroke="#D9CDBA" stroke-width="1.5"/>';
const CRATE = '<path d="M9 36h46l-4 20H13z" fill="#C98B4E"/><path d="M11 43h42M12 50h40" stroke="#A86E38" stroke-width="2"/>';
const VEGBOX =
  '<path d="M17 36c-3-10 3-17 8-15 0 6-2 11-5 15z" fill="#5DA34A"/><circle cx="34" cy="30" r="8" fill="#9BD07A"/><path d="M34 23v14M28 30h12" stroke="#7BB85E" stroke-width="1.5"/><path d="M43 36l6-17 3 2-5 15z" fill="#F08A2E"/><path d="M50 19l2-5M51 20l4-3" stroke="#5DA34A" stroke-width="2" stroke-linecap="round"/>' +
  CRATE;

export const ART = {
  apple:
    '<path d="M32 24c-6-5-17-3-18 9-1 13 9 22 18 20 9 2 19-7 18-20-1-12-12-14-18-9z" fill="#E4473A"/><path d="M32 24c0-5 2-8 5-10" stroke="#6B4A2B" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M35 17c5-4 11-3 12 0-4 3-9 3-12 0z" fill="#5DA34A"/><ellipse cx="23" cy="33" rx="3" ry="5" fill="#fff" opacity=".35"/>',
  apple2:
    '<path d="M31 25c-7-4-17-1-17 10 0 12 9 20 17 18 10 3 19-6 18-19-1-11-11-13-18-9z" fill="#D9503A"/><path d="M32 25c0-5 2-8 5-10" stroke="#6B4A2B" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M35 18c5-4 11-3 12 0-4 3-9 3-12 0z" fill="#5DA34A"/><circle cx="38" cy="40" r="2.4" fill="#8A3A22"/><circle cx="26" cy="45" r="1.7" fill="#8A3A22"/><circle cx="41" cy="31" r="1.4" fill="#8A3A22"/>',
  pouch:
    '<path d="M22 19h20l3 33a4 4 0 0 1-4 4H23a4 4 0 0 1-4-4z" fill="#F4C54C"/><rect x="28" y="11" width="8" height="9" rx="2" fill="#E4473A"/><circle cx="32" cy="39" r="7" fill="#E4473A"/><path d="M32 32c0-2 1-3 3-4" stroke="#5DA34A" stroke-width="2" fill="none"/>',
  persimmon:
    '<ellipse cx="32" cy="38" rx="20" ry="16" fill="#F08A2E"/><ellipse cx="24" cy="33" rx="5" ry="3" fill="#fff" opacity=".3"/><path d="M32 21l-10 4 6 2-4 5 8-3 8 3-4-5 6-2z" fill="#4E8A3A"/><rect x="31" y="16" width="2.5" height="6" rx="1" fill="#6B4A2B"/>',
  dried:
    '<rect x="11" y="24" width="14" height="26" rx="7" fill="#D9762A" transform="rotate(-16 18 37)"/><rect x="25" y="20" width="14" height="28" rx="7" fill="#E88A3A"/><rect x="39" y="24" width="14" height="26" rx="7" fill="#C9682A" transform="rotate(16 46 37)"/>',
  jujube:
    '<ellipse cx="23" cy="36" rx="9" ry="12" fill="#B3312A"/><ellipse cx="41" cy="34" rx="9" ry="12" fill="#C7442E"/><ellipse cx="32" cy="45" rx="9" ry="11" fill="#9E2A24"/><ellipse cx="20" cy="32" rx="2" ry="4" fill="#fff" opacity=".3"/><ellipse cx="38" cy="30" rx="2" ry="4" fill="#fff" opacity=".3"/>',
  jchip:
    '<circle cx="21" cy="28" r="10" fill="#EBC77E"/><circle cx="21" cy="28" r="3.5" fill="#B3312A"/><circle cx="43" cy="30" r="10" fill="#E2B866"/><circle cx="43" cy="30" r="3.5" fill="#B3312A"/><circle cx="32" cy="46" r="10" fill="#F0D08E"/><circle cx="32" cy="46" r="3.5" fill="#B3312A"/>',
  banchan:
    '<rect x="3" y="41" width="58" height="8" rx="3" fill="#C98B4E"/><rect x="3" y="47" width="58" height="3" rx="1.5" fill="#A86E38"/>' +
    '<ellipse cx="13" cy="30" rx="9.5" ry="3.5" fill="#9C6B3E"/><circle cx="10" cy="28.5" r="1.3" fill="#E8D3B0"/><circle cx="15" cy="29" r="1.3" fill="#E8D3B0"/><path d="M3.5 30h19a9.5 10 0 0 1-19 0z" fill="#EFE7DA"/>' +
    '<ellipse cx="32" cy="30" rx="9.5" ry="3.5" fill="#2E2A28"/><circle cx="29" cy="29" r="1.4" fill="#5A524C"/><circle cx="34" cy="28.5" r="1.4" fill="#5A524C"/><path d="M22.5 30h19a9.5 10 0 0 1-19 0z" fill="#F6EFE3"/>' +
    '<ellipse cx="51" cy="30" rx="9.5" ry="3.5" fill="#E9C46A"/><path d="M46 29.5l4-1.5M51 29l4-1.5" stroke="#C99A3A" stroke-width="1.4" stroke-linecap="round"/><path d="M41.5 30h19a9.5 10 0 0 1-19 0z" fill="#EFE7DA"/>',
  namul:
    '<ellipse cx="32" cy="34" rx="22" ry="6" fill="#5DA34A"/><path d="M17 33q7-10 14-1M30 32q7-11 15 0M22 30q3-6 8-3" stroke="#3E7D33" stroke-width="3" fill="none" stroke-linecap="round"/>' +
    BOWL,
  kimchi:
    '<ellipse cx="32" cy="34" rx="22" ry="6" fill="#D9442E"/><path d="M18 34q9-14 22-5M28 31q8-8 16 0" stroke="#F3D9A4" stroke-width="4" fill="none" stroke-linecap="round"/>' +
    BOWL,
  tofu:
    '<ellipse cx="32" cy="46" rx="25" ry="7" fill="#CFE3EE"/><rect x="13" y="25" width="19" height="19" rx="3" fill="#FBF8F1" stroke="#DCD3C3" stroke-width="1.5"/><rect x="32" y="27" width="19" height="19" rx="3" fill="#F5EFE3" stroke="#DCD3C3" stroke-width="1.5"/>',
  bottle:
    '<rect x="26" y="8" width="12" height="7" rx="2" fill="#2D7A70"/><path d="M24 15h16v6l4 6v25a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4V27l4-6z" fill="#F5F2EC" stroke="#DCD3C3" stroke-width="1.5"/><rect x="20" y="32" width="24" height="15" fill="#3A3634"/><circle cx="32" cy="39.5" r="4" fill="#F5F2EC"/>',
  vegbox: VEGBOX,
  bigbox:
    '<path d="M13 36c-3-10 3-17 8-15 0 6-2 11-5 15z" fill="#5DA34A"/><ellipse cx="27" cy="30" rx="5" ry="9" fill="#7B4FA0" transform="rotate(-20 27 30)"/><circle cx="38" cy="29" r="8" fill="#9BD07A"/><path d="M46 36l5-16 3 2-4 14z" fill="#F08A2E"/><circle cx="20" cy="33" r="4" fill="#E4473A"/>' +
    CRATE,
  fruitbox:
    '<circle cx="21" cy="30" r="8" fill="#E4473A"/><path d="M21 22c0-3 1-4 3-5" stroke="#6B4A2B" stroke-width="2" fill="none"/><ellipse cx="36" cy="31" rx="9" ry="7" fill="#F08A2E"/><path d="M36 24l-4 2 3 1-2 2 3-1 3 1-2-2 3-1z" fill="#4E8A3A"/><ellipse cx="48" cy="32" rx="5" ry="6" fill="#B3312A"/>' +
    CRATE,
};
export type ArtKey = keyof typeof ART;

const HERO: Record<SType, { vb: string; inner: string }> = {
  farm: {
    vb: '0 0 120 90',
    inner:
      '<ellipse cx="62" cy="82" rx="50" ry="5" fill="#000" opacity=".06"/><rect x="14" y="36" width="56" height="34" rx="6" fill="#EF7535"/><path d="M70 46h18l12 13v11H70z" fill="#F59A5F"/><path d="M76 50h11l8 9H76z" fill="#FFF4EA"/><rect x="22" y="22" width="36" height="15" rx="3" fill="#C98B4E"/><circle cx="30" cy="22" r="6" fill="#E4473A"/><circle cx="41" cy="20" r="6" fill="#F0A13A"/><circle cx="51" cy="22" r="6" fill="#E4473A"/><path d="M24 52h34" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/><circle cx="32" cy="72" r="8" fill="#2B3335"/><circle cx="32" cy="72" r="3" fill="#E8E2D8"/><circle cx="86" cy="72" r="8" fill="#2B3335"/><circle cx="86" cy="72" r="3" fill="#E8E2D8"/>',
  },
  pickup: {
    vb: '0 0 120 90',
    inner:
      '<ellipse cx="62" cy="84" rx="50" ry="5" fill="#000" opacity=".06"/><rect x="24" y="40" width="74" height="42" rx="3" fill="#FFF8EE"/><rect x="24" y="40" width="5" height="42" fill="#C98B4E"/><rect x="93" y="40" width="5" height="42" fill="#C98B4E"/><path d="M16 24h90l-6 16H22z" fill="#2D7A70"/><path d="M34 24l-3 16M52 24l-1 16M70 24l1 16M88 24l3 16" stroke="#FFFFFF" stroke-width="7" opacity=".85"/><g fill="#2D7A70"><circle cx="28" cy="41" r="5"/><circle cx="46" cy="41" r="5"/><circle cx="64" cy="41" r="5"/><circle cx="82" cy="41" r="5"/><circle cx="98" cy="41" r="5"/></g><rect x="44" y="10" width="34" height="13" rx="3" fill="#EF7535"/><rect x="24" y="62" width="74" height="8" fill="#C98B4E"/><ellipse cx="42" cy="61" rx="9" ry="3" fill="#9C6B3E"/><path d="M33 61h18a9 7 0 0 1-18 0z" fill="#EFE7DA"/><ellipse cx="62" cy="61" rx="9" ry="3" fill="#5DA34A"/><path d="M53 61h18a9 7 0 0 1-18 0z" fill="#EFE7DA"/><rect x="75" y="52" width="13" height="10" rx="2" fill="#FBF8F1" stroke="#DCD3C3"/>',
  },
  box: { vb: '0 0 64 64', inner: VEGBOX },
};

export function Art({ k, type, style }: { k: ArtKey; type: SType; style?: CSSProperties }) {
  return (
    <span className={'art t-' + type} style={style}>
      <svg viewBox="0 0 64 64" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ART[k] }} />
    </span>
  );
}

export function ArtSvg({ k }: { k: ArtKey }) {
  return <svg viewBox="0 0 64 64" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ART[k] }} />;
}

export function HeroArt({ kind }: { kind: SType }) {
  const h = HERO[kind];
  return <svg className="il" viewBox={h.vb} aria-hidden="true" dangerouslySetInnerHTML={{ __html: h.inner }} />;
}

const ICON = {
  home: '<path d="M3.5 10.5 12 3.5l8.5 7V20a.5.5 0 0 1-.5.5h-5.5v-6h-5v6H4a.5.5 0 0 1-.5-.5z"/>',
  bag: '<path d="M5 8h14l-1.1 11.6a1 1 0 0 1-1 .9H7.1a1 1 0 0 1-1-.9z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
  receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
  store: '<path d="M4 9 5.5 4h13L20 9"/><path d="M4 9h16v1.5a2.7 2.7 0 0 1-5.3 0 2.7 2.7 0 0 1-5.4 0A2.7 2.7 0 0 1 4 10.5z"/><path d="M5 13v7h14v-7"/>',
  box: '<path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  right: '<path d="m9 6 6 6-6 6"/>',
  back: '<path d="m15 6-6 6 6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
  more: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  truck: '<path d="M3 6h11v10H3zM14 9h4l3 3.5V16h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17.5" cy="17.5" r="1.8"/>',
  wallet: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M16 14.5h2"/>',
  ticket: '<path d="M3 10a2 2 0 0 0 0 4v4h18v-4a2 2 0 0 1 0-4V6H3z"/><path d="M14 8v12" stroke-dasharray="2 2"/>',
};
export type IconName = keyof typeof ICON;

export function Ico({ n }: { n: IconName }) {
  return (
    <svg
      className="ico"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: ICON[n] }}
    />
  );
}
