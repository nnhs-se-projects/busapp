const rowA = document.getElementById("rowA").value;
const rowB = document.getElementById("rowB").value;

async function saveMap() {
    await fetch("/updateBusMap", {
        method: 'POST',
        headers: {
            accept: 'application.json',
            'Content-Type': 'application/json'
        },
        body:
        JSON.stringify({
            lots, lots
        })
    });
 
 
    updateBusMap();
    window.location.assign("/admin");
}