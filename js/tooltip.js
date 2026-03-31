function buildCombinedTooltip() {
  if (tooltip) return;
  tooltip = d3
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

MapEvents.addEventListener("map-hover-start", (e) => {
  const { name } = e.detail;

  const html = buildCombinedTooltip(name);
  if (!html) return;

  tooltip.style("display", "block").html(html);
});

MapEvents.addEventListener("map-hover-move", (e) => {
  const { event } = e.detail;
  const [x, y] = d3.pointer(event, d3.select("#iowa-map").node());

  tooltip.style("left", x + 14 + "px").style("top", y - 28 + "px");
});

MapEvents.addEventListener("map-hover-end", () => {
  tooltip.style("display", "none");
});

// Tooltip label dispatcher
function getTooltipLine(countyName) {
  totalHTML = "";
  if (
    typeof countyTotals !== "undefined" &&
    Object.keys(countyTotals).length > 0
  ) {
    var d = countyData[countyName];
    if (currentMode === "enrollment")
      totalHTML +=
        "PK-12 Enrollment: <strong>" + d.total.toLocaleString() + "</strong>";
    if (currentMode === "pct_hispanic")
      totalHTML +=
        "Hispanic students: <strong>" + d.pctHispanic.toFixed(1) + "%</strong>";
    if (currentMode === "pct_black")
      totalHTML +=
        "Black students: <strong>" + d.pctBlack.toFixed(1) + "%</strong>";
    if (currentMode === "pct_asian")
      totalHTML +=
        "Asian students: <strong>" + d.pctAsian.toFixed(1) + "%</strong>";
    if (currentMode === "pct_white")
      totalHTML +=
        "White students: <strong>" + d.pctWhite.toFixed(1) + "%</strong>";
    if (currentMode === "pct_native")
      totalHTML +=
        "Native American students: <strong>" +
        d.pctNative.toFixed(1) +
        "%</strong>";
    if (currentMode === "pct_multirace")
      totalHTML +=
        "Multi-race students: <strong>" +
        d.pctMultiRace.toFixed(1) +
        "%</strong>";
  } else if (
    typeof liquorData !== "undefined" &&
    Object.keys(liquorData).length > 0
  ) {
    var d = liquorData[countyName];

    function fmt(val) {
      if (val >= 1000000) return "$" + (val / 1000000).toFixed(1) + "M";
      if (val >= 1000) return "$" + (val / 1000).toFixed(1) + "K";
      return "$" + val.toFixed(0);
    }

    if (liquorMode === "sales") {
      return (
        "Liquor sales: <strong>" +
        fmt(d.totalSales) +
        "</strong>" +
        "<br>Bottles sold: <strong>" +
        d.totalBottles.toLocaleString() +
        "</strong>"
      );
    }
    if (liquorMode === "category") {
      return (
        "Top spirit: <strong>" +
        d.topCategory +
        "</strong>" +
        "<br>Best seller: <strong>" +
        d.topItem +
        "</strong>"
      );
    }
  }
  if (totalHTML === "") {
    return "No data";
  } else {
    return totalHTML;
  }
}
