// js/budget.js
// Handles County Budget choropleth + spending category breakdowns.

// "total"      = Total Expenditures
// "safety"     = Public Safety & Legal Services
// "health"     = Physical Health & Social Services
// "roads"      = Roads & Transportation
// "admin"      = Administration
// "education"  = County Environment & Education
var budgetMode = "total";

// Color Scales
// Total Expenditures 
function getColorForTotal(val) {
  if (val > 200000000) return "#0A1628"; // > $200M  (Polk)
  if (val > 100000000) return "#0D2B4E"; // > $100M  (Linn, Scott, Black Hawk...)
  if (val >  60000000) return "#1A4A7A";
  if (val >  40000000) return "#2E6FAD";
  if (val >  27000000) return "#4D92CC"; // around median
  if (val >  20000000) return "#80B8E0";
  if (val >  15000000) return "#B3D6F0";
  return "#DDEEFA";                      // smallest counties
}

// Public Safety — orange/red  
function getColorForSafety(val) {
  if (val > 50000000) return "#5C1A00"; // > $50M
  if (val > 20000000) return "#A03000";
  if (val > 10000000) return "#D44800";
  if (val >  7000000) return "#E86A22";
  if (val >  5000000) return "#F08C55";
  if (val >  3000000) return "#F5B080";
  if (val >  2000000) return "#FAD0B0";
  return "#FDF0E5";
}

// Physical Health & Social Services — pink
function getColorForHealth(val) {
  if (val > 20000000) return "#5C003C";
  if (val > 10000000) return "#990066";
  if (val >  5000000) return "#CC0088";
  if (val >  3000000) return "#DD44AA";
  if (val >  2000000) return "#EE88CC";
  if (val >  1000000) return "#F5BBE0";
  if (val >   500000) return "#FADCEE";
  return "#FDF0F8";
}

// Roads & Transportation — green  
// Roads are more evenly distributed across counties than other categories.
function getColorForRoads(val) {
  if (val > 16000000) return "#003300";
  if (val > 13000000) return "#005500";
  if (val > 11000000) return "#007700";
  if (val >  9000000) return "#229922";
  if (val >  7000000) return "#55BB55"; 
  if (val >  6000000) return "#88CC88";
  if (val >  5000000) return "#BBEEBB";
  return "#E5F8E5";
}

// Administration — purple  
function getColorForAdmin(val) {
  if (val > 20000000) return "#2A0050";
  if (val > 10000000) return "#4A0090";
  if (val >  6000000) return "#6A22BB";
  if (val >  4000000) return "#8844CC";
  if (val >  3000000) return "#AA77DD";
  if (val >  2000000) return "#CCAAEE";
  if (val >  1500000) return "#E5CCF8";
  return "#F5EEFE";
}

// County Environment & Education — gold  
function getColorForEducation(val) {
  if (val > 10000000) return "#3D2800";
  if (val >  5000000) return "#7A5200";
  if (val >  3000000) return "#AA7500";
  if (val >  2000000) return "#CC9900";
  if (val >  1500000) return "#DDBB33";
  if (val >  1000000) return "#EED477";
  if (val >   600000) return "#F7EAAA";
  return "#FDFAE0";
}

// Master color dispatcher
function getBudgetCountyColor(countyName, mode) {
  if (!budgetData[countyName]) return "#ffffff";
  var d = budgetData[countyName];
  var m = mode || budgetMode;
  if (m === "total")     return getColorForTotal(d.total);
  if (m === "safety")    return getColorForSafety(d.safety);
  if (m === "health")    return getColorForHealth(d.health);
  if (m === "roads")     return getColorForRoads(d.roads);
  if (m === "admin")     return getColorForAdmin(d.admin);
  if (m === "education") return getColorForEducation(d.education);
  return "#ffffff";
}

