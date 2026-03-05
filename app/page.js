"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";

const RAKUTEN_SPU_ITEMS = [
  { id: "rakuten_mobile", label: "楽天モバイル", rate: 4, desc: "+4倍（要エントリー）" },
  { id: "rakuten_mobile_carrier", label: "楽天モバイル キャリア決済", rate: 2, desc: "+2倍（月2,000円以上）" },
  { id: "rakuten_turbo_hikari", label: "Rakuten Turbo／楽天ひかり", rate: 2, desc: "+2倍（要エントリー）" },
  { id: "rakuten_card", label: "楽天カード（通常+特典）", rate: 2, desc: "+2倍" },
  { id: "rakuten_bank", label: "楽天銀行+楽天カード", rate: 0.5, desc: "最大+0.5倍（引落+給与受取）" },
  { id: "rakuten_securities", label: "楽天証券 投資信託", rate: 0.5, desc: "+0.5倍（月3万円以上）" },
  { id: "rakuten_securities_us", label: "楽天証券 米国株式", rate: 0.5, desc: "+0.5倍（月3万円以上）" },
  { id: "rakuten_wallet", label: "楽天ウォレット", rate: 0.5, desc: "+0.5倍（月3万円以上）" },
  { id: "rakuten_denki", label: "楽天でんき", rate: 0.5, desc: "+0.5倍（前月5,500円以上）" },
  { id: "rakuten_travel", label: "楽天トラベル", rate: 1, desc: "+1倍（月1回利用）" },
  { id: "rakuten_books", label: "楽天ブックス", rate: 0.5, desc: "+0.5倍（1回3,000円以上）" },
  { id: "rakuten_kobo", label: "楽天Kobo", rate: 0.5, desc: "+0.5倍（1回3,000円以上）" },
  { id: "rakuten_rakuma", label: "楽天ラクマ", rate: 0.5, desc: "+0.5倍（月1回販売）" },
  { id: "rakuten_fashion", label: "Rakuten Fashionアプリ", rate: 0.5, desc: "+0.5倍" },
  { id: "rakuten_beauty", label: "楽天ビューティ", rate: 0.5, desc: "+0.5倍（月1回利用）" },
  { id: "rakuten_pasha", label: "Rakuten Pasha", rate: 0.5, desc: "+0.5倍" },
  { id: "rakuten_kdreams", label: "楽天Kドリームス", rate: 0.5, desc: "+0.5倍" },
];

const AMAZON_CONDITIONS = [
  { id: "prime", label: "プライム会員", rate: 0.5, desc: "+0.5%" },
  { id: "mastercard", label: "Amazon Mastercard", rate: 1.5, desc: "+1.5%" },
  { id: "prime_mastercard", label: "Prime Mastercard", rate: 2.0, desc: "+2.0% (Prime+MC)" },
];

const LS_KEY = "price-sim-settings";

function loadSettings() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function saveSettings(data) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch {}
}

function parseRakutenUrl(url) {
  try {
    // https://item.rakuten.co.jp/{shopCode}/{itemId}/
    const m = url.match(/item\.rakuten\.co\.jp\/([^/]+)\/([^/?#]+)/);
    if (m) return { shopCode: m[1], itemId: m[2], itemCode: `${m[1]}:${m[2]}` };
    return null;
  } catch { return null; }
}

function formatYen(n) { return "\u00a5" + Math.round(n).toLocaleString(); }

function ResultBar({ label, actual, color, maxVal }) {
  const pct = maxVal > 0 ? (actual / maxVal) * 100 : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text)", letterSpacing: "0.03em" }}>{label}</span>
        <span style={{ fontWeight: 800, fontSize: 15, color }}>{formatYen(actual)}</span>
      </div>
      <div style={{ background: "var(--border)", borderRadius: 6, height: 18, overflow: "hidden" }}>
        <div style={{
          width: `${Math.min(pct, 100)}%`, height: "100%",
          background: `linear-gradient(90deg, ${color}cc, ${color})`,
          borderRadius: 6, transition: "width 0.5s cubic-bezier(.4,0,.2,1)",
          boxShadow: `0 0 12px ${color}44`,
        }} />
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, color }) {
  return (
    <button onClick={() => onChange(!checked)} style={{
      width: 38, height: 20, borderRadius: 10, border: "none",
      background: checked ? color : "var(--border2)", position: "relative",
      cursor: "pointer", transition: "background 0.2s", flexShrink: 0,
    }}>
      <div style={{
        width: 16, height: 16, borderRadius: 8, background: "#fff",
        position: "absolute", top: 2, left: checked ? 20 : 2,
        transition: "left 0.2s cubic-bezier(.4,0,.2,1)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
      }} />
    </button>
  );
}

function NumInput({ value, onChange, placeholder, prefix }) {
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      {prefix && <span style={{ position: "absolute", left: 12, color: "var(--text-dim)", fontSize: 14, fontWeight: 600, pointerEvents: "none" }}>{prefix}</span>}
      <input type="number" value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", padding: prefix ? "10px 12px 10px 28px" : "10px 12px",
          background: "var(--bg)", border: "1px solid var(--border2)", borderRadius: 8,
          color: "var(--text)", fontSize: 15, fontFamily: "'DM Mono', monospace", outline: "none",
        }}
        onFocus={(e) => (e.target.style.borderColor = "var(--gold)")}
        onBlur={(e) => (e.target.style.borderColor = "var(--border2)")}
      />
    </div>
  );
}

