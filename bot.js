const { Telegraf, Markup } = require('telegraf');
const { message } = require('telegraf/filters');
const axios = require('axios');
require('dotenv').config();

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const bot = new Telegraf(botToken);

bot.telegram.setMyCommands([
    { command: 'start', description: 'Start the bot' },
  ]);

// Хранилище выбранного языка для каждого пользователя
const userLanguage = {};

// Команда /start с кнопками выбора языка
bot.start((ctx) => {
    ctx.reply(
        'Choose your language / Выберите язык:',
        Markup.inlineKeyboard([
            [Markup.button.callback('Русский', 'lang_ru'), Markup.button.callback('English', 'lang_en')]
        ])
    );
});

// Обработка выбора языка
bot.action('lang_ru', (ctx) => {
    userLanguage[ctx.from.id] = 'ru';
    ctx.reply('Вы выбрали русский язык. Отправьте своё местоположение для получения данных о погоде.');
});

bot.action('lang_en', (ctx) => {
    userLanguage[ctx.from.id] = 'en';
    ctx.reply('You selected English. Send your location to get weather information.');
});

// Обработка сообщений с учётом языка
bot.on('message', async (ctx) => {
    const lang = userLanguage[ctx.from.id] || 'en'; // По умолчанию - English
    if (ctx.message.location) {
        try {
            const { latitude, longitude } = ctx.message.location;
            const weatherApiKey = process.env.WEATHER_API_KEY;
            const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&units=metric&exclude=hourly,daily&appid=${weatherApiKey}`;
            const response = await axios.get(url);

            const currentTemp = response.data.current.temp;
            const currentUV = response.data.current.uvi;

            const tempMessage =
                lang === 'ru'
                    ? `Температура: ${currentTemp}°C, UV-индекс: ${currentUV}`
                    : `Temperature: ${currentTemp}°C, UV Index: ${currentUV}`;

            const sunscreenMessage =
                lang === 'ru'
                    ? currentUV >= 3
                        ? 'Нужен солнцезащитный крем!'
                        : 'Солнцезащитный крем не нужен.'
                    : currentUV >= 3
                        ? 'You need sunscreen!'
                        : 'You do not need sunscreen.';

            await ctx.reply(tempMessage);
            await ctx.reply(sunscreenMessage);
            await ctx.reply(
                lang === 'ru'
                    ? 'Отправьте своё местоположение для получения данных о погоде.'
                    : 'Send your location to get weather information.'
            );
        } catch (error) {
            console.error('Ошибка при запросе погоды:', error);
            await ctx.reply(
                lang === 'ru'
                    ? 'Извините, не удалось получить данные о погоде. Попробуйте позже.'
                    : 'Sorry, failed to get weather data. Please try again later.'
            );
        }
    } else {
        await ctx.reply(
            lang === 'ru'
                ? 'Пожалуйста, отправьте своё местоположение, чтобы получить данные о погоде.'
                : 'Please send your location to get weather information.'
        );
    }
});

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));


// const { Telegraf } = require('telegraf');
// const { message } = require('telegraf/filters');
// const axios = require('axios');
// require('dotenv').config();

// const botToken = process.env.TELEGRAM_BOT_TOKEN;
// const weatherApiKey = process.env.WEATHER_API_KEY;

// const bot = new Telegraf(botToken);
// bot.start((ctx) => {
//     ctx.reply('Welcome, send me your location to get current weather');
// });

// bot.on('message', async (ctx) => {
//     if (ctx.message.location) {
//         try {
//             const { latitude, longitude } = ctx.message.location;
//             const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&units=metric&exclude=hourly,daily&appid=${weatherApiKey}`;
//             const response = await axios.get(url);

//             const currentTemp = response.data.current.temp;
//             const currentUV = response.data.current.uvi;

//             // Последовательно отправляем сообщения
//             await ctx.reply(`Температура: ${currentTemp}°C, UV-индекс: ${currentUV}`);
//             if (currentUV >= 3) {
//                 await ctx.reply('Нужен солнцезащитный крем!');
//             } else {
//                 await ctx.reply('Солнцезащитный крем не нужен.');
//             }
//         } catch (error) {
//             console.error('Ошибка при запросе погоды:', error);
//             await ctx.reply('Извините, не удалось получить данные о погоде. Попробуйте позже.');
//         }

//         // Сообщение выводится строго после всех предыдущих
//         await ctx.reply('Ok, send me your location to get current weather');
//     } else {
//         // Если пользователь не отправил локацию
//         await ctx.reply('Пожалуйста, отправьте своё местоположение, чтобы получить данные о погоде.');
//     }
// });


// bot.launch();

// // Enable graceful stop
// process.once('SIGINT', () => bot.stop('SIGINT'));
// process.once('SIGTERM', () => bot.stop('SIGTERM'));