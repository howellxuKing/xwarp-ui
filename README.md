<div align="center">
<img src="https://raw.githubusercontent.com/howellxuKing/x-panel-ui/main/public/logo.png" width="120" alt="XWarp" />
<h1>XWarp UI</h1>
<p>XWarp 前端管理界面（Vue + Element UI）</p>
</div>

## 简介

XWarp 的 Web 管理界面（基于 [Trojan Panel UI](https://github.com/trojanpanel/trojan-panel-ui) 定制），配套后端见 [x-panel](https://github.com/howellxuKing/x-panel)。

功能：节点管理、用户/账号管理、流量与到期管理、订阅管理、系统设置、邮件到期提醒、伪装站配置。

## 与上游差异

- 更名 XWarp（浏览器标题固定为 XWarp）
- 移除「项目地址 / 项目文档」外链入口
- 使用自定义 logo

## 快速使用

推荐用 [install-script](https://github.com/howellxuKing/xfly) 一键安装（含本前端镜像）：

```bash
source <(curl -L https://raw.githubusercontent.com/howellxuKing/xfly/main/install_script.sh)
# 选 1 安装前端，2 安装后端，3 安装内核
```

镜像：`ghcr.io/howellxuking/x-panel-ui`（GitHub Actions 自动构建）

## 本地开发

```bash
# Node 22 + vue-cli 4 需加 openssl-legacy-provider
npm install --allow-remote=all --legacy-peer-deps
NODE_OPTIONS=--openssl-legacy-provider npm run serve    # 开发预览 :8888
NODE_OPTIONS=--openssl-legacy-provider npm run build    # 产物在 dist/
```

## 致谢

基于 [Trojan Panel UI](https://github.com/trojanpanel/trojan-panel-ui) 定制，感谢原作者与社区。

## License

MIT
