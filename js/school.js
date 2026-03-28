// js/school.js
// Handles the Public School Enrollment choropleth 

// Color scale 
const _RED8 = "#1A0000"; // > 200,000
const _RED7 = "#4D0000"; // > 100,000
const _RED6 = "#7A0000"; // >  50,000
const _RED5 = "#AA1100"; // >  20,000
const _RED4 = "#DD3300"; // >  10,000
const _RED3 = "#FF6644"; // >   5,000
const _RED2 = "#FFAA99"; // >   2,500
const _RED1 = "#FFE5E0"; // <=  2,500

function getColorForEnrollment(enrollment) {
  if (enrollment > 200000) return _RED8;
  if (enrollment > 100000) return _RED7;
  if (enrollment > 50000) return _RED6;
  if (enrollment > 20000) return _RED5;
  if (enrollment > 10000) return _RED4;
  if (enrollment >  5000) return _RED3;
  if (enrollment >  2000) return _RED2;
  return _RED1;
}
// countyTotals is global so iowa_map.js getBaseColor() can read it.
var enrollmentTooltip = null;
var countyTotals = {};

//  Tooltip 
function createTooltip() {
  if (enrollmentTooltip) return;
  enrollmentTooltip = d3
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

// when user hasn't picked a dataset, hovering highlights orange then restores white.
// When enrollment data is loaded, it restores the red choropleth color + tooltip.

function attachHoverEvents() {
  createTooltip();

  svg.selectAll("path")
    .on("mouseover.school", function (event, d) {
      if (!d3.select(this).classed("active")) {
        d3.select(this).transition().duration(100).style("fill", "#FFBC3E");
      }
      // Only show tooltip if data has been loaded
      if (Object.keys(countyTotals).length > 0) {
        var name = d.properties.NAME;
        var total = countyTotals[name];
        enrollmentTooltip
          .style("display", "block")
          .html(
            "<strong>" + name + " County</strong><br>" +
            "PK-12 Enrollment: <strong>" +
            (total !== undefined ? total.toLocaleString() : "No data") +
            "</strong>"
          );
      }
    })
    .on("mousemove.school", function (event) {
      var coords = d3.pointer(event, d3.select("#iowa-map").node());
      enrollmentTooltip
        .style("left", coords[0] + 14 + "px")
        .style("top",  coords[1] - 28 + "px");
    })
    .on("mouseout.school", function (event, d) {
      enrollmentTooltip.style("display", "none");
      if (!d3.select(this).classed("active")) {
        var name = d.properties.NAME;
        // If data loaded: restore red shade. If not: restore white.
        var restoreColor = countyTotals[name]
          ? getColorForEnrollment(countyTotals[name])
          : "#ffffff";
        d3.select(this).transition().duration(200).style("fill", restoreColor);
      }
    });
}

// Combine CSV districts into county totals 
function getCountyTotals(csvData) {
  var totals = {};
  csvData.forEach(function (row) {
    var county = row["COUNTY NAME"];
    if (!county) return;
    if (county === "Pottawattam") county = "Pottawattamie";
    var val = Number(row["Total PK12"].toString().replace(/,/g, "")) || 0;
    totals[county] = (totals[county] || 0) + val;
  });
  return totals;
}

// entry point 
function enrollmentClickHandler() {
  var isChecked = event.target.checked;

  if (!isChecked) {
    countyTotals = {};
    d3.selectAll("path").style("fill", "#ffffff");
    return;
  }

  d3.csv(
    "Iowa_Public_School_District_Enrollment_(PreK-12_Enrollment_by_Grade,_Race_and_Gender)_20260324.csv"
  ).then(function (csvData) {

    // Write into the global so getBaseColor() in iowa_map.js can see it
    countyTotals = getCountyTotals(csvData);

    // Color every county
    var countyList = document.getElementById("county-list");
    for (var i = 0; i < countyList.children.length; i++) {
      var countyName = countyList.children[i].children[0].value;
      d3.selectAll("path")
        .filter(function (d) { return d.properties.NAME === countyName; })
        .style("fill", getColorForEnrollment(countyTotals[countyName] || 0));
    }

    console.log("[school.js] Loaded. Johnson:", countyTotals["Johnson"], "| Polk:", countyTotals["Polk"]);
  });
}

//  Attach hover as soon as the map paths exist 
// iowa_map.js loads the TopoJSON asynchronously
var hoverAttached = false;
var hoverPoll = setInterval(function () {
  if (typeof svg !== "undefined" && svg.selectAll("path").size() > 0) {
    attachHoverEvents();
    hoverAttached = true;
    clearInterval(hoverPoll);
    console.log("[school.js] Hover events attached.");
  }
}, 100);