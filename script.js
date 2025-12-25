// === KONFIG ===
const VALUTAKURS_EUR_TIL_NOK = 11.5; // juster ved behov

let steder = []; // fylles fra tettsteder.json når siden lastes

// === STARTUP ===
document.addEventListener('DOMContentLoaded', () => {
  console.log("✅ Init startet");

  // last tettsteder
  fetch('tettsteder.json')
    .then(res => res.json())
    .then(data => {
      steder = data;
      window.steder = data; // gjør tilgjengelig i konsollen
      console.log(`✅ Lastet tettsteder.json – ${steder.length} poster`);
    })
    .catch(err => {
      console.error("🚨 Klarte ikke å laste tettsteder.json:", err);
      settStatus("Klarte ikke å laste tettsted-data.", false);
    });

  // knapper
  document.getElementById('visInfoBtn').addEventListener('click', visTettsted);
  document.getElementById('btnValider').addEventListener('click', () => validerSoner(steder));
  document.getElementById('btnAntall').addEventListener('click', () => antallPerSone(steder));
  document.getElementById('btnTestPris').addEventListener('click', testAlleSoner);

  console.log("✅ Init fullført");
});

// === HJELPERE ===
function settStatus(tekst, ok) {
  const el = document.getElementById('status');
  el.textContent = tekst;
  el.className = 'status ' + (ok ? 'status-ok' : 'status-error');
}

function normaliserTettstedNavn(str) {
  return str.trim().toLowerCase();
}

// === HOVEDFUNKSJON – vis info om tettsted ===
async function visTettsted() {
  console.log("✅ visTettsted() ble kalt");
  const input = document.getElementById('sokInput').value;
  const søk = normaliserTettstedNavn(input);

  if (!søk) {
    settStatus("Skriv inn et tettsted først.", false);
    return;
  }

  if (!steder || steder.length === 0) {
    settStatus("Tettstedsdata ikke lastet ennå.", false);
    return;
  }

  const entry = steder.find(e => normaliserTettstedNavn(e.tettsted) === søk);

  if (!entry) {
    settStatus(`Fant ikke tettstedet "${input}".`, false);
    oppdaterFelter(null, null);
    return;
  }

  console.log("✅ Fant entry:", entry);

  // hent spotpris basert på sone
  const sone = entry.sone;
  console.log("Sone som sendes til API:", sone);

  const pris = await hentSpotpris(sone);

  if (pris == null) {
    settStatus(`Fant data for ${entry.tettsted}, men ingen strømpris for sone ${sone}.`, false);
  } else {
    settStatus(`Fant data for ${entry.tettsted} (sone ${sone}).`, true);
  }

  oppdaterFelter(entry, pris);
}

// === OPPDATER UI ===
function oppdaterFelter(entry, pris) {
  const tettstedEl = document.getElementById('tettstedDisplay');
  const prisEl = document.getElementById('prisDisplay');
  const kNrEl = document.getElementById('kNrDisplay');
  const fylkeEl = document.getElementById('fylkeDisplay');
  const soneEl = document.getElementById('soneDisplay');
  const antallEl = document.getElementById('antallDisplay');

  if (!entry) {
    tettstedEl.textContent = '–';
    prisEl.textContent = '–';
    kNrEl.textContent = '–';
    fylkeEl.textContent = '–';
    soneEl.textContent = '–';
    antallEl.textContent = '–';
    return;
  }

  tettstedEl.textContent = entry.tettsted ?? '–';
  kNrEl.textContent = entry.k_nr ?? '–';
  fylkeEl.textContent = entry.fylke ?? '–';
  soneEl.textContent = entry.sone ?? '–';
  antallEl.textContent = entry.antall ?? '–';

  if (pris == null) {
    prisEl.textContent = 'Ingen pris tilgjengelig';
  } else {
    const øre = (pris * 100).toFixed(2);
    prisEl.textContent = `${øre} øre/kWh (inkl. MVA, ca.)`;
  }
}

// === HENT SPOTPRIS FRA ENERGI-DATASERVICE ===
async function hentSpotpris(sone) {
  const url =
    `https://api.energidataservice.dk/dataset/Elspotprices` +
    `?filter={"PriceArea":"${sone}"}` +
    `&limit=1&sort=HourUTC desc`;

  console.log("Henter norsk spotpris:", url);

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.records || data.records.length === 0) {
      console.warn("⚠ Ingen data for norsk prisområde:", sone);
      return null;
    }

    const eurMWh = data.records[0].SpotPriceEUR;
    if (eurMWh == null) {
      console.warn("⚠ SpotPriceEUR mangler i responsen for sone:", sone);
      return null;
    }

    const nokPerKWh = eurMWh * VALUTAKURS_EUR_TIL_NOK / 1000;
    console.log(`Sone ${sone}: ${nokPerKWh} NOK/kWh`);
    return nokPerKWh;

  } catch (error) {
    console.error("🚨 Feil ved henting av norsk spotpris:", error);
    return null;
  }
}

// === DEBUG-FUNKSJONER ===
function validerSoner(data) {
  if (!data || !data.length) {
    console.warn("Ingen data å validere (steder er tom / ikke lastet).");
    return;
  }

  const gyldige = ["NO1", "NO2", "NO3", "NO4", "NO5"];
  const feil = data.filter(e => !gyldige.includes(e.sone));

  if (feil.length === 0) {
    console.log("✅ Alle tettsteder har gyldig sone (NO1–NO5)");
  } else {
    console.warn("⚠ Fant ugyldige soner:", feil);
  }
}

function antallPerSone(data) {
  if (!data || !data.length) {
    console.warn("Ingen data å telle (steder er tom / ikke lastet).");
    return;
  }

  const resultat = {};

  data.forEach(e => {
    resultat[e.sone] = (resultat[e.sone] || 0) + 1;
  });

  console.log("📊 Antall tettsteder per sone:", resultat);
}

async function testAlleSoner() {
  const soner = ["NO1", "NO2", "NO3", "NO4", "NO5"];
  console.log("🔍 Tester spotpris for alle soner...");

  for (const sone of soner) {
    const pris = await hentSpotpris(sone);
    console.log(
      `Sone ${sone}:`,
      pris ? `${(pris * 100).toFixed(2)} øre/kWh` : "Ingen pris"
    );
  }

  console.log("✅ testAlleSoner ferdig");
}