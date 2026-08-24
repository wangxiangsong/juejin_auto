# 掘金每日签到与免费抽奖

通过 GitHub Actions 每天北京时间 07:00 执行掘金签到和免费抽奖，并以 QQ 邮箱发送结果。所有凭证只保存在 GitHub Actions Secrets，绝不提交到仓库。

## 配置

在仓库的 `Settings → Secrets and variables → Actions` 中添加以下 Repository secrets：

| 名称 | 内容 |
| --- | --- |
| `JUEJIN_COOKIE` | 浏览器已登录掘金后的完整 Cookie 值（不包含 `Cookie:` 前缀） |
| `QQ_EMAIL_USER` | QQ 发件邮箱 |
| `QQ_EMAIL_AUTH_CODE` | QQ 邮箱 SMTP 授权码，不是邮箱密码 |
| `QQ_EMAIL_TO` | 接收结果的邮箱 |

Cookie 会过期。若邮件提示未登录或请求失败，请重新登录掘金并更新 `JUEJIN_COOKIE`。不要把 Cookie、授权码或邮箱密码写进代码、Issue 或提交记录。

## 手动验证

提交后，进入仓库的 **Actions** 页面，选择 **Juejin daily check-in**，点击 **Run workflow**。执行日志和邮件都会显示签到、抽奖与通知的结果。

GitHub 的定时任务可能有数分钟排队延迟；该工作流的目标触发时间是每天北京时间 07:00。
