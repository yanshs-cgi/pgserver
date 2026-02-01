
import express from 'express';
import { createServer } from 'http';
import { Telegraf, Markup } from 'telegraf';

const app = express();
const httpServer = createServer(app);
let bot: Telegraf | null = null;
let isRunning = false;
let botInfo: any = null;

async function startBot(token: string) {
  if (isRunning && bot) {
    try { bot.stop('SIGINT'); } catch (e) {}
  }

  bot = new Telegraf(token);

  bot.start((ctx) => {
    ctx.reply(
      `Bot Aktif! 🟢\n\nKetik .menu untuk melihat fitur.`,
      Markup.keyboard([['.menu', '.ping'], ['.creator']]).resize()
    );
  });

  const menuMarkup = Markup.inlineKeyboard([
    [Markup.button.callback('🎮 Games', 'menu_games'), Markup.button.callback('🛡️ Admin', 'menu_admin')],
    [Markup.button.callback('❌ Close', 'close_menu')]
  ]);

  bot.hears('.menu', (ctx) => ctx.reply('Menu Utama:', menuMarkup));

  bot.action('menu_games', (ctx) => {
    ctx.editMessageText('🎮 **Games**\n\n.dice\n.darts\n.slot', 
      Markup.inlineKeyboard([[Markup.button.callback('🔙 Back', 'main_menu')]])
    );
  });

  bot.action('menu_admin', (ctx) => {
    ctx.editMessageText('🛡️ **Admin**\n\n.kick (reply user)\n.tagall', 
      Markup.inlineKeyboard([[Markup.button.callback('🔙 Back', 'main_menu')]])
    );
  });

  bot.action('main_menu', (ctx) => ctx.editMessageText('Menu Utama:', menuMarkup));
  bot.action('close_menu', (ctx) => ctx.deleteMessage());

  bot.hears(/^\.kick$/, async (ctx) => {
    if (!ctx.message.reply_to_message) return ctx.reply('Reply user yang mau di kick.');
    try {
      // @ts-ignore
      await ctx.telegram.kickChatMember(ctx.chat.id, ctx.message.reply_to_message.from.id);
      ctx.reply('User berhasil di kick.');
    } catch (e) { ctx.reply('Gagal kick. Pastikan bot admin.'); }
  });

  bot.hears('.tagall', async (ctx) => {
    ctx.reply('Tagging all admins/members... (Simulated)');
  });

  bot.hears('.ping', (ctx) => ctx.reply('Pong! 🏓'));

  bot.launch();
  isRunning = true;
  botInfo = bot.botInfo;
  return botInfo;
}

app.get('/', async (req, res) => {
  const apikey = req.query.apikey as string;
  const logout = req.query.logout as string;

  if (logout) {
    if (bot) bot.stop('SIGINT');
    isRunning = false;
    bot = null;
    return res.json({ status: true, result: "Sukses Logout" });
  }

  if (apikey) {
    try {
      const info = await startBot(apikey);
      return res.json({
        status: true,
        result: {
          message: "Bot Aktif!",
          bot_name: info.first_name,
          username: `@${info.username}`
        }
      });
    } catch (e) {
      return res.json({ status: false, message: "Gagal login." });
    }
  }

  res.send('Server Running. Use ?apikey=TOKEN');
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
