// js/school.js
// Handles Public School Enrollment choropleth + demographic breakdowns.

// ── Current view mode ─────────────────────────────────────────────────────────
var currentMode = "enrollment";
// Total enrollment color scale
const _RED8 = "#1A0000"; // > 200,000  (Polk)
const _RED7 = "#4D0000"; // > 100,000  (Linn, Scott)
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
  if (enrollment > 5000) return _RED3;
  if (enrollment > 2500) return _RED2;
  return _RED1;
}

// ── Demographic percentage color scales
// Hispanic — purple
function getColorForHispanic(pct) {
  if (pct > 20) return "#4A0080";
  if (pct > 10) return "#7B00CC";
  if (pct > 7) return "#9B30E0";
  if (pct > 5) return "#B966EE";
  if (pct > 3) return "#D4A0F5";
  if (pct > 2) return "#E8CCF9";
  if (pct > 1) return "#F3E5FC";
  return "#FAF4FF";
}

// Black — navy blue
function getColorForBlack(pct) {
  if (pct > 12) return "#003366";
  if (pct > 8) return "#005599";
  if (pct > 5) return "#1A7ACC";
  if (pct > 3) return "#4D9EE0";
  if (pct > 2) return "#80BFEE";
  if (pct > 1) return "#B3D9F7";
  if (pct > 0.5) return "#D9EDFB";
  return "#EEF7FE";
}

// Asian — green
function getColorForAsian(pct) {
  if (pct > 5) return "#004D00";
  if (pct > 3) return "#007A00";
  if (pct > 2) return "#00AA00";
  if (pct > 1) return "#33CC33";
  if (pct > 0.5) return "#80DD80";
  if (pct > 0.3) return "#B3EABB";
  if (pct > 0.1) return "#D9F5DC";
  return "#F0FBF1";
}

// White — TEAL
// Higher % white = darker teal. Most rural counties will be deep teal.
// More diverse urban counties is lighter, like Polk, Linn, Johnson, Scott, etc.
function getColorForWhite(pct) {
  if (pct > 95) return "#003D3D";
  if (pct > 90) return "#006666";
  if (pct > 85) return "#009999";
  if (pct > 80) return "#00BBBB";
  if (pct > 70) return "#33CCCC";
  if (pct > 60) return "#80DDDD";
  if (pct > 50) return "#B3EEEE";
  return "#E0F9F9";
}

// Native American — brown
function getColorForNative(pct) {
  if (pct > 3) return "#7A3B00";
  if (pct > 2) return "#A85200";
  if (pct > 1) return "#D06B00";
  if (pct > 0.5) return "#E89030";
  if (pct > 0.3) return "#F2B870";
  if (pct > 0.1) return "#F8D9A8";
  return "#FDF0E0";
}

// Multi-race — gold
function getColorForMultiRace(pct) {
  if (pct > 5) return "#4D3300";
  if (pct > 4) return "#7A5200";
  if (pct > 3) return "#AA7500";
  if (pct > 2) return "#CC9900";
  if (pct > 1.5) return "#DDBB44";
  if (pct > 1) return "#EED488";
  if (pct > 0.5) return "#F7EABC";
  return "#FDF8EC";
}

// color dispatcher
function getCountyColor(countyName) {
  if (!countyData[countyName]) return "#ffffff";
  var d = countyData[countyName];
  if (currentMode === "enrollment") return getColorForEnrollment(d.total);
  if (currentMode === "pct_hispanic") return getColorForHispanic(d.pctHispanic);
  if (currentMode === "pct_black") return getColorForBlack(d.pctBlack);
  if (currentMode === "pct_asian") return getColorForAsian(d.pctAsian);
  if (currentMode === "pct_white") return getColorForWhite(d.pctWhite);
  if (currentMode === "pct_native") return getColorForNative(d.pctNative);
  if (currentMode === "pct_multirace")
    return getColorForMultiRace(d.pctMultiRace);
  return "#ffffff";
}

// Tooltip label dispatcher
function getTooltipLine(countyName) {
  if (!countyData[countyName]) return "No data";
  var d = countyData[countyName];
  if (currentMode === "enrollment")
    return (
      "PK-12 Enrollment: <strong>" + d.total.toLocaleString() + "</strong>"
    );
  if (currentMode === "pct_hispanic")
    return (
      "Hispanic students: <strong>" + d.pctHispanic.toFixed(1) + "%</strong>"
    );
  if (currentMode === "pct_black")
    return "Black students: <strong>" + d.pctBlack.toFixed(1) + "%</strong>";
  if (currentMode === "pct_asian")
    return "Asian students: <strong>" + d.pctAsian.toFixed(1) + "%</strong>";
  if (currentMode === "pct_white")
    return "White students: <strong>" + d.pctWhite.toFixed(1) + "%</strong>";
  if (currentMode === "pct_native")
    return (
      "Native American students: <strong>" +
      d.pctNative.toFixed(1) +
      "%</strong>"
    );
  if (currentMode === "pct_multirace")
    return (
      "Multi-race students: <strong>" + d.pctMultiRace.toFixed(1) + "%</strong>"
    );
  return "No data";
}

// Globals for iowa_map.js compatibility
var enrollmentTooltip = null;
var countyTotals = {};
var countyData = {}; // countyData[name] = { total, pctBlack, pctHispanic, ... }

