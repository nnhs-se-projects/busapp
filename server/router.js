"use strict";

const express = require("express");
const {OAuth2Client, TokenPayload} = require("google-auth-library");
const { getBuses } = require('./DBHandler');
const path = require("path");
const fs = require("fs");
const router = express.Router();
const webpush = require('web-push');
const dotenv = require("dotenv");
const Announcement = require("./model/announcement");
const Bus = require("./model/bus");
const Weather = require("./model/weather");
const Wave = require("./model/wave");
const Subscription = require("./model/subscription");
const Admin = require("./model/admin");
const Lot = require("./model/lot");

const CLIENT_ID = "319647294384-m93pfm59lb2i07t532t09ed5165let11.apps.googleusercontent.com"
const oAuth2 = new OAuth2Client(CLIENT_ID);

dotenv.config({ path: ".env" });

// Remember to set vapid keys in .env - run ```npx web-push generate-vapid-keys``` to generate
const vapidPrivateKey = process.env.VAPID_PRIVATE;
const vapidPublicKey = process.env.VAPID_PUBLIC;

webpush.setVapidDetails(
    'mailto:busappdevs@proton.me',
    vapidPublicKey,
    vapidPrivateKey,
);

const bodyParser = require('body-parser');
const { log } = require("console");
router.use(bodyParser.urlencoded({ extended: true }));

Announcement.findOneAndUpdate({}, {announcement: ""}, {upsert: true});
Announcement.findOneAndUpdate({}, {tvAnnouncement: ""}, {upsert: true});
let timer = 30;

// Homepage. This is where students will view bus information from. 
router.get("/", async (req, res) => {
    // Reads from data file and displays data
    let data = {
        buses: await getBuses(), 
        weather: await Weather.findOne({}),
        isLocked: (await Wave.findOne({})).locked,
        leavingAt: (await Wave.findOne({})).leavingAt,
        vapidPublicKey,
        announcement: (await Announcement.findOne({})).announcement,
        isDev: process.env.DEV === "true", 
        timer: timer,
        apiKey: officialKey
    };

    res.render("index", {
        data: data,
        render: fs.readFileSync(path.resolve(__dirname, "../views/include/indexContent.ejs"))
    });
});

// tv route
// TODO: improve this
router.get("/tv", async (req, res) => {
    // Reads from data file and displays data
    res.render("tv", {
        data: {
            buses: await getBuses(), 
            weather: await Weather.findOne({}),
            tvAnnouncement: (await Announcement.findOne({})).tvAnnouncement,
            isLocked: (await Wave.findOne({})).locked,
            timer: timer
        },
        render: fs.readFileSync(path.resolve(__dirname, "../views/include/tvIndexContent.ejs")),                                
    })
})

router.get("/extension", async (req, res) => {
    // Reads from data file and displays data
    res.render("extension", {
        data: {
            buses: await getBuses(),
            isLocked: (await Wave.findOne({})).locked,
            timer: timer
        },
        render: fs.readFileSync(path.resolve(__dirname, "../views/include/extensionContent.ejs")),                                
    })
})

// Login page. User authenticates here and then is redirected to admin (where they will be authorized)
router.get("/login", (req, res) => {
    res.render("login");
});

// Authenticates the user
router.post("/auth/v1/google", async (req, res) => {
    let token = req.body.token; // Gets token from request body
    let ticket = await oAuth2.verifyIdToken({ // Verifies and decodes token    
        idToken: token,
        audience: CLIENT_ID
    });
    req.session.userEmail = ticket.getPayload().email; // Store email in session
    req.session.isAdmin = Boolean(await Admin.findOne({Email: req.session.userEmail?.toLowerCase()}));
    res.status(201).end();
});


// only works if the server is in dev mode, throws an error to crash the server and be automatically restarted
router.get("/restartServer", async (req, res) => {
    if(process.env.DEV === "true") {
        throw new Error("restarting...");
    }
    else {res.sendStatus(404)}
})

