var expanded = false;

function toggleCounties() {
  var checkboxes = document.getElementById("county-list");
  if (!expanded) {
    checkboxes.style.display = "block";
    expanded = true;
  } else {
    checkboxes.style.display = "none";
    expanded = false;
  }
}

function toggleData() {
  var checkboxes = document.getElementById("data-list");
  if (!expanded) {
    checkboxes.style.display = "block";
    expanded = true;
  } else {
    checkboxes.style.display = "none";
    expanded = false;
  }
}

function enableCountySearch() {
  const searchBox = document.getElementById("county-search");
  const items = document.querySelectorAll("#county-list label");

  searchBox.addEventListener("input", function () {
    const query = this.value.toLowerCase();

    items.forEach((label) => {
      const countyName = label.querySelector("input").value.toLowerCase();

      // Show if it matches, hide if not
      label.style.display = countyName.includes(query) ? "" : "none";
    });
  });
}

enableCountySearch();
