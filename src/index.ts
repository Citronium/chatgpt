import TelegramBot from 'node-telegram-bot-api';
import {ChatGPT} from './api';
import {MessageHandler} from './handlers/message';
import {loadConfig} from './utils';
import {DB} from './db';

async function main() {
  console.log('🔮 ChatGPT Telegram Bot is starting...11');
  console.log('TELEGRAM_BOT_TOKEN', process.env['TELEGRAM_BOT_TOKEN']);
  console.log('OPENAI_API_KEY', process.env['OPENAI_API_KEY']);
  const opts = loadConfig();
  const db = new DB();

  // Initialize ChatGPT API.
  const api = new ChatGPT(opts.api, db);
  await api.init();

  // Initialize Telegram Bot and message handler.
  const bot = new TelegramBot(opts.bot.token, {
    polling: true,
  });
  const messageHandler = new MessageHandler(bot, api, opts.bot, db, opts.debug);
  await messageHandler.init();

  bot.on('message', messageHandler.handle);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