// https://save418.com/ 
router.get("/teapot", (req, res) => { res.sendStatus(418); });

// used for networkIndicator
router.get("/getConnectivity", (req, res) => { res.sendStatus(200); });

// this is for other students making discord bots or other integrations with apps to make it easier.
// also reduces load on the server as we dont have to render the EJS for automated requests.
var limiter = {};
const officialKey = Math.random().toString(36).substring(2, 15);
router.get("/api", async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    const now = Date.now();

    // go over every ip and remove everything from more than 500ms ago
    for(const key of Object.keys(limiter)) {
        if(now - limiter[key] > 500) { delete limiter[key] }
    }

    // check if it has been < 500 ms since last request from this IP
    // by seeing if the IP is still in the map
    if(req.ip in limiter && req.query.key !== officialKey) {
        // 429 = too many requests
        res.sendStatus(429);
    } else {
        // Client is being nice and isnt spamming our server.
        // We express our gratitude by sending over the API data
        limiter[req.ip] = now;
        res.send(JSON.stringify({
            buses: await getBuses(),
            wave: await Wave.findOne({}, {_id: 0, __v: 0}),
            announcement: await Announcement.findOne({}, {_id: 0, __v: 0}),
            timerDuration: timer
        }));
    }
});

router.get("/getWeather", async (req, res) => { res.send(JSON.stringify(await Weather.findOne({}))); });

// this needs to be served from the root of the server to work properly - used for push notifications
router.get("/serviceWorker.js", async (req, res) => {
    res.sendFile("serviceWorker.js", { root: path.join(__dirname, '../static/js/') });
})

router.post("/subscribe", async (req, res) => {
    const subscription = req.body.pushObject;
    const num = Number(req.body.busNumber);
    const rm = req.body.remove;
    if(rm) {
        (await Subscription.find({subscription, bus: num})).forEach(async (e) => await Subscription.findByIdAndDelete(e._id));
        res.send("success!");
    } else if(!(await Subscription.findOne({subscription, bus: num}))) {
        await Subscription.create({subscription, bus: num});
        res.send("success!");
    } else {
        res.send("Duplicate, pin request ignored");
    }
})

router.get("/waveStatus", async (req, res) => {
    // get the wave status from the wave schema
    const wave = await Wave.findOne({});
    res.send(wave.locked);
});

router.get("/beans", async (req, res) => {
    res.sendFile(path.resolve(__dirname, "../static/img/beans.jpg"));
});

// manifest - necessary for making the busapp behave like a proper PWA when added to the homescreen
// not serving in static because iirc it is necessary to have it at the root for scope reasons
router.get("/manifest.json", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../data/manifest.json"))
});

router.get('/help',(req, res)=>{
    res.render('help');
});





/* 
    ADMIN AUTHENTICATED ROUTES GO HERE!
    PUT `if(!(await checkLogin(req, res))) { return; }` AT THE BEGINNING OF EVERY ENDPOINT
*/

async function checkLogin(req, res) {
    // return true; // uncomment for easier debugging - don't forget to recomment!
    if(!req.session.userEmail) {
        res.redirect("/login");
        return false;
    } else if(req.session.isAdmin === false) {
        res.render("unauthorized");
        return false;
    } 
    return true;
}

/* Admin page. This is where bus information can be updated from
Reads from data file and displays data */
router.get("/admin", async (req, res) => {
    // Check if user is logged in and is an admin
    if(!(await checkLogin(req, res))) { return; }

    let data = {
        allBuses: await getBuses(),
        nextWave: await Bus.find({status: "Next Wave"}),
        loading: await Bus.find({status: "Loading"}).sort("order"),
        isLocked: false, 
        leavingAt: new Date(),
        timer: timer,
        weather: await Weather.findOne({})
    };
    data.isLocked = (await Wave.findOne({})).locked;
    data.leavingAt = (await Wave.findOne({})).leavingAt;
    res.render("admin", {
        data: data,
        render: fs.readFileSync(path.resolve(__dirname, "../views/include/adminContent.ejs")),
    });
});

