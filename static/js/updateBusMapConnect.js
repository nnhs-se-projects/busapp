var adminSocket = window.io('/admin');

adminSocket.on("update", (data) => {
    console.log("update received")

    console.log(data)

    window.location.reload();
    

});

function updateBusMap() {
    console.log("update called")
    adminSocket.emit("updateMain", {
        type: "update",
    });
}