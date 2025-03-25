var adminSocket = window.io('/admin');

let currentWave = [];

adminSocket.on("update", (data) => {

    window.location.reload();
    

});

function updateBusMap() {
    adminSocket.emit("updateMain", {
        type: "update",
    });
}