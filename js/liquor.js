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
function getLiquorCountyColor(countyName) {
  if (!liquorData[countyName]) return "#ffffff";
  var d = liquorData[countyName];
  if (liquorMode === "sales")    return getColorForSales(d.totalSales);
  if (liquorMode === "category") return CATEGORY_COLORS[d.topCategory] || "#888780";
  return "#ffffff";
}

// Tooltip label dispatcher 
function getLiquorTooltipLine(countyName) {
  if (!liquorData[countyName]) return "No data";
  var d = liquorData[countyName];

  function fmt(val) {
    if (val >= 1000000) return "$" + (val / 1000000).toFixed(1) + "M";
    if (val >= 1000)    return "$" + (val / 1000).toFixed(1) + "K";
    return "$" + val.toFixed(0);
  }

  if (liquorMode === "sales") {
    return "Liquor sales: <strong>" + fmt(d.totalSales) + "</strong>" +
           "<br>Bottles sold: <strong>" + d.totalBottles.toLocaleString() + "</strong>";
  }
  if (liquorMode === "category") {
    return "Top spirit: <strong>" + d.topCategory + "</strong>" +
           "<br>Best seller: <strong>" + d.topItem + "</strong>";
  }
  return "No data";
}

//  Globals 
var liquorTooltip = null;
// liquorData[countyName] = { totalSales, totalBottles, topCategory, topItem }
var liquorData = {};

// Tooltip 
function createLiquorTooltip() {
  if (liquorTooltip) return;
  liquorTooltip = d3
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

//  Hover functions  
function attachLiquorHoverEvents() {
  createLiquorTooltip();

  svg.selectAll("path")
    .on("mouseover.liquor", function (event, d) {
      if (!d3.select(this).classed("active")) {
        d3.select(this).transition().duration(100).style("fill", "#FFBC3E");
      }
      if (Object.keys(liquorData).length > 0) {
        var name = d.properties.NAME;
        liquorTooltip
          .style("display", "block")
          .html("<strong>" + name + " County</strong><br>" + getLiquorTooltipLine(name));
      }
    })
    .on("mousemove.liquor", function (event) {
      var coords = d3.pointer(event, d3.select("#iowa-map").node());
      liquorTooltip
        .style("left", coords[0] + 14 + "px")
        .style("top",  coords[1] - 28 + "px");
    })
    .on("mouseout.liquor", function (_event, d) {
      liquorTooltip.style("display", "none");
      if (!d3.select(this).classed("active")) {
        var name = d.properties.NAME;
        var restoreColor = Object.keys(liquorData).length > 0
          ? getLiquorCountyColor(name)
          : "#ffffff";
        d3.select(this).transition().duration(200).style("fill", restoreColor);
      }
    });
}

function removeLiquorHoverEvents() {
  svg.selectAll("path")
    .on("mouseover.liquor", null)
    .on("mousemove.liquor", null)
    .on("mouseout.liquor",  null);
  if (liquorTooltip) liquorTooltip.style("display", "none");
}

//  Repaint map 
function repaintLiquorMap() {
  svg.selectAll("path").each(function(d) {
    if (!d || !d.properties) return;
    var name = d.properties.NAME;
    if (!d3.select(this).classed("active")) {
      d3.select(this).style("fill", getLiquorCountyColor(name));
    }
  });
}

// Called when user picks a sub-category
function setLiquorMode(mode) {
  liquorMode = mode;
  repaintLiquorMap();
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
    d3.selectAll("path").style("fill", "#ffffff");
    document.getElementById("liquor-suboptions").style.display = "none";
    removeLiquorHoverEvents();
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

    // Reset category to first option
    var radios = document.querySelectorAll('input[name="liquor-metric"]');
    if (radios.length > 0) radios[0].checked = true;

    document.getElementById("liquor-suboptions").style.display = "block";

    repaintLiquorMap();
    attachLiquorHoverEvents();

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