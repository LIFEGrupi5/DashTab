'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type TileId = 'pos' | 'menu' | 'staff' | 'management' | 'analytics';

type Tile = {
  id: TileId;
  name: string;
  href: string;
  color: string;
  dark: string;
  pos: { x: number; y: number };
  hintPos: 'top' | 'bottom';
};

const TILES: Tile[] = [
  { id: 'management', name: 'Management', href: '/kitchen', color: '#269271', dark: '#1a6a52', pos: { x: 15, y: 15 }, hintPos: 'top' },
  { id: 'analytics',  name: 'Analytics',  href: '/overview', color: '#c74a2d', dark: '#8a2f1c', pos: { x: 85, y: 15 }, hintPos: 'top' },
  { id: 'pos',        name: 'POS',        href: '/orders',   color: '#e8a23a', dark: '#b77a20', pos: { x: 50, y: 50 }, hintPos: 'bottom' },
  { id: 'menu',       name: 'Menu',       href: '/menu',     color: '#2f78c4', dark: '#1f4f85', pos: { x: 15, y: 85 }, hintPos: 'bottom' },
  { id: 'staff',      name: 'Staff',      href: '/staff',    color: '#c14b7b', dark: '#8a2f55', pos: { x: 85, y: 85 }, hintPos: 'bottom' },
];

const BOB_DELAYS: Record<TileId, string> = {
  pos: '0s', management: '0.2s', analytics: '0.4s', menu: '0.6s', staff: '0.8s',
};

export type LauncherStats = {
  revenue: string;
  orders: string;
  topItem: string;
  peakHour: string;
  staffOnline: string;
  openOrders: string;
};

