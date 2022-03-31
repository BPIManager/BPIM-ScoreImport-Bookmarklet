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
const Express = class Express {
    constructor() {
        this.updateProgressText = (innerText) => {
            if (document && document.getElementById("bpim_progressText")) {
                return document.getElementById("bpim_progressText").innerHTML = innerText;
            }
        };
    }
};
const main = class Main extends Express {
    constructor() {
        super(...arguments);
        //private mode: number = 0;
        this.getter = new getter();
        this.scraper = new scraper();
        this.result = [];
        this.scrapingView = `
<div style="text-align:center;display:flex;justify-content:center;align-items:center;flex-direction:column;height:100vh;background:#fff;overflow:hidden;" id="bpim-loading-view">
  <div class="loader">Loading...</div>
  <h1 style="display:inherit !important;">Now loading...</h1>
  <p id="bpim_progressText"></p>
  <style>.loader,.loader:after{border-radius:50%;width:10em;height:10em}.loader{margin:60px auto;font-size:10px;position:relative;text-indent:-9999em;border-top:1.1em solid rgba(0,0,0,.2);border-right:1.1em solid rgba(0,0,0,.2);border-bottom:1.1em solid rgba(0,0,0,.2);border-left:1.1em solid #000;-webkit-transform:translateZ(0);-ms-transform:translateZ(0);transform:translateZ(0);-webkit-animation:load8 1.1s infinite linear;animation:load8 1.1s infinite linear}@-webkit-keyframes load8{0%{-webkit-transform:rotate(0);transform:rotate(0)}100%{-webkit-transform:rotate(360deg);transform:rotate(360deg)}}@keyframes load8{0%{-webkit-transform:rotate(0);transform:rotate(0)}100%{-webkit-transform:rotate(360deg);transform:rotate(360deg)}}</style>
</div>`;
        this.wait = (msec) => new Promise((resolve, _reject) => setTimeout(resolve, msec));
    }
    exec() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!document) {
                return alert("Script loaded on unknown device");
            }
            if (document.domain.indexOf("eagate.573.jp") === -1) {
                return alert("対応外のページです。");
            }
            document.body.innerHTML = this.scrapingView;
            console.log("BPIManager score import bookmarklet available at: https://github.com/BPIManager");
            this.updateProgressText("開始しています");
            yield this.wait(500);
            for (let i = 0; i < 2; ++i) {
                for (let j = 0; j < 13; ++j) {
                    this.getter.setDiff(i === 0 ? 10 : 11).setOffset(j);
                    this.updateProgressText("☆" + (i === 0 ? "11" : "12") + " / " + Number(j + 1) + "ページを読み込んでいます");
                    const body = yield this.getter.get();
                    const b = this.scraper.setRawBody(body).exec();
                    this.result = this.result.concat(b);
                }
            }
            this.uploadToServer();
        });
    }
    uploadToServer() {
        return __awaiter(this, void 0, void 0, function* () {
            this.updateProgressText("サーバーに一時データを保存しています");
            console.log(this.result);
            yield this.wait(1000);
            const res = yield fetch("https://proxy.poyashi.me/bpim/api/v1/bookmarklet/add", {
                method: "POST",
                body: JSON.stringify(this.result),
            });
            const detail = yield res.json();
            const hash = detail.body.hash;
            console.log(hash, "https://bpi.poyashi.me/data/" + hash);
            this.updateProgressText("BPIManager に移動しています");
            window.location.href = "https://bpi.poyashi.me/data/" + hash;
        });
    }
};
const getter = class Getter {
    constructor() {
        this.diff = 11;
        this.offset = 0;
    }
    setDiff(val) {
        this.diff = val;
        return this;
    }
    setOffset(val) {
        this.offset = (val) * 50;
        return this;
    }
    parseBlob(blob) {
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => {
                resolve(reader.result);
            };
            reader.readAsText(blob, 'shift-jis');
        });
    }
    get() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const res = yield fetch(`https://p.eagate.573.jp/game/2dx/29/djdata/music/difficulty.html?difficult=${this.diff}&style=0&disp=1&offset=${this.offset}`, {
                    method: "GET",
                    credentials: "same-origin",
                });
                if (res.url.indexOf("error.html") > -1) {
                    console.error("Error detected", res);
                }
                if (!res.ok || res.status !== 200) {
                    throw new Error(`statuscode:${res.status}`);
                }
                const text = (yield this.parseBlob(yield res.blob()));
                return text;
            }
            catch (e) {
                console.log(e);
                alert("error!");
                return "";
            }
        });
    }
};
const scraper = class Scraper {
    constructor() {
        this.rawBody = "";
    }
    setRawBody(input) {
        this.rawBody = input;
        return this;
    }
    exec() {
        this.getTable();
        return this.getEachSongs();
    }
    getTable() {
        const matcher = this.rawBody.match(/<div class="series-difficulty">.*?<div id="page-top">/);
        this.setRawBody((!matcher || matcher.length === 0) ? "" : matcher[0]);
        return this;
    }
    detectClearState(input) {
        try {
            const num = input.match(/clflg.*?\.gif/);
            if (!num) {
                return 7;
            }
            const n = num[0].replace(/clflg|\.gif/g, "");
            return n === "0" ? 7 : Number(n) - 1;
        }
        catch (e) {
            return 7;
        }
    }
    getEachSongs() {
        if (!this.rawBody) {
            return [];
        }
        let res = [];
        const matcher = this.rawBody.match(/<tr>.*?<\/tr>/g);
        if (!matcher) {
            return [];
        }
        for (let key in matcher) {
            const eachSong = matcher[key];
            const _matcher = eachSong.match(/(<td>).*?(<\/td>)/g);
            const tableRemove = (input) => input.replace(/(<td>|<\/td>)/g, "");
            if (_matcher) {
                const songName = tableRemove(_matcher[0]).match(/(\"music_win\">).*?(<\/a>)/);
                if (songName) {
                    const score = tableRemove(_matcher[3]).split(/<br>/);
                    if (score && score[0] !== "0") {
                        res.push({
                            "title": songName[0].replace(/\"music_win\">|<\/a>/g, ""),
                            "difficulty": tableRemove(_matcher[1]).toLowerCase(),
                            "clear": this.detectClearState(tableRemove(_matcher[4])),
                            "score": Number(score[0]),
                        });
                    }
                }
            }
        }
        return res;
    }
};
new main().exec();