function Pill({ text, color }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 10,
      background: `${color}18`, color: `${color}cc`, border: `1px solid ${color}33`,
      display: "inline-flex", alignItems: "center", gap: 4,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, display: "inline-block" }} />
      {text}
    </span>
  );
}

function Toast({ visible, text }) {
  return (
    <div style={{
      position: "fixed", bottom: 24, left: "50%",
      transform: `translateX(-50%) translateY(${visible ? 0 : 60}px)`,
      opacity: visible ? 1 : 0, transition: "all 0.35s cubic-bezier(.4,0,.2,1)",
      background: "var(--gold)", color: "var(--bg)", padding: "8px 20px",
      borderRadius: 24, fontSize: 12, fontWeight: 700,
      boxShadow: "0 4px 20px rgba(212,168,83,0.3)", pointerEvents: "none", zIndex: 100,
    }}>
      {text}
    </div>
  );
}

export default function Home() {
  const [rPrice, setRPrice] = useState("");
  const [rShip, setRShip] = useState("0");
  const [rUrl, setRUrl] = useState("");
  const [rFetch, setRFetch] = useState("idle");
  const [rName, setRName] = useState("");
  const [rImg, setRImg] = useState("");
  const [aPrice, setAPrice] = useState("");
  const [aShip, setAShip] = useState("0");
  const [aName, setAName] = useState("");
  const [shops, setShops] = useState("1");
  const [spu, setSpu] = useState({});
  const [amz, setAmz] = useState({});
  const [d50, setD50] = useState(false);
  const [sale, setSale] = useState(false);
  const [tab, setTab] = useState("product");
  const [toast, setToast] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [appId, setAppId] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const [fetchErr, setFetchErr] = useState("");
  const saveRef = useRef(null);

  useEffect(() => {
    const d = loadSettings();
    if (d) {
      if (d.spu) setSpu(d.spu);
      if (d.amz) setAmz(d.amz);
      if (d.shops) setShops(d.shops);
      if (d.d50 !== undefined) setD50(d.d50);
      if (d.sale !== undefined) setSale(d.sale);
      if (d.appId) setAppId(d.appId);
      if (d.accessKey) setAccessKey(d.accessKey);
    }
    setLoaded(true);

    // Read Amazon data from URL params (sent by bookmarklet)
    const url = new URL(window.location.href);
    const ap = url.searchParams.get("aPrice");
    const as2 = url.searchParams.get("aShip");
    const an = url.searchParams.get("aName");
    if (ap) setAPrice(ap);
    if (as2) setAShip(as2);
    if (an) setAName(decodeURIComponent(an));
    // Clean URL params without reload
    if (ap || an) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (saveRef.current) clearTimeout(saveRef.current);
    saveRef.current = setTimeout(() => {
      saveSettings({ spu, amz, shops, d50, sale, appId, accessKey });
      setToast("✓ 設定を保存しました");
      setTimeout(() => setToast(""), 1800);
    }, 600);
    return () => { if (saveRef.current) clearTimeout(saveRef.current); };
  }, [spu, amz, shops, d50, sale, appId, accessKey, loaded]);

  const toggleSpu = useCallback((id) => setSpu((p) => ({ ...p, [id]: !p[id] })), []);
  const toggleAmz = useCallback((id) => setAmz((p) => ({ ...p, [id]: !p[id] })), []);

  const handleReset = useCallback(() => {
    setSpu({}); setAmz({}); setShops("1"); setD50(false); setSale(false); setAppId(""); setAccessKey("");
    try { localStorage.removeItem(LS_KEY); } catch {}
  }, []);

  const handleFetchRakuten = useCallback(async () => {
    if (!rUrl.trim()) return;
    if (!appId.trim()) { setFetchErr("楽天アプリIDを「楽天設定」タブで入力してください"); setRFetch("error"); return; }
    const parsed = parseRakutenUrl(rUrl);
    if (!parsed) { setFetchErr("楽天市場の商品URLを正しく入力してください\n例: https://item.rakuten.co.jp/shop/itemid/"); setRFetch("error"); return; }

    setRFetch("loading"); setFetchErr(""); setRName(""); setRImg("");

    try {
      // Use shopCode + keyword search (more reliable than itemCode on new API)
      const params = new URLSearchParams({ appId, keyword: parsed.itemId, shopCode: parsed.shopCode });
      if (accessKey) params.set("accessKey", accessKey);
      let res = await fetch(`/api/rakuten?${params}`);
      let data = await res.json();

      // If shopCode+keyword fails, try keyword only with shop name
      if (data.error) {
        const params2 = new URLSearchParams({ appId, keyword: `${parsed.shopCode} ${parsed.itemId}` });
        if (accessKey) params2.set("accessKey", accessKey);
        res = await fetch(`/api/rakuten?${params2}`);
        data = await res.json();
      }

      if (data.error) throw new Error(data.error);

      if (data.Items && data.Items.length > 0) {
        // Try to find exact match by itemCode
        let item = data.Items.find((i) => i.itemCode === parsed.itemCode) || data.Items[0];
        setRPrice(String(item.itemPrice || ""));
        setRName(item.itemName || "");
        if (item.postageFlag === 1) setRShip("0");
        if (item.mediumImageUrls && item.mediumImageUrls.length > 0) {
          setRImg(item.mediumImageUrls[0].replace("?_ex=128x128", "?_ex=200x200"));
        }
        setRFetch("success");
      } else {
        setFetchErr("商品が見つかりませんでした。URLを確認してください。"); setRFetch("error");
      }
    } catch (err) {
      setFetchErr(err.message || "取得に失敗しました"); setRFetch("error");
    }
  }, [rUrl, appId, accessKey]);

  const result = useMemo(() => {
    const rp = parseFloat(rPrice) || 0, rs = parseFloat(rShip) || 0;
    const ap = parseFloat(aPrice) || 0, as2 = parseFloat(aShip) || 0;
    let mult = 1;
    RAKUTEN_SPU_ITEMS.forEach((i) => { if (spu[i.id]) mult += i.rate; });
    mult += Math.min(Math.max(parseInt(shops) || 1, 1), 10) - 1;
    if (d50) mult += 3;
    if (sale) mult += 1;
    const cm = Math.min(mult, 18);
    const rPts = Math.round((rp / 1.1) * (cm / 100));
    const rTot = rp + rs, rAct = rTot - rPts;
    let aRate = 1;
    if (amz["prime"] && amz["mastercard"]) aRate = 2.5;
    else if (amz["prime_mastercard"]) aRate = 2.5;
    else if (amz["mastercard"]) aRate = 2;
    else if (amz["prime"]) aRate = 1.5;
    const aPts = Math.round(ap * (aRate / 100));
    const aTot = ap + as2, aAct = aTot - aPts;
    const diff = rAct - aAct;
    return { rTot, rPts, rAct, cm, aTot, aPts, aAct, aRate, diff,
      winner: diff < 0 ? "r" : diff > 0 ? "a" : "t",
      has: rp > 0 || ap > 0 };
  }, [rPrice, rShip, aPrice, aShip, spu, amz, shops, d50, sale]);

  const RC = "var(--rakuten)", AC = "var(--amazon)", G = "var(--gold)";
  const rcRaw = "#BF0000", acRaw = "#FF9900", gRaw = "#d4a853";
  const spuN = RAKUTEN_SPU_ITEMS.filter((i) => spu[i.id]).length;
  const amzN = AMAZON_CONDITIONS.filter((i) => amz[i.id]).length;
  const tabs = [{ id: "product", l: "商品情報" }, { id: "rakuten", l: "楽天設定" }, { id: "amazon", l: "Amazon設定" }];

  if (!loaded) return <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ color: "var(--text-muted)", fontSize: 13 }}>読み込み中...</div></div>;

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 16px 80px" }}>
      <Toast visible={!!toast} text={toast} />

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 28, maxWidth: 440, width: "100%" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.2em", color: gRaw, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>REAL PRICE SIMULATOR</div>
        <h1 style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.3, fontFamily: "'DM Sans', sans-serif" }}>
          <span style={{ color: rcRaw }}>楽天</span> vs <span style={{ color: acRaw }}>Amazon</span>
        </h1>
        <p style={{ fontSize: 12, color: "var(--text-dim)", margin: "6px 0 0" }}>ポイント還元込みの実質価格を比較</p>
        {(spuN > 0 || amzN > 0) && (
          <div style={{ marginTop: 8, display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
            {spuN > 0 && <Pill text={`SPU ${spuN}件・${result.cm}倍`} color={rcRaw} />}
            {amzN > 0 && <Pill text={`Amazon ${result.aRate}%還元`} color={acRaw} />}
          </div>
        )}
      </div>

      <div style={{ maxWidth: 440, width: "100%" }}>
        {/* Result */}
        {result.has && (
          <div style={{ background: "linear-gradient(135deg, var(--surface), var(--surface2))", borderRadius: 16, padding: 20, marginBottom: 20, border: `1px solid ${gRaw}22`, boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
            {result.diff !== 0 && (
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <span style={{
                  display: "inline-block", padding: "4px 16px", borderRadius: 20, fontSize: 12, fontWeight: 800,
                  background: result.winner === "r" ? `${rcRaw}22` : `${acRaw}22`,
                  color: result.winner === "r" ? rcRaw : acRaw,
                  border: `1px solid ${result.winner === "r" ? rcRaw : acRaw}44`,
                }}>
                  {result.winner === "r" ? "楽天がお得！" : "Amazonがお得！"}　差額 {formatYen(Math.abs(result.diff))}
                </span>
              </div>
            )}
            <ResultBar label="楽天 実質価格" actual={result.rAct} color={rcRaw} maxVal={Math.max(result.rAct, result.aAct) * 1.05} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginBottom: 16, marginTop: -6, padding: "0 2px" }}>
              <span>支払: {formatYen(result.rTot)}</span><span>還元: -{formatYen(result.rPts)}（{result.cm}倍）</span>
            </div>
            <ResultBar label="Amazon 実質価格" actual={result.aAct} color={acRaw} maxVal={Math.max(result.rAct, result.aAct) * 1.05} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginTop: -6, padding: "0 2px" }}>
              <span>支払: {formatYen(result.aTot)}</span><span>還元: -{formatYen(result.aPts)}（{result.aRate}%）</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "var(--surface)", borderRadius: 12, padding: 3 }}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: "10px 0", border: "none", borderRadius: 10, fontSize: 12,
              fontWeight: tab === t.id ? 700 : 500, cursor: "pointer", transition: "all 0.2s",
              background: tab === t.id ? "var(--border)" : "transparent",
              color: tab === t.id ? "var(--text)" : "var(--text-muted)", fontFamily: "inherit",
            }}>{t.l}</button>
          ))}
        </div>

        {/* ===== PRODUCT ===== */}
        {tab === "product" && (
          <div style={{ background: "var(--surface)", borderRadius: 14, padding: 20, border: "1px solid var(--border)" }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: rcRaw }} />
                <span style={{ fontSize: 13, fontWeight: 700 }}>楽天市場</span>
                {appId && <Pill text="API連携ON" color={rcRaw} />}
              </div>

              {appId && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4, fontWeight: 600 }}>商品URL</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input type="text" value={rUrl}
                      onChange={(e) => { setRUrl(e.target.value); setRFetch("idle"); setFetchErr(""); }}
                      placeholder="https://item.rakuten.co.jp/..."
                      style={{
                        flex: 1, padding: "10px 12px", background: "var(--bg)", border: "1px solid var(--border2)",
                        borderRadius: 8, color: "var(--text)", fontSize: 12, fontFamily: "'DM Mono', monospace", outline: "none",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = rcRaw)}
                      onBlur={(e) => (e.target.style.borderColor = "var(--border2)")}
                      onKeyDown={(e) => { if (e.key === "Enter") handleFetchRakuten(); }}
                    />
                    <button onClick={handleFetchRakuten} disabled={rFetch === "loading"} style={{
                      padding: "10px 16px", background: rcRaw, border: "none", borderRadius: 8,
                      color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer",
                      opacity: rFetch === "loading" ? 0.6 : 1, fontFamily: "inherit", whiteSpace: "nowrap",
                    }}>
                      {rFetch === "loading" ? "取得中..." : "価格取得"}
                    </button>
                  </div>
                  {rFetch === "error" && <div style={{ marginTop: 6, fontSize: 11, color: "#ff6b6b", lineHeight: 1.4 }}>{fetchErr}</div>}
                  {rFetch === "success" && rName && (
                    <div style={{
                      marginTop: 10, padding: 10, background: "var(--bg)", borderRadius: 8,
                      border: `1px solid ${rcRaw}33`, display: "flex", gap: 10, alignItems: "center",
                    }}>
                      {rImg && <img src={rImg} alt="" style={{ width: 48, height: 48, borderRadius: 6, objectFit: "cover", flexShrink: 0, background: "var(--surface2)" }}
                        onError={(e) => { e.target.style.display = "none"; }} />}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{rName}</div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: rcRaw, marginTop: 2, fontFamily: "'DM Mono', monospace" }}>{formatYen(parseFloat(rPrice) || 0)}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 2 }}>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4, fontWeight: 600 }}>
                    商品価格（税込）{rFetch === "success" && <span style={{ color: gRaw }}> ← API取得済</span>}
                  </div>
                  <NumInput value={rPrice} onChange={setRPrice} placeholder="10000" prefix="¥" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4, fontWeight: 600 }}>送料</div>
                  <NumInput value={rShip} onChange={setRShip} placeholder="0" prefix="¥" />
                </div>
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: acRaw }} />
                <span style={{ fontSize: 13, fontWeight: 700 }}>Amazon</span>
                {aName ? <Pill text="ブックマークレット取得済" color={acRaw} /> : <span style={{ fontSize: 10, color: "var(--text-faint)", fontStyle: "italic" }}>手動入力 or ブックマークレット</span>}
              </div>
              {aName && (
                <div style={{
                  marginBottom: 14, padding: 10, background: "var(--bg)", borderRadius: 8,
                  border: `1px solid ${acRaw}33`,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{aName}</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: acRaw, marginTop: 2, fontFamily: "'DM Mono', monospace" }}>{formatYen(parseFloat(aPrice) || 0)}</div>
                </div>
              )}
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 2 }}>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4, fontWeight: 600 }}>
                    商品価格（税込）{aName && <span style={{ color: acRaw }}> ← 自動取得済</span>}
                  </div>
                  <NumInput value={aPrice} onChange={(v) => { setAPrice(v); if (!v) setAName(""); }} placeholder="9800" prefix="¥" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4, fontWeight: 600 }}>送料</div>
                  <NumInput value={aShip} onChange={setAShip} placeholder="0" prefix="¥" />
                </div>
              </div>
              {aName && (
                <div style={{ marginTop: 8, fontSize: 10, color: "#ff9966", lineHeight: 1.5 }}>
                  ⚠ ブックマークレットはタイムセール等で税抜価格を取得する場合があります。Amazonの商品ページで税込価格をご確認のうえ、必要に応じて修正してください。
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== RAKUTEN ===== */}
        {tab === "rakuten" && (
          <div style={{ background: "var(--surface)", borderRadius: 14, padding: 20, border: "1px solid var(--border)" }}>
            <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: gRaw }} />楽天アプリID
                </div>
                <Pill text="自動保存" color={gRaw} />
              </div>
              <input type="text" value={appId} onChange={(e) => setAppId(e.target.value)}
                placeholder="Application ID"
                style={{
                  width: "100%", padding: "10px 12px", background: "var(--bg)", border: "1px solid var(--border2)",
                  borderRadius: 8, color: "var(--text)", fontSize: 12, fontFamily: "'DM Mono', monospace", outline: "none", boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = gRaw)}
                onBlur={(e) => (e.target.style.borderColor = "var(--border2)")}
              />
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4, fontWeight: 600 }}>Access Key</div>
                <input type="text" value={accessKey} onChange={(e) => setAccessKey(e.target.value)}
                  placeholder="Access Key（アプリ詳細画面で確認）"
                  style={{
                    width: "100%", padding: "10px 12px", background: "var(--bg)", border: "1px solid var(--border2)",
                    borderRadius: 8, color: "var(--text)", fontSize: 12, fontFamily: "'DM Mono', monospace", outline: "none", boxSizing: "border-box",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = gRaw)}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border2)")}
                />
              </div>
              <div style={{ marginTop: 6, fontSize: 10, color: "var(--text-faint)", lineHeight: 1.6 }}>
                <a href="https://webservice.rakuten.co.jp/" target="_blank" rel="noopener noreferrer" style={{ color: gRaw, textDecoration: "none" }}>楽天Developers</a> → Your Apps → Application ID と Access Key の2つが必要です
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: rcRaw }} />SPU
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {RAKUTEN_SPU_ITEMS.map((item) => (
                <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                    <Toggle checked={!!spu[item.id]} onChange={() => toggleSpu(item.id)} color={rcRaw} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{item.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>買いまわり店舗数</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <input type="range" min="1" max="10" value={shops} onChange={(e) => setShops(e.target.value)} style={{ flex: 1, accentColor: rcRaw }} />
                <span style={{ fontSize: 18, fontWeight: 800, fontFamily: "'DM Mono', monospace", color: rcRaw, minWidth: 36, textAlign: "right" }}>{shops}店</span>
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>開催中イベント</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div><div style={{ fontSize: 12, fontWeight: 600 }}>5と0のつく日</div><div style={{ fontSize: 10, color: "var(--text-muted)" }}>+3倍</div></div>
                  <Toggle checked={d50} onChange={setD50} color={rcRaw} />
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div><div style={{ fontSize: 12, fontWeight: 600 }}>スーパーSALE期間中</div><div style={{ fontSize: 10, color: "var(--text-muted)" }}>+1倍</div></div>
                  <Toggle checked={sale} onChange={setSale} color={rcRaw} />
                </div>
              </div>
            </div>

            <div style={{ marginTop: 16, padding: "12px 16px", background: `${rcRaw}11`, borderRadius: 10, border: `1px solid ${rcRaw}33`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>合計ポイント倍率</span>
              <span style={{ fontSize: 22, fontWeight: 900, color: rcRaw, fontFamily: "'DM Mono', monospace" }}>{result.cm}倍</span>
            </div>
          </div>
        )}

        {/* ===== AMAZON ===== */}
        {tab === "amazon" && (
          <div style={{ background: "var(--surface)", borderRadius: 14, padding: 20, border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: acRaw }} />Amazon ポイント条件
              </div>
              <Pill text="自動保存" color={gRaw} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {AMAZON_CONDITIONS.map((item) => (
                <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Toggle checked={!!amz[item.id]} onChange={() => toggleAmz(item.id)} color={acRaw} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{item.label}</div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{item.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20, padding: "12px 16px", background: `${acRaw}11`, borderRadius: 10, border: `1px solid ${acRaw}33`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>合計ポイント還元率</span>
              <span style={{ fontSize: 22, fontWeight: 900, color: acRaw, fontFamily: "'DM Mono', monospace" }}>{result.aRate}%</span>
            </div>
          </div>
        )}

        {/* Reset */}
        <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
          <button onClick={handleReset} style={{
            padding: "8px 20px", background: "transparent", border: "1px solid var(--border2)",
            borderRadius: 8, color: "var(--text-muted)", fontSize: 11, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
          }}
            onMouseEnter={(e) => { e.target.style.borderColor = gRaw; e.target.style.color = gRaw; }}
            onMouseLeave={(e) => { e.target.style.borderColor = ""; e.target.style.color = ""; }}
          >全設定をリセット</button>
        </div>

        <div style={{ marginTop: 16, padding: 16, fontSize: 10, color: "var(--text-faint)", lineHeight: 1.7, textAlign: "center" }}>
          ※ 計算結果は概算です。SPU最大18倍。各項目にポイント上限があり、実際の付与と異なる場合があります。<br />
          SPU条件は2026年3月時点の公式情報に基づいています。設定はブラウザに自動保存されます。
        </div>
      </div>
    </main>
  );
}