router.get("/updateBusList", async (req, res) => {
    // Check if user is logged in and is an admin
    if(!(await checkLogin(req, res))) { return; }

    // get all the bus numbers of all the buses from the database and make a list of them
    const busList = await Bus.find().distinct("busNumber");

    res.render("updateBusList", { busList });
});

router.post("/updateBusList", async (req, res) => {
    // Check if user is logged in and is an admin
    if(!(await checkLogin(req, res))) { return; }

    // use the posted bus list to update the database, removing any buses that are not in the list, and adding any buses that are in the list but not in the database
    const bus = req.body.bus;
    const del = req.body.del;
    
    if(del) await Bus.findOneAndDelete({ busNumber: bus }); // remove the bus from the database
    else if(!(await Bus.findOne({ busNumber: bus }))) await (new Bus({ busNumber: bus, busChange: 0, status: "normal", time: new Date(),})).save();
    
    res.status(201).end();
});

router.get("/makeAnnouncement", async (req, res) => {
    // Check if user is logged in and is an admin
    if(!(await checkLogin(req, res))) { return; }
    
    res.render("makeAnnouncement", {
        currentAnnouncement: (await Announcement.findOne({})).announcement,
        currentTvAnnouncement: (await Announcement.findOne({})).tvAnnouncement
    });
});

router.get('/whitelist', async (req, res)=>{
    // Check if user is logged in and is an admin
    if(!(await checkLogin(req, res))) { return; }
    
    res.render("updateWhitelist", {
        whitelist: {admins: (await Admin.find({}).exec()).map((e) => e.Email).reverse()}
    });
})

router.post("/updateBusChange", async (req, res) => {
    // Check if user is logged in and is an admin
    if(!(await checkLogin(req, res))) { return; }

    let busNumber = req.body.number;
    let busChange = req.body.change;
    let time = req.body.time;
    await Bus.findOneAndUpdate({busNumber: busNumber}, {busChange: busChange, time: time});
    res.send("success");
});

router.post("/updateOrder", async (req, res) => {
    // Check if user is logged in and is an admin
    if(!(await checkLogin(req, res))) { return; }

    const busOne = req.body.busOne;
    const busTwo = req.body.busTwo;
    const orderOne = (await Bus.findOne({busNumber: busOne})).order;

    if (await Bus.findOneAndUpdate({busNumber: busOne}, {order: (await Bus.findOne({busNumber: busTwo})).order}) &&
        await Bus.findOneAndUpdate({busNumber: busTwo}, {order: orderOne})) {
        res.send("success");
    } else {
        res.sendStatus(500);
    }
})

router.post("/updateBusStatus", async (req, res) => {
    // Check if user is logged in and is an admin
    if(!(await checkLogin(req, res))) { return; }

    let busNumber = req.body.number;
    let busStatus = req.body.status;
    let time = req.body.time;

    // if we are removing the bus from the wave
    if(busStatus === "" && (await Bus.findOne({busNumber: busNumber})).status === "Loading") {
        var bus = await Bus.findOne({busNumber: busNumber})
        await Bus.updateMany({order: { $gt: bus.order }, status: bus.status}, {$inc: { order: -1 }});
    } 
    // if we are adding the bus to the wave
    else if (busStatus === "Loading") {
        // update the bus times for prediction
        if((await Bus.findOne({busNumber: busNumber})).busTimes.length > 5) {
            await Bus.findOneAndUpdate({busNumber: busNumber}, {$pop: {busTimes: -1}});
        }
        await Bus.findOneAndUpdate({busNumber: busNumber}, {$push: { busTimes: time }});
    }
    
    let order;
    if(busStatus === "Loading" || busStatus === "Next Wave") { 
        var orders = await Bus.find({status: busStatus});
        order = orders.length; 
        // this seems redundant but if there is a duplicate for whatever reason, 
        // this mitigates any cascading damage that would cause
        while(orders.includes(order)) { order++ }
    } else order = -1;

    await Bus.findOneAndUpdate({busNumber: busNumber}, {status: busStatus, time: time, order: order});
    
    res.send("success");
});

