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
  cookie: `__tea_cookie_tokens_2608=%257B%2522web_id%2522%253A%25227252909595475428867%2522%252C%2522user_unique_id%2522%253A%25227252909595475428867%2522%252C%2522timestamp%2522%253A1688699623514%257D; s_v_web_id=f1d3b409d8d5de4a0edb7ce252177301168e013e2a30376b90; _tea_utm_cache_2608={%22utm_source%22:%22course_list%22}; _jj_ext=1; msToken=OInd_1rbJXNQxZNy-iOTUfD9RoDJzjP677XO9ojbsb6JAQ3AbifikvbIl1zAjL3_gujv9FNsvxidWXq2ZzlyYLr3pZIhu8x_iqxhurlcjl0z06KzDOyP7CEJsALnhHh4`,
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
