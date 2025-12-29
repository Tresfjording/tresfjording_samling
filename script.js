let kommuneData = [];

// Hent JSON-data fra filen
fetch("data/kommuner_soner_slagord.json")
  .then(res => res.json())
  .then(kommune => {
    kommuneData = kommune;
    fyllDropDown(kommuneData);
  })
  .catch(err => console.error("Feil ved henting:", err));

// Fyll dropdown med kommuner
function fyllDropDown(kommune) {
  const select = document.getElementById("kommuneSelect");

  kommune.forEach(k => {
    const option = document.createElement("option");
    option.value = k.kommune;
    option.textContent = k.kommune;
    select.appendChild(option);
  });
}

// Når en kommune velges
document.getElementById("kommuneSelect").addEventListener("change", function(e) {
  const valgt = e.target.value;
  const infoDiv = document.getElementById("info");

  if (!valgt) {
    infoDiv.innerHTML = "";
    return;
  }

  const kommuneObj = kommuneData.find(k => k.kommune === valgt);

  if (kommuneObj) {
    infoDiv.innerHTML = `
      <h2>${kommuneObj.kommune}</h2>
      <p>${kommuneObj.Sone}</p>
      <p><em>${kommuneObj.Slagord}</em></p>
    `;
  }
});