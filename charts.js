let chart1Instance = null;
let chart2Instance = null;
let chart3Instance = null;

const DATA_FILES = {
  Education_Enrollment:
    "Iowa_Public_School_District_Enrollment_(PreK-12_Enrollment_by_Grade,_Race_and_Gender)_20260324.csv",
  Finance:
    "County_Budgeted_Expenditures_By_Service_Area_By_Fiscal_Year_20260324.csv",
  Liquor: "Liquor_Sales.csv",
  CityCountyMap: "iowa_counties_to_cities.csv"
};

const loadedData = {
  Education_Enrollment: null,
  Finance: null,
  Liquor: null,
  CityCountyMap: null
};

function cleanNumber(value) {
  return Number(String(value || "0").replace(/[$,]/g, "").trim()) || 0;
}

function normalizeName(value) {
  return String(value || "").trim();
}

function normalizeCountyName(name) {
  let county = String(name || "").trim();
  if (!county) return "";
  if (county === "Pottawattam") county = "Pottawattamie";
  return county
    .toLowerCase()
    .replace(/\b\w/g, function (char) {
      return char.toUpperCase();
    });
}

function normalizeCityName(name) {
  return String(name || "")
    .trim()
    .toUpperCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ");
}

function destroyCharts() {
  if (chart1Instance) chart1Instance.destroy();
  if (chart2Instance) chart2Instance.destroy();
  if (chart3Instance) chart3Instance.destroy();
  chart1Instance = null;
  chart2Instance = null;
  chart3Instance = null;
}

function getSelectedDatasets() {
  return Array.from(document.querySelectorAll('#data-list input[type="checkbox"]:checked'))
    .map(function (cb) {
      return cb.value;
    })
    .filter(function (value) {
      return ["Education_Enrollment", "Finance", "Liquor"].includes(value);
    });
}

function getSelectedCounties() {
  const checked = Array.from(document.querySelectorAll('#county-list input[type="checkbox"]:checked')).map(
    function (cb) {
      return cb.value;
    }
  );

  if (!checked.length || checked.includes("All")) {
    return [];
  }

  return checked;
}

async function loadAllDataIfNeeded() {
  if (!loadedData.Education_Enrollment) {
    loadedData.Education_Enrollment = await d3.csv(DATA_FILES.Education_Enrollment);
  }
  if (!loadedData.Finance) {
    loadedData.Finance = await d3.csv(DATA_FILES.Finance);
  }
  if (!loadedData.Liquor) {
    loadedData.Liquor = await d3.csv(DATA_FILES.Liquor);
  }
  if (!loadedData.CityCountyMap) {
    loadedData.CityCountyMap = await d3.csv(DATA_FILES.CityCountyMap);
  }
}

function buildCityToCountyLookup(mappingRows) {
  const lookup = {};

  mappingRows.forEach(function (row) {
    const cityList = String(row["City"] || "").split(",");
    const countyField = String(row["County"] || "").trim();

    let countyNames = [countyField];
    if (!countyField.includes(",") && countyField.split(/\s+/).length === 2) {
      countyNames = countyField.split(/\s+/);
    } else if (countyField.includes(",")) {
      countyNames = countyField.split(",");
    }

    countyNames.forEach(function (countyName) {
      const county = normalizeCountyName(countyName);
      if (!county) return;

      cityList.forEach(function (city) {
        const cleanedCity = normalizeCityName(city);
        if (cleanedCity) {
          lookup[cleanedCity] = county;
        }
      });
    });
  });

  return lookup;
}

function topEntries(obj, count) {
  return Object.entries(obj)
    .sort(function (a, b) {
      return b[1] - a[1];
    })
    .slice(0, count);
}

function keepOnlySelectedLocations(obj, selectedLocations) {
  if (!selectedLocations.length) return obj;

  const filtered = {};
  Object.keys(obj).forEach(function (key) {
    if (selectedLocations.includes(key)) {
      filtered[key] = obj[key];
    }
  });
  return filtered;
}