router.post("/sendWave", async (req, res) => {
    // Check if user is logged in and is an admin
    if(!(await checkLogin(req, res))) { return; }

    // find the wave
    if( !(null === await Wave.findOne({locked: true})) ) { 
        // find the buses and iterate over them
        (await Bus.find({status: "Loading"})).forEach(async (bus) => {
            // get every subscription for that bus and iterate over them
            (await Subscription.find({bus: bus.busNumber})).forEach((sub) => {
                webpush.sendNotification(JSON.parse(sub.subscription), JSON.stringify({
                    title: 'Your Bus Just Left!',
                    body: `Bus number ${bus.busNumber}${bus.busChange ? ` (Changed to ${bus.busChange})` : ""} just left.`,
                    icon: "/img/Icon-New-512-any.png"
                })).catch(async (e) => { // if fail, delete endpoint
                    // 400: Apple, 403 & 410: Google, 401: Mozilla and Microsoft
                    if([410, 400, 403, 401].includes(e.statusCode)) {
                        return Subscription.findByIdAndDelete(sub._id);
                    }
                }).then(() => {});
            });
        });
    };

    await Bus.updateMany({ status: "Loading" }, { $set: { status: "Gone" } });
    await Bus.updateMany({ status: "Next Wave" }, { $set: { status: "Loading" } });
    await Wave.findOneAndUpdate({}, { locked: false }, { upsert: true });

    res.send("success");
});

router.post("/lockWave", async (req, res) => {
    // Check if user is logged in and is an admin
    if(!(await checkLogin(req, res))) { return; }

    await Wave.findOneAndUpdate({}, { locked: !(await Wave.findOne({})).locked }, { upsert: true });
    const leavingAt = new Date();
    leavingAt.setSeconds(leavingAt.getSeconds() + timer);
    await Wave.findOneAndUpdate({}, { leavingAt: leavingAt }, { upsert: true });

    if( !(null === await Wave.findOne({locked: true})) ) { 
        // find the buses and iterate over them
        (await Bus.find({status: "Loading"})).forEach(async (bus) => {
            // get every subscription for that bus and iterate over them
            (await Subscription.find({bus: bus.busNumber})).forEach((sub) => {
                webpush.sendNotification(JSON.parse(sub.subscription), JSON.stringify({
                    title: 'Your Bus is Here!',
                    body: `Bus number ${bus.busNumber}${bus.busChange ? ` (Changed to ${bus.busChange})` : ""} is currently loading, and will leave in ${Math.floor(timer/60)} minutes and ${timer % 60} seconds`,
                    icon: "/img/Icon-New-512-any.png"
                })).catch(async (e) => { // if fail, delete endpoint
                    // 400: Apple, 403 & 410: Google, 401: Mozilla and Microsoft
                    if([410, 400, 403, 401].includes(e.statusCode)) {
                        return Subscription.findByIdAndDelete(sub._id);
                    }
                }).then(() => {});
            });
        });
    };

    res.send("success");
});

router.post("/setTimer", async (req, res) => {
    // Check if user is logged in and is an admin
    if(!(await checkLogin(req, res))) { return; }

    var tmpTimer = Number(req.body.minutes) * 60;
    if(Number.isNaN(tmpTimer) || tmpTimer === null) {
        tmpTimer = 30;
    }
    timer = tmpTimer;
    res.send("success");
});

router.get("/leavingAt", async (req, res) => {
    const leavingAt = (await Wave.findOne({})).leavingAt;
    res.send(leavingAt);
});

