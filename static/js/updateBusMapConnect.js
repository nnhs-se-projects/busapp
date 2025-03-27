var busMapSocket = window.io('/busMap');

let currentWave = [];

busMapSocket.on("update", (data) => {

    window.location.reload();
    

});

function updateBusMap() {
    busMapSocket.emit("updateMain", {
        type: "update",
    });
}