//  Tooltip label dispatcher
function getBudgetTooltipLine(countyName, mode) {
  if (!budgetData[countyName]) return "No data";
  var d = budgetData[countyName];
  var m = mode || budgetMode;

  // Format dollar amounts nicely: $27,415,783 → $27.4M
  function fmt(val) {
    if (val >= 1000000) return "$" + (val / 1000000).toFixed(1) + "M";
    if (val >= 1000)    return "$" + (val / 1000).toFixed(0) + "K";
    return "$" + val.toLocaleString();
  }

  if (m === "total")     return "Total expenditures: <strong>" + fmt(d.total) + "</strong>";
  if (m === "safety")    return "Public safety: <strong>" + fmt(d.safety) + "</strong>";
  if (m === "health")    return "Health & social: <strong>" + fmt(d.health) + "</strong>";
  if (m === "roads")     return "Roads & transport: <strong>" + fmt(d.roads) + "</strong>";
  if (m === "admin")     return "Administration: <strong>" + fmt(d.admin) + "</strong>";
  if (m === "education") return "Environment & education: <strong>" + fmt(d.education) + "</strong>";
  return "No data";
}

// Globals
var budgetTooltip = null;
var budgetData    = {}; // budgetData[countyName] = { total, safety, health, roads, admin, education }

// Tooltip 
function createBudgetTooltip() {
  if (budgetTooltip) return;
  budgetTooltip = d3
    .select("#iowa-map")
    .style("position", "relative")
    .append("div")
    .style("position", "absolute")
    .style("pointer-events", "none")
    .style("display", "none")
    .style("background", "white")
    .style("border", "1px solid #ccc")
    .style("border-radius", "4px")
    .style("padding", "6px 10px")
    .style("font-size", "13px")
    .style("color", "#222")
    .style("z-index", "10");
}

// Hover events 
// Used namespaced events (.budget) so school.js hover events (.school)
// don't conflict, each file owns its own namespace.
function attachBudgetHoverEvents() {
  createBudgetTooltip();

  svg.selectAll("path")
    .on("mouseover.budget", function (event, d) {
      if (!d3.select(this).classed("active")) {
        d3.select(this).transition().duration(100).style("fill", "#FFBC3E");
      }
      if (Object.keys(budgetData).length > 0) {
        var name = d.properties.NAME;
        var lines = [];
        document.querySelectorAll('input[name="budget-metric"]:checked').forEach(function(cb) {
          lines.push(getBudgetTooltipLine(name, cb.value));
        });
        budgetTooltip
          .style("display", "block")
          .html("<strong>" + name + " County</strong><br>" + (lines.length > 0 ? lines.join("<br>") : getBudgetTooltipLine(name)));
      }
    })
    .on("mousemove.budget", function (event) {
      var coords = d3.pointer(event, d3.select("#iowa-map").node());
      budgetTooltip
        .style("left", coords[0] + 14 + "px")
        .style("top",  coords[1] - 28 + "px");
    })
    .on("mouseout.budget", function (_event, d) {
      budgetTooltip.style("display", "none");
      if (!d3.select(this).classed("active")) {
        var name = d.properties.NAME;
        d3.select(this).transition().duration(200).style("fill", getBlendedColor(name));
      }
    });
}

// Removes budget hover events ( when checkbox is unchecked)
function removeBudgetHoverEvents() {
  svg.selectAll("path")
    .on("mouseover.budget", null)
    .on("mousemove.budget", null)
    .on("mouseout.budget",  null);
  if (budgetTooltip) budgetTooltip.style("display", "none");
}

//  Repaints all counties with the current budget mode (blended with other active layers)
function repaintBudgetMap() {
  repaintWithBlend();
}

//  Called when user picks a budget's other metric (safety, health, roads, admin, education)
function setBudgetMode(mode) {
  budgetMode = mode;
  registerLayer("budget:" + mode, _budgetLayerLabel(mode), _budgetLegendColors(mode));
  repaintWithBlend();
}

// Called from onchange on sub-metric checkboxes; registers one layer per checked metric
// so the bivariate legend renders a proper 3×3 grid when 2 metrics are active.
function refreshBudgetLayer() {
  unregisterLayerGroup("budget");
  var checked = document.querySelectorAll('input[name="budget-metric"]:checked');
  if (checked.length === 0) return;
  budgetMode = checked[0].value;
  checked.forEach(function(cb) {
    registerLayer("budget:" + cb.value, _budgetLayerLabel(cb.value), _budgetLegendColors(cb.value));
  });
  repaintWithBlend();
}