router.post("/resetAllBusses", async (req, res) => {
    // Check if user is logged in and is an admin
    if(!(await checkLogin(req, res))) { return; }

    await Bus.updateMany({}, { $set: { status: "", order: 0 } }); 
    await Wave.updateMany({}, { $set: { locked: false } });
    res.send("success");

});

router.get("/getWhitelist", async (req, res) => {
    // Check if user is logged in and is an admin
    if(!(await checkLogin(req, res))) { return; }

    res.type("json").send((await Admin.find({}).exec()).map((e) => e.Email).reverse());
});

router.post("/updateWhitelist", async (req, res) => {
    // Check if user is logged in and is an admin
    if(!(await checkLogin(req, res))) { return; }

    const adminExists = await Admin.findOne({Email: req.body.admin.toLowerCase()}).exec();

    if(adminExists){
        if(req.session.userEmail?.toLowerCase() === req.body.admin.toLowerCase()) {
            res.status(409).send("Refusing to remove email of admin currently logged in");
            return;
        }
        await Admin.findByIdAndDelete(adminExists._id);
    } else {
        await (new Admin({Email: req.body.admin.toLowerCase()})).save();
    }
    res.send("success!");
});

router.post("/submitAnnouncement", async (req, res) => {    //overwrites the announcement in the database
    // Check if user is logged in and is an admin
    if(!(await checkLogin(req, res))) { return; }

    // check if the announcement was actually changed
    if((await Announcement.findOne({})).announcement !== req.body.announcement) {
        (await Subscription.find().distinct("subscription")).forEach((sub) => {
            webpush.sendNotification(JSON.parse(sub), JSON.stringify({
                title: 'Announcement From Bus App',
                body: req.body.announcement,
                icon: "/img/Icon-New-512-any.png"
            })).catch(async (e) => { // if fail, delete endpoint
                // 400: Apple, 403 & 410: Google, 401: Mozilla and Microsoft
                if([410, 400, 403, 401].includes(e.statusCode)) {
                    // this also serves as a great way to periodically check all our subscriptions
                    // to make sure we arent storing dead subscriptions on the database forever
                    return Subscription.deleteMany({subscription: sub});
                }
            }).then(() => {});
        });
    }

    await Announcement.findOneAndUpdate({}, {announcement: req.body.announcement, tvAnnouncement: req.body.tvAnnouncement}, {upsert: true});

    res.redirect("/admin");
});

router.post("/clearAnnouncement", async (req, res) => {
    // Check if user is logged in and is an admin
    
    await Announcement.findOneAndUpdate({}, {announcement: ""}, {upsert: true});
});

router.get("/busMap", async (req, res) => {
    let currentWave = await Bus.find({status: "Loading"});
    let nextWave = await Bus.find({status: "Next Wave"});

    // sort the current wave by order
    currentWave = currentWave.sort((a, b) => b.order - a.order);
    nextWave = nextWave.sort((a, b) => a.order - b.order);
    
    let data = {
        currentWave: currentWave,
        nextWave: nextWave,
        rowA: await Lot.findOne({}).rowA,
        rowB: await Lot.findOne({}).rowB,
    };

    res.render("busMap", {
        data: data,
        render: fs.readFileSync(path.resolve(__dirname, "../views/busMap.ejs")),
    });
});

router.get("/busMapAdmin", async (req, res) => {
    if(!(await checkLogin(req, res))) { return; }

    await Lot.findOneAndUpdate({}, {rowA: req.body.rowA, rowB: req.body.rowB}, {upsert: true});

    let data = {
        rowA: await Lot.findOne({}).rowA,
        rowB: await Lot.findOne({}).rowB,
    }

    res.render("busMapAdmin", {
        data: data,
        render: fs.readFileSync(path.resolve(__dirname, "../views/busMapAdmin.ejs")),
    });
});

// this is stupid but in order to get the actual timer to server.js and not just the initial value we need this
function getTimer() { return timer; }
module.exports = {router, getTimer};