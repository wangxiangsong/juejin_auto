'use strict';

/*---------------依赖-----------------*/
const nodeMailer = require('nodemailer');
const axios = require('axios');

/*---------------配置-----------------*/
const config = {
  baseUrl: 'https://api.juejin.cn',
  apiUrl: {
    getTodayStatus: '/growth_api/v1/get_today_status',
    checkIn: '/growth_api/v1/check_in',
    getLotteryConfig: '/growth_api/v1/lottery_config/get',
    drawLottery: '/growth_api/v1/lottery/draw',
  },
  cookie: `MONITOR_WEB_ID=99b4e96b-d34b-4134-b641-feeaa1bd9731; _ga=GA1.2.1131998804.1664454900; __tea_cookie_tokens_2608=%7B%22web_id%22%3A%227148779312904144417%22%2C%22user_unique_id%22%3A%227148779312904144417%22%2C%22timestamp%22%3A1664454900288%7D; _tea_utm_cache_2608={"utm_source":"gold_browser_extension"}; passport_csrf_token=cb32c70153a905ad2d548e4593438e69; passport_csrf_token_default=cb32c70153a905ad2d548e4593438e69; n_mh=9FLVpl8qFYrxAf9FPIqWNmPCbGDWHkKqyHI_eXYFC9g; sid_guard=a7259271939fb1d8b4123f474cdb1705|1664454983|31536000|Fri,+29-Sep-2023+12:36:23+GMT; uid_tt=36222c80d487161ee5f2a854ded82663; uid_tt_ss=36222c80d487161ee5f2a854ded82663; sid_tt=a7259271939fb1d8b4123f474cdb1705; sessionid=a7259271939fb1d8b4123f474cdb1705; sessionid_ss=a7259271939fb1d8b4123f474cdb1705; sid_ucp_v1=1.0.0-KDhmZGY3YWI0OWMyZjY3YmM0NmRhZDJkY2U3Njg5MjJiMWU4ZTAwN2UKFwi-usDaj4zmARDHotaZBhiwFDgCQPEHGgJsZiIgYTcyNTkyNzE5MzlmYjFkOGI0MTIzZjQ3NGNkYjE3MDU; ssid_ucp_v1=1.0.0-KDhmZGY3YWI0OWMyZjY3YmM0NmRhZDJkY2U3Njg5MjJiMWU4ZTAwN2UKFwi-usDaj4zmARDHotaZBhiwFDgCQPEHGgJsZiIgYTcyNTkyNzE5MzlmYjFkOGI0MTIzZjQ3NGNkYjE3MDU; _gid=GA1.2.1116687710.1668663922`,
  email: {
    qq: {
      user: '951606897@qq.com',
      from: '951606897@qq.com',
      to: '951606897@qq.com',
      pass: 'ltqvyeglpdekbcdi',
    },
  },
};

/*---------------掘金-----------------*/

// 签到
const checkIn = async () => {
  let { error, isCheck } = await getTodayCheckStatus();
  if (error) return console.log('查询签到失败');
  if (isCheck) return console.log('今日已参与签到');
  const { cookie, baseUrl, apiUrl } = config;
  let { data } = await axios({
    url: baseUrl + apiUrl.checkIn,
    method: 'post',
    headers: { Cookie: cookie },
  });
  if (data.err_no) {
    console.log('签到失败');
    await sendEmailFromQQ('今日掘金签到：失败', JSON.stringify(data));
  } else {
    console.log(`签到成功！当前积分：${data.data.sum_point}`);
    await sendEmailFromQQ('今日掘金签到：成功', JSON.stringify(data));
  }
};

// 查询今日是否已经签到
const getTodayCheckStatus = async () => {
  const { cookie, baseUrl, apiUrl } = config;
  let { data } = await axios({
    url: baseUrl + apiUrl.getTodayStatus,
    method: 'get',
    headers: { Cookie: cookie },
  });
  if (data.err_no) {
    await sendEmailFromQQ('今日掘金签到查询：失败', JSON.stringify(data));
  }
  return { error: data.err_no !== 0, isCheck: data.data };
};

// 抽奖
const draw = async () => {
  let { error, isDraw } = await getTodayDrawStatus();
  if (error) return console.log('查询抽奖次数失败');
  if (isDraw) return console.log('今日已无免费抽奖次数');
  const { cookie, baseUrl, apiUrl } = config;
  let { data } = await axios({
    url: baseUrl + apiUrl.drawLottery,
    method: 'post',
    headers: { Cookie: cookie },
  });
  if (data.err_no) return console.log('免费抽奖失败');
  console.log(`恭喜抽到：${data.data.lottery_name}`);
};

// 获取今天免费抽奖的次数
const getTodayDrawStatus = async () => {
  const { cookie, baseUrl, apiUrl } = config;
  let { data } = await axios({
    url: baseUrl + apiUrl.getLotteryConfig,
    method: 'get',
    headers: { Cookie: cookie },
  });
  if (data.err_no) {
    return { error: true, isDraw: false };
  } else {
    return { error: false, isDraw: data.data.free_count === 0 };
  }
};

/*---------------邮件-----------------*/

// 通过qq邮箱发送
const sendEmailFromQQ = async (subject, html) => {
  let cfg = config.email.qq;
  if (!cfg || !cfg.user || !cfg.pass) return;
  const transporter = nodeMailer.createTransport({
    service: 'qq',
    auth: { user: cfg.user, pass: cfg.pass },
  });
  transporter.sendMail(
    {
      from: cfg.from,
      to: cfg.to,
      subject: subject,
      html: html,
    },
    err => {
      if (err) return console.log(`发送邮件失败：${err}`, true);
      console.log('发送邮件成功');
    }
  );
};

const fn = async () => {
  await checkIn();
  await draw();
};

fn();
