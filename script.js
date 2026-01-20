// === CONFIG (EDIT AFTER LAUNCH) ===
const CONTRACT_ADDRESS = ""; // paste CA here
const CHAIN = "solana";

// Social links
document.getElementById("xLink").href = "#";
document.getElementById("tgLink").href = "#";
document.getElementById("buyLink").href = "#";
document.getElementById("chartLink").href = "#";

const statusText = document.getElementById("statusText");
const caText = document.getElementById("caText");
const copyBtn = document.getElementById("copyCA");

if(!CONTRACT_ADDRESS){
  statusText.textContent = "Waiting for launch…";
}else{
  statusText.textContent = "Live";
  caText.textContent = CONTRACT_ADDRESS;
  copyBtn.disabled = false;

  copyBtn.onclick = () => {
    navigator.clipboard.writeText(CONTRACT_ADDRESS);
  };

  fetchData();
  setInterval(fetchData, 15000);
}

async function fetchData(){
  try{
    const url = `https://api.dexscreener.com/latest/dex/tokens/${CONTRACT_ADDRESS}`;
    const res = await fetch(url);
    const data = await res.json();
    const pair = data.pairs?.[0];
    if(!pair) return;

    document.getElementById("price").textContent = `$${Number(pair.priceUsd).toFixed(6)}`;
    document.getElementById("mc").textContent = `$${Number(pair.fdv).toLocaleString()}`;
    document.getElementById("liq").textContent = `$${Number(pair.liquidity.usd).toLocaleString()}`;
    document.getElementById("vol").textContent = `$${Number(pair.volume.h24).toLocaleString()}`;
  }catch(e){
    console.error(e);
  }
}
