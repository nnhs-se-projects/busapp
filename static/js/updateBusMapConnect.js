var busMapSocket = window.io('/busMap');


busMapSocket.on("update", (data) => {


   window.location.reload();
  


});


function updateBusMap() {
   busMapSocket.emit("updateMain", {
       type: "update",
   });
}
