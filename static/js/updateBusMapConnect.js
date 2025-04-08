var busMapSocket = window.io('/admin');

busMapSocket.on("update", (data) => {

    window.location.reload();

    const html = ejs.render(
        document.getElementById("getRender").getAttribute("render"),
        { data: data }
      );
      document.getElementById("content").innerHTML = html;
    

});

function updateBusMap() {
    busMapSocket.emit("updateMain", {
        type: "update",
    });
}