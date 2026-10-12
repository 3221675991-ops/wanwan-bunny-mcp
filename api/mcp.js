import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { readFile } from 'node:fs/promises';
import path from 'node:path';


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


const stickerIds =
  stickers.map(s=>s.id);



function choose(id){

  return stickers.find(
    s=>s.id===id
  );

}



async function getImageBase64(sticker){

  const file =
    path.join(
      process.cwd(),
      'public',
      'stickers',
      sticker.filename
    );


  const bytes =
    await readFile(file);


  return bytes.toString('base64');

}





function makeServer(req){


  const server =
    new McpServer({

      name:'wanwan-bunny-stickers',

      version:'2.0.0'

    });



  server.tool(

    'list_stickers',

    '列出兔兔表情包',

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

    '展示兔兔表情包',

    {

      id:z.enum(stickerIds)

    },


    async({id})=>{


      const sticker =
        choose(id);



      if(!sticker){

        throw new Error(
          'Sticker not found'
        );

      }



      const base64 =
        await getImageBase64(
          sticker
        );



      return {

        content:[

          {

            type:'resource',

            resource:{

              uri:
              `sticker://${sticker.id}`,

              mimeType:
              'image/png',

              blob:
              base64

            }

          },

          {

            type:'text',

            text:
            `${sticker.label}兔兔`

          }

        ]

      };

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
    'GET, POST, DELETE, OPTIONS'
  );


  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Accept, Mcp-Session-Id, MCP-Protocol-Version, Authorization'
  );



  if(req.method==='OPTIONS'){

    res.statusCode=204;

    return res.end();

  }



  const server =
    makeServer(req);



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