"use strict";
var adminSocket = window.io('/admin');

adminSocket.on("update", (data) => {
    console.log("update received")

    console.log(data)

    //window.location.reload();
});

function updateAnnouncement() {
    console.log("update called")
    adminSocket.emit("updateMain", {
        type: "update",
    });
}

function clearAnnouncement() {
    document.getElementsByName("announcement")[0].value = "";
    save_();
}

function clearTvAnnouncement() {
    document.getElementsByName("tvAnnouncement")[0].value = "";
    save_();
}
var announcement = document.getElementsByName("announcement")[0].value;
var tvAnnouncement = document.getElementsByName("tvAnnouncement")[0].value;

async function save_() {
    if(!confirm("This will notify anybody with notifications enabled. Are you sure you want to update the announcement?")) {return;};
    
    await fetch("/submitAnnouncement", {
        method: 'POST',
        headers: {
            accept: 'application.json',
            'Content-Type': 'application/json'
        },
        body:
        JSON.stringify({
            announcement: document.getElementsByName("announcement")[0].value,
            tvAnnouncement: document.getElementsByName("tvAnnouncement")[0].value
        })
    });

    updateAnnouncement();

    window.location.href = "/admin";
}