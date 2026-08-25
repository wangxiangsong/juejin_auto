'use strict';

const nodemailer = require('nodemailer');

const BASE_URL = 'https://api.juejin.cn';
const ENDPOINTS = {
  todayStatus: '/growth_api/v1/get_today_status',
  checkIn: '/growth_api/v1/check_in',
  lotteryConfig: '/growth_api/v1/lottery_config/get',
  drawLottery: '/growth_api/v1/lottery/draw',
};

function requireEnvironment(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`缺少 GitHub Secret：${name}`);
  return value;
}

function formatError(error) {
  return error instanceof Error ? error.message : String(error);
}

function chinaDate() {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function createJuejinClient(cookie) {
  return async (path, method = 'GET') => {
    let response;
    try {
      response = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: {
          Cookie: cookie,
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
          Origin: 'https://juejin.cn',
          Referer: 'https://juejin.cn/',
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        },
        body: method === 'POST' ? '{}' : undefined,
        signal: AbortSignal.timeout(20_000),
      });
    } catch (error) {
      throw new Error(`请求 ${path} 失败：${formatError(error)}`);
    }

    const contentType = response.headers.get('content-type') || '未提供';
    const body = await response.text();
    let payload;
    try {
      payload = JSON.parse(body);
    } catch {
      // 仅保留短片段以定位网关/风控页；不输出请求头或 Cookie。
      const preview = body.replace(/\s+/g, ' ').trim().slice(0, 200) || '（空响应）';
      throw new Error(
        `请求 ${path} 返回了无法解析的响应（HTTP ${response.status}，Content-Type: ${contentType}，响应片段: ${preview}）`
      );
    }

    if (!response.ok) throw new Error(`请求 ${path} 失败（HTTP ${response.status}）`);
    if (payload.err_no !== 0) throw new Error(payload.err_msg || `请求 ${path} 失败（错误码 ${payload.err_no}）`);
    return payload.data;
  };
}

async function checkIn(request) {
  const checkedIn = await request(ENDPOINTS.todayStatus);
  if (checkedIn) return '签到：今日已完成';

  const result = await request(ENDPOINTS.checkIn, 'POST');
  const points = result?.sum_point;
  return points === undefined ? '签到：成功' : `签到：成功，当前积分 ${points}`;
}

async function drawLottery(request) {
  const config = await request(ENDPOINTS.lotteryConfig);
  const freeCount = Number(config?.free_count ?? 0);
  if (freeCount <= 0) return '免费抽奖：今日无可用次数';

  const result = await request(ENDPOINTS.drawLottery, 'POST');
  return result?.lottery_name ? `免费抽奖：${result.lottery_name}` : '免费抽奖：完成';
}

async function sendEmail({ user, pass, to }, subject, lines) {
  const transporter = nodemailer.createTransport({
    service: 'qq',
    auth: { user, pass },
  });
  await transporter.sendMail({
    from: user,
    to,
    subject,
    text: lines.join('\n'),
  });
}

async function main() {
  const cookie = requireEnvironment('JUEJIN_COOKIE');
  const email = {
    user: requireEnvironment('QQ_EMAIL_USER'),
    pass: requireEnvironment('QQ_EMAIL_AUTH_CODE'),
    to: requireEnvironment('QQ_EMAIL_TO'),
  };
  const request = createJuejinClient(cookie);
  const lines = [`执行日期（北京时间）：${chinaDate()}`];
  let failed = false;

  for (const task of [checkIn, drawLottery]) {
    try {
      lines.push(await task(request));
    } catch (error) {
      failed = true;
      lines.push(`${task === checkIn ? '签到' : '免费抽奖'}：失败 - ${formatError(error)}`);
    }
  }

  for (const line of lines) console.log(line);

  try {
    await sendEmail(email, `掘金每日任务 ${failed ? '失败' : '完成'} - ${chinaDate()}`, lines);
    console.log('邮件通知：已发送');
  } catch (error) {
    failed = true;
    console.error(`邮件通知：发送失败 - ${formatError(error)}`);
  }

  if (failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`任务启动失败：${formatError(error)}`);
  process.exitCode = 1;
});
