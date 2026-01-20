/* =========================
   The Royal Jerk — Frontend Only
   - Paste CA when live
   - Pulls stats from Dexscreener
   - Builds a clean chart embed
   ========================= */

const CONFIG = {
  COIN_NAME: "THE ROYAL JERK",

  // Paste your CA later:
  CONTRACT_ADDRESS: "",

  // Set these now or later:
  LINKS: {
    X: "#",
    TG: "#",
    BUY: "#",     // e.g. Jupiter swap link later
    CHART: "#"    // optional override; otherwise auto-embed Dex chart
  },

  REFRESH_MS: 15000
};

/* ---------- Helpers ---------- */
const $ = (id) => document.getElementById(id);

function formatUSD(n, decimals = 2){
  const num = Number(n);
  if (!Number.isFinite(num)) return "—";
  if (num >= 1e9) return `$${(num/1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num/1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num/1e3).toFixed(2)}K`;
  return `$${num.toFixed(decimals)}`;
}

function formatPrice(n){
  const num = Number(n);
  if (!Number.isFinite(num)) return "—";
  if (num >= 1) return `$${num.toFixed(6)}`;
  if (num >= 0.01) return `$${num.toFixed(8)}`;
  return `$${num.toPrecision(4)}`;
}

function shortCA(ca){
  if (!ca || ca.length < 10) return ca || "TBA";
  return `${ca.slice(0, 4)}…${ca.slice(-4)}`;
}

let toastEl;
function toast(msg){
  if (!toastEl){
    toastEl = document.createElement("div");
    toastEl.className = "toast";
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), 1400);
}

/* ---------- Wire links ---------- */
function setLink(id, href){
  const el = $(id);
  if (!el) return;
  el.href = href || "#";
}

setLink("xLink", CONFIG.LINKS.X);
setLink("tgLink", CONFIG.LINKS.TG);
setLink("buyLink", CONFIG.LINKS.BUY);

const statusText = $("statusText");
const caText = $("caText");
const copyBtn = $("copyCA");
const dot = $("dot");

/* Optional IDs in your HTML (safe if missing) */
const k_price = $("price");
const k_mc = $("mc");
const k_liq = $("liq");
const k_vol = $("vol");
const k_buys = $("buys");
const k_sells = $("sells");
const k_change = $("change");
const chartLink = $("chartLink");

/* If you have a container like <div id="chartEmbed" class="chartFrame"></div> */
const chartEmbed = $("chartEmbed");

/* ---------- Initial state ---------- */
const CA = (CONFIG.CONTRACT_ADDRESS || "").trim();

if (!CA){
  if (statusText) statusText.textContent = "Waiting for launch CA…";
  if (caText) caText.textContent = "TBA — paste CA in script.js";
  if (copyBtn) copyBtn.disabled = true;
  if (dot) dot.style.filter = "grayscale(1)";
  if (chartLink) chartLink.href = "#";
} else {
  bootLive();
}

function bootLive(){
  if (statusText) statusText.textContent = "Live • tracking in real time";
  if (dot) dot.style.filter = "none";

  if (caText) caText.textContent = CA;
  if (copyBtn){
    copyBtn.disabled = false;
    copyBtn.addEventListener("click", async () => {
      try{
        await navigator.clipboard.writeText(CA);
        toast("CA copied");
      }catch{
        toast("Copy failed");
      }
    });
  }

  // Build chart link + embed (Dexscreener)
  const dexChartUrl = `https://dexscreener.com/solana/${CA}`;
  const chartUrl = (CONFIG.LINKS.CHART && CONFIG.LINKS.CHART !== "#") ? CONFIG.LINKS.CHART : dexChartUrl;

  if (chartLink) chartLink.href = chartUrl;

  if (chartEmbed){
    // Dexscreener embed works via their "embed" endpoint.
    // If Dex changes their embed behavior, you can swap this to a different iframe source later.
    const src = `https://dexscreener.com/solana/${CA}?embed=1&theme=dark&trades=0&info=0`;
    chartEmbed.innerHTML = `<iframe src="${src}" loading="lazy" referrerpolicy="no-referrer"></iframe>`;
  }

  // Start fetching
  fetchAndRender();
  setInterval(fetchAndRender, CONFIG.REFRESH_MS);
}

/* ---------- Data fetch (Dexscreener) ---------- */
async function fetchAndRender(){
  try{
    const url = `https://api.dexscreener.com/latest/dex/tokens/${CA}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // Pick the best pair: highest liquidity in USD
    const pairs = Array.isArray(data.pairs) ? data.pairs : [];
    if (!pairs.length) return;

    const best = pairs
      .slice()
      .sort((a,b) => (b?.liquidity?.usd || 0) - (a?.liquidity?.usd || 0))[0];

    // Safely extract fields
    const priceUsd = best?.priceUsd;
    const fdv = best?.fdv; // Dex uses fdv for marketcap-ish; sometimes it's FDV
    const liqUsd = best?.liquidity?.usd;
    const vol24 = best?.volume?.h24;
    const buys24 = best?.txns?.h24?.buys;
    const sells24 = best?.txns?.h24?.sells;
    const change24 = best?.priceChange?.h24;

    // Render (only if elements exist)
    if (k_price) k_price.textContent = formatPrice(priceUsd);
    if (k_mc) k_mc.textContent = formatUSD(fdv, 0);
    if (k_liq) k_liq.textContent = formatUSD(liqUsd, 0);
    if (k_vol) k_vol.textContent = formatUSD(vol24, 0);
    if (k_buys) k_buys.textContent = Number.isFinite(Number(buys24)) ? `${buys24}` : "—";
    if (k_sells) k_sells.textContent = Number.isFinite(Number(sells24)) ? `${sells24}` : "—";

    if (k_change){
      if (Number.isFinite(Number(change24))){
        const n = Number(change24);
        const sign = n > 0 ? "+" : "";
        k_change.textContent = `${sign}${n.toFixed(2)}%`;
        k_change.style.color = n >= 0 ? "var(--gold)" : "var(--red)";
      } else {
        k_change.textContent = "—";
        k_change.style.color = "";
      }
    }

    // Update “last update” if you included an element with id="updated"
    const updated = $("updated");
    if (updated){
      const now = new Date();
      updated.textContent = `Updated ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }

  }catch(e){
    // Keep quiet but visible if you added an element id="statusErr"
    const err = $("statusErr");
    if (err) err.textContent = "Data temporarily unavailable";
    console.error("[RoyalJerk] fetch error:", e);
  }
}
