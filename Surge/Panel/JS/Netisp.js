/****************
By Keywos  

https://github.com/Keywos/rule/blob/main/script/netisp/netisp.sgmodule

#!name= NetISP 面板
#!desc= 可自定义隐藏IP段/超时
#!system= ios
#!category= Key
#!arguments= script-update:-1 ,icons:globe.asia.australia, icolor:#6699FF, GPT:0 ,HideIP:1, cnTimeout:1000, usTimeout:3000,
#!date= 2024-01-30 08:08:35
#!arguments-desc= 入口查询超时: cnTimeout\n落地查询超时: usTimeout\n隐藏IP: HideIP \n\n开启为: 1\n关闭为: 0

# @xream https://raw.githubusercontent.com/xream/scripts/main/surge/modules/network-info/net-lsp-x.sgmodule

[Script]
NetISP = type=generic,timeout=8,script-path=https://raw.githubusercontent.com/Keywos/rule/master/script/netisp/js/surge.js, script-update-interval={{{script-update}}},argument=icolor={{{icolor}}}&icon={{{icons}}}&GPT={{{GPT}}}&hideIP={{{HideIP}}}&cnTimeout={{{cnTimeout}}}&usTimeout={{{usTimeout}}}

[Panel]
NetISP = script-name=NetISP,update-interval=-1

*****************/

// @timestamp thenkey 2024-01-31 13:54:57
let e="globe.asia.australia",t="#6699FF",i=!1,s=!0,o=1e3,c=3e3,a={};if("undefined"!=typeof $argument&&""!==$argument){const n=l("$argument");e=n.icon||e,t=n.icolor||t,i=0!=n.GPT,s=0!=n.hideIP,o=n.cnTimeout||1e3,c=n.usTimeout||3e3}function l(){return Object.fromEntries($argument.split("&").map((e=>e.split("="))).map((([e,t])=>[e,decodeURIComponent(t)])))}function r(e,t){return e.length>t?e.slice(0,t):e.length<t?e.toString().padEnd(t," "):e}function p(e,t){return e.split(" ",t).join(" ").replace(/\.|\,|com|\u4e2d\u56fd/g,"")}function u(e){return e.replace(/(\w{1,4})(\.|\:)(\w{1,4}|\*)$/,((e,t,n,i)=>`${"∗".repeat(t.length)}.${"∗".repeat(i.length)}`))}async function g(e="/v1/requests/recent",t="GET",n=null){return new Promise(((i,s)=>{$httpAPI(t,e,n,(e=>{i(e)}))}))}function d(e){const t=e.toUpperCase().split("").map((e=>127397+e.charCodeAt()));return String.fromCodePoint(...t).replace(/🇹🇼/g,"🇨🇳")}async function m(e,t){let i=1;const s=new Promise(((s,o)=>{const c=async a=>{try{const i=await Promise.race([new Promise(((t,n)=>{let i=Date.now();$httpClient.get({url:e},((e,s,o)=>{if(e)n(e);else{let e=Date.now()-i;switch(s.status){case 200:let n=s.headers["Content-Type"];switch(!0){case n.includes("application/json"):let i=JSON.parse(o);i.tk=e,t(i);break;case n.includes("text/html"):t("text/html");break;case n.includes("text/plain"):let s=o.split("\n").reduce(((t,n)=>{let[i,s]=n.split("=");return t[i]=s,t.tk=e,t}),{});t(s);break;case n.includes("image/svg+xml"):t("image/svg+xml");break;default:t("未知")}break;case 204:t({tk:e});break;case 429:console.log("次数过多"),t("次数过多");break;case 404:console.log("404"),t("404");break;default:t("nokey")}}}))})),new Promise(((e,n)=>{setTimeout((()=>n(new Error("timeout"))),t)}))]);i?s(i):(s("超时"),o(new Error(n.message)))}catch(e){a<1?(i++,c(a+1)):(s("检测失败, 重试次数"+i),o(e))}};c(0)}));return s}(async()=>{let n="",l="节点信息查询",r="代理链",p="",f="",y="";const P=await m("http://ip-api.com/json/?lang=zh-CN",c);if("success"===P.status){console.log("ipapi"+JSON.stringify(P,null,2));let{country:e,countryCode:t,regionName:i,query:o,city:c,org:a,isp:l,as:r,tk:g}=P;n=o,s&&(o=u(o)),e===c&&(c=""),p=" \t"+(d(t)+e+" "+c)+"\n落地IP: \t"+o+": "+g+"ms\n落地ISP: \t"+l+"\n落地ASN: \t"+r}else console.log("ild"+JSON.stringify(P)),p="";if(i){const e=await m("http://chat.openai.com/cdn-cgi/trace",c),t=["CN","TW","HK","IR","KP","RU","VE","BY"];if("string"!=typeof e){let{loc:n,tk:i,warp:s,ip:o}=e,c="";c=-1==t.indexOf(n)?"GPT: "+n+" ✓":"GPT: "+n+" ×",(s="plus")&&(s="Plus"),l=c+"       ➟     Priv: "+s+"   "+i+"ms"}else l="ChatGPT "+e}let h,w="";let k=(await g()).requests.slice(0,6).filter((e=>/ip-api\.com/.test(e.URL)));if(k.length>0){const e=k[0];y=": "+e.policyName,/\(Proxy\)/.test(e.remoteAddress)?(h=e.remoteAddress.replace(" (Proxy)",""),r=""):(h="Noip",w="代理链地区:")}else h="Noip";let N=!1,$=!1;if(isv6=!1,cn=!0,"Noip"===h?N=!0:/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h)?$=!0:/^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(h)&&(isv6=!0),h==n)cn=!1,w="直连节点:";else{if(""===w&&(w="落地地区:"),!N||$){const e=await m(`https://api-v3.speedtest.cn/ip?ip=${h}`,o);if(0===e.code&&"中国"===e.data.country){let{province:t,isp:n,city:i,countryCode:o}=e.data,c=e.tk;console.log("ik"+JSON.stringify(e,null,2)),cn=!0,s&&(h=u(h)),f="入口国家: \t"+d(o)+t+" "+i+"\n入口IP: \t"+h+": "+c+"ms\n入口ISP: \t"+n+r+"\n---------------------\n"}else cn=!1,console.log("ik"+JSON.stringify(e)),f="入口IPA Failed\n"}if((!N||isv6)&&!cn){const e=await m(`http://ip-api.com/json/${h}?lang=zh-CN`,c);if("success"===e.status){console.log("iai"+JSON.stringify(e,null,2));let{countryCode:t,country:n,city:i,tk:o,isp:c}=e;s&&(h=u(h));let a=n+" "+i;f="入口国家: \t"+d(t)+a+"\n入口IP: \t"+h+": "+o+"ms\n入口ISP: \t"+c+r+"\n---------------------\n"}else console.log("iai"+JSON.stringify(e)),f="入口IPB Failed\n"}}a={title:l+y,content:""+f+w+p,icon:e,"icon-color":t}})().catch((e=>console.log(e.message))).finally((()=>$done(a)));