// Tooltip
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

// Hover events
function attachHoverEvents() {
  createTooltip();
  var countiesData = getActiveCounties();
  svg
    .selectAll("path")
    .filter((d) => countiesData.has(d.properties.NAME))
    .on("mouseover.school", function (event, d) {
      if (Object.keys(countyData).length > 0) {
        var name = d.properties.NAME;
        enrollmentTooltip
          .style("display", "block")
          .html(
            "<strong>" + name + " County</strong><br>" + getTooltipLine(name),
          );
      }
    })
    .on("mousemove.school", function (event) {
      var coords = d3.pointer(event, d3.select("#iowa-map").node());
      enrollmentTooltip
        .style("left", coords[0] + 14 + "px")
        .style("top", coords[1] - 28 + "px");
    })
    .on("mouseout.school", function (event, d) {
      enrollmentTooltip.style("display", "none");
      if (!d3.select(this).classed("active")) {
        var name = d.properties.NAME;
        var restoreColor =
          Object.keys(countyData).length > 0 ? getCountyColor(name) : "#ffffff";
        d3.select(this)
          .transition()
          .duration(200)
          .style("fill", restoreColor)
          .style("stroke", "#000000") // or whatever your original border color is
          .style("stroke-width", "1px")
          .style("opacity", "1");
      }
    });
}

//  whenever the user switches between from enrollment to demographic breakdowns, repaint the map with the new color scheme.
function repaintMap() {
  var countiesData = getActiveCounties();

  console.log("repainting");
  console.log(countiesData);
  svg
    .selectAll("path")
    .filter((d) => countiesData.has(d.properties.NAME))
    .each(function (d) {
      if (!d || !d.properties) return;
      var name = d.properties.NAME;
      if (d3.select(this).classed("active")) {
        d3.select(this).style("fill", getCountyColor(name));
      }
    });
}

// index.html calls this when user clicks on enrollment checkbox or demographic breakdown
// radio buttons. It updates the currentMode and repaints the map with the new color scheme.
function setEnrollmentMode(mode) {
  currentMode = mode;
  repaintMap();
}

// csv formatting is a little weird so we have to do some processing to get it into a more usable form.
//this function 1st sums all district in county
//Also, Pottawattam is misspelled in the csv, so we have to fix that here.
function buildCountyData(csvData) {
  var raw = {};

  csvData.forEach(function (row) {
    var county = row["COUNTY NAME"];
    if (!county) return;
    if (county === "Pottawattam") county = "Pottawattamie";

    var n = function (col) {
      return Number((row[col] || "0").toString().replace(/,/g, "")) || 0;
    };

    if (!raw[county]) {
      raw[county] = {
        total: 0,
        hispanic: 0,
        black: 0,
        asian: 0,
        white: 0,
        native: 0,
        multirace: 0,
      };
    }
    raw[county].total += n("Total PK12");
    raw[county].hispanic += n("Total Hispanic");
    raw[county].black += n("Black Total");
    raw[county].asian += n("Asian Total");
    raw[county].white += n("White Total");
    raw[county].native += n("Native American Total");
    raw[county].multirace += n("Multi-Race Total");
  });

  var result = {};
  Object.keys(raw).forEach(function (county) {
    var r = raw[county];
    var t = r.total || 1;
    result[county] = {
      total: r.total,
      pctHispanic: (r.hispanic / t) * 100,
      pctBlack: (r.black / t) * 100,
      pctAsian: (r.asian / t) * 100,
      pctWhite: (r.white / t) * 100,
      pctNative: (r.native / t) * 100,
      pctMultiRace: (r.multirace / t) * 100,
    };
    countyTotals[county] = r.total;
  });

  return result;
}

// when user clicks on enrollment checkbox, load the csv data, build the countyData object, and repaint the map with the enrollment color scheme.
function enrollmentClickHandler() {
  var isChecked = event.target.checked;

  if (!isChecked) {
    countyTotals = {};
    countyData = {};
    currentMode = "enrollment";
    d3.selectAll("path").style("fill", "#ffffff");
    document.getElementById("enrollment-suboptions").style.display = "none";
    return;
  }

  d3.csv(
    "Iowa_Public_School_District_Enrollment_(PreK-12_Enrollment_by_Grade,_Race_and_Gender)_20260324.csv",
  ).then(function (csvData) {
    countyData = buildCountyData(csvData);
    currentMode = "enrollment";

    var radios = document.querySelectorAll('input[name="enrollment-metric"]');
    if (radios.length > 0) radios[0].checked = true;

    document.getElementById("enrollment-suboptions").style.display = "block";

    repaintMap();

    console.log(
      "[school.js] Loaded. Polk:",
      countyData["Polk"].total,
      "| Polk % white:",
      countyData["Polk"].pctWhite.toFixed(1) + "%",
    );
  });
}

// Attach hover as soon as the map paths exists
// iowa_map.js loads the TopoJSON asyncronously
var hoverPoll = setInterval(function () {
  if (typeof svg !== "undefined" && svg.selectAll("path").size() > 0) {
    attachHoverEvents();
    clearInterval(hoverPoll);
    console.log("[school.js] Hover events attached.");
  }
}, 100);
