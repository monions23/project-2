const svg = d3
  .select("#iowa-map")
  .append("svg")
  .attr("width", 960)
  .attr("height", 600);

d3.json(
  "https://raw.githubusercontent.com/subyfly/topojson/refs/heads/master/us-states/IA-19-iowa-counties.json",
).then(function (topology) {
  console.log(topology.objects.cb_2015_iowa_county_20m.geometries);
  const geojson = topojson.feature(
    topology,
    topology.objects.cb_2015_iowa_county_20m,
  );

  const projection = d3.geoMercator().scale(10000).fitSize([960, 600], geojson); // center on IA
  const path = d3.geoPath().projection(projection);
  svg
    .append("g")
    .selectAll("path")
    .data(geojson.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", "#ffffff")
    .attr("stroke", "#000000");
});
