async function saveMap() {
    // if (!confirm("AHHHHHHHHHHHHHHHHH")) return;
    
    let beans = document.getElementsByClassName("test");

    await fetch("/updateBusMap", {
        method: 'POST',
        headers: {
            accept: 'application.json',
            'Content-Type': 'application/json'
        },
        body: 
        JSON.stringify({
            beans: beans
        })
    });

    updateBusMap();
    window.location.assign("/admin");
}
