"use strict";
// Checks if form is valid before submission and returns false if not so form submission can be prevented
function verifyForm() {
    const busNumberInputs = document.getElementsByName("busNumber");
    const busNumbers = Array.from(busNumberInputs, (numberInput) => {
        return numberInput.value;
    });
    // Checks that there is at least one bus
    if (busNumbers.length == 0) {
        alert("Must have at least one bus to save");
        return false;
    }
    // Checks that there are no duplicate buses
    if (busNumbers.some((number) => { return busNumbers.indexOf(number) != busNumbers.lastIndexOf(number); })) {
        alert("Duplicate buses are not allowed");
        return false;
    }
}
