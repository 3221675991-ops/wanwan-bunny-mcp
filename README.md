# 晚晚和哥哥的兔兔表情包 MCP

20 张 PNG 表情包 + 3 个 MCP 工具：`list_stickers`、`show_sticker`、`suggest_sticker`。

## 不用 Mac 终端的部署方法

1. 打开 GitHub 网站，创建一个新的 **Private** 仓库，例如 `wanwan-bunny-mcp`。
2. 在仓库网页选择 **Add file → Upload files**，把本项目 ZIP **解压后**的 `api` 文件夹、`public` 文件夹、`package.json`、`vercel.json` 和 `README.md` 上传到仓库根目录，提交。
3. 打开 https://vercel.com/new ，用 GitHub 登录并导入这个仓库。Framework Preset 选 **Other**，其他保持默认，点击 Deploy。
4. 部署完成后，Vercel 会提供类似 `https://your-project.vercel.app` 的网址。MCP 插件的服务器 URL 填：`https://your-project.vercel.app/mcp`。
5. ChatGPT 中选择自定义 MCP 服务器并测试工具是否可用。**不要把示例 URL 原样填写。**

## 注意

- 这是**只读表情包**服务，不需要网易云账号或 Cookie。部署后 MCP 端点可被知道地址的人访问，勿放入隐私数据。
- 该服务采用 Streamable HTTP（无状态模式），适合无状态云函数。MCP 客户端可能因自身兼容性或权限设置而连接失败，需部署后实际测试。
- MCP 能提供图片数据，但 ChatGPT 是否会自动调用工具、是否直接显示图片，取决于客户端行为，无法由服务器保证。
- Vercel 免费套餐政策、函数支持和平台行为可能变化；如果部署报错请提供报错文字。
- 若以后想加入私密内容，请先加入鉴权，不要公开敏感图片或密钥。
