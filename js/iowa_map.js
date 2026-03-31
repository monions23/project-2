var activeCounties = new Set();
var dragActive = false;

// For tracking dragging behavior
var previousCounty = "";
var dragColor = "";
var firstNodeActive = false;

const noDataColor = "#FFFFFF";

// Returns the blended resting color for a county across all active datasets.
// Falls back to white when no datasets are loaded.
function getBaseColor(countyName) {
  var noneChecked =
    document.querySelector(
      '#data-list .checkbox-header input[type="checkbox"]:checked',
    ) == null;
  if (noneChecked) {
    return "#FFBC3E";
  } else if (typeof getBlendedColor === "function")
    return getBlendedColor(countyName);
  else {
    console.log("no color");
    return noDataColor;
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
    .attr("fill", noDataColor)
    .attr("stroke", "#000000");

  // Form functionality - event listener for changing form input
  d3.select("#county-list")
    .selectAll("input")
    .on("change", function (event) {
      // find the value being changed
      const newValue = event.currentTarget.value;

      // update the map with that value
      updateMap(newValue);
    });

  d3.select("#data-list")
    .selectAll("input")
    .on("change", function (event) {
      // find the value being changed
      var countiesData = getActiveCounties();
      svg
        .selectAll("path")
        .filter((d) => countiesData.has(d.properties.NAME))
        .each(function (d) {
          if (!d || !d.properties) return;
          if (d3.select(this).classed("active")) {
            d3.select(this)
              .style("opacity", 1)
              .style("fill", getBaseColor(d.properties.NAME));
          }
        });
    });

  // Function for implementing all values on load
  var allBox = document.querySelector('input[value="All"]');
  if (allBox) {
    allBox.checked = true;
    // 2. Run the update logic to sync the Map and the other Checkboxes
    updateMap("All");
  }

  // Mouseover functions
  svg
    .selectAll("path")
    .on("mouseover.base", function (event) {
      // only function if drag isn't currently active
      if (dragActive) {
        return;
      }
      let countyName = getCountyName(d3.select(this));

      // Highlight if not already clicked
      if (!d3.select(this).classed("active")) {
        d3.select(this)
          .transition()
          .duration(100)
          .style("fill", getBaseColor(countyName))
          .attr("opacity", 1);
      } else {
        // Get current color and store it if not already stored - for hover effect
        let currentColor = d3.select(this).style("fill");
        d3.select(this).attr("data-original-color", currentColor);
      }
      var coords = d3.pointer(event, d3.select("#iowa-map").node());
      showMasterTooltip(countyName, coords[0], coords[1]);
    })
    .on("mousemove.base", function (event) {
      var coords = d3.pointer(event, d3.select("#iowa-map").node());
      moveMasterTooltip(coords[0], coords[1]);
    })
    .on("mouseout.base", function () {
      // only function if drag isn't currently active
      if (dragActive) {
        return;
      }

      // Revert only if not clicked
      if (!d3.select(this).classed("active")) {
        d3.select(this)
          .transition()
          .duration(200)
          .style("fill", noDataColor)
          .attr("opacity", 1);
      }
      hideMasterTooltip();
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
    });

  // Drag functionality
  const dragHandler = d3
    .drag()
    .on("start.drag", function () {
      // Set dragActive state to true
      dragActive = true;

      // Reset previous county
      previousCounty = "";

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
      previousCounty = node;
      var targetState = !firstNodeActive;

      // If the node is a county, highlight it (while ensuring it's not already in the state we want)
      if (
        node &&
        d3.select(node).classed("county") &&
        d3.select(node).classed("active") !== targetState
      ) {
        var county = d3.select(node);
        var countyName = getCountyName(county);

        toggleCounty(countyName, firstNodeActive);

        // set previous county to make sure active state is not toggled multiple times for 1
      }
    })
    .on("end.drag", function () {
      // return active drag state to False
      dragActive = false;
    });

  // Call the drag handler
  svg.selectAll("path").call(dragHandler);

  // Function for updating the checklist based on changing map clicks
  function updateChecklist(countyName, isChecked) {
    // find correct input instance
    const checkbox = document.querySelector(
      `input[type="checkbox"][value="${countyName}"]`,
    );

    // check active status of county in map
    // if active, make sure the corresponding form input is checked
    // if not active, make sure it is not checked
    if (isChecked) {
      checkbox.checked = true;
    } else {
      checkbox.checked = false;
    }

    // check all value
    syncAllCheckbox();
  }

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
        .style("fill", function (d) {
          if (checkboxActive) {
            // Use the actual county name from the map data (d.properties.NAME)
            return getBaseColor(d.properties.NAME);
          } else {
            return noDataColor;
          }
        });
    } else {
      // add or remove county from activeCounties based on status of checkbox
      // this will help inform
      if (checkboxActive) {
        activeCounties.add(value);
      } else {
        activeCounties.delete(value);
      }

      // find the path corresponding with the county name being checked in the form
      // change that path's active status based on the checkbox's status
      // if checkbox is becoming active, change the color to orange, else change to white
      d3.selectAll("path")
        .filter((d) => d.properties.NAME === value)
        .classed("active", checkboxActive)
        .style("fill", function () {
          if (checkboxActive) {
            return getBaseColor(value);
          } else {
            return noDataColor;
          }
        });

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
    console.log("activating");
    activeCounties.add(name);
    getCountyPath(name)
      .classed("active", true)
      .style("fill", getBaseColor(name));

    updateChecklist(name, true);
    updateCharts();
  }

  /* deactivates a county */
  function deactivateCounty(name) {
    console.log("deactivating");
    activeCounties.delete(name);
    getCountyPath(name).classed("active", false).style("fill", noDataColor);

    updateChecklist(name, false);
    updateCharts();
  }

  /* toggles a county between active and inactive based off of a boolean */
  function toggleCounty(name, currActive) {
    if (!currActive) activateCounty(name);
    else deactivateCounty(name);

    console.log(activeCounties);
    // update the charts below the map with whatever the new selection is
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
