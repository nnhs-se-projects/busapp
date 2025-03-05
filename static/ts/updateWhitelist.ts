var admins: string[];   
fetch("/getWhitelist").then((data)=>data.json()).then((data) => admins = data);

var newAdminEmptyRow: string;
fetch("/adminEmptyRow").then((res) => res.text()).then((data) => newAdminEmptyRow = data);
 

function addAdmin_admins(e: HTMLElement) {
    console.log(e)
    let row = e.parentElement!.parentElement! as HTMLTableRowElement;
    let admin = (row.children[0]!.children[0] as HTMLInputElement).value.toLowerCase();
    if(admin.includes('@') && admin.includes('naperville203.org') && (admin.indexOf('@') < admin.indexOf('naperville203.org'))){
        if (admins.includes(admin)) {
            alert("Duplicate admins are not allowed");
            return;
        }
        const newRow = (<HTMLTableElement> document.getElementsByClassName("whitelist-table")[0]).insertRow(2);
        const html = ejs.render(newAdminEmptyRow, {newAddress: admin});
        newRow.innerHTML = html;
        admins.splice(0,0, admin);
        let gleepGlorp = <HTMLInputElement> document.getElementById("gleepGlorp");
        gleepGlorp.value = ""
        save2(admin);

    }
    else {
        alert("Invalid address entered. Please enter a D203 email address.");
        let gleepGlorp = <HTMLInputElement> document.getElementById("gleepGlorp");
        gleepGlorp.value = ""
    }
    
}

function removeAdmin_admins(secondChild: HTMLElement) {
    let row = secondChild.parentElement!.parentElement! as HTMLTableRowElement;
    let admin = row.children[0]!.innerHTML;
    admins.splice(admins.indexOf(admin), 1);
    row.remove();
    save2(admin);
}



async function  save2(admin: string) {
    fetch("/updateWhitelist", {
        method: 'POST',
        headers: {
        accept: 'application.json',
        'Content-Type': 'application/json'
        },
        body: JSON.stringify({ admin: admin })
    });
}