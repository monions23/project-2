const _RED5 = "#4D0000"
const _RED4 = "#990000"
const _RED3 = "#FF0000"
const _RED2 = "#FF6666"
const _RED1 = "#FFCCCC"


function enrollmentClickHandler() {
    const isChecked = event.target.checked;

    if (!isChecked) {
        d3.selectAll("path")
            .style("fill", "#FFFFFF"); // Reset all counties to white
        console.log("Enrollment checkbox checked");
    } else {
        updateMapWithEnrollmentData();
    }
}

function updateMapWithEnrollmentData() {
    // console.log("Enrollment checkbox clicked");

    // Display the enrollment data on the map
    countyList = document.getElementById("county-list");
    d3.csv("Iowa_Public_School_District_Enrollment_(PreK-12_Enrollment_by_Grade,_Race_and_Gender)_20260324.csv")
        .then(csvData => {

            // Loop through the checkboxes and fill county red
            for (let i = 0; i < countyList.children.length; i++) {

                // Get the county name from the checkbox value
                const county = countyList.children[i];
                const countyName = county.children[0].value;

                // Get the enrollment data for the county
                const enrollment = getEnrollmentData(countyName, csvData);

                // Get the color based on the enrollment data
                const color = getColorForEnrollment(enrollment);

                // Fill the county on the map with the determined color
                // console.log(`County: ${countyName}, Enrollment: ${enrollment}, Color: ${color}`);
                d3.selectAll("path")
                    .filter((d) => d.properties.NAME === countyName)
                    .style("fill", color);
            }
        });
}

function getEnrollmentData(countyName, csvData) {
    // Find the row for the given county
    const row = csvData.find(d => d['COUNTY NAME'] === countyName);
    
    if (row && row['Total PK12']) {
        // Remove commas and convert to a number
        const cleanValue = row['Total PK12'].toString().replace(/,/g, '');
        return Number(cleanValue) || 0;
    }
    
    return -1;
}
function getColorForEnrollment(enrollment) {
    if (enrollment > 3000) return _RED5;
    if (enrollment > 2000) return _RED4;
    if (enrollment > 1000) return _RED3;
    if (enrollment > 500)  return _RED2;
    return _RED1;
}