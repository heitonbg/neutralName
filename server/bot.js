import { Bot, Keyboard } from '@maxhub/max-bot-api';
import db from './db/database.js';

// ⚠️ Username бота без символа @
const BOT_USERNAME = 't184_hakaton_bot';

let bot = null;

/**
 * Инициализация и запуск бота MAX
 */
export function startBot({ token, webAppUrl }) {
  if (!token || token.trim() === '') {
    console.warn('⚠️  BOT_TOKEN не задан — бот не запущен');
    return null;
  }

  try {
    bot = new Bot(token);

    // Устанавливаем меню команд
    bot.api
      .setMyCommands([
        { name: 'start', description: 'Открыть афишу событий' },
        { name: 'my', description: 'Мои события' },
        { name: 'help', description: 'Справка' }
      ])
      .catch((e) => console.warn('Не удалось установить меню:', e.message));

    // Глобальный обработчик ошибок — бот не упадёт при сбое
    bot.catch((err) => {
      console.error('❌ Ошибка в обработке:', err.message);
    });

    // ============================================
    // /start
    // ============================================
    bot.command('start', async (ctx) => {
      const userName = ctx.user?.name || 'друг';

      const text =
        `Привет, ${userName}! 👋\n\n` +
        `Я помогу найти интересные события рядом с тобой.\n\n` +
        `📋 Что я умею:\n` +
        `• Открывать афишу событий\n` +
        `• Показывать твои события\n` +
        `• Напоминать о записи\n\n` +
        `Нажми кнопку ниже, чтобы начать 👇`;

      const keyboard = Keyboard.inlineKeyboard([
        [
          Keyboard.button.openApp(
            '🎉 Открыть афишу событий',
            BOT_USERNAME
          )
        ],
        [
          Keyboard.button.openApp(
            '👤 Мои события',
            BOT_USERNAME
          )
        ]
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
        [
          Keyboard.button.openApp(
            '👤 Открыть мои события',
            BOT_USERNAME
          )
        ]
      ]);

      await ctx.reply('Вот твои события:', { attachments: [keyboard] });
    });

    // ============================================
    // bot_started — пользователь запустил бота по диплинку
    // ============================================
    bot.on('bot_started', async (ctx) => {
      const payload = ctx.update?.payload;
      console.log('🤖 bot_started, payload:', payload);

      const userName = ctx.user?.name || 'друг';

      const text =
        `Привет, ${userName}! 👋\n\n` +
        `Нажми кнопку ниже, чтобы открыть афишу событий.`;

      const keyboard = Keyboard.inlineKeyboard([
        [
          Keyboard.button.openApp(
            '🎉 Открыть афишу',
            BOT_USERNAME
          )
        ]
      ]);

      await ctx.reply(text, { attachments: [keyboard] });
    });

    // ============================================
    // Обработка всех входящих сообщений
    // ============================================
    bot.on('message_created', async (ctx) => {
      const text = ctx.message?.body?.text || '';

      // Игнорируем команды (они обрабатываются выше)
      if (text.startsWith('/')) return;

      const keyboard = Keyboard.inlineKeyboard([
        [
          Keyboard.button.openApp(
            '🎉 Открыть афишу событий',
            BOT_USERNAME
          )
        ]
      ]);

      await ctx.reply('Нажми кнопку ниже, чтобы открыть афишу 👇', {
        attachments: [keyboard]
      });
    });

    // ============================================
    // Callback-кнопки (если будут)
    // ============================================
    bot.on('message_callback', async (ctx) => {
      const payload = ctx.callback?.payload || '';
      console.log('📩 Callback:', payload);

      if (payload.startsWith('join_event:')) {
        const eventId = parseInt(payload.split(':')[1]);
        const event = db.findEvent(eventId);

        if (event) {
          await ctx.reply(`✅ Ты записался на «${event.title}»`);
        } else {
          await ctx.reply('⚠️ Событие не найдено');
        }
      }
    });

    // ============================================
    // Запуск
    // ============================================
    bot.start();
    console.log('🤖 Бот MAX Events запущен!');
    console.log(`   Username: @${BOT_USERNAME}`);

    return bot;
  } catch (e) {
    console.error('❌ Ошибка запуска бота:', e.message);
    return null;
  }
}

/**
 * Отправка уведомления пользователю
 * @param {number} userId - ID пользователя
 * @param {string} text - текст (поддерживает Markdown)
 */
export async function notifyUser(userId, text) {
  if (!bot) return;
  try {
    await bot.api.sendMessageToUser(userId, text, { format: 'markdown' });
  } catch (e) {
    console.warn('⚠️  Не удалось отправить уведомление:', e.message);
  }
}