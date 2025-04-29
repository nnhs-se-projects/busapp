"use strict";
window.onload = () => { document.getElementById("addInput").value = ""; }

var admins = document.getElementById("adminList").getAttribute("admins")

async function addAdmin_admins(e) {
    console.log(e)
    let row = e.parentElement.parentElement;
    let admin = (row.children[0].children[0]).value.toLowerCase();
    if(admin.includes('@') && admin.includes('naperville203.org') && (admin.indexOf('@') < admin.indexOf('naperville203.org'))){
        if (admins.includes(admin)) {
            alert("Duplicate admins are not allowed");
            return;
        }
        if(!(await save(admin))) {
            alert("Error adding admin! Try again later");
            return;
        }
        window.location.reload();
    }
    else {
        alert("Invalid address entered. Please enter a D203 email address.");
        let gleepGlorp = document.getElementById("gleepGlorp");
        gleepGlorp.value = ""
    }
    
}

async function removeAdmin_admins(secondChild) {
    let row = secondChild.parentElement.parentElement;
    let admin = row.children[0].innerHTML;
    if(!(await save(admin))) {
        alert("Cannot remove this admin. If you are trying to remove yourself, this is not permitted. If this is not what you are trying to do, please try again later."); 
    } else {
        window.location.reload();
    }
}



async function  save(admin) {
    const res = await fetch("/updateWhitelist", {
        method: 'POST',
        headers: {
        accept: 'application.json',
        'Content-Type': 'application/json'
        },
        body: JSON.stringify({ admin: admin })
    });

    if(res.status === 200) {
        return true;
    } return false;
}