var activeCounties = new Set();
var dragActive = false;

// For tracking dragging behavior
var previousCounty = "";
var dragColor = "";
var firstNodeActive = false;

// Returns the correct resting color for a county.
// If school.js has loaded enrollment data, use that color.
// Otherwise fall back to white (the default blank map state).
function getBaseColor(countyName) {
  if (typeof countyTotals !== "undefined" && countyTotals[countyName]) {
    return getColorForEnrollment(countyTotals[countyName]);
  } else if (!(countyName in activeCounties)) {
    return "#FFBC3E";
  } else {
    return "#ffffff";
  }
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
  const geojson = topojson.feature(
    topology,
    topology.objects.cb_2015_iowa_county_20m,
  );

  const projection = d3.geoMercator().scale(10000).fitSize([960, 600], geojson);
  const path = d3.geoPath().projection(projection);

  // Append the map to the svg
  svg
    .append("g")
    .selectAll("path")
    .data(geojson.features)
    .enter()
    .append("path")
    .attr("class", "county")
    .attr("d", path)
    .attr("fill", "#ffffff")
    .attr("stroke", "#000000");

  // Mouseover functions
  svg
    .selectAll("path")
    .on("mouseover.base", function (d) {
      // only function if drag isn't currently active
      if (dragActive) {
        return;
      }
      // Highlight if not already clicked
      if (!d3.select(this).classed("active")) {
        let countyName = getCountyName(d3.select(this));
        d3.select(this)
          .transition()
          .duration(100)
          .style("fill", getBaseColor(countyName))
          .attr("opacity", 1);
      }
    })
    .on("mouseout.base", function (d) {
      // only function if drag isn't currently active
      if (dragActive) {
        return;
      }
      // Revert only if not clicked
      if (!d3.select(this).classed("active")) {
        d3.select(this)
          .transition()
          .duration(200)
          .style("fill", "#ffffff")
          .attr("opacity", 1);
      }
    })
    .on("click", function (event, d) {
      // only function if drag isn't currently active
      if (dragActive) {
        return;
      }
      // Check current active state
      const isActive = d3.select(this).classed("active");
      let countyName = getCountyName(d3.select(this));

      toggleCounty(countyName, isActive);

      console.log("Clicked path data:", d);
      console.log(activeCounties);
    });

  // Drag functionality
  const dragHandler = d3
    .drag()
    .on("start.drag", function () {
      // Set dragActive state to true
      dragActive = true;

      // Get the first node, and calculate what drag value will be (activate or deactivate)
      // Active boolean corresponds to whether county will be activated or deactivated
      firstNodeActive = d3.select(this).classed("active");
    })
    .on("drag.drag", function (event) {
      // Find the element at the current mouse position
      const node = document.elementFromPoint(
        event.sourceEvent.clientX,
        event.sourceEvent.clientY,
      );
      if (node == previousCounty) {
        return;
      }
      // If the node is a county, highlight it
      if (node && d3.select(node).classed("county")) {
        var county = d3.select(node);
        var countyName = getCountyName(county);

        toggleCounty(countyName, firstNodeActive);

        console.log(activeCounties);

        // set previous county to make sure active state is not toggled multiple times for 1
      }
      previousCounty = node;
    })
    .on("end.drag", function () {
      // return active drag state to False
      dragActive = false;
    });

  // Call the drag handler
  svg.selectAll("path").call(dragHandler);

  // Function for updating the checklist based on changing map clicks
  function updateChecklist(countyName, activeBool) {
    // find correct input instance
    const checkbox = document.querySelector(
      `input[type="checkbox"][value="${countyName}"]`,
    );

    // check active status of county in map
    // if active, make sure the corresponding form input is checked
    // if not active, make sure it is not checked
    if (!activeBool) {
      checkbox.checked = true;
    } else {
      checkbox.checked = false;
    }

    // check all value
    syncAllCheckbox();
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
      `input[type="checkbox"][value="${value}"]`,
    ).checked;

    // Fill all counties and update checklist if "All"" was clicked
    if (value === "All") {
      // Update all checkboxes
      d3.select("#county-list")
        .selectAll(`input[type="checkbox"]`)
        .property("checked", checkboxActive);

      // Update activeCounties set
      if (checkboxActive) {
        d3.selectAll("path").each(function (d) {
          activeCounties.add(d.properties.NAME);
        });
      } else {
        activeCounties.clear();
      }

      d3.selectAll("path")
        .classed("active", checkboxActive)
        .style("fill", function () {
          return getBaseColor(value);
        });
    } else {
      // find the path corresponding with the county name being checked in the form
      // change that path's active status based on the checkbox's status
      // if checkbox is becoming active, change the color to orange, else change to white
      d3.selectAll("path")
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
      syncAllCheckbox();
    }
  }

  function syncAllCheckbox() {
    const allBox = document.querySelector(`input[value="All"]`);
    const countyBoxes = document.querySelectorAll(
      `#county-list input[type="checkbox"]:not([value="All"])`,
    );

    // Check if all counties are selected
    const allChecked = Array.from(countyBoxes).every((cb) => cb.checked);

    allBox.checked = allChecked;
  }
  /* gets the filtered county paths */
  function getCountyPath(name) {
    return d3.selectAll("path").filter((d) => d.properties.NAME === name);
  }

  /* activates a county */
  function activateCounty(name) {
    activeCounties.add(name);
    getCountyPath(name)
      .classed("active", true)
      .style("fill", getBaseColor(name));

    updateChecklist(name, true);
  }

  /* deactivates a county */
  function deactivateCounty(name) {
    activeCounties.delete(name);
    getCountyPath(name).classed("active", false).style("fill", "#FFFFFF");

    updateChecklist(name, false);
  }

  /* toggles a county between active and inactive based off of a boolean */
  function toggleCounty(name, currActive) {
    if (!currActive) activateCounty(name);
    else deactivateCounty(name);
  }

  /* get the county name based on a specific node */
  function getCountyName(countyPath) {
    var countyData = countyPath.datum();
    var countyName = countyData.properties.NAME;

    return countyName;
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

/* returns active counties */
function getActiveCounties() {
  return activeCounties;
}
