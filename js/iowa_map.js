var activeCounties = new Set();

// Returns the correct resting color for a county.
// If school.js has loaded enrollment data, use that color.
// Otherwise fall back to white (the default blank map state).
function getBaseColor(countyName) {
  if (typeof countyTotals !== "undefined" && countyTotals[countyName]) {
    return getColorForEnrollment(countyTotals[countyName]);
  }
  return "#ffffff";
}

const svg = d3
  .select("#iowa-map")
  .append("svg")
  .attr("preserveAspectRatio", "xMinYMin meet")
  .attr("viewBox", "0 0 960 600");

/* Read and process the data */
d3.json(
  "https://raw.githubusercontent.com/subyfly/topojson/refs/heads/master/us-states/IA-19-iowa-counties.json",
).then(function (topology) {
  // First, prepare the data
  console.log(topology.objects.cb_2015_iowa_county_20m.geometries);
  const geojson = topojson.feature(
    topology,
    topology.objects.cb_2015_iowa_county_20m,
  );

  const projection = d3.geoMercator().scale(10000).fitSize([960, 600], geojson);
  const path = d3.geoPath().projection(projection);

  // Define drag behavior
  const drag = d3.drag().on("drag", dragged);

  // Append the map to the svg
  svg
    .append("g")
    .selectAll("path")
    .data(geojson.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", "#ffffff")
    .attr("stroke", "#000000");

  // Mouseover functions
  svg
    .selectAll("path")
    .on("click", function (event, d) {
      // Check current active state
      const isActive = d3.select(this).classed("active");

      // When clicked, switch current state to opposite state
      d3.select(this).classed("active", !isActive);

      // Set to orange if it's becoming active, else set it to white
      if (!isActive) {
        d3.select(this).style("fill", "#FFBC3E");

        // If becoming active, add to activeCounties
        activeCounties.add(d.properties.NAME);
      } else {
        d3.select(this).style("fill", getBaseColor(d.properties.NAME));

        // If becoming inactive, delete from activeCounties
        activeCounties.delete(d.properties.NAME);
      }

      // Make sure change (making active or making inactive) is reflected in checklist
      updateChecklist(d.properties.NAME, isActive);

      console.log("Clicked path data:", d);
      console.log(activeCounties);
    });
  // Drag functionality
  // svg.selectAll("path").call(brushed);

  function dragged(event, d) {
    console.log(d3.select(this));
  }

  // Function for updating the checklist based on changing map clicks
  function updateChecklist(countyName, activeBool) {
    // find correct input instance
    const checkbox = document.querySelector(
      `input[type="checkbox"][value=${countyName}]`,
    );

    // check active status of county in map
    // if active, make sure the corresponding form input is checked
    // if not active, make sure it is not checked
    if (!activeBool) {
      checkbox.checked = true;
    } else {
      checkbox.checked = false;
    }
  }

  // Form functionality - event listener for changing form input
  d3.select("#county-list")
    .selectAll("input")
    .on("change", function (event) {
      // find the value being changed
      const newValue = event.currentTarget.value;

      // update the map with that value
      updateMap(newValue);
    });

  // Function for updating the map based on changing form values
  function updateMap(value) {
    // select the path for the corresponding county

    // checkboxActive relates to whether the corresponding checkbox is checked
    const checkboxActive = document.querySelector(
      `input[type="checkbox"][value=${value}]`,
    ).checked;

    // find the path corresponding with the county name being checked in the form
    // change that path's active status based on the checkbox's status
    // if checkbox is becoming active, change the color to orange, else change to white
    const countyPath = d3
      .selectAll("path")
      .filter((d) => d.properties.NAME === value)
      .classed("active", checkboxActive)
      .style("fill", function () {
        if (checkboxActive) {
          return "#FFBC3E";
        } else {
          return getBaseColor(value);
        }
      });

    // add or remove county from activeCounties based on status of checkbox
    if (checkboxActive) {
      activeCounties.add(value);
    } else {
      activeCounties.delete(value);
    }

    console.log(activeCounties);
    // check if the state is already filled in due to click

    // if (isChecked) {
    // }

    // console.log(checkedTypes);å
  }

  // Append county labels
  //   svg
  //     .append("g")
  //     .selectAll("text")
  //     .data(geojson.features)
  //     .enter()
  //     .append("text")
  //     .attr("x", (d) => path.centroid(d)[0]) // Get horizontal center
  //     .attr("y", (d) => path.centroid(d)[1]) // Get vertical center
  //     .attr("text-anchor", "middle") // Center the text on the point
  //     .attr("font-size", "10px")
  //     .text((d) => d.properties.NAME); // Access the label from data properties
});
