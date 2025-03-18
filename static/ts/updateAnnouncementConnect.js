/// <reference path="./socket-io-client.d.ts"/>

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
announcement = document.getElementsByName("announcement")[0].value;
tvAnnouncement = document.getElementsByName("tvAnnouncement")[0].value;

async function save_() {
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