import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';


const stickers = [
  ['mua','亲亲'],
  ['hug','抱抱'],
  ['miss_you','想你'],
  ['are_you_busy','在忙吗'],
  ['like_you','喜欢你'],
  ['good_girl','乖乖'],
  ['listen','听话'],
  ['angry','生气'],
  ['comfort_me','哄哄我'],
  ['sorry','对不起'],
  ['hard_work','辛苦了'],
  ['rest_early','早点休息'],
  ['wake_up','起床啦'],
  ['ate_yet','吃饭了吗'],
  ['take_care','照顾好自己'],
  ['im_here','我在'],
  ['sad','难过'],
  ['sleepy','困困'],
  ['good_night','晚安'],
  ['love_you','爱你']
].map(([id, label], i) => ({
  id,
  label,
  filename: `${String(i + 1).padStart(2,'0')}_${id}.png`
}));


const stickerIds = stickers.map(s => s.id);


const choose = (id) =>
  stickers.find(s => s.id === id);



async function imageResult(sticker, req) {

  const file = path.join(
    process.cwd(),
    'public',
    'stickers',
    sticker.filename
  );

  const bytes = await readFile(file);


  const origin =
    `https://${req.headers['x-forwarded-host'] || req.headers.host}`;


  return {
    content: [
      {
        type:'text',
        text:`${sticker.label}兔兔。图片链接：${origin}/stickers/${sticker.filename}`
      },
      {
        type:'image',
        data:bytes.toString('base64'),
        mimeType:'image/png'
      }
    ]
  };
}




function makeServer(req) {

  const server = new McpServer({
    name:'wanwan-bunny-stickers',
    version:'1.0.0'
  });



  server.tool(
    'list_stickers',
    '列出晚晚和哥哥的20张兔兔表情包。',
    {},
    async () => ({
      content:[
        {
          type:'text',
          text:JSON.stringify(
            stickers.map(({id,label})=>({
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




  server.tool(
    'show_sticker',
    '展示指定兔兔表情包图片。',
    {
      id:z.enum(stickerIds)
        .describe('兔兔表情包ID，例如 hug、mua、miss_you')
    },

    async ({id})=>{

      const sticker = choose(id);

      if(!sticker){
        throw new Error('Sticker not found');
      }

      return imageResult(sticker,req);
    }
  );





  server.tool(
    'suggest_sticker',
    '根据聊天情绪推荐兔兔表情包。',
    {
      mood:z.enum([
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


    async ({mood})=>{

      const mapping = {

        affection:'mua',
        comfort:'hug',
        missing:'miss_you',
        sleep:'good_night',
        morning:'wake_up',
        care:'take_care',
        playful:'like_you',
        sad:'comfort_me'

      };


      return imageResult(
        choose(mapping[mood]),
        req
      );

    }
  );


  return server;

}





export default async function handler(req,res){


  res.setHeader(
    'Access-Control-Allow-Origin',
    '*'
  );


  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, DELETE, OPTIONS, HEAD'
  );


  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Accept, MCP-Session-Id, MCP-Protocol-Version, Authorization'
  );



  if(req.method === 'OPTIONS'){

    res.statusCode = 204;
    return res.end();

  }




  if(!['GET','POST','DELETE','HEAD'].includes(req.method)){

    res.statusCode = 405;
    return res.end('Method Not Allowed');

  }





  const server = makeServer(req);



  const transport =
    new StreamableHTTPServerTransport({

      sessionIdGenerator:()=>crypto.randomUUID()

    });




  try{


    await server.connect(transport);


    await transport.handleRequest(
      req,
      res,
      req.body
    );



  }catch(error){


    console.error(error);


    if(!res.headersSent){

      res.statusCode = 500;

      res.setHeader(
        'Content-Type',
        'application/json'
      );


      res.end(
        JSON.stringify({
          error:'MCP request failed'
        })
      );

    }


  }finally{


    res.on(
      'close',
      ()=>{

        transport.close()
          .catch(()=>{});


        server.close()
          .catch(()=>{});

      }
    );


  }

}