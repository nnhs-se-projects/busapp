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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = __importDefault(require("express"));
const google_auth_library_1 = require("google-auth-library");
const jsonHandler_1 = require("./jsonHandler");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
exports.router = express_1.default.Router();
const web_push_1 = __importDefault(require("web-push"));
const dotenv = require("dotenv");
const Announcement = require("./model/announcement");
const Bus = require("./model/bus");
const Weather = require("./model/weather");
const Wave = require("./model/wave");
const Subscription = require("./model/subscription");
const Admin = require("./model/admin");
const CLIENT_ID = "319647294384-m93pfm59lb2i07t532t09ed5165let11.apps.googleusercontent.com";
const oAuth2 = new google_auth_library_1.OAuth2Client(CLIENT_ID);
dotenv.config({ path: ".env" });
// Remember to set vapid keys in .env - run ```npx web-push generate-vapid-keys``` to generate
const vapidPrivateKey = process.env.VAPID_PRIVATE;
const vapidPublicKey = process.env.VAPID_PUBLIC;
web_push_1.default.setVapidDetails('mailto:test@test.com', vapidPublicKey, vapidPrivateKey);
const bodyParser = require('body-parser');
exports.router.use(bodyParser.urlencoded({ extended: true }));
Announcement.findOneAndUpdate({}, { announcement: "" }, { upsert: true });
Announcement.findOneAndUpdate({}, { tvAnnouncement: "" }, { upsert: true });
let timer = 30;
// this was to migrate the admins from the file to the database when on the production server
// no longer neeeded but keeping it commented for the time being in case something went wrong with the migration
/*
router.get("/migrateAdminsDotJsonToDB", async (req: Request, res: Response) => {
    readWhitelist().admins.forEach(async e => {
        if(!(await Admin.findOne({Email: e.toLowerCase()}))) await (new Admin({Email: e.toLowerCase()})).save();
    });
    res.send("all done!");
});
*/
// Homepage. This is where students will view bus information from. 
exports.router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Reads from data file and displays data
    let data = {
        buses: yield (0, jsonHandler_1.getBuses)(), weather: yield Weather.findOne({}),
        isLocked: false,
        leavingAt: new Date(),
        vapidPublicKey
    };
    data.isLocked = (yield Wave.findOne({})).locked;
    data.leavingAt = (yield Wave.findOne({})).leavingAt;
    res.render("index", {
        data: data,
        render: fs_1.default.readFileSync(path_1.default.resolve(__dirname, "../views/include/indexContent.ejs")),
        announcement: (yield Announcement.findOne({})).announcement
    });
}));
// tv route
exports.router.get("/tv", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Reads from data file and displays data
    res.render("tv", {
        data: yield (0, jsonHandler_1.readData)(),
        render: fs_1.default.readFileSync(path_1.default.resolve(__dirname, "../views/include/tvIndexContent.ejs")),
        announcement: (yield Announcement.findOne({})).tvAnnouncement
    });
}));
// Login page. User authenticates here and then is redirected to admin (where they will be authorized)
exports.router.get("/login", (req, res) => {
    res.render("login");
});
// Authenticates the user
exports.router.post("/auth/v1/google", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let token = req.body.token; // Gets token from request body
    let ticket = yield oAuth2.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID
    });
    req.session.userEmail = ticket.getPayload().email; // Store email in session
    res.status(201).end();
}));
// Checks if the user's email is in the whitelist and authorizes accordingly
function authorize(req) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        req.session.isAdmin = Boolean(yield Admin.findOne({ Email: (_a = req.session.userEmail) === null || _a === void 0 ? void 0 : _a.toLowerCase() }));
    });
}
/* Admin page. This is where bus information can be updated from
Reads from data file and displays data */
exports.router.get("/admin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // If user is not authenticated (email is not is session) redirects to login page
    if (!req.session.userEmail) {
        res.redirect("/login");
        return;
    }
    // Authorizes user, then either displays admin page or unauthorized page
    let data = {
        allBuses: yield (0, jsonHandler_1.getBuses)(),
        nextWave: yield Bus.find({ status: "Next Wave" }),
        loading: yield Bus.find({ status: "Loading" }),
        isLocked: false,
        leavingAt: new Date(),
        timer: timer
    };
    data.isLocked = (yield Wave.findOne({})).locked;
    data.leavingAt = (yield Wave.findOne({})).leavingAt;
    yield authorize(req);
    if (req.session.isAdmin) {
        res.render("admin", {
            data: data,
            render: fs_1.default.readFileSync(path_1.default.resolve(__dirname, "../views/include/adminContent.ejs")),
        });
    }
    else {
        res.render("unauthorized");
    }
}));
// https://save418.com/ 
exports.router.get("/teapot", (req, res) => { res.sendStatus(418); });
// used for networkIndicator
exports.router.get("/getConnectivity", (req, res) => { res.sendStatus(200); });
// this needs to be served from the root of the server to work properly - used for push notifications
exports.router.get("/serviceWorker.js", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.sendFile("serviceWorker.js", { root: path_1.default.join(__dirname, '../static/ts/') });
}));
exports.router.post("/subscribe", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const subscription = req.body.pushObject;
    const num = Number(req.body.busNumber);
    const rm = req.body.remove;
    if (rm) {
        (yield Subscription.find({ subscription, bus: num })).forEach((e) => __awaiter(void 0, void 0, void 0, function* () { return yield Subscription.findByIdAndDelete(e._id); }));
    }
    else {
        yield Subscription.create({ subscription, bus: num });
    }
    res.send("success!");
}));
exports.router.get("/waveStatus", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // get the wave status from the wave schema
    const wave = yield Wave.findOne({});
    res.send(wave.locked);
}));
exports.router.post("/updateBusChange", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.session.userEmail) {
        res.redirect("/login");
        return;
    }
    let busNumber = req.body.number;
    let busChange = req.body.change;
    let time = req.body.time;
    yield Bus.findOneAndUpdate({ busNumber: busNumber }, { busChange: busChange, time: time });
    res.send("success");
}));
exports.router.post("/updateBusStatus", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.session.userEmail) {
        res.redirect("/login");
        return;
    }
    let busNumber = req.body.number;
    let busStatus = req.body.status;
    let time = req.body.time;
    yield Bus.findOneAndUpdate({ busNumber: busNumber }, { status: busStatus, time: time });
    res.send("success");
}));
exports.router.post("/sendWave", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.session.userEmail) {
        res.redirect("/login");
        return;
    }
    // find the wave
    if (!(null === (yield Wave.findOne({ locked: true })))) {
        // find the buses and iterate over them
        (yield Bus.find({ status: "Loading" })).forEach((bus) => __awaiter(void 0, void 0, void 0, function* () {
            // get every subscription for that bus and iterate over them
            (yield Subscription.find({ bus: bus.busNumber })).forEach((sub) => {
                web_push_1.default.sendNotification(JSON.parse(sub.subscription), JSON.stringify({
                    title: 'Your Bus Just Left!',
                    body: `Bus number ${bus.busNumber} just left.`,
                    icon: "/img/busAppIcon.png"
                })).catch((e) => __awaiter(void 0, void 0, void 0, function* () {
                    // 400: Apple, 403 & 410: Google, 401: Mozilla and Microsoft
                    if ([410, 400, 403, 401].includes(e.statusCode)) {
                        return Subscription.findByIdAndDelete(sub._id);
                    }
                }));
            });
        }));
    }
    yield Bus.updateMany({ status: "Loading" }, { $set: { status: "Gone" } });
    yield Bus.updateMany({ status: "Next Wave" }, { $set: { status: "Loading" } });
    yield Wave.findOneAndUpdate({}, { locked: false }, { upsert: true });
    res.send("success");
}));
exports.router.post("/lockWave", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.session.userEmail) {
        res.redirect("/login");
        return;
    }
    yield Wave.findOneAndUpdate({}, { locked: !(yield Wave.findOne({})).locked }, { upsert: true });
    const leavingAt = new Date();
    leavingAt.setSeconds(leavingAt.getSeconds() + timer);
    yield Wave.findOneAndUpdate({}, { leavingAt: leavingAt }, { upsert: true });
    if (!(null === (yield Wave.findOne({ locked: true })))) {
        // find the buses and iterate over them
        (yield Bus.find({ status: "Loading" })).forEach((bus) => __awaiter(void 0, void 0, void 0, function* () {
            // get every subscription for that bus and iterate over them
            (yield Subscription.find({ bus: bus.busNumber })).forEach((sub) => {
                web_push_1.default.sendNotification(JSON.parse(sub.subscription), JSON.stringify({
                    title: 'Your Bus is Here!',
                    body: `Bus number ${bus.busNumber} is currently loading, and will leave in ${Math.floor(timer / 60)} minutes and ${timer % 60} seconds`,
                    icon: "/img/busAppIcon.png"
                })).catch((e) => __awaiter(void 0, void 0, void 0, function* () {
                    // 400: Apple, 403 & 410: Google, 401: Mozilla and Microsoft
                    if ([410, 400, 403, 401].includes(e.statusCode)) {
                        return Subscription.findByIdAndDelete(sub._id);
                    }
                }));
            });
        }));
    }
    res.send("success");
}));
exports.router.post("/setTimer", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.session.userEmail) {
        res.redirect("/login");
        return;
    }
    var tmpTimer = Number(req.body.minutes) * 60;
    if (Number.isNaN(tmpTimer) || tmpTimer === null) {
        tmpTimer = 30;
    }
    timer = tmpTimer;
    res.send("success");
}));
exports.router.get("/getTimer", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.send(JSON.stringify({ minutes: timer / 60 }));
}));
exports.router.get("/leavingAt", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const leavingAt = (yield Wave.findOne({})).leavingAt;
    res.send(leavingAt);
}));
exports.router.post("/resetAllBusses", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.session.userEmail) {
        res.redirect("/login");
        return;
    }
    yield Bus.updateMany({}, { $set: { status: "" } });
    res.send("success");
}));
exports.router.get("/beans", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.sendFile(path_1.default.resolve(__dirname, "../static/img/beans.jpg"));
}));
// old manifest, leaving it because im not sure if anything still uses it?
// EDIT: commenting this out because I cannot find anything that uses it and having 2 manifest files is cause for confusion
/*router.get("/manifest.webmanifest", (req: Request, res: Response) => {
    res.sendFile(path.resolve(__dirname, "../data/manifest.webmanifest"))
});*/
// new manifest - necessary for making the busapp behave like a proper PWA when added to the homescreen
exports.router.get("/manifest.json", (req, res) => {
    res.sendFile(path_1.default.resolve(__dirname, "../data/manifest.json"));
});
/* Admin page. This is where bus information can be updated from
Reads from data file and displays data */
exports.router.get("/updateBusList", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // If user is not authenticated (email is not is session) redirects to login page
    if (!req.session.userEmail) {
        res.redirect("/login");
        return;
    }
    // Authorizes user, then either displays admin page or unauthorized page
    // get all the bus numbers of all the buses from the database and make a list of them
    const busList = yield Bus.find().distinct("busNumber");
    let data = { busList: busList };
    yield authorize(req);
    if (req.session.isAdmin) {
        res.render("updateBusList", {
            data: data
        });
    }
    else {
        res.render("unauthorized");
    }
}));
exports.router.get("/makeAnnouncement", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // If user is not authenticated (email is not is session) redirects to login page
    if (!req.session.userEmail) {
        res.redirect("/login");
        return;
    }
    // Authorizes user, then either displays admin page or unauthorized page
    yield authorize(req);
    if (req.session.isAdmin) {
        res.render("makeAnnouncement", {
            currentAnnouncement: (yield Announcement.findOne({})).announcement,
            currentTvAnnouncement: (yield Announcement.findOne({})).tvAnnouncement
        });
    }
    else {
        res.render("unauthorized");
    }
}));
exports.router.get('/whitelist', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // If user is not authenticated (email is not is session) redirects to login page
    if (!req.session.userEmail) {
        res.redirect("/login");
        return;
    }
    // Authorizes user, then either displays admin page or unauthorized page
    yield authorize(req);
    if (req.session.isAdmin) {
        res.render("updateWhitelist", {
            whitelist: { admins: (yield Admin.find({}).exec()).map((e) => e.Email).reverse() }
        });
    }
    else {
        res.render("unauthorized");
    }
}));
// TODO: remove this, I think it's no longer used for anything and it just straight up crashes the server
/*
router.get('/updateWhitelist', (req: Request,res: Response)=>{
    // If user is not authenticated (email is not is session) redirects to login page
    if (!req.session.userEmail) {
        res.redirect("/login");
        return;
    }
    
    // Authorizes user, then either displays admin page or unauthorized page
    await authorize(req);
    if (req.session.isAdmin) {
        res.render("updateWhitelist");
    }
    else {
        res.render("unauthorized");
    }
})
*/
exports.router.get("/updateBusListEmptyRow", (req, res) => {
    res.sendFile(path_1.default.resolve(__dirname, "../views/sockets/updateBusListEmptyRow.ejs"));
});
exports.router.get("/updateBusListPopulatedRow", (req, res) => {
    res.sendFile(path_1.default.resolve(__dirname, "../views/sockets/updateBusListPopulatedRow.ejs"));
});
exports.router.get("/adminEmptyRow", (req, res) => {
    res.sendFile(path_1.default.resolve(__dirname, "../views/sockets/adminEmptyRow.ejs"));
});
exports.router.get("/busList", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.type("json").send(yield Bus.find().distinct("busNumber"));
}));
//TODO: consult if we want this to be publically accessible or not, idk why it would need to be anyway
exports.router.get("/getWhitelist", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.type("json").send((yield Admin.find({}).exec()).map((e) => e.Email).reverse());
}));
exports.router.post("/updateBusList", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.session.userEmail) {
        res.redirect("/login");
        return;
    }
    // use the posted bus list to update the database, removing any buses that are not in the list, and adding any buses that are in the list but not in the database
    const busList = req.body.busList;
    let buses = yield Bus.find({});
    buses.forEach((bus) => {
        if (!busList.includes(bus.busNumber)) { // if the bus is not in the list
            Bus.findOneAndDelete({ busNumber: bus.busNumber }).exec(); // remove the bus from the database
        }
    });
    busList.forEach((busNumber) => __awaiter(void 0, void 0, void 0, function* () {
        if (!buses.map((bus) => bus.busNumber).includes(busNumber)) { // if the bus is not in the database
            try {
                const newBus = new Bus({
                    busNumber: busNumber,
                    busChange: 0,
                    status: "normal",
                    time: new Date(),
                });
                yield newBus.save();
            }
            catch (error) {
                console.log("bus creation failed");
            }
        }
    }));
    res.status(201).end();
}));
exports.router.get('/help', (req, res) => {
    res.render('help');
});
exports.router.post("/updateWhitelist", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.session.userEmail) {
        res.redirect("/login");
        return;
    }
    const adminExists = yield Admin.findOne({ Email: req.body.admin.toLowerCase() }).exec();
    if (adminExists) {
        yield Admin.findByIdAndDelete(adminExists._id);
    }
    else {
        yield (new Admin({ Email: req.body.admin.toLowerCase() })).save();
    }
    res.send("success!");
}));
exports.router.post("/submitAnnouncement", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.session.userEmail) {
        res.redirect("/login");
        return;
    }
    yield Announcement.findOneAndUpdate({}, { announcement: req.body.announcement, tvAnnouncement: req.body.tvAnnouncement }, { upsert: true });
    res.redirect("/admin");
}));
exports.router.post("/clearAnnouncement", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.session.userEmail) {
        res.redirect("/login");
        return;
    }
    yield Announcement.findOneAndUpdate({}, { announcement: "" }, { upsert: true });
}));
//# sourceMappingURL=router.js.map