function normalizeSeries(obj) {
  const entries = Object.entries(obj);
  if (!entries.length) return {};

  const maxValue = Math.max(
    ...entries.map(function (entry) {
      return entry[1];
    })
  );

  const result = {};
  entries.forEach(function (entry) {
    const key = entry[0];
    const value = entry[1];
    result[key] = maxValue === 0 ? 0 : (value / maxValue) * 100;
  });

  return result;
}

function averageOfValues(obj) {
  const values = Object.values(obj);
  if (!values.length) return 0;

  return (
    values.reduce(function (sum, value) {
      return sum + value;
    }, 0) / values.length
  );
}

function schoolCountyTotals(rows) {
  const totals = {};
  rows.forEach(function (row) {
    let county = normalizeName(row["COUNTY NAME"]);
    if (!county) return;
    if (county === "Pottawattam") county = "Pottawattamie";

    const total = cleanNumber(row["Total PK12"]);
    if (!totals[county]) totals[county] = 0;
    totals[county] += total;
  });
  return totals;
}

function schoolYearTotals(rows) {
  const totals = {};
  rows.forEach(function (row) {
    const year = row["School Year"];
    if (!year) return;
    const total = cleanNumber(row["Total PK12"]);
    if (!totals[year]) totals[year] = 0;
    totals[year] += total;
  });
  return Object.entries(totals).sort(function (a, b) {
    return Number(a[0]) - Number(b[0]);
  });
}

function schoolRaceTotals(rows) {
  return {
    Hispanic: d3.sum(rows, function (d) {
      return cleanNumber(d["Total Hispanic"]);
    }),
    Black: d3.sum(rows, function (d) {
      return cleanNumber(d["Black Total"]);
    }),
    Asian: d3.sum(rows, function (d) {
      return cleanNumber(d["Asian Total"]);
    }),
    White: d3.sum(rows, function (d) {
      return cleanNumber(d["White Total"]);
    }),
    "Native American": d3.sum(rows, function (d) {
      return cleanNumber(d["Native American Total"]);
    }),
    "Multi-Race": d3.sum(rows, function (d) {
      return cleanNumber(d["Multi-Race Total"]);
    })
  };
}

function financeCountyTotals(rows) {
  const totals = {};
  rows.forEach(function (row) {
    const county = normalizeCountyName(row["County Name"]);
    if (!county) return;
    const total = cleanNumber(row["Total Expenditures"]);
    if (!totals[county]) totals[county] = 0;
    totals[county] += total;
  });
  return totals;
}

function financeYearTotals(rows) {
  const totals = {};
  rows.forEach(function (row) {
    const date = row["Fiscal Year Ending"];
    if (!date) return;
    const year = new Date(date).getFullYear();
    if (!year || Number.isNaN(year)) return;
    const total = cleanNumber(row["Total Expenditures"]);
    if (!totals[year]) totals[year] = 0;
    totals[year] += total;
  });
  return Object.entries(totals).sort(function (a, b) {
    return Number(a[0]) - Number(b[0]);
  });
}

function financeServiceTotals(rows) {
  const columns = [
    "Public Safety & Legal Services",
    "Physical Health & Social Services",
    "Mental Health MR, DD",
    "County Environment & Education",
    "Roads & Transportation",
    "Government Services to Residents",
    "Administration",
    "Nonprogram Current",
    "Debt Service",
    "Capital Projects"
  ];

  const totals = {};
  columns.forEach(function (column) {
    totals[column] = d3.sum(rows, function (row) {
      return cleanNumber(row[column]);
    });
  });
  return totals;
}

function liquorCountyTotals(rows, cityCountyLookup) {
  const totals = {};
  rows.forEach(function (row) {
    const city = normalizeCityName(row["City"]);
    const county = cityCountyLookup[city];
    if (!county) return;

    const total = cleanNumber(row["Sale (Dollars)"]);
    if (!totals[county]) totals[county] = 0;
    totals[county] += total;
  });
  return totals;
}

function liquorCountyTotalsForSelected(rows, cityCountyLookup, selectedCounties) {
  return keepOnlySelectedLocations(liquorCountyTotals(rows, cityCountyLookup), selectedCounties);
}