function Spark({ color }: { color: string }) {
  const pts = Array.from({ length: 12 }, (_, i) => Math.round(8 + Math.sin(i * 0.9) * 4 + (i % 3) * 2));
  const max = Math.max(...pts), min = Math.min(...pts);
  const path = pts.map((v, i) =>
    `${(i / (pts.length - 1)) * 40},${22 - ((v - min) / (max - min || 1)) * 18 - 2}`
  ).join(' ');
  return (
    <svg className="iso-spark" viewBox="0 0 40 22">
      <polyline points={path} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// Inverse isometric projection.
// Forward:  screen_x = 0.707*(px-py),  screen_y = 0.406*(px+py)   (all % relative to center)
// Inverse:  px = (sx/0.707 + sy/0.406)/2 + 50
//           py = (sy/0.406 - sx/0.707)/2 + 50
function hitTestTile(clientX: number, clientY: number, stageEl: HTMLElement): Tile | null {
  const r = stageEl.getBoundingClientRect();
  const sx = ((clientX - r.left) / r.width  - 0.5) * 100;
  const sy = ((clientY - r.top)  / r.height - 0.5) * 100;
  const px = (sx / 0.707 + sy / 0.406) / 2 + 50;
  const py = (sy / 0.406 - sx / 0.707) / 2 + 50;
  return TILES.find(t => Math.abs(t.pos.x - px) < 13 && Math.abs(t.pos.y - py) < 13) ?? null;
}

function previewPos(tile: Tile, stageEl: HTMLElement, wrapEl: HTMLElement) {
  const sr = stageEl.getBoundingClientRect();
  const wr = wrapEl.getBoundingClientRect();
  const relX = tile.pos.x - 50;
  const relY = tile.pos.y - 50;
  const projX = 0.707 * (relX - relY) / 100 * sr.width  + sr.width  / 2;
  const projY = 0.406 * (relX + relY) / 100 * sr.height + sr.height / 2;
  return {
    x: sr.left - wr.left + projX,
    y: tile.hintPos === 'top'
      ? sr.top - wr.top + projY - 16
      : sr.top - wr.top + projY + 16,
  };
}

function TileIcon({ id }: { id: TileId }) {
  const s: React.SVGProps<SVGSVGElement> = {
    width: '60%', height: '60%',
    stroke: 'rgba(255,255,255,0.85)', strokeWidth: 2.5,
    fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round',
  };
  if (id === 'analytics') return (
    <svg viewBox="0 0 24 24" {...s}><rect x="3" y="4" width="18" height="14" rx="2"/><polyline points="6,14 10,10 13,12 18,7"/></svg>
  );
  if (id === 'menu') return (
    <svg viewBox="0 0 24 24" {...s}><rect x="5" y="3" width="14" height="18" rx="2"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="13" y2="15"/></svg>
  );
  if (id === 'management') return (
    <svg viewBox="0 0 24 24" {...s} fill="rgba(255,255,255,0.15)"><rect x="4" y="6" width="16" height="10" rx="2"/><line x1="7" y1="10" x2="17" y2="10"/><line x1="7" y1="13" x2="13" y2="13"/></svg>
  );
  if (id === 'staff') return (
    <svg viewBox="0 0 24 24" {...s}><circle cx="8" cy="9" r="2"/><circle cx="14" cy="8" r="2"/><circle cx="11" cy="14" r="2"/><circle cx="17" cy="14" r="2"/><circle cx="6" cy="14" r="2"/></svg>
  );
  return (
    <svg viewBox="0 0 24 24" {...s}><rect x="4" y="6" width="16" height="12" rx="2"/><line x1="4" y1="10" x2="20" y2="10"/><line x1="8" y1="14" x2="11" y2="14"/><line x1="14" y1="14" x2="16" y2="14"/></svg>
  );
}


type Preview = { tile: Tile; x: number; y: number } | null;

const DEFAULT_STATS: LauncherStats = {
  revenue: '—', orders: '—', topItem: '—', peakHour: '—', staffOnline: '—', openOrders: '—',
};

export default function IsometricLauncher({ stats = DEFAULT_STATS }: { stats?: LauncherStats }) {
  const router = useRouter();
  const wrapRef  = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const rafRef   = useRef<number | null>(null);

  useEffect(() => () => { if (rafRef.current != null) cancelAnimationFrame(rafRef.current); }, []);

  const [hoverId,  setHoverId]  = useState<TileId | null>(null);
  const [pressId,  setPressId]  = useState<TileId | null>(null);
  const [preview,  setPreview]  = useState<Preview>(null);

  const updateHover = useCallback((clientX: number, clientY: number) => {
    if (!stageRef.current || !wrapRef.current) return;
    const tile = hitTestTile(clientX, clientY, stageRef.current);
    setHoverId(tile?.id ?? null);
    if (tile) {
      const pos = previewPos(tile, stageRef.current, wrapRef.current);
      setPreview({ tile, ...pos });
    } else {
      setPreview(null);
    }
  }, []);

  return (
    <div className="iso-wrapper" ref={wrapRef}>

      {/* Status strip — real data passed from dashboard */}
      <div className="iso-stat-strip">
        {([
          { k: 'Revenue',  v: stats.revenue,     color: '#269271' },
          { k: 'Orders',   v: stats.orders,      color: '#2f78c4' },
          { k: 'Open',     v: stats.openOrders,  color: '#e8a23a' },
          { k: 'Staff',    v: stats.staffOnline, color: '#c14b7b' },
          { k: 'Top item', v: stats.topItem,     color: '#c74a2d' },
        ] as const).map(s => (
          <div className="iso-stat" key={s.k}>
            <div>
              <div className="iso-stat-k">{s.k}</div>
              <div className="iso-stat-v" style={{ color: s.color }}>{s.v}</div>
            </div>
            <Spark color={s.color} />
          </div>
        ))}
      </div>

      <p className="iso-hint mt-3">TAP A SECTION TO ENTER</p>

      {/* 3D stage — purely visual, pointer-events disabled on inner */}
      <div className="iso-stage-wrap" style={{ position: 'relative' }}>
        <div className="iso-stage" ref={stageRef}>
          <div className="iso-inner" style={{ pointerEvents: 'none' }}>
            <div className="iso-floor"/>
            {TILES.map(tile => (
              <div
                key={tile.id}
                className={`iso-tile${hoverId === tile.id ? ' hovered' : ''}${pressId === tile.id ? ' pressing' : ''}`}
                style={{
                  '--tc': tile.color,
                  '--tc-d': tile.dark,
                  left: `calc(${tile.pos.x}% - 12%)`,
                  top:  `calc(${tile.pos.y}% - 12%)`,
                } as React.CSSProperties}
              >
                <div className="iso-block" style={{ animationDelay: BOB_DELAYS[tile.id] }}>
                  <div className="iso-layer l5"/>
                  <div className="iso-layer l4"/>
                  <div className="iso-layer l3"/>
                  <div className="iso-layer l2"/>
                  <div className="iso-layer top">
                    <div className="iso-face-content">
                      <div className="iso-icon-pane"><TileIcon id={tile.id}/></div>
                    </div>
                  </div>
                  <div className="iso-ripple"/>
                </div>
                <div className={`iso-label${tile.hintPos === 'top' ? ' top-label' : ''}`}>{tile.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Transparent 2D overlay — catches all pointer events, uses inverse-projection math */}
        <div
          style={{
            position: 'absolute', inset: 0,
            cursor: hoverId ? 'pointer' : 'default',
            zIndex: 10,
          }}
          onMouseMove={e => {
            if (rafRef.current != null) return;
            const { clientX, clientY } = e;
            rafRef.current = requestAnimationFrame(() => {
              updateHover(clientX, clientY);
              rafRef.current = null;
            });
          }}
          onMouseLeave={() => { setHoverId(null); setPressId(null); setPreview(null); }}
          onMouseDown={e => {
            const tile = stageRef.current ? hitTestTile(e.clientX, e.clientY, stageRef.current) : null;
            setPressId(tile?.id ?? null);
          }}
          onMouseUp={e => {
            const tile = stageRef.current ? hitTestTile(e.clientX, e.clientY, stageRef.current) : null;
            setPressId(null);
            if (tile) router.push(tile.href);
          }}
        />
      </div>

      <p className="iso-hint mb-3">HOVER TO PREVIEW · CLICK TO NAVIGATE</p>

      {/* Mobile grid */}
      <div className="iso-mobile-grid">
        {TILES.map((tile, i) => (
          <button
            key={tile.id}
            className={`iso-mobile-tile${i === 0 ? ' primary' : ''}`}
            style={{ '--tc': tile.color, '--tc-d': tile.dark } as React.CSSProperties}
            onClick={() => router.push(tile.href)}
          >
            <div className="iso-mobile-icon"><TileIcon id={tile.id}/></div>
            <div>
              <div className="iso-mobile-name">{tile.name}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Hover preview card */}
      {preview && (
        <div
          className="iso-preview"
          style={{
            '--tc': preview.tile.color,
            left: preview.x,
            top: preview.y,
            transform: preview.tile.hintPos === 'top'
              ? 'translate(-50%, calc(-100% - 4px))'
              : 'translate(-50%, 0)',
          } as React.CSSProperties}
        >
          <div className="iso-preview-title">
            <span className="iso-preview-swatch"/>
            <b>{preview.tile.name}</b>
          </div>
          <div className="iso-preview-go">
            <span>ENTER {preview.tile.name.toUpperCase()}</span>
            <span>↵</span>
          </div>
        </div>
      )}
    </div>
  );
}
