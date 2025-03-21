// npx web-push generate-vapid-keys

// this was part of some example code
const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
  
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
  
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};  


// Enables push notifications by requesting permission, registering a serviceworker, and iterating over every pin to subscribe to that bus
// Takes in the VAPID public key as an argument. This can be set in .env and is passed to the function from the ejs file
async function enablePushNotifications(publicKey) {
    if ('Notification' in window && 'serviceWorker' in navigator) {
        let permission = await Notification.requestPermission();
        if(permission === "granted") {
            // Register the serviceworker and wait until it's ready before continuing
                navigator.serviceWorker.register('/serviceWorker.js', { scope: '/' });
                var registration = await navigator.serviceWorker.ready;

                // subscribe the service worker to the push API
                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(publicKey),
                });
                // save the push object so we can use it when subscribing in the future
                localStorage.setItem("pushObject", JSON.stringify(subscription))

                // iterate over pins and subscribe to them
                const pins = (localStorage.getItem("pins") ?? "").split(", ");
                for(var i = 0; i < pins.length; i++) {
                    if (Number.isNaN(Number(pins[i]))) { continue }
                    fetch("/subscribe", {
                        headers: {
                            "Content-Type": "application/json",
                        },
                        method: "POST",
                        body: JSON.stringify({busNumber: Number(pins[i]) , pushObject: localStorage.getItem("pushObject"), remove: false}),
                    }).then(async response => {
                        if(response.ok) { 
                            console.log(await response.text()) 
                        } 
                        else {
                            console.log("error!" + response.status); 
                            alert("Something went wrong while subscribing to your pinned buses. Please unpin and repin them.")
                        }
                    });
                }
                
                // all is well - remove the button
                document.getElementById("notif-container")?.remove()
        } else {
            alert("You denied notification permission, this will result in push notifications not working");
        }
    } else if('serviceWorker' in navigator) { // If the browser supports service workers but not notifications, I'm like 60% sure it'll be safari on IOS
        document.getElementById('IOSnotifpopup').style.display='block';
    } else {
        alert("Your browser is not supported :(");
    }
}

// checks if notifications are working via a couple of methods and if they are, removes the notification button
function removeNotifButton() {
    // check if the serviceworker is present and functional/"active"
    var areServiceWorkersWorking = navigator.serviceWorker.getRegistrations().then(e => {
        if(e.length !== 0) {
            e.forEach( i => {
                if(!i.active) {
                    console.log(i); 
                    return false;
                }
            });
        } else {
            return false;
        }
        return true;
    });

    areServiceWorkersWorking.then(condition => {
        if (Notification.permission === "granted" && condition) {
            document.getElementById("notif-container")?.remove()
        }
    });
}