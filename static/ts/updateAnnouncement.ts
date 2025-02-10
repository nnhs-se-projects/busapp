// let announcementList: string[];
// fetch("/announcementList").then((res) => res.json()).then((data) => announcementList = data).then(() => console.log(announcementList));

// let newAnnouncement: string;
// fetch("/updateAnnouncement").then((res) => res.text()).then((data) => newAnnouncement = data);

let announcement: string;
fetch("/announcement").then((res) => res.text()).then((data) => announcement = data);

async function save_() {
    if (!confirm("Are you sure you would like to update the bus list and reset all live pages?")) return;
    
    await fetch("/updateAnnouncement", {
        method: 'POST',
        headers: {
            accept: 'application.json',
            'Content-Type': 'application/json'
        },
        body: 
        JSON.stringify({
            announcement: announcement
        })
    });

    updateBusList();
}