function liquorMonthTotals(rows) {
  const totals = {};
  rows.forEach(function (row) {
    const date = row["Date"];
    if (!date) return;

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return;

    const monthKey = parsed.getFullYear() + "-" + String(parsed.getMonth() + 1).padStart(2, "0");
    const total = cleanNumber(row["Sale (Dollars)"]);

    if (!totals[monthKey]) totals[monthKey] = 0;
    totals[monthKey] += total;
  });

  return Object.entries(totals).sort(function (a, b) {
    return a[0].localeCompare(b[0]);
  });
}

function liquorTopProducts(rows) {
  const totals = {};
  rows.forEach(function (row) {
    const product = normalizeName(row["Item Description"]);
    if (!product) return;
    const bottles = cleanNumber(row["Bottles Sold"]);
    if (!totals[product]) totals[product] = 0;
    totals[product] += bottles;
  });

  return Object.entries(totals)
    .sort(function (a, b) {
      return b[1] - a[1];
    })
    .slice(0, 10);
}

function makeBarChart(canvasId, titleId, title, labels, datasetLabel, values) {
  document.getElementById(titleId).textContent = title;
  return new Chart(document.getElementById(canvasId).getContext("2d"), {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: datasetLabel,
          data: values,
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

function makeLineChart(canvasId, titleId, title, labels, datasets) {
  document.getElementById(titleId).textContent = title;
  return new Chart(document.getElementById(canvasId).getContext("2d"), {
    type: "line",
    data: { labels: labels, datasets: datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

function makeDoughnutChart(canvasId, titleId, title, labels, values) {
  document.getElementById(titleId).textContent = title;
  return new Chart(document.getElementById(canvasId).getContext("2d"), {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [
        {
          label: title,
          data: values,
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } }
    }
  });
}

function makeRadarChart(canvasId, titleId, title, labels, datasets) {
  document.getElementById(titleId).textContent = title;
  return new Chart(document.getElementById(canvasId).getContext("2d"), {
    type: "radar",
    data: { labels: labels, datasets: datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { r: { beginAtZero: true, min: 0, max: 100 } }
    }
  });
}

function renderSchoolCharts(selectedCounties) {
  document.getElementById("charts-title").textContent = "Public School Enrollment Graphs";
  const rows = loadedData.Education_Enrollment;

  const countyTotals = keepOnlySelectedLocations(schoolCountyTotals(rows), selectedCounties);
  const countyTop = topEntries(countyTotals, selectedCounties.length ? selectedCounties.length : 10);
  const yearTotals = schoolYearTotals(rows);
  const raceTotals = schoolRaceTotals(rows);

  chart1Instance = makeBarChart(
    "chart1",
    "chart1-title",
    "County Enrollment Comparison",
    countyTop.map(function (d) { return d[0]; }),
    "Students",
    countyTop.map(function (d) { return d[1]; })
  );

  chart2Instance = makeLineChart(
    "chart2",
    "chart2-title",
    "Statewide Enrollment by School Year",
    yearTotals.map(function (d) { return d[0]; }),
    [{ label: "Enrollment", data: yearTotals.map(function (d) { return d[1]; }), tension: 0.2, fill: false }]
  );

  chart3Instance = makeDoughnutChart(
    "chart3",
    "chart3-title",
    "Statewide Race Breakdown",
    Object.keys(raceTotals),
    Object.values(raceTotals)
  );
}

function renderFinanceCharts(selectedCounties) {
  document.getElementById("charts-title").textContent = "County Budget Graphs";
  const rows = loadedData.Finance;

  const countyTotals = keepOnlySelectedLocations(financeCountyTotals(rows), selectedCounties);
  const countyTop = topEntries(countyTotals, selectedCounties.length ? selectedCounties.length : 10);
  const yearTotals = financeYearTotals(rows);
  const serviceTotals = financeServiceTotals(rows);

  chart1Instance = makeBarChart(
    "chart1",
    "chart1-title",
    "County Budget Comparison",
    countyTop.map(function (d) { return d[0]; }),
    "Total Expenditures",
    countyTop.map(function (d) { return d[1]; })
  );

  chart2Instance = makeLineChart(
    "chart2",
    "chart2-title",
    "Total Expenditures by Fiscal Year",
    yearTotals.map(function (d) { return d[0]; }),
    [{ label: "Expenditures", data: yearTotals.map(function (d) { return d[1]; }), tension: 0.2, fill: false }]
  );

  chart3Instance = makeDoughnutChart(
    "chart3",
    "chart3-title",
    "Spending by Service Area",
    Object.keys(serviceTotals),
    Object.values(serviceTotals)
  );
}

function renderLiquorCharts(selectedCounties) {
  document.getElementById("charts-title").textContent = "Liquor Sales Graphs";
  const liquorRows = loadedData.Liquor;
  const cityCountyLookup = buildCityToCountyLookup(loadedData.CityCountyMap);

  const countyTotals = liquorCountyTotalsForSelected(liquorRows, cityCountyLookup, selectedCounties);
  const countyTop = topEntries(countyTotals, selectedCounties.length ? selectedCounties.length : 10);
  const monthTotals = liquorMonthTotals(liquorRows);
  const products = liquorTopProducts(liquorRows);

  chart1Instance = makeBarChart(
    "chart1",
    "chart1-title",
    "Top Counties by Liquor Sales",
    countyTop.map(function (d) { return d[0]; }),
    "Sales ($)",
    countyTop.map(function (d) { return d[1]; })
  );

  chart2Instance = makeLineChart(
    "chart2",
    "chart2-title",
    "Liquor Sales by Month",
    monthTotals.map(function (d) { return d[0]; }),
    [{ label: "Sales", data: monthTotals.map(function (d) { return d[1]; }), tension: 0.2, fill: false }]
  );

  chart3Instance = makeBarChart(
    "chart3",
    "chart3-title",
    "Top Products by Bottles Sold",
    products.map(function (d) { return d[0]; }),
    "Bottles Sold",
    products.map(function (d) { return d[1]; })
  );
}

function renderCombinedCharts(selectedDatasets, selectedCounties) {
  document.getElementById("charts-title").textContent = "Combined Dataset Comparison";
  const cityCountyLookup = buildCityToCountyLookup(loadedData.CityCountyMap);

  const school = normalizeSeries(keepOnlySelectedLocations(schoolCountyTotals(loadedData.Education_Enrollment), selectedCounties));
  const finance = normalizeSeries(keepOnlySelectedLocations(financeCountyTotals(loadedData.Finance), selectedCounties));
  const liquor = normalizeSeries(liquorCountyTotalsForSelected(loadedData.Liquor, cityCountyLookup, selectedCounties));

  const countyLabels = Array.from(new Set([...Object.keys(school), ...Object.keys(finance), ...Object.keys(liquor)])).sort();

  const schoolValues = countyLabels.map(function (county) { return school[county] || 0; });
  const financeValues = countyLabels.map(function (county) { return finance[county] || 0; });
  const liquorValues = countyLabels.map(function (county) { return liquor[county] || 0; });

  document.getElementById("chart1-title").textContent = "Normalized County Comparison";
  chart1Instance = new Chart(document.getElementById("chart1").getContext("2d"), {
    type: "bar",
    data: {
      labels: countyLabels,
      datasets: [
        ...(selectedDatasets.includes("Education_Enrollment") ? [{ label: "School Enrollment (Normalized)", data: schoolValues, borderWidth: 1 }] : []),
        ...(selectedDatasets.includes("Finance") ? [{ label: "County Budget (Normalized)", data: financeValues, borderWidth: 1 }] : []),
        ...(selectedDatasets.includes("Liquor") ? [{ label: "Liquor Sales (Normalized)", data: liquorValues, borderWidth: 1 }] : [])
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true, max: 100 } }
    }
  });

  chart2Instance = makeRadarChart(
    "chart2",
    "chart2-title",
    "Average Normalized County Scores",
    ["School Enrollment", "County Budget", "Liquor Sales"],
    [{
      label: "Selected Data",
      data: [
        selectedDatasets.includes("Education_Enrollment") ? averageOfValues(school) : 0,
        selectedDatasets.includes("Finance") ? averageOfValues(finance) : 0,
        selectedDatasets.includes("Liquor") ? averageOfValues(liquor) : 0
      ],
      borderWidth: 1
    }]
  );

  let lineLabels = [];
  const datasetMap = {};

  if (selectedDatasets.includes("Education_Enrollment")) {
    schoolYearTotals(loadedData.Education_Enrollment).forEach(function (item) {
      const label = String(item[0]);
      if (!datasetMap[label]) datasetMap[label] = {};
      datasetMap[label].school = item[1];
    });
  }

  if (selectedDatasets.includes("Finance")) {
    financeYearTotals(loadedData.Finance).forEach(function (item) {
      const label = String(item[0]);
      if (!datasetMap[label]) datasetMap[label] = {};
      datasetMap[label].finance = item[1];
    });
  }

  if (selectedDatasets.includes("Liquor")) {
    liquorMonthTotals(loadedData.Liquor).forEach(function (item) {
      const label = String(item[0]);
      if (!datasetMap[label]) datasetMap[label] = {};
      datasetMap[label].liquor = item[1];
    });
  }

  lineLabels = Object.keys(datasetMap).sort();
  const schoolSeries = lineLabels.map(function (label) { return datasetMap[label]?.school || 0; });
  const financeSeries = lineLabels.map(function (label) { return datasetMap[label]?.finance || 0; });
  const liquorSeries = lineLabels.map(function (label) { return datasetMap[label]?.liquor || 0; });
  const schoolMax = Math.max(0, ...schoolSeries);
  const financeMax = Math.max(0, ...financeSeries);
  const liquorMax = Math.max(0, ...liquorSeries);

  const lineDatasets = [];
  if (selectedDatasets.includes("Education_Enrollment")) {
    lineDatasets.push({ label: "Enrollment Trend", data: schoolSeries.map(function (value) { return schoolMax === 0 ? 0 : (value / schoolMax) * 100; }), tension: 0.2, fill: false });
  }
  if (selectedDatasets.includes("Finance")) {
    lineDatasets.push({ label: "Budget Trend", data: financeSeries.map(function (value) { return financeMax === 0 ? 0 : (value / financeMax) * 100; }), tension: 0.2, fill: false });
  }
  if (selectedDatasets.includes("Liquor")) {
    lineDatasets.push({ label: "Liquor Trend", data: liquorSeries.map(function (value) { return liquorMax === 0 ? 0 : (value / liquorMax) * 100; }), tension: 0.2, fill: false });
  }

  chart3Instance = makeLineChart(
    "chart3",
    "chart3-title",
    "Normalized Trend Comparison",
    lineLabels,
    lineDatasets
  );
}

async function updateCharts() {
  await loadAllDataIfNeeded();
  destroyCharts();

  const selectedDatasets = getSelectedDatasets();
  const selectedCounties = getSelectedCounties();

  if (selectedDatasets.length === 0) {
    document.getElementById("charts-title").textContent = "Data Visualizations";
    document.getElementById("chart1-title").textContent = "Select a dataset";
    document.getElementById("chart2-title").textContent = "Select a dataset";
    document.getElementById("chart3-title").textContent = "Select a dataset";
    return;
  }

  if (selectedDatasets.length === 1) {
    if (selectedDatasets[0] === "Education_Enrollment") return renderSchoolCharts(selectedCounties);
    if (selectedDatasets[0] === "Finance") return renderFinanceCharts(selectedCounties);
    if (selectedDatasets[0] === "Liquor") return renderLiquorCharts(selectedCounties);
  }

  renderCombinedCharts(selectedDatasets, selectedCounties);
}

function setupChartListeners() {
  document.querySelectorAll('#data-list input[type="checkbox"]').forEach(function (checkbox) {
    checkbox.addEventListener("change", updateCharts);
  });

  document.querySelectorAll('#county-list input[type="checkbox"]').forEach(function (checkbox) {
    checkbox.addEventListener("change", updateCharts);
  });
}

window.addEventListener("DOMContentLoaded", function () {
  setupChartListeners();
  updateCharts();
});
