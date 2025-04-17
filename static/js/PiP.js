const can = document.getElementById("pipCanvas");
const canWidth = +can.getAttribute("width");
const canHeight = +can.getAttribute("height");


const vid = document.createElement("video");
vid.setAttribute("width", canWidth);
vid.setAttribute("height", canHeight);
vid.addEventListener("pause", () => { 
    vid.play();
    // SOME operating systems (ahem, IOS), dont show the right mediaSession controls... add a fallback to cycle through pins with the pause/stop button
    activePin++;
    if(activePin >= pins.length) { activePin = 0 }
});

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

var PiPinterval = false;
var angle = 0;

function startPopout() {
    if(!("mediaSession" in navigator && 
        document.pictureInPictureEnabled && 
        !!document.createElement("canvas").getContext)) {
        console.log("Browser not supported (Hey iPhone users, get a phone that doesn't suck)");
        return;
    }
    if(!PiPinterval) PiPinterval = window.setInterval(() => {
        if(activePin >= pins.length && pins.length > 0) {activePin--}
        const bus = buses.filter(e => +e.number === pins[activePin])[0];
        ctx.font = `bold ${fontSize}px Roboto`;
        ctx.clearRect(0, 0, canWidth, canHeight);

        angle += 0.1;
        var x = canWidth / 2;
        var y = canHeight / 2;
        var length = Math.max(canWidth, canHeight);
        var grad1 = ctx.createLinearGradient(x, y, x + Math.cos(angle) * length, y + Math.sin(angle) * length);
        grad1.addColorStop(0, "#2e294e"); grad1.addColorStop(0.75, "skyblue");
        ctx.fillStyle = grad1;
        ctx.fillRect(0, 0, canWidth, canHeight);

        if(bus === undefined) {
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.font = `bold ${canWidth / 8}px Roboto`;
            ctx.fillText("Pin a bus first!", canWidth/2, canHeight / 2 + (canWidth / 32));
            return;
        }
    
        ctx.beginPath();
        ctx.fillStyle = "#f46036"
        ctx.roundRect(gap, gap, canWidth - (gap * 2), fontSize + (gap*2), 30);
        ctx.fill();
        ctx.beginPath();
        if(bus.status === "Loading") {
            const dist = isLocked ? canWidth * (Math.max(countDownDate.getTime() - (new Date()).getTime(), 0)/timerDuration/1000) : canWidth;
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
        ctx.fillText(`Bus ${pins[activePin]}${bus.change ? "➡" + bus.change : ""}${bus.status === "Loading" ? `@Spot ${bus.order+1}` : ""}`, canWidth/2, fontSize + (gap*1.5));
        ctx.fillText(`${bus.status === "Loading" && isLocked ? `${minutes > 0 || seconds > 0 ? `Loading: ${minutes}:${String(seconds).padStart(2, "0")}` : "About to Leave!"}` : bus.status ? bus.status : "Not Here Yet"}`, canWidth/2, (2*fontSize) + (gap*4.5));
    }, 100);

    navigator.mediaSession.metadata = new MediaMetadata({
        title: 'Bus App',
        artist: 'Bus Status PiP window',
        album: 'Bus App',
        artwork: [
            { src: '/img/Icon-New-512.png', sizes: '512x512', type: 'image/jpeg' }
        ]
    });
      
    vid.play();
    if(vid.webkitSupportsPresentationMode && typeof vid.webkitSetPresentationMode === "function") {
        // I hate Safari
        vid.webkitSetPresentationMode("picture-in-picture");
    } else {
        vid.requestPictureInPicture();
    }
}

vid.addEventListener("leavepictureinpicture", () => {
    console.log("left pip");
    window.clearInterval(PiPinterval);
    PiPinterval = false;
})