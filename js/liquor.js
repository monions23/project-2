// js/liquor.js
// Handles Liquor Sales choropleth.
// Used iowa_zip_lookup.csv which maps every Iowa city name to its county
// Two sub-categories: 
//   "sales"    = total dollar sales per county (graduated color)
//   "category" = most popular spirit category per county (categorical color)

var liquorMode = "sales";

// City → County lookup 
// Keys are city names in ALL CAPS to match the liquor CSV format.
var cityToCounty = {};

// Color scale: Total Sales 
function getColorForSales(val) {
  if (val > 200000) return "#3D1C00"; // > $200k  
  if (val >  80000) return "#7A3800"; // > $80k   
  if (val >  40000) return "#B45800"; // > $40k
  if (val >  20000) return "#D97E20"; // > $20k
  if (val >  10000) return "#E8A040"; // > $10k   
  if (val >   5000) return "#F0BC70"; // > $5k
  if (val >   2000) return "#F7D8A8"; // > $2k
  return "#FDF2E0";                   
}

//  Color scale: Spirit category — categorical colors 
// Each spirit type gets a distinct color so the map reads like a legend.
var CATEGORY_COLORS = {
  "Whiskey": "#8B0000",   // deep red
  "Vodka":   "#1A3A6B",   // navy blue
  "Rum":     "#5C3A00",   // dark brown
  "Tequila": "#4A7A00",   // olive green
  "Gin":     "#2D5A6B",   // slate blue
  "Brandy":  "#6B2D5A",   // purple
  "Other":   "#888780",   // grey
};

//  Spirit categorizer 
// Fireball is technically a liqueur but marketed as whiskey 
function categorizeSpirit(itemName) {
  var item = itemName.toUpperCase();
  if (item.includes("VODKA"))                                   
           return "Vodka";
  if (item.includes("RUM") || item.includes("ADMIRAL NELSON") ||
      item.includes("CAPTAIN MORGAN"))                                 
      return "Rum";
  if (item.includes("TEQUILA") || item.includes("MEZCAL"))            
    return "Tequila";
  if (item.includes("GIN"))                                            
    return "Gin";
  if (item.includes("BRANDY") || item.includes("COGNAC"))             
    return "Brandy";
  if (item.includes("WHISKEY") || item.includes("WHISKY") ||
      item.includes("BOURBON") || item.includes("SCOTCH") ||
      item.includes("FIREBALL") || item.includes("CROWN ROYAL") ||
      item.includes("BLACK VELVET") || item.includes("JIM BEAM") ||
      item.includes("JACK DANIEL") || item.includes("CANADIAN"))      return "Whiskey";
  return "Other";
}

// Master color dispatcher
function getLiquorCountyColor(countyName, mode) {
  if (!liquorData[countyName]) return "#ffffff";
  var d = liquorData[countyName];
  var m = mode || liquorMode;
  if (m === "sales")    return getColorForSales(d.totalSales);
  if (m === "category") return CATEGORY_COLORS[d.topCategory] || "#888780";
  return "#ffffff";
}

// Tooltip label dispatcher
function getLiquorTooltipLine(countyName, mode) {
  if (!liquorData[countyName]) return "No data";
  var d = liquorData[countyName];
  var m = mode || liquorMode;

  function fmt(val) {
    if (val >= 1000000) return "$" + (val / 1000000).toFixed(1) + "M";
    if (val >= 1000)    return "$" + (val / 1000).toFixed(1) + "K";
    return "$" + val.toFixed(0);
  }

  if (m === "sales") {
    return "Liquor sales: <strong>" + fmt(d.totalSales) + "</strong>" +
           "<br>Bottles sold: <strong>" + d.totalBottles.toLocaleString() + "</strong>";
  }
  if (m === "category") {
    return "Top spirit: <strong>" + d.topCategory + "</strong>" +
           "<br>Best seller: <strong>" + d.topItem + "</strong>";
  }
  return "No data";
}

//  Globals
// liquorData[countyName] = { totalSales, totalBottles, topCategory, topItem }
var liquorData = {};

//  Repaint map (blended with other active layers)
function repaintLiquorMap() {
  repaintWithBlend();
}

// Called when user picks a sub-category
function setLiquorMode(mode) {
  liquorMode = mode;
  registerLayer("liquor:" + mode, _liquorLayerLabel(mode), _liquorLegendColors(mode));
  repaintWithBlend();
}

