(function () {
  const data = window.FC_DATA;

  const rowsEl = document.getElementById("rows");
  const totalFcEl = document.getElementById("totalFc");
  const totalIronEl = document.getElementById("totalIron");
  const resetBtn = document.getElementById("resetBtn");

  const clampLevel = (n) => {
    if (Number.isNaN(n)) return 0;
    return Math.max(0, Math.min(12, n));
  };

  // Excel-Logik: Summe der Levelkosten von (from+1) bis (to)
  // costsArray ist [Lv1..Lv12] => Index 0..11
  const calcUpgradeCost = (costsArray, from, to) => {
    from = clampLevel(from);
    to = clampLevel(to);
    if (from >= to) return 0;

    let sum = 0;
    for (let i = from; i < to; i++) {
      sum += Number(costsArray[i] ?? 0);
    }
    return sum;
  };

  const fmt = (n) => new Intl.NumberFormat("de-DE").format(n);

  const STORAGE_KEY = "fc_shards_calc_state_v1";
  const loadState = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };
  const saveState = (state) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  };

  const parseDeInt = (s) => {
    // "1.234.567" -> 1234567
    const cleaned = String(s ?? "0").replace(/\./g, "").replace(",", ".");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  };

  const recalcTotals = () => {
    let totalFc = 0;
    let totalIron = 0;

    const trs = rowsEl.querySelectorAll("tr");
    trs.forEach((tr) => {
      const fcTd = tr.querySelector('td[data-kind="fc"]');
      const ironTd = tr.querySelector('td[data-kind="iron"]');
      totalFc += parseDeInt(fcTd?.textContent ?? "0");
      totalIron += parseDeInt(ironTd?.textContent ?? "0");
    });

    totalFcEl.textContent = fmt(totalFc);
    totalIronEl.textContent = fmt(totalIron);
  };

  const render = () => {
    rowsEl.innerHTML = "";
    const state = loadState();

    for (const skill of Object.keys(data)) {
      const tr = document.createElement("tr");

      const tdSkill = document.createElement("td");
      tdSkill.textContent = skill;

      const tdFrom = document.createElement("td");
      const fromInput = document.createElement("input");
      fromInput.type = "number";
      fromInput.min = "0";
      fromInput.max = "12";
      fromInput.step = "1";
      fromInput.className = "input";
      fromInput.value = state[skill]?.from ?? 0;

      const tdTo = document.createElement("td");
      const toInput = document.createElement("input");
      toInput.type = "number";
      toInput.min = "0";
      toInput.max = "12";
      toInput.step = "1";
      toInput.className = "input";
      toInput.value = state[skill]?.to ?? 0;

      const tdFc = document.createElement("td");
      tdFc.className = "right";
      tdFc.dataset.kind = "fc";

      const tdIron = document.createElement("td");
      tdIron.className = "right";
      tdIron.dataset.kind = "iron";

      const recalcRow = () => {
        const from = clampLevel(parseInt(fromInput.value, 10));
        const to = clampLevel(parseInt(toInput.value, 10));
        fromInput.value = from;
        toInput.value = to;

        const fc = calcUpgradeCost(data[skill].fc, from, to);
        const iron = calcUpgradeCost(data[skill].iron, from, to);

        tdFc.textContent = fmt(fc);
        tdIron.textContent = fmt(iron);

        state[skill] = { from, to };
        saveState(state);

        recalcTotals();
      };

      fromInput.addEventListener("input", recalcRow);
      toInput.addEventListener("input", recalcRow);

      tdFrom.appendChild(fromInput);
      tdTo.appendChild(toInput);

      tr.appendChild(tdSkill);
      tr.appendChild(tdFrom);
      tr.appendChild(tdTo);
      tr.appendChild(tdFc);
      tr.appendChild(tdIron);

      rowsEl.appendChild(tr);
      recalcRow();
    }
  };

  resetBtn.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    render();
  });

  render();
})();