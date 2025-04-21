
/*
This is a very scuffed way to do this but basically changeMap() will toggle between the bus lots and the usual waves.
Stores the html of each one and swaps them out when the button is pressed.
*/
const nextContent = document.getElementById("next-wave").innerHTML;
const currentContent = document.getElementById("current-wave").innerHTML;
const lotsContent = document.getElementById("bus-lots").innerHTML;


/*
These are to get the actual list of buses in each wave
*/
const nextWave = document.getElementsByClassName("next-wave");
const currentWave = document.getElementsByClassName("current-wave");


const pins = localStorage.getItem("pins");


/*
This immediately clears the bus lots when the page loads (I know this is scuffed but it works for now)
*/
document.getElementById("bus-lots").innerHTML = "";


function changeMap() {
   if (document.getElementById("next-wave").innerHTML !== "") {


       document.getElementById("next-wave").innerHTML = "";
       document.getElementById("current-wave").innerHTML = "";


       document.getElementById("bus-lots").innerHTML = lotsContent;
   }
   else {
       document.getElementById("next-wave").innerHTML = nextContent;
       document.getElementById("current-wave").innerHTML = currentContent;


       document.getElementById("bus-lots").innerHTML = "";
   }
}


function containsPins() {
   for (let i = 0; i < nextWave.length; i++) {
       if (pins.includes(nextWave[i].value)) {
           nextWave[i].value = "pinned";
       }
   }
}


containsPins();


async function saveMap() {
   await fetch("/updateBusMap", {
       method: 'POST',
       headers: {
           accept: 'application.json',
           'Content-Type': 'application/json'
       },
       body:
       JSON.stringify({
           lots, lots
       })
   });


   updateBusMap();
   window.location.assign("/admin");
}
