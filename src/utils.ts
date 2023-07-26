import type { openai } from 'chatgpt';
import config from 'config';
import { Config, APIOfficialOptions } from './types.js';
import { tryGet } from './lib/try.get.js';
import TelegramBot from 'node-telegram-bot-api';

function loadConfig(): Config {
  const apiOfficialCfg: APIOfficialOptions = {
    apiKey:
      process.env.OPENAI_API_KEY ?? config.get<string>('api.official.apiKey'),
    apiBaseUrl: tryGet<string>('api.official.apiBaseUrl'),
    completionParams: tryGet<
      Partial<Omit<openai.CreateChatCompletionRequest, 'messages' | 'n'>>
    >('api.official.completionParams'),
    maxModelTokens: tryGet<number>('api.official.maxModelTokens'),
    maxResponseTokens: tryGet<number>('api.official.maxResponseTokens'),
    timeoutMs: tryGet<number>('api.official.timeoutMs'),
    debug: (tryGet<number>('debug') ?? 1) >= 2,
  };

  const ownerId = process.env.OWNER_ID
    ? Number(process.env.OWNER_ID)
    : tryGet<number>('bot.ownerId') ?? 0;

  return {
    debug: tryGet<number>('debug') ?? 2,
    version: process.env.DOCKER_TAG ?? 'local',
    bot: {
      token: process.env.TELEGRAM_BOT_TOKEN ?? config.get<string>('bot.token'),
      ownerId,
      userIds: tryGet<number[]>('bot.userIds') ?? [],
      groupIds: tryGet<number[]>('bot.groupIds') ?? [],
      chatCmd: tryGet<string>('bot.chatCmd') ?? '/chat',
      queue: tryGet<boolean>('bot.queue') ?? true,
    },
    api: {
      official: apiOfficialCfg,
    },
  };
}

function logWithTime(...args: string[] | TelegramBot.Message[]) {
  console.log(new Date().toLocaleString(), ...args);
}

export { loadConfig, logWithTime };
