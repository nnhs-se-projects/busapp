
/*
This is a very scuffed way to do this but basically changeMap() will toggle between the bus lots and the usual waves.
Stores the html of each one and swaps them out when the button is pressed.
*/
const nextContent = document.getElementById("next-wave").innerHTML;
const currentContent = document.getElementById("current-wave").innerHTML;
const lotsContent = document.getElementById("bus-lots").innerHTML;

// This is the button that will change the layout of the map from the waves to the bus lots
const button = document.getElementById("button map-change");

// These are the table rows of the respective waves
const currentWave = document.getElementsByClassName("current-wave");
const nextWave = document.getElementsByClassName("next-wave");

const pinString = localStorage.getItem("pins");

let pins = [];
if (pinString != null) {
    let pinArrayString = pinString.split(", ");
    
    for (let i = 0; i < pinArrayString.length; i++) {
        let n = parseInt(pinArrayString[i]);
        pins.push(n);
    }
}


/*
This immediately clears the bus lots when the page loads (I know this is scuffed but it works for now)
*/
document.getElementById("bus-lots").innerHTML = "";


function changeMap() {
   if (document.getElementById("next-wave").innerHTML !== "") {

       document.getElementById("next-wave").innerHTML = "";
       document.getElementById("current-wave").innerHTML = "";

       document.getElementById("bus-lots").innerHTML = lotsContent;

       button.innerText = "Waves";
   }
   else {
       document.getElementById("next-wave").innerHTML = nextContent;
       document.getElementById("current-wave").innerHTML = currentContent;

       document.getElementById("bus-lots").innerHTML = "";

       button.innerText = "Lots";
   }
}


const pinnedBusHighlight = () => {
    let nextHighlight = [];

    for (let i = 0; i < nextWave.length; i++) {
        const bus = nextWave[i].textContent.trim();

        if (pins.includes(parseInt(bus))) {
            nextWave[i].style.backgroundColor = "#e43939";
            nextWave[i].style.animation = "glowCurrent 1s ease-in-out infinite alternate";

            nextHighlight.push(i);
        }
    }

    for (let i = currentWave.length - 1; i >= 0; i--) {
        const bus = currentWave[i].textContent.trim();

        if (pins.includes(parseInt(bus))) {
            currentWave[i].style.backgroundColor = "#e43939";
            currentWave[i].style.animation = "glowCurrent 1s ease-in-out infinite alternate";
        } if (nextHighlight.includes(i)) {
            currentWave[i].style.borderWidth = "5px";
            currentWave[i].style.borderStyle = "solid";
            currentWave[i].style.borderColor = "#1cbfff";
            currentWave[i].style.animation = "glowNext 1s ease-in-out infinite alternate";
        }
    }
};


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
