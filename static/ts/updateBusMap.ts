async function saveMap() {
    if (!confirm("Are you sure you would like to update the bus list and reset all live pages?")) return;
    
    await fetch("/updateBusMap", {
        method: 'POST',
        headers: {
            accept: 'application.json',
            'Content-Type': 'application/json'
        },
        body: 
        JSON.stringify({
            busList: busList
        })
    });

    updateBusMap();
    window.location.assign("/admin");
}
