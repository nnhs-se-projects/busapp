"use strict";
var adminSocket = window.io("/admin");
var countDownDate = new Date();
var updatingCount = 0;
// version of the state currently on screen; older snapshots are ignored
var renderedVersion = +document.getElementById("getRender").getAttribute("version") || 0;
// set while a wave-level command is in flight so a double tap can't send it twice
var waveCommandInFlight = false;

adminSocket.on("update", (data) => {
  renderState(data);
});

adminSocket.on("updateError", (message) => {
  console.error("Server failed to send an update:", message);
});

// fires on the first connection and on every reconnect; updates broadcast while this page
// was disconnected (e.g. the phone was asleep) are lost, so fetch the current state
adminSocket.on("connect", () => {
  forceUpdatePage();
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") forceUpdatePage();
});

function renderState(data) {
  if (data.version < renderedVersion) return;
  renderedVersion = data.version;

  // convert from time strings to dates to allow conversion to local time
  data.allBuses.forEach((bus) => {
    if (bus.time != "") bus.time = new Date(bus.time);
  });

  countDownDate = new Date(data.leavingAt);
  // rerender the page
  const html = ejs.render(
    document.getElementById("getRender").getAttribute("render"),
    { data: data }
  );
  
  document.getElementById("content").innerHTML = html;

  // the indicator is part of the rerendered content, restore its look
  showIndicatorStatus(lastStatus);
}

// fetches the current state over HTTP; used after our own commands (so they show up even if
// the socket is down) and to resync after reconnecting. networkIndicator.js also calls this.
async function forceUpdatePage() {
  try {
    const response = await fetch("/adminState", { cache: "no-store" });
    if (!response.ok || !response.headers.get("Content-Type")?.includes("application/json")) {
      throw new Error(`Response status: ${response.status}`);
    }
    renderState(await response.json());
  } catch (error) {
    console.error("Failed to refresh admin state:", error);
  }
}

function update() {
  return forceUpdatePage();
}

// numbers of the buses shown in the current wave on this screen
function shownCurrentWave() {
  return Array.from(document.querySelectorAll("#currentWaveTBody .numberInput"), (input) => Number(input.value));
}

async function lockWave(locked) {
  if (waveCommandInFlight) return;
  waveCommandInFlight = true;
  try {
    await fetchWithAlert("/lockWave", "POST", {"Content-Type": "application/json"}, { locked: locked });
  } finally {
    waveCommandInFlight = false;
  }
  update();
}

async function updateTimer() {
  var timerValue = document.getElementById("timerDurationSelector");

  if (timerValue === null) {
    timerValue = { value: 1 };
  }

  const res = await fetchWithAlert(
    "/setTimer",
    "POST",
    {
      "Content-Type": "application/json",
    },
    { minutes: timerValue.value }
  );
  if (!res.ok) {
    alert(`Response status: ${res.status}`);
  }

  update();
}

async function updateStatus(button, status) {
  let number = button.parentElement.parentElement.children[0].children[0].value;
  let time = new Date();

  let data = {
    number: number,
    time: time,
    status: status
  };


  await fetchWithAlert(
    "/updateBusStatus",
    "POST",
    {
      "Content-Type": "application/json",
    },
    data
  );

  update();
}

async function sendWave() {
  if (waveCommandInFlight) return;
  // capture what the admin is looking at before the confirm dialog, which an update could change
  const expectedLoading = shownCurrentWave();
  if (!confirm("Are you sure you want to send a wave?")) {
    return;
  }
  waveCommandInFlight = true;
  try {
    await fetchWithAlert("/sendWave", "POST", {"Content-Type": "application/json"}, { expectedLoading: expectedLoading });
  } finally {
    waveCommandInFlight = false;
  }
  update();
}

async function addToWave(button) {
  await updateStatus(button, "Loading");
}

async function removeFromWave(button, current) {
  await updateStatus(button, "");
}

async function addToNextWave(button) {
  await updateStatus(button, "Next Wave");
}

async function reset(button) {
  if(!confirm("Are you sure you want to reset this bus?")) return;
  await updateStatus(button, "");
}

async function resetAllBusses(button) {
  if(!confirm("Are you sure you want to reset all buses?")) return;
  await fetchWithAlert("/resetAllBusses", "POST", {}, {});
  update();
}

async function updateOrder(elem) {
  var busOne = elem.parentElement.parentElement?.children[0].children[0].value;
  var busTwo = elem.parentElement.parentElement.previousElementSibling?.children[0].children[0].value;

  await fetchWithAlert("/updateOrder", "POST", {"Content-Type": "application/json"}, {busOne: busOne, busTwo: busTwo});
  update();
}

async function updateBusChange(button) {
  // children are number, change, time, status
  let number = button.parentElement.parentElement.children[0].children[0].value;
  let change = button.parentElement.parentElement.children[1].children[0].value;
  let time = new Date();

  let data = {
    number: number,
    change: change,
    time: time,
  };

  await fetchWithAlert(
    "/updateBusChange",
    "POST",
    {
      "Content-Type": "application/json",
    },
    data
  );

  update();
}

// Set the date we're counting down to
fetch("/leavingAt")
  .then((response) => response.json())
  .then((data) => {
    // convert the data string to a date object
    const leavingAt = new Date(data);

    countDownDate = leavingAt; // Assign the value to countDownDate
  })
  .catch((error) => {
    console.error("Error:", error);
  });

// Update the count down every 1 second
var x = setInterval(async function () {
  // Get today's date and time
  var now = new Date().getTime();

  // Find the distance between now and the count down date
  var distance = countDownDate.getTime() - now;
  // console.log("distance: " + distance);

  // Time calculations for days, hours, minutes and seconds
  var days = Math.floor(distance / (1000 * 60 * 60 * 24));
  var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  var seconds = Math.floor((distance % (1000 * 60)) / 1000);

  // Output the result in an element with id="demo"
  document.querySelectorAll("[id=timer]").forEach((element) => {
    element.innerHTML =
      "The current wave will leave in " + minutes + "min " + seconds + "sec ";
  });

  // If the count down is over, write some text
  if (distance < 0) {
    document.querySelectorAll("[id=timer]").forEach((element) => {
      element.innerHTML = "The current wave is about to leave!";
    });
  }
}, 1000);


// requires global variable updatingcount
// functions like the fetch command, but shows the loading alert message to show if the app is actually working on it
async function fetchWithAlert(
  endpoint,
  method,
  header,
  data
) {
  updatingCount++;
  setLoadingState(true);
  var response;
  try {
    response = await fetch(endpoint, {
      method: method,
      headers: header,
      body: JSON.stringify(data),
    });
    const text = await response.text();
    if (response.status === 409) {
      // the command was based on an out-of-date screen and the server refused it
      alert(text);
    } else if (text !== "success") {
      throw(new Error("Non-success response recieved. You were most likely logged out and need to log back in."));
    }
  } catch (error) {
    console.error("Error:", error);
    alert("There was an error when processing the request. Please try reloading, and contact Bus App devs if the issue persists.\n\n" + error);
  } finally {
    updatingCount--;
    if (updatingCount == 0) {
      setLoadingState(false);
    } else {
      setLoadingState(true);
    }
    return response;
  }

}

// sets the loading state for the "Loading" popup
async function setLoadingState(option) {
  var div = document.getElementsByClassName("popup")[0];
  if (div) {
    if (option) {
      div.style.animationName = "slide";
      div.style.animationPlayState = "paused";
    } else {
      div.style.animationPlayState = "running";
    }
  }
}
