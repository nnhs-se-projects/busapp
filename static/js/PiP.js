const can = document.getElementById("pipCanvas");
const canWidth = +can.getAttribute("width");
const canHeight = +can.getAttribute("height");


const vid = document.createElement("video");
vid.setAttribute("width", canWidth);
vid.setAttribute("height", canHeight);
vid.addEventListener("pause", () => {});
var activePin = 0;
if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('previoustrack', () => { 
        activePin--;
        if(activePin < 0) { activePin = pins.length - 1 }
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => {
        activePin++;
        if(activePin >= pins.length) { activePin = 0 }
    });
}
document.querySelector(".hidden").appendChild(vid);


const ctx = can.getContext("2d");
// must fill at least once before capturing video - its weird idk why
ctx.fillStyle = "#2e294e";
ctx.fillRect(0, 0, canWidth, canHeight);
vid.srcObject = can.captureStream(10);

var fontSize = 60;
var gap = 20;
ctx.font = `bold ${fontSize}px Roboto`;


var PiPinterval = false;
function startPopout() {
    if(!("mediaSession" in navigator && 
        document.pictureInPictureEnabled && 
        !!document.createElement("canvas").getContext)) {
        console.log("Browser not supported (Hey iPhone users, get a phone that doesn't suck)");
        return;
    }
    if(!PiPinterval) PiPinterval = window.setInterval(() => {
        const bus = buses.filter(e => +e.number === pins[activePin])[0];
        ctx.clearRect(0, 0, canWidth, canHeight);
    
        ctx.fillStyle = "#2e294e";
        ctx.fillRect(0, 0, canWidth, canHeight);
    
        ctx.beginPath();
        ctx.fillStyle = "#f46036"
        ctx.roundRect(gap, gap, canWidth - (gap * 2), fontSize + (gap*2), 30);
        ctx.fill();
        ctx.beginPath();
        if(bus.status === "Loading") {
            const dist = isLocked ? canWidth * (Math.max(distance, 0)/timerDuration/1000) : canWidth;
            const grad=ctx.createLinearGradient(dist,0,dist+10,0);
            grad.addColorStop(0, "green");
            grad.addColorStop(1, "red");
            ctx.fillStyle = grad;
        } if(bus.status === "Gone") {
            ctx.fillStyle = "#444444";
        }
        ctx.roundRect(gap, (gap*4) + fontSize, canWidth - (gap * 2), fontSize + (gap*2), 30);
        ctx.fill();
    
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText(`Bus ${pins[activePin]}${bus.status === "Loading" ? ` @ Spot ${bus.order+1}` : ""}`, canWidth/2, fontSize + (gap*1.5));
        ctx.fillText(`${bus.status === "Loading" && isLocked ? `${minutes > 0 || seconds > 0 ? `Loading: ${minutes}:${String(seconds).padStart(2, "0")}` : "About to Leave!"}` : bus.status ? bus.status : "Not Here Yet"}`, canWidth/2, (2*fontSize) + (gap*4.5));
    }, 100);

    if('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: 'Bus App',
            artist: 'Bus Status PiP window',
            album: 'Bus App',
            artwork: [
                { src: '/img/Icon-New-512.png', sizes: '512x512', type: 'image/jpeg' }
            ]
        });
    }
      
    vid.play();
    vid.requestPictureInPicture();
}

vid.addEventListener("leavepictureinpicture", () => {
    console.log("left pip");
    window.clearInterval(PiPinterval);
    PiPinterval = false;
})