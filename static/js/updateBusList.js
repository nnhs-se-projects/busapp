window.onload = () => { document.getElementById("addInput").value = ""; }

async function save(elem, del) {
    if (!confirm("Are you sure you would like to update the bus list?")) return;

    const bus = elem.parentElement.parentElement.querySelector("input").value;
    await fetch("/updateBusList", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bus: bus, del: del })
    });

    updateBusList();
}

function discardChanges() {
    if (confirm("Are you sure you would like to discard changes?")) location.reload();
}
