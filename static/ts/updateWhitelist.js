"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var admins;
fetch("/getWhitelist").then((data) => data.json()).then((data) => admins = data);
var newAdminEmptyRow;
fetch("/adminEmptyRow").then((res) => res.text()).then((data) => newAdminEmptyRow = data);
function addAdmin_admins(e) {
    console.log(e);
    let row = e.parentElement.parentElement;
    let admin = row.children[0].children[0].value;
    if (admin.includes('@') && admin.includes('naperville203.org') && (admin.indexOf('@') < admin.indexOf('naperville203.org'))) {
        if (admins.includes(admin)) {
            alert("Duplicate admins are not allowed");
            return;
        }
        const newRow = document.getElementsByClassName("whitelist-table")[0].insertRow(2);
        const html = ejs.render(newAdminEmptyRow, { newAddress: admin });
        newRow.innerHTML = html;
        admins.splice(0, 0, admin);
        let gleepGlorp = document.getElementById("gleepGlorp");
        gleepGlorp.value = "";
        save2(admin);
    }
    else {
        alert("Invalid address entered. Please enter a D203 email address.");
        let gleepGlorp = document.getElementById("gleepGlorp");
        gleepGlorp.value = "";
    }
}
function removeAdmin_admins(secondChild) {
    let row = secondChild.parentElement.parentElement;
    let admin = row.children[0].innerHTML;
    admins.splice(admins.indexOf(admin), 1);
    row.remove();
    save2(admin);
}
function save2(admin) {
    return __awaiter(this, void 0, void 0, function* () {
        fetch("/updateWhitelist", {
            method: 'POST',
            headers: {
                accept: 'application.json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ admin: admin })
        });
    });
}
//# sourceMappingURL=updateWhitelist.js.map