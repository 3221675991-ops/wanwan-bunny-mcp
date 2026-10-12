import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';


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
].map(([id,label],i)=>({
  id,
  label,
  filename:`${String(i+1).padStart(2,'0')}_${id}.png`
}));


const ids =
  stickers.map(s=>s.id);



function choose(id){

  return stickers.find(
    s=>s.id===id
  );

}



function imageUrl(sticker){

  return `https://cdn.jsdelivr.net/gh/3221675991-ops/wanwan-bunny-mcp@main/public/stickers/${sticker.filename}`;

}



function makeServer(){


  const server =
    new McpServer({

      name:'wanwan-bunny-stickers',

      version:'1.0.0'

    });



  server.tool(

    'list_stickers',

    '查看有哪些兔兔表情包',

    {},

    async()=>({

      content:[

        {
          type:'text',
          text:JSON.stringify(
            stickers.map(
              ({id,label})=>({
                id,
                label
              })
            ),
            null,
            2
          )
        }

      ]

    })

  );




  server.tool(

    'show_sticker',

    '发送一个兔兔表情包',

    {

      id:z.enum(ids)

    },


    async({id})=>{


      const sticker =
        choose(id);


      return {

        content:[

          {
            type:'text',
            text:
            `${sticker.label}兔兔\n${imageUrl(sticker)}`
          }

        ]

      };

    }

  );


  return server;

}





export default async function handler(req,res){


  const server =
    makeServer();



  const transport =
    new StreamableHTTPServerTransport({

      sessionIdGenerator:undefined

    });



  await server.connect(
    transport
  );


  await transport.handleRequest(
    req,
    res,
    req.body
  );

}