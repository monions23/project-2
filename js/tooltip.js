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

// Tooltip label dispatcher
function getTooltipLine(countyName, mode) {
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
