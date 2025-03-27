var adminSocket = window.io('/admin'); 

adminSocket.on("update", (data) => {
    console.log("update received")

    console.log(data)

    window.location.reload();
    

});

function updateBusList() {
    console.log("update called")
    adminSocket.emit("updateMain", {
        type: "update",
    });
}


