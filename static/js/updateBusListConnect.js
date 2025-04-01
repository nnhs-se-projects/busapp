"use strict";
var adminSocket = window.io('/admin'); 

adminSocket.on("update", (data) => {
    window.location.reload();
});

function updateBusList() {
    adminSocket.emit("updateMain", {
        type: "update",
    });
}