// Returns representative [low, mid, high] colors for the given (or current) budget mode.
function _budgetLegendColors(mode) {
  var m = mode || budgetMode;
  if (m === "total")     return ["#DDEEFA", "#4D92CC", "#0A1628"];
  if (m === "safety")    return ["#FDF0E5", "#E86A22", "#5C1A00"];
  if (m === "health")    return ["#FDF0F8", "#DD44AA", "#5C003C"];
  if (m === "roads")     return ["#E5F8E5", "#55BB55", "#003300"];
  if (m === "admin")     return ["#F5EEFE", "#8844CC", "#2A0050"];
  if (m === "education") return ["#FDFAE0", "#DDBB33", "#3D2800"];
  return ["#DDEEFA", "#4D92CC", "#0A1628"];
}

function _budgetLayerLabel(mode) {
  var m = mode || budgetMode;
  if (m === "total")     return "Budget: Total";
  if (m === "safety")    return "Budget: Public Safety";
  if (m === "health")    return "Budget: Health";
  if (m === "roads")     return "Budget: Roads";
  if (m === "admin")     return "Budget: Admin";
  if (m === "education") return "Budget: Education";
  return "County Budget";
}

// Changed dollar string to number
// Budget CSV stores all values as strings like "$22,147,312" — strip $ and commas.
function parseBudgetDollar(str) {
  if (!str || str === "nan") return 0;
  return Number(str.toString().replace(/[$,]/g, "")) || 0;
}

//  Combined CSV rows into per-county data 
// The budget CSV has one row per county per fiscal year. We take only the most
// recent row for each county so the map shows current spending. 
function buildBudgetData(csvData) {
  var raw = {};

  csvData.forEach(function(row) {
    var county = row["County Name"];
    if (!county) return;

    // Convert ALL CAPS to Title Case: "BLACK HAWK" → "Black Hawk"
    county = county.toLowerCase().replace(/\b\w/g, function(c) { return c.toUpperCase(); });

    // "6/30/2026" → 2026
    var year = new Date(row["Fiscal Year Ending"]).getFullYear();
    if (isNaN(year)) return;

    // Keep only the most recent year's data for each county
    if (!raw[county] || year > raw[county].year) {
      raw[county] = {
        year:      year,
        total:     parseBudgetDollar(row["Total Expenditures"]),
        safety:    parseBudgetDollar(row["Public Safety & Legal Services"]),
        health:    parseBudgetDollar(row["Physical Health & Social Services"]),
        roads:     parseBudgetDollar(row["Roads & Transportation"]),
        admin:     parseBudgetDollar(row["Administration"]),
        education: parseBudgetDollar(row["County Environment & Education"]),
      };
    }
  });

  // Strip the year field before returning ( only needed for filtering )
  var result = {};
  Object.keys(raw).forEach(function(county) {
    var r = raw[county];
    result[county] = {
      total:     r.total,
      safety:    r.safety,
      health:    r.health,
      roads:     r.roads,
      admin:     r.admin,
      education: r.education,
    };
  });

  return result;
}

// Called from index.html when the user checks/unchecks "County Budget".
function budgetClickHandler() {
  var isChecked = event.target.checked;

  if (!isChecked) {
    budgetData = {};
    budgetMode = "total";
    unregisterLayerGroup("budget");
    document.getElementById("budget-suboptions").style.display = "none";
    removeBudgetHoverEvents();
    repaintWithBlend();
    return;
  }

  d3.csv(
    "County_Budgeted_Expenditures_By_Service_Area_By_Fiscal_Year_20260324.csv"
  ).then(function(csvData) {
    budgetData = buildBudgetData(csvData);
    budgetMode = "total";

    var radios = document.querySelectorAll('input[name="budget-metric"]');
    if (radios.length > 0) radios[0].checked = true;

    document.getElementById("budget-suboptions").style.display = "block";

    registerLayer("budget:total", _budgetLayerLabel("total"), _budgetLegendColors("total"));
    repaintWithBlend();
    attachBudgetHoverEvents();

    console.log("[budget.js] Loaded. Polk:", budgetData["Polk"], "| Ringgold:", budgetData["Ringgold"]);
  });
}

// ── Poll for map paths then attach hover
// Same pattern as school.js
//  waits for iowa_map.js to finish its async
// TopoJSON fetch before attaching hover events to the county paths.
var budgetHoverPoll = setInterval(function () {
  if (typeof svg !== "undefined" && svg.selectAll("path").size() > 0) {
    clearInterval(budgetHoverPoll);
    console.log("[budget.js] Map paths ready.");
  }
}, 100);