// Called from onchange on sub-metric checkboxes; registers one layer per checked metric
// so the bivariate legend renders a proper 3×3 grid when 2 metrics are active.
function refreshLiquorLayer() {
  unregisterLayerGroup("liquor");
  var checked = document.querySelectorAll('input[name="liquor-metric"]:checked');
  if (checked.length === 0) return;
  liquorMode = checked[0].value;
  checked.forEach(function(cb) {
    registerLayer("liquor:" + cb.value, _liquorLayerLabel(cb.value), _liquorLegendColors(cb.value));
  });
  repaintWithBlend();
}

// Returns representative [low, mid, high] colors for the given (or current) liquor mode.
function _liquorLegendColors(mode) {
  var m = mode || liquorMode;
  if (m === "sales")    return ["#FDF2E0", "#D97E20", "#3D1C00"];
  if (m === "category") return ["#888780", "#8B0000", "#1A3A6B"];
  return ["#FDF2E0", "#D97E20", "#3D1C00"];
}

function _liquorLayerLabel(mode) {
  var m = mode || liquorMode;
  if (m === "sales")    return "Liquor Sales ($)";
  if (m === "category") return "Top Spirit Type";
  return "Liquor Sales";
}

//  city→county lookup from iowa_zip_lookup.csv 
// Keys are ALL CAPS to match the liquor CSV city format.
function buildCityLookup(zipData) {
  var lookup = {};
  zipData.forEach(function(row) {
    var city = (row["City"] || "").trim().toUpperCase();
    var county = (row["County"] || "").trim();
    if (city && county && !lookup[city]) {
      lookup[city] = county;
    }
  });
  return lookup;
}

// For each row: look up city → county, then combine sales, bottles, and track which spirit category + specific item sells most per county.
function buildLiquorData(liquorRows, lookup) {
  var raw = {};

  liquorRows.forEach(function(row) {
    var city = (row["City"] || "").trim().toUpperCase();
    var county = lookup[city];
    if (!county) return; // skip unmatched cities 

    var sale    = parseFloat((row["Sale (Dollars)"] || "0").replace(/[$,]/g, "")) || 0;
    var bottles = parseFloat(row["Bottles Sold"]) || 0;
    var item    = (row["Item Description"] || "").trim();
    var cat     = categorizeSpirit(item);

    if (!raw[county]) {
      raw[county] = {
        totalSales:   0,
        totalBottles: 0,
        items:        {},  // item name → bottles sold
        categories:   {},  // category → bottles sold
      };
    }

    raw[county].totalSales   += sale;
    raw[county].totalBottles += bottles;

    raw[county].items[item] = (raw[county].items[item] || 0) + bottles;
    raw[county].categories[cat] = (raw[county].categories[cat] || 0) + bottles;
  });

  // Convert raw into clean per-county records
  var result = {};
  Object.keys(raw).forEach(function(county) {
    var r = raw[county];

    // Find top item (most bottles sold)
    var topItem = Object.keys(r.items).reduce(function(a, b) {
      return r.items[a] > r.items[b] ? a : b;
    });

    // Find top category
    var topCategory = Object.keys(r.categories).reduce(function(a, b) {
      return r.categories[a] > r.categories[b] ? a : b;
    });

    result[county] = {
      totalSales:   r.totalSales,
      totalBottles: r.totalBottles,
      topItem:      topItem,
      topCategory:  topCategory,
    };
  });

  return result;
}

// Entry point 
// Load both CSVs, builds the lookup, then paints the map.
function liquorClickHandler() {
  var isChecked = event.target.checked;

  if (!isChecked) {
    liquorData = {};
    liquorMode = "sales";
    unregisterLayerGroup("liquor");
    document.getElementById("liquor-suboptions").style.display = "none";
    repaintWithBlend();
    return;
  }

  // Load both CSVs
  Promise.all([
    d3.csv("iowa_zip_lookup.csv"),
    d3.csv("Liquor_Sales.csv"),
  ]).then(function(results) {
    var zipData    = results[0];
    var liquorRows = results[1];

    cityToCounty = buildCityLookup(zipData);
    liquorData   = buildLiquorData(liquorRows, cityToCounty);
    liquorMode   = "sales";

    var radios = document.querySelectorAll('input[name="liquor-metric"]');
    if (radios.length > 0) radios[0].checked = true;

    document.getElementById("liquor-suboptions").style.display = "block";

    registerLayer("liquor:sales", _liquorLayerLabel("sales"), _liquorLegendColors("sales"));
    repaintWithBlend();

    console.log("[liquor.js] Loaded.", Object.keys(liquorData).length, "counties.");
    console.log("[liquor.js] Polk:", liquorData["Polk"]);
  });
}

//  Poll for map paths 
var liquorHoverPoll = setInterval(function () {
  if (typeof svg !== "undefined" && svg.selectAll("path").size() > 0) {
    clearInterval(liquorHoverPoll);
    console.log("[liquor.js] Map paths ready.");
  }
}, 100);