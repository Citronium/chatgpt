import type { ChatGPTAPI, ChatMessage as ChatResponseV4 } from 'chatgpt';
import { APIOfficialOptions, APIOptions } from './types';
import { logWithTime } from './utils';
import { DB } from './db';
import { SendMessageOptions } from 'chatgpt';
import TelegramBot from 'node-telegram-bot-api';

class ChatGPT {
  debug: number;
  readonly apiType: string;
  protected _opts: APIOptions;
  protected _api: ChatGPTAPI | undefined;
  protected _apiOfficial: ChatGPTAPI | undefined;
  protected _timeoutMs: number | undefined;
  protected _db: DB;

  constructor(apiOpts: APIOptions, db: DB, debug = 1) {
    this.debug = debug;
    this.apiType = apiOpts.type;
    this._opts = apiOpts;
    this._timeoutMs = undefined;
    this._db = db;
  }

  init = async () => {
    if (this._opts.type == 'official') {
      const { ChatGPTAPI } = await import('chatgpt');
      this._apiOfficial = new ChatGPTAPI(
        this._opts.official as APIOfficialOptions,
      );
      this._api = this._apiOfficial;
      this._timeoutMs = this._opts.official?.timeoutMs;
    } else {
      throw new RangeError('Invalid API type');
    }
    logWithTime('🔮 ChatGPT API has started...');
  };

  sendMessage = async (
    msg: TelegramBot.Message,
    text: string,
    chatId: number,
    onProgress?: (res: ChatResponseV4) => void,
  ) => {
    const userId = msg.from?.id ?? 0;
    if (!this._api) return;

    const contextDB = await this._db.getContext(chatId, userId);

    const context = {
      conversationId: contextDB?.conversationId,
      parentMessageId: contextDB?.parentMessageId,
    };

    if (!this._apiOfficial) {
      return;
    }
    const res: ChatResponseV4 = await this._apiOfficial.sendMessage(text, {
      ...context,
      onProgress,
      timeoutMs: this._timeoutMs,
    });

    const parentMessageId = (res as ChatResponseV4).id;

    await this._db.updateContext(chatId, userId, {
      conversationId: res.conversationId,
      parentMessageId,
    });

    return res;
  };

  resetThread = async (chatId: number, userId: number) => {
    await this._db.clearContext(chatId, userId);
  };
}

export { ChatGPT };
