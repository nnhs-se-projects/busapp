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
let nextWave = [];
let lots = [];
let currentWave = [];
function saveMap() {
    return __awaiter(this, void 0, void 0, function* () {
        yield fetch("/updateBusMap", {
            method: 'POST',
            headers: {
                accept: 'application.json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nextWave: nextWave,
                // lots: lots,
                // currentWave: currentWave
            })
        });
        updateBusMap();
        window.location.assign("/admin");
    });
}
//# sourceMappingURL=updateBusMap.js.map