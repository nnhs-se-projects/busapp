const rowA = document.getElementById("rowA").value;
const rowB = document.getElementById("rowB").value;

const test = [1,2,3,4,5,6,7,8,9];



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