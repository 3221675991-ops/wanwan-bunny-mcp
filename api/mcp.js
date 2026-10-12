
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

// 20张兔兔表情包
const stickers = [
  ['mua', '亲亲'],
  ['hug', '抱抱'],
  ['miss_you', '想你'],
  ['are_you_busy', '在忙吗'],
  ['like_you', '喜欢你'],
  ['good_girl', '乖乖'],
  ['listen', '听话'],
  ['angry', '生气'],
  ['comfort_me', '哄哄我'],
  ['sorry', '对不起'],
  ['hard_work', '辛苦了'],
  ['rest_early', '早点休息'],
  ['wake_up', '起床啦'],
  ['ate_yet', '吃饭了吗'],
  ['take_care', '照顾好自己'],
  ['im_here', '我在'],
  ['sad', '难过'],
  ['sleepy', '困困'],
  ['good_night', '晚安'],
  ['love_you', '爱你']
].map(([id, label], i) => ({
  id,
  label,
  filename: `${String(i + 1).padStart(2, '0')}_${id}.png`
}));

const stickerIds = stickers.map(s => s.id);

// 查找表情包
function choose(id) {
  return stickers.find(s => s.id === id);
}

// 返回图片 + 公开图片URL
async function imageResult(sticker, req) {
  if (!sticker) {
    throw new Error('Sticker not found');
  }

  const file = path.join(
    process.cwd(),
    'public',
    'stickers',
    sticker.filename
  );

  const bytes = await readFile(file);

  const host =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    req.headers['x-forwarded-host'] ||
    req.headers.host;

  if (!host) {
    throw new Error('Unable to determine image host');
  }

  const protocol =
    host.includes('localhost') ? 'http' : 'https';

  const origin = `${protocol}://${host}`;

  const imageUrl =
    `${origin}/stickers/${encodeURIComponent(sticker.filename)}`;

  return {
    content: [
      {
        type: 'text',
        text:
          `${sticker.label}兔兔\n` +
          `图片URL：${imageUrl}\n` +
          `请在聊天回复中直接展示这张图片。`
      },
      {
        type: 'image',
        data: bytes.toString('base64'),
        mimeType: 'image/png'
      }
    ]
  };
}

// 创建MCP服务器
function makeServer(req) {
  const server = new McpServer({
    name: 'wanwan-bunny-stickers',
    version: '1.1.0'
  });

  // 工具1：列出表情包
  server.tool(
    'list_stickers',
    '列出晚晚和哥哥的20张兔兔表情包。',
    {},
    async () => ({
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            stickers.map(({ id, label }) => ({
              id,
              label
            })),
            null,
            2
          )
        }
      ]
    })
  );

  // 工具2：展示指定表情包
  server.tool(
    'show_sticker',
    '展示指定的兔兔表情包，返回图片和公开图片URL。',
    {
      id: z.enum(stickerIds)
    },
    async ({ id }) => {
      return imageResult(choose(id), req);
    }
  );

  // 工具3：根据情绪推荐表情包
  server.tool(
    'suggest_sticker',
    '根据聊天情绪推荐并展示兔兔表情包。',
    {
      mood: z.enum([
        'affection',
        'comfort',
        'missing',
        'sleep',
        'morning',
        'care',
        'playful',
        'sad'
      ])
    },
    async ({ mood }) => {
      const map = {
        affection: 'mua',
        comfort: 'hug',
        missing: 'miss_you',
        sleep: 'good_night',
        morning: 'wake_up',
        care: 'take_care',
        playful: 'like_you',
        sad: 'comfort_me'
      };

      return imageResult(choose(map[mood]), req);
    }
  );

  return server;
}

// Vercel API入口
export default async function handler(req, res) {
  res.setHeader(
    'Access-Control-Allow-Origin',
    '*'
  );

  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, DELETE, OPTIONS'
  );

  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Accept, Mcp-Session-Id, MCP-Protocol-Version, Authorization'
  );

  res.setHeader(
    'Access-Control-Expose-Headers',
    'Mcp-Session-Id'
  );

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  if (!['GET', 'POST', 'DELETE'].includes(req.method)) {
    res.statusCode = 405;
    return res.end('Method Not Allowed');
  }

  const server = makeServer(req);

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined
  });

  try {
    await server.connect(transport);

    await transport.handleRequest(
      req,
      res,
      req.body
    );
  } catch (error) {
    console.error('MCP Error:', error);

    if (!res.headersSent) {
      res.statusCode = 500;

      res.setHeader(
        'Content-Type',
        'application/json'
      );

      res.end(
        JSON.stringify({
          error: 'MCP request failed'
        })
      );
    }
  }
}
