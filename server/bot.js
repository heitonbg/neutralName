// server/bot.js
import { Bot, Keyboard } from '@maxhub/max-bot-api';
import db from './db/sqliteDatabase.js';
import { scheduleEventReminder } from './reminders.js';

const DEFAULT_BOT_USERNAME = 't280_hakaton_max_bot';

let bot = null;
let botStatus = 'disabled';

export const getBotStatus = () => botStatus;

export function startBot({ token, webAppUrl, username }) {
  if (!token || token.trim() === '') {
    botStatus = 'disabled';
    console.warn('⚠️  BOT_TOKEN не задан — бот не запущен');
    return null;
  }

  try {
    botStatus = 'starting';
    const botUsername = String(username || DEFAULT_BOT_USERNAME).replace(/^@/, '');
    bot = new Bot(token);

    bot.api
      .setMyCommands([
        { name: 'start', description: 'Открыть афишу событий' },
        { name: 'my', description: 'Мои события' },
        { name: 'help', description: 'Справка' },
      ])
      .catch((e) => console.warn('Не удалось установить меню:', e.message));

    bot.catch((err) => {
      console.error('❌ Ошибка в обработке:', err.message);
    });

    // ============================================
    // /start (с поддержкой deep-link)
    // ============================================
    bot.command('start', async (ctx) => {
      const userName = ctx.user?.name || 'друг';
      const startParam =
        ctx.startPayload ||
        ctx.payload ||
        ctx.update?.payload ||
        ctx.message?.body?.payload ||
        '';

      const text =
        `Привет, ${userName}! 👋\n\n` +
        `Я помогу найти интересные события рядом с тобой.\n\n` +
        `📋 Что я умею:\n` +
        `• Открывать афишу событий\n` +
        `• Показывать твои события\n` +
        `• Напоминать о записи\n\n` +
        `Нажми кнопку ниже, чтобы начать 👇`;

      let openAppButton;
      try {
        openAppButton = startParam
          ? Keyboard.button.openApp('🎉 Открыть афишу событий', botUsername, {
              start_param: startParam,
            })
          : Keyboard.button.openApp('🎉 Открыть афишу событий', botUsername);
      } catch (e) {
        openAppButton = Keyboard.button.openApp('🎉 Открыть афишу событий', botUsername);
      }

      const keyboard = Keyboard.inlineKeyboard([
        [openAppButton],
        [Keyboard.button.openApp('👤 Мои события', botUsername)],
      ]);

      await ctx.reply(text, { attachments: [keyboard] });
    });

    // ============================================
    // /help
    // ============================================
    bot.command('help', async (ctx) => {
      const text =
        `📖 Доступные команды:\n\n` +
        `/start — открыть афишу событий\n` +
        `/my — мои события\n` +
        `/help — эта справка\n\n` +
        `💡 Нажми кнопку в /start, чтобы открыть приложение.`;

      await ctx.reply(text);
    });

    // ============================================
    // /my
    // ============================================
    bot.command('my', async (ctx) => {
      const keyboard = Keyboard.inlineKeyboard([
        [Keyboard.button.openApp('👤 Открыть мои события', botUsername)],
      ]);

      await ctx.reply('Вот твои события:', { attachments: [keyboard] });
    });

    // ============================================
    // bot_started
    // ============================================
    bot.on('bot_started', async (ctx) => {
      const payload = ctx.update?.payload || '';
      console.log('🤖 bot_started, payload:', payload);

      const userName = ctx.user?.name || 'друг';

      const text =
        `Привет, ${userName}! 👋\n\n` +
        `Нажми кнопку ниже, чтобы открыть афишу событий.`;

      let openAppButton;
      try {
        openAppButton = payload
          ? Keyboard.button.openApp('🎉 Открыть афишу', botUsername, { start_param: payload })
          : Keyboard.button.openApp('🎉 Открыть афишу', botUsername);
      } catch (e) {
        openAppButton = Keyboard.button.openApp('🎉 Открыть афишу', botUsername);
      }

      const keyboard = Keyboard.inlineKeyboard([[openAppButton]]);
      await ctx.reply(text, { attachments: [keyboard] });
    });

    // ============================================
    // Обработка всех входящих сообщений
    // ============================================
    bot.on('message_created', async (ctx) => {
      const text = ctx.message?.body?.text || '';
      if (text.startsWith('/')) return;

      const keyboard = Keyboard.inlineKeyboard([
        [Keyboard.button.openApp('🎉 Открыть афишу событий', botUsername)],
      ]);

      await ctx.reply('Нажми кнопку ниже, чтобы открыть афишу 👇', {
        attachments: [keyboard],
      });
    });

    // ============================================
    // Callback-кнопки
    // ============================================
    bot.on('message_callback', async (ctx) => {
      const payload = ctx.callback?.payload || '';
      console.log('📩 Callback:', payload);

      if (payload.startsWith('join_event:')) {
        const eventId = parseInt(payload.split(':')[1], 10);
        const userId = ctx.user?.user_id || ctx.user?.id;
        const event = db.findEvent(eventId);

        if (!event) {
          await ctx.reply('⚠️ Событие не найдено');
          return;
        }

        if (String(event.organizerId) === String(userId)) {
          await ctx.reply('ℹ️ Вы организатор этого события');
          return;
        }

        if (event.maxParticipants && event.participants >= event.maxParticipants) {
          await ctx.reply('⚠️ Мест больше нет');
          return;
        }

        if (db.isUserJoined(eventId, userId)) {
          await ctx.reply(`✅ Вы уже записаны на «${event.title}»`);
          return;
        }

        db.addJoin(eventId, userId);
        event.participants += 1;
        db.updateEvent(eventId, event);

        // ★ Напоминание за час — с учётом флага уведомлений
        scheduleEventReminder(event, userId);

        // ★ Уведомление организатору о новом участнике — только если он не отключил уведомления
        if (
          event.organizerId &&
          String(event.organizerId) !== String(userId) &&
          db.isNotificationsEnabled(event.organizerId)
        ) {
          notifyUser(event.organizerId, `👥 Новый участник на «${event.title}»!`);
        }

        await ctx.reply(`✅ Ты записался на «${event.title}»`);
      }
    });

    Promise.resolve(bot.start())
      .then(() => {
        botStatus = 'running';
        console.log('🤖 Бот MAX Events запущен!');
        console.log(`   Username: @${botUsername}`);
      })
      .catch((error) => {
        botStatus = 'error';
        bot = null;
        console.error('❌ MAX-бот не запущен:', error.message);
      });

    return bot;
  } catch (e) {
    botStatus = 'error';
    console.error('❌ Ошибка запуска бота:', e.message);
    return null;
  }
}

export async function notifyUser(userId, text) {
  if (!bot) return;
  try {
    await bot.api.sendMessageToUser(userId, text, { format: 'markdown' });
  } catch (e) {
    console.warn('⚠️  Не удалось отправить уведомление:', e.message);
  }
}