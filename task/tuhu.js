// 途虎养车 Surge版

const NAME = "途虎养车";
let tokenArr = JSON.parse($persistentStore.read("tuhu_token") || "[]");
let blackbox = $persistentStore.read("tuhu_blackbox") || "";
let messages = [];


// 入口
(async () => {
    if (typeof $request !== "undefined") {
        captureToken();
    } else {
        await main();
    }
    $done();
})();


// 主任务
async function main() {
    if (!tokenArr.length) {
        notify(NAME, "未找到Token，请打开途虎APP积分页面");
        return;
    }

    if (!blackbox) {
        await getBlackBox();
    }

    for (let i = 0; i < tokenArr.length; i++) {
        let token = tokenArr[i];
        if (!token.startsWith("Bearer ")) {
            token = "Bearer " + token;
        }

        let user = await userInfo(token);
        if (!user) {
            messages.push(`账号${i + 1}: Token失效 ❌`);
            continue;
        }

        let app = await checkIn(token, "app", "软件任务");
        let wx = await checkIn(token, "wxapp", "微信任务");
        let integral = await getIntegral(token);

        messages.push(`${user}\n${app}\n${wx}\n${integral}`);
    }

    notify(NAME, messages.join("\n"));
}


// 抓Token
function captureToken() {
    let headers = $request.headers;
    let token = headers.Authorization || headers.authorization;
    let bb = headers.blackbox || headers.Blackbox;

    if (token) {
        if (!tokenArr.includes(token)) {
            tokenArr.push(token);
            $persistentStore.write(JSON.stringify(tokenArr), "tuhu_token");
        }
    }

    if (bb) {
        blackbox = bb;
        $persistentStore.write(blackbox, "tuhu_blackbox");
    }

    notify(NAME, "Token获取成功 ✅");
}


// 用户信息
async function userInfo(token) {
    let r = await POST({
        url: "https://cl-gateway.tuhu.cn/cl-user-info-site/userAccount/getCurrentUserInfo",
        headers: {
            Authorization: token,
            authType: "oauth",
            "Content-Type": "application/json"
        },
        body: "{}"
    });

    if (r.code == 10000 && r.data) {
        return "当前用户: " + r.data.nickName;
    }
    return "";
}


// 签到
async function checkIn(token, type, name) {
    let r = await POST({
        url: "https://cl-gateway.tuhu.cn/cl-common-api/api/dailyCheckIn/userCheckIn",
        headers: {
            Authorization: token,
            authType: "oauth",
            blackbox: blackbox,
            Host: "cl-gateway.tuhu.cn",
            api_level: "2",
            channel: "iOS",
            version: "7.40.0",
            needErrorCode: "true",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            channel: type
        })
    });

    if (r.data && r.data.rewardIntegral) {
        return `${name}: 签到成功, 积分 +${r.data.rewardIntegral} ✅`;
    }

    return `${name}: 签到失败, ${r.message || JSON.stringify(r)}`;
}


// 获取blackbox
async function getBlackBox() {
    try {
        let r = await GET({
            url: "https://tuhu.xn--ug8h.eu.org/blackbox"
        });

        if (r.blackBox) {
            blackbox = r.blackBox;
            $persistentStore.write(blackbox, "tuhu_blackbox");
            console.log("blackbox更新成功");
        }
    } catch (e) {
        console.log("blackbox获取失败", e);
    }
}


// 查询积分
async function getIntegral(token) {
    let r = await GET({
        url: "https://api.tuhu.cn/User/GetPersonalCenterQuantity",
        headers: {
            Authorization: token,
            "Content-Type": "application/json"
        }
    });

    if (r.Code == 1) {
        return `查询积分: ${r.IntegralNumber} 分, 可抵现: ${(r.IntegralNumber / 100).toFixed(2)} 元`;
    }
    return "查询积分失败";
}


// GET请求
function GET(options) {
    return new Promise(resolve => {
        $httpClient.get(options, (err, resp, data) => {
            if (err) {
                console.log("GET错误:", err);
                resolve({});
                return;
            }
            try {
                resolve(JSON.parse(data));
            } catch (e) {
                resolve({});
            }
        });
    });
}


// POST请求

function POST(options) {
    return new Promise(resolve => {
        $httpClient.post(options, (err, resp, data) => {
            if (err) {
                console.log("POST错误:", err);
                resolve({});
                return;
            }
            try {
                resolve(JSON.parse(data));
            } catch (e) {
                resolve({});
            }
        });
    });
}


// 通知
function notify(title, body) {
    $notification.post(title, "", body);
    console.log(`\n${title}\n\n${body}\n`);
}
