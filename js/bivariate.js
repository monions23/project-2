// js/bivariate.js
// colors per county onto the single map. Also renders a 2D legend.

// When budget (blue) and school (red) are both active, counties high in both
// appear dark purple; high-budget/low-school appear dark blue; etc.

// Hex color utilities ───────────────────────────────────────────────────────

function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map(function (v) {
    return Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  }).join("");
}

function multiplyBlend(hex1, hex2) {
  var a = hexToRgb(hex1), b = hexToRgb(hex2);
  return rgbToHex(a[0] * b[0] / 255, a[1] * b[1] / 255, a[2] * b[2] / 255);
}

// Each dataset file calls registerLayer / unregisterLayer as the user moves through the checkboxes
// colors: [lowHex, midHex, highHex] — representative shades from that scale.

var activeLayers = {};

// Disables unchecked sub-metric checkboxes when 2 layers are already active.
function _enforceLayerLimit() {
  var all = document.querySelectorAll(
    'input[name="budget-metric"], input[name="enrollment-metric"], input[name="liquor-metric"]'
  );
  var checkedCount = 0;
  all.forEach(function(cb) { if (cb.checked) checkedCount++; });
  all.forEach(function(cb) {
    if (!cb.checked) cb.disabled = checkedCount >= 2;
  });
}

function registerLayer(id, label, colors) {
  activeLayers[id] = { label: label, colors: colors };
  refreshBivariateLegend();
}

function unregisterLayer(id) {
  delete activeLayers[id];
  refreshBivariateLegend();
}

// Removes all layers whose key starts with prefix + ":" (e.g. all "school:*" entries).
function unregisterLayerGroup(prefix) {
  Object.keys(activeLayers).forEach(function(key) {
    if (key === prefix || key.indexOf(prefix + ":") === 0) {
      delete activeLayers[key];
    }
  });
  refreshBivariateLegend();
}

//  Blended color for a single county 
function getBlendedColor(countyName) {
  var colors = [];

  if (typeof countyData !== "undefined" && Object.keys(countyData).length > 0) {
    document.querySelectorAll('input[name="enrollment-metric"]:checked').forEach(function(cb) {
      colors.push(getCountyColor(countyName, cb.value));
    });
  }

  if (typeof budgetData !== "undefined" && Object.keys(budgetData).length > 0) {
    document.querySelectorAll('input[name="budget-metric"]:checked').forEach(function(cb) {
      colors.push(getBudgetCountyColor(countyName, cb.value));
    });
  }

  if (typeof liquorData !== "undefined" && Object.keys(liquorData).length > 0) {
    document.querySelectorAll('input[name="liquor-metric"]:checked').forEach(function(cb) {
      colors.push(getLiquorCountyColor(countyName, cb.value));
    });
  }

  if (colors.length === 0) return "#ffffff";
  var result = colors[0];
  for (var i = 1; i < colors.length; i++) result = multiplyBlend(result, colors[i]);
  return result;
}

// repaint all counties based on user selection of layers
function repaintWithBlend() {
  svg.selectAll("path").each(function (d) {
    if (!d || !d.properties) return;
    if (!d3.select(this).classed("active")) {
      d3.select(this).style("fill", getBlendedColor(d.properties.NAME));
    }
  });
}

// ── Bivariate legend ──────────────────────────────────────────────────────────
// • 0 active layers  → legend hidden
// • 1 active layer   → horizontal color bar (low → high) with label
// • 2 active layers  → 3×3 blended grid with X/Y axis labels

var _legendSel = null;

function _ensureLegend() {
  if (_legendSel) return _legendSel;
  _legendSel = d3.select("#iowa-map")
    .append("div")
    .attr("id", "bivariate-legend")
    .style("position",      "absolute")
    .style("bottom",        "16px")
    .style("right",         "16px")
    .style("background",    "rgba(255,255,255,0.93)")
    .style("border",        "1px solid #bbb")
    .style("border-radius", "4px")
    .style("padding",       "8px 10px")
    .style("font-size",     "11px")
    .style("color",         "#222")
    .style("line-height",   "1.4")
    .style("display",       "none")
    .style("pointer-events","none");
  return _legendSel;
}

function refreshBivariateLegend() {
  var legend = _ensureLegend();
  var ids    = Object.keys(activeLayers);

  if (ids.length === 0) { legend.style("display", "none"); _enforceLayerLimit(); return; }

  legend.style("display", "block").html("");

  var CELL = 18; // px per grid cell

  if (ids.length === 1) {
    // single bar for one variable 
    var L = activeLayers[ids[0]];
    legend.append("div").style("font-weight", "bold").style("margin-bottom", "4px")
      .text(L.label);
    var svg1 = legend.append("svg").attr("width", CELL * 3).attr("height", CELL + 12);
    L.colors.forEach(function (c, i) {
      svg1.append("rect").attr("x", i * CELL).attr("y", 0)
        .attr("width", CELL).attr("height", CELL).attr("fill", c);
    });
    svg1.append("text").attr("x", 0).attr("y", CELL + 10).attr("font-size", "9px").text("Low");
    svg1.append("text").attr("x", CELL * 3 - 2).attr("y", CELL + 10)
      .attr("font-size", "9px").attr("text-anchor", "end").text("High");
    _enforceLayerLimit();
    return;
  }

  // ── 3×3 bivariate grid ──
  var L1 = activeLayers[ids[0]]; // X axis (→)
  var L2 = activeLayers[ids[1]]; // Y axis (↑)

  legend.append("div").style("font-weight", "bold").style("margin-bottom", "6px")
    .text("Color = " + L1.label + " × " + L2.label);

  var W = CELL * 3, H = CELL * 3;

  // Outer flex row: [y-label] [grid + x-label]
  var row = legend.append("div")
    .style("display",     "flex")
    .style("align-items", "center")
    .style("gap",         "4px");

  // Rotated Y-axis label
  row.append("div")
    .style("font-size",    "10px")
    .style("writing-mode", "vertical-rl")
    .style("transform",    "rotate(180deg)")
    .style("text-align",   "center")
    .style("max-width",    "80px")
    .text("↑ " + L2.label + " (high)");

  var col = row.append("div");

  // Grid SVG
  var gridSvg = col.append("svg").attr("width", W + 1).attr("height", H + 1);

  for (var r = 0; r < 3; r++) {
    for (var c2 = 0; c2 < 3; c2++) {
      var xColor = L1.colors[c2];       // col 0=low … col 2=high
      var yColor = L2.colors[2 - r];    // row 0=top=high, row 2=bottom=low
      gridSvg.append("rect")
        .attr("x", c2 * CELL).attr("y", r * CELL)
        .attr("width", CELL).attr("height", CELL)
        .attr("fill", multiplyBlend(xColor, yColor))
        .attr("stroke", "#fff").attr("stroke-width", "0.5");
    }
  }

  // X-axis label below grid
  col.append("div")
    .style("font-size",       "10px")
    .style("display",         "flex")
    .style("justify-content", "space-between")
    .style("width",           W + "px")
    .style("margin-top",      "2px")
    .html("<span>Low</span><span>→</span><span>High</span>");
  col.append("div")
    .style("font-size",  "10px")
    .style("text-align", "center")
    .style("margin-top", "1px")
    .text(L1.label);

  _enforceLayerLimit();
}
