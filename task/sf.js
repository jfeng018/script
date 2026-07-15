const $ = new Env('顺丰速运')
$.KEY_login = 'chavy_login_sfexpress'

!(async () => {
  console.log("========== STEP1 loginapp ==========")
  await loginapp()

  await $.wait(1000)

  console.log("========== STEP2 loginweb ==========")
  await loginweb()

  await $.wait(1000)

  console.log("========== STEP3 sign ==========")
  await sign()

  await $.wait(1000)

  console.log("========== STEP4 signDailyTasks ==========")
  await signDailyTasks()

  showmsg()
})()
.catch((e) => $.logErr(e))
.finally(() => $.done())

function loginapp() {
  const loginOpts = $.getjson($.KEY_login)

  delete loginOpts.headers.Cookie
  delete loginOpts.headers.cookie

  // Loon 有，Surge 没有，补一下
  if (!loginOpts.headers.host) {
    loginOpts.headers.host = "ccsp-egmas.sf-express.com"
  }

  console.log("========== LOGIN REQUEST ==========")
  console.log(loginOpts.url)
  console.log(loginOpts.body)
  console.log(JSON.stringify(loginOpts.headers, null, 2))

  return $.http.post(loginOpts).then((resp) => {

    console.log("========== LOGIN RESPONSE ==========")
    console.log(resp.body)

    $.login = JSON.parse(resp.body)

    console.log("========== LOGIN JSON ==========")
    console.log(JSON.stringify($.login, null, 2))

  }).catch((err) => {

    console.log("========== LOGIN ERROR ==========")
    console.log(JSON.stringify(err))

    throw err
  })
}

function loginweb() {

  const sign = encodeURIComponent($.login.obj.sign)

  const loginOpts = {
    url: `https://mcs-mimp-web.sf-express.com/mcs-mimp/share/app/shareRedirect?sign=${sign}&source=SFAPP&bizCode=647@RnlvejM1R3VTSVZ6d3BNaXJxRFpOUVVtQkp0ZnFpNDBKdytobm5TQWxMeHpVUXVrVzVGMHVmTU5BVFA1bXlwcw==`
  }

  console.log("========== LOGINWEB URL ==========")
  console.log(loginOpts.url)

  return $.http.get(loginOpts).then(resp => {

    console.log("========== LOGINWEB STATUS ==========")
    console.log(resp.statusCode)

    console.log("========== LOGINWEB BODY ==========")
    console.log(resp.body)

  }).catch(err => {

    console.log("========== LOGINWEB ERROR ==========")
    console.log(JSON.stringify(err))

    throw err
  })
}

function sign() {

  const signOpts = {
    url: `https://mcs-mimp-web.sf-express.com/mcs-mimp/commonPost/~memberNonactivity~integralTaskSignPlusService~automaticSignFetchPackage`,
    body: `{"comeFrom":"vioin","channelFrom":"SFAPP"}`,
    headers: {
      "Content-Type": "application/json"
    }
  }

  console.log("========== SIGN REQUEST ==========")

  return $.http.post(signOpts).then(resp => {

    console.log("========== SIGN RESPONSE ==========")
    console.log(resp.body)

    $.sign = JSON.parse(resp.body)

  }).catch(err => {

    console.log("========== SIGN ERROR ==========")
    console.log(JSON.stringify(err))

    throw err
  })
}

function queryDailyTask() {

  return $.http.post({
    url: `https://mcs-mimp-web.sf-express.com/mcs-mimp/commonPost/~memberNonactivity~integralTaskStrategyService~queryPointTaskAndSignFromES`,
    body: `{"channelType":"1"}`,
    headers: {
      "Content-Type": "application/json"
    }
  }).then(resp => {

    console.log("========== TASK RESPONSE ==========")
    console.log(resp.body)

    $.tasks = JSON.parse(resp.body).obj.taskTitleLevels

  })
}

async function signDailyTasks() {

  await queryDailyTask()

  for (let i = 0; i < $.tasks.length; i++) {

    const task = $.tasks[i]

    if (task.status === 1) {

      await getPoint(task)

    } else if (task.status === 2) {

      await doTask(task)

      await getPoint(task)

    } else if (task.status === 3) {

      task.result = "积分已领取！"

    } else {

      task.result = "未知"

    }

  }

}

function doTask(task) {

  return $.http.post({

    url: `https://mcs-mimp-web.sf-express.com/mcs-mimp/commonRoutePost/memberEs/taskRecord/finishTask`,

    body: `{"taskCode":"${task.taskCode}"}`,

    headers: {}

  })

}

function getPoint(task) {

  return $.http.post({

    url: `https://mcs-mimp-web.sf-express.com/mcs-mimp/commonPost/~memberNonactivity~integralTaskStrategyService~fetchIntegral`,

    body: `{"strategyId":${task.strategyId},"taskId":"${task.taskId}","taskCode":"${task.taskCode}","channelType":"1"}`,

    headers: {
      "Content-Type":"application/json"
    }

  }).then(resp => {

    const data = JSON.parse(resp.body)

    task.result = data.success ? "成功" : data.errorMessage

  })

}

function showmsg() {

  const success = $.sign && $.sign.success

  $.subt = "签到: "

  $.desc = []

  if (success) {

    if ($.sign.obj.hasFinishSign) {

      $.subt += "重复"

      $.desc.push(`说明: 连续签到${$.sign.obj.countDay}天`)

    } else {

      $.subt += "成功"

      $.desc.push(`说明: 连续签到${$.sign.obj.countDay}天`)

    }

  } else {

    $.subt += "失败"

    $.desc.push(`说明: ${$.sign.errorMessage}`)

  }

  $.desc.push("", "每日任务:")

  for (const task of $.tasks) {

    $.desc.push(`${task.title}: ${task.result}`)

  }

  $.msg($.name, $.subt, $.desc.join("\n"))

}



