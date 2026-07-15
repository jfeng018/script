/**
 * 顺丰速运签到 Surge版
 * 
 * 获取会话:
 * 打开顺丰APP 获取 Cookie
 * 
 * 运行本脚本签到
 */

const SF_KEY = "sfexpress_session";

let login = null;
let signData = null;
let taskList = [];

(async () => {
  console.log("🔔顺丰速运 开始");

  try {
    if (typeof $request !== "undefined") {
      const session = {
        url: $request.url,
        body: $request.body,
        headers: $request.headers
      };

      const ok = $persistentStore.write(JSON.stringify(session), SF_KEY);
      console.log(ok ? "会话保存成功" : "会话保存失败");

      $notification.post(
        "顺丰速运",
        ok ? "获取会话成功" : "获取会话失败",
        ""
      );

      $done();
      return;
    }

    await loginApp();
    await wait(1000);
    await loginWeb();
    await wait(1000);
    await sign();
    await wait(1000);
    await dailyTask();

    showMsg();

  } catch(e) {
    console.log("异常: " + e);
    $notification.post("顺丰速运", "执行失败", String(e));
  }

  $done();
})();

function wait(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

function requestPost(opts) {
  return new Promise((resolve, reject) => {
    $httpClient.post(opts, (err, res, body) => {
      if (err) {
        reject(err);
      } else {
        resolve(body);
      }
    });
  });
}

function requestGet(opts) {
  return new Promise((resolve, reject) => {
    $httpClient.get(opts, (err, res, body) => {
      if (err) {
        reject(err);
      } else {
        resolve(body);
      }
    });
  });
}

async function loginApp() {
  const data = $persistentStore.read(SF_KEY);
  if (!data) {
    throw "没有顺丰会话";
  }

  let opts = JSON.parse(data);
  if (opts.headers.Cookie) {
    delete opts.headers.Cookie;
  }

  const body = await requestPost(opts);
  login = JSON.parse(body);

  if (login.success) {
    console.log("APP登录成功");
  } else {
    throw "APP登录失败";
  }
}

async function loginWeb() {
  const sign = encodeURIComponent(login.obj.sign);

  await requestGet({
    url: `https://mcs-mimp-web.sf-express.com/mcs-mimp/share/app/shareRedirect?sign=${sign}&source=SFAPP&bizCode=647@RnlvejM1R3VTSVZ6d3BNaXJxRFpOUVVtQkp0ZnFpNDBKdytobm5TQWxMeHpVUXVrVzVGMHVmTU5BVFA1bXlwcw==`
  });

  console.log("WEB登录成功");
}

async function sign() {
  const body = await requestPost({
    url: "https://mcs-mimp-web.sf-express.com/mcs-mimp/commonPost/~memberNonactivity~integralTaskSignPlusService~automaticSignFetchPackage",
    headers: {
      "Content-Type": "application/json"
    },
    body: '{"comeFrom":"vioin","channelFrom":"SFAPP"}'
  });

  signData = JSON.parse(body);

  if (signData.success) {
    if (signData.obj.hasFinishSign) {
      console.log(`今日已签到 连续${signData.obj.countDay}天`);
    } else {
      console.log(`签到成功 连续${signData.obj.countDay}天`);
    }
  } else {
    console.log("签到失败");
  }
}

async function dailyTask() {
  const body = await requestPost({
    url: "https://mcs-mimp-web.sf-express.com/mcs-mimp/commonPost/~memberNonactivity~integralTaskStrategyService~queryPointTaskAndSignFromES",
    headers: {
      "Content-Type": "application/json"
    },
    body: '{"channelType":"1"}'
  });

  taskList = JSON.parse(body).obj.taskTitleLevels;
  console.log("任务数量: " + taskList.length);

  for (const task of taskList) {
    if (task.status === 1) {
      await getPoint(task);
    } else if (task.status === 2) {
      await requestPost({
        url: "https://mcs-mimp-web.sf-express.com/mcs-mimp/commonRoutePost/memberEs/taskRecord/finishTask",
        body: `{"taskCode":"${task.taskCode}"}`
      });
      await getPoint(task);
    } else if (task.status === 3) {
      task.result = "已领取";
    }
  }

  console.log(
    taskList.map(task => `${task.title}: ${task.result || "未完成"}`).join("\n")
  );
}

async function getPoint(task) {
  const body = await requestPost({
    url: "https://mcs-mimp-web.sf-express.com/mcs-mimp/commonPost/~memberNonactivity~integralTaskStrategyService~fetchIntegral",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      strategyId: task.strategyId,
      taskId: task.taskId,
      taskCode: task.taskCode,
      channelType: "1"
    })
  });

  const data = JSON.parse(body);
  task.result = data.success ? "成功" : data.errorMessage;
}

function showMsg() {
  let msg = "";
  for (const task of taskList) {
    msg += `${task.title}: ${task.result || "未完成"}\n`;
  }

  let title = "签到失败";
  if (signData && signData.success) {
    if (signData.obj.hasFinishSign) {
      title = `今日已签到 连续${signData.obj.countDay}天`;
    } else {
      title = `签到成功 连续${signData.obj.countDay}天`;
    }
  }

  $notification.post("顺丰速运", title, msg);
}
