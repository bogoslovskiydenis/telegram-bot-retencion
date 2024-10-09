import TelegramBot from 'node-telegram-bot-api';
import {initializeApp} from 'firebase/app';
import {getFirestore, doc, setDoc} from 'firebase/firestore';
import 'dotenv/config';
import axios from "axios";

const token = "8022134984:AAH3uGzx0OjKNnFFQA6pN2UPwuBipLazEKA";
const bot = new TelegramBot(token, {polling: true});
export const firebaseConfig = {
    apiKey: "AIzaSyBHANT5jst9KpWYAN38ZKwC4FqQMbHh5-Q",
    authDomain: "telegram-d8624.firebaseapp.com",
    projectId: "telegram-d8624",
    storageBucket: "telegram-d8624.appspot.com",
    messagingSenderId: "943102622976",
    appId: "1:943102622976:web:28cc5c97affd7979b207e5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const API_URL = "http://77.241.194.38:5001"
// Функция записи user_id в Firebase
const writeUserData = async (userId, firstName, username, phoneNumber) => {
    try {
        await setDoc(doc(db, 'users', String(userId)), {
            userId: userId,
            firstName: firstName,
            username: username,
            phoneNumber: phoneNumber
        });
        console.log('User data saved successfully');
    } catch (error) {
        console.error('Error writing user data to Firestore:', error);
    }
};
async function getVideoUrlFromServer(contentType) {
    if (!contentType) {
        console.error('Content type is undefined');
        return null;
    }
    try {
        const response = await axios.get(`${API_URL}/api/get-video/${contentType}`);
        return response.data.videoUrl;
    } catch (error) {
        console.error(`Error fetching video URL for ${contentType} from server:`, error.message);
        return null;
    }
}
async function getContentFromServer(contentType) {
    try {
        const response = await axios.get(`${API_URL}/api/get-text/${contentType}`);
        return response.data.text;
    } catch (error) {
        console.error(`Error fetching ${contentType} from server:`, error.message);
        return null;
    }
}
async function getVideoFromServer(contentType) {
    if (!contentType) {
        console.error('Content type is undefined');
        return null;
    }
    try {
        const response = await axios.get(`${API_URL}/api/get-video/${contentType}`, {
            responseType: 'arraybuffer'
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching video for ${contentType} from server:`, error.message);
        return null;
    }
}
async function getUrlFromServer(contentType) {
    if (!contentType) {
        console.error('Content type is undefined');
        return null;
    }
    try {
        const response = await axios.get(`${API_URL}/api/get-url/${contentType}`);
        return response.data.url;
    } catch (error) {
        console.error(`Error fetching URL for ${contentType} from server:`, error.message);
        return null;
    }
}
async function handlePhoneNumber(msg, phoneNumber, validate) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const firstName = msg.from.first_name;
    const username = msg.from.username || '';

    // Проверка формата номера телефона, если это ввод вручную
    if (validate && !validatePhoneNumber(phoneNumber)) {
        await bot.sendMessage(chatId, 'Пожалуйста, введите номер телефона в правильном формате: 79XXXXXXXXXX (12 цифр, начиная с 7).');
        return;
    }

    try {
        const videoContactPath = await getVideoFromServer("contact");

        // Обновление данных пользователя в Firebase с номером телефона
        await writeUserData(userId, firstName, username, phoneNumber);
        await bot.sendVideo(chatId, videoContactPath);
        console.log('Номер телефона успешно сохранен');
        const contactMessage = await getContentFromServer('contact');
        await bot.sendMessage(chatId, contactMessage);

        // Переход к главному меню
        const sectionMessage = 'Выберите раздел:';
        await bot.sendMessage(chatId, sectionMessage, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'SPORTSBOOK', callback_data: 'sports_book' }],
                    [{ text: 'CASINO', callback_data: 'casino' }],
                    [{ text: 'Sport+casino', callback_data: 'sport_casino' }],
                    [{ text: 'live casino', callback_data: 'live_casino' }],
                ]
            }
        });
    } catch (error) {
        console.error('Ошибка при сохранении номера телефона в Firestore:', error);
        // await bot.sendMessage(chatId, 'Извините, произошла ошибка при сохранении номера телефона.');
    }
}
function validatePhoneNumber(phoneNumber) {
    // Проверяем, содержит ли ввод недопустимые символы
    if (/[a-zA-Zа-яА-Я]/.test(phoneNumber)) {
        return false; // Содержит буквы
    }

    // Удаляем все допустимые символы форматирования
    const cleanedPhoneNumber = phoneNumber.replace(/[\s\-\(\)\+]/g, '');

    // Проверяем, остались ли какие-либо недопустимые символы
    if (/\D/.test(cleanedPhoneNumber)) {
        return false; // Содержит недопустимые символы
    }

    // Проверяем длину и префикс для номеров Казахстана
    if (cleanedPhoneNumber.length === 11 && (cleanedPhoneNumber.startsWith('7') || cleanedPhoneNumber.startsWith('8'))) {
        return true;
    }

    if (cleanedPhoneNumber.length === 10 && cleanedPhoneNumber.startsWith('7')) {
        return true;
    }

    return false; // Номер не соответствует ожидаемому формату
}
async function sendPhoneNumberInstructions(chatId) {
    try {
        await bot.sendMessage(chatId, 'Пожалуйста, введите ваш номер телефона в формате: 79XXXXXXXXXX (12 цифр, начиная с 7) Либо нажми кнопку ниже "Подельться номером телефона"', {
            reply_markup: {
                keyboard: [
                    [{ text: 'Поделиться номером телефона', request_contact: true }],
                    // [{ text: 'Вернуться' }]
                ],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });
    } catch (err) {
        console.error('Error sending phone number instructions:', err);
    }
}
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const firstName = msg.from.first_name;
    const username = msg.from.username || '';

    try {
        // Write userId to Firestore
        await writeUserData(userId, firstName, username);

        const getWelcomeVideoPreview = await getVideoFromServer("preview_welcome");
        await bot.sendVideo(chatId, getWelcomeVideoPreview);
        const welcomeMessage = await getContentFromServer("preview_welcome");
        await bot.sendMessage(chatId, welcomeMessage, {
            reply_markup: {
                keyboard: [
                    [{ text: 'Старт' }]
                ],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });
    } catch (error) {
        console.error('Error handling /start command:', error);
    }
});
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    if (msg.text && msg.text.toLowerCase() === 'старт') {
        const videoPath = await getVideoFromServer('welcome');
        const welcomeText = await getContentFromServer('welcome');

        try {
            await bot.sendVideo(chatId, videoPath);
            await bot.sendMessage(chatId, welcomeText, {
                reply_markup: {
                    keyboard: [
                        [{ text: 'Поделиться номером телефона', request_contact: true }],
                        [{ text: 'Ввести номер вручную' }]
                    ],
                    resize_keyboard: true,
                    one_time_keyboard: true
                },
                parse_mode: 'Markdown'
            });
        } catch (err) {
            console.error('Error sending content:', err);
            // await bot.sendMessage(chatId, 'Извините, произошла ошибка. Попробуйте позже.');
        }
    }

    // Обработка кнопки "Ввести номер вручную"
    else if (msg.text && msg.text === 'Ввести номер вручную') {
        await sendPhoneNumberInstructions(chatId);
    }

    // Обработка кнопки "Вернуться" — возврат к меню выбора номера
    // else if (msg.text && msg.text === 'Вернуться') {
    //     await showPhoneNumberMenu(chatId);  // Возвращаемся в меню выбора номера
    // }

    // Обработка номера, отправленного через "Поделиться номером телефона"
    // else if (msg.contact) {
    //     const phoneNumber = msg.contact.phone_number;
    //     await handlePhoneNumber(msg, phoneNumber, false); // Без проверки номера
    // }

    // Обработка вручную введенного номера
    else if (msg.text && msg.text.startsWith('7')) {
        if (validatePhoneNumber(msg.text)) {
            await handlePhoneNumber(msg, msg.text, true); // С проверкой
        } else {
            await bot.sendMessage(chatId, 'Пожалуйста, введите номер телефона в правильном формате: 79XXXXXXXXXX (10 цифр, начиная с 7). Либо нажми кнопку ниже "Подельться номером телефона"');
        }
    }
});

bot.on('contact', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const firstName = msg.from.first_name;
    const username = msg.from.username || '';
    const phoneNumber = msg.contact.phone_number;

    try {
        // Update the user data in Firebase with the phone number
        await writeUserData(userId, firstName, username, phoneNumber);

        const videoContactPath = await getVideoFromServer("contact");
        await bot.sendVideo(chatId, videoContactPath);

        console.log('Phone number saved successfully');
        const contactMessage = await getContentFromServer('contact');

        // Send a confirmation message
        await bot.sendMessage(chatId, contactMessage);

        // Proceed to the main menu
        const sectionMessage = 'Выберите раздел:';
        await bot.sendMessage(chatId, sectionMessage, {
            reply_markup: {
                inline_keyboard: [
                    [{text: 'SPORTSBOOK', callback_data: 'sports_book'}],
                    [{text: 'CASINO', callback_data: 'casino'}],
                    [{text: 'Sport+casino', callback_data: 'sport_casino'}],
                    [{text: 'live casino', callback_data: 'live_casino'}],
                ]
            }
        });
    } catch (error) {
        console.error('Error saving phone number to Firestore:', error);
        await bot.sendMessage(chatId, 'Извините, произошла ошибка при сохранении номера телефона.');
    }
});

// Обработчик для Inline Keyboard
bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;

    // Обработка нажатия на кнопки Inline Keyboard
    switch (data) {
        case 'sports_book':
            const sportBookMessage = await getContentFromServer('sports_book');
            const sportBookUrl = await getUrlFromServer('sports_book');
            const sportBookVideoPath = await getVideoFromServer("sports_book")
            const sportBookOption = {
                reply_markup: {
                    inline_keyboard: [
                        [{text: 'АКТИВИРОВАТЬ', url: sportBookUrl}],
                        [{text: 'КАК ИСПОЛЬЗОВАТЬ', callback_data: 'how_use_bonus'}],
                    ]
                }
            };

            try {
                await bot.sendVideo(chatId, sportBookVideoPath)
                await bot.sendMessage(chatId, sportBookMessage, sportBookOption);

            } catch (e) {
                console.error('Error sending content:', e);
            }

            break;
        case 'casino':
            const casinoMessage = await getContentFromServer("casino");
            const casinoUrl = await getUrlFromServer('casino');
            const casinoVideoPath = await getVideoFromServer("casino")
            const casinoOptions = {
                reply_markup: {
                    inline_keyboard: [
                        [{text: 'АКТИВИРОВАТЬ', url: casinoUrl}],
                        [{text: 'КАК ИСПОЛЬЗОВАТЬ', callback_data: 'how_use_bonus'}]
                    ]
                },
                parse_mode: 'Markdown'
            };
            await bot.sendVideo(chatId, casinoVideoPath)
            await bot.sendMessage(chatId, casinoMessage, casinoOptions);
            break;
        case 'sport_casino':
            const sportCasinoMessage = await getContentFromServer("sport_casino")
            const sportCasinoUrl = await getUrlFromServer('sport_casino');
            const sportCasinoVideoPath = await getVideoFromServer("sport_casino")
            const sportCasinoOptions = {
                reply_markup: {
                    inline_keyboard: [
                        [{text: 'АКТИВИРОВАТЬ', url: sportCasinoUrl}],
                        [{text: 'КАК ИСПОЛЬЗОВАТЬ', callback_data: 'how_use_bonus'}]
                    ]
                },
                parse_mode: 'Markdown'
            };
            await bot.sendVideo(chatId, sportCasinoVideoPath)
            await bot.sendMessage(chatId, sportCasinoMessage, sportCasinoOptions);

            break;
        case 'live_casino':
            const liveCasinoMessage = await getContentFromServer("live_casino");
            const liveCasinoUrl = await getUrlFromServer('live_casino');
            const liveCasinoVideoPath = await getVideoFromServer("live_casino")
            const liveCasinoOptions = {
                reply_markup: {
                    inline_keyboard: [
                        [{text: 'АКТИВИРОВАТЬ', url: liveCasinoUrl}],
                        [{text: 'КАК ИСПОЛЬЗОВАТЬ', callback_data: 'how_use_bonus'}]
                    ]
                },
                parse_mode: 'Markdown'
            };
            await bot.sendVideo(chatId, liveCasinoVideoPath)
            await bot.sendMessage(chatId, liveCasinoMessage, liveCasinoOptions);
            break;
        case 'back_to_start':
            const videoBackPath = await getVideoFromServer("contact")
            await bot.sendVideo(chatId, videoBackPath)
            const backMessage = await getContentFromServer('contact')
            await bot.sendMessage(chatId, backMessage, {
                reply_markup: {
                    inline_keyboard: [
                        [{text: 'SPORTSBOOK', callback_data: 'sports_book'}],
                        [{text: 'CASINO', callback_data: 'casino'}],
                        [{text: 'Sport+casino', callback_data: 'sport_casino'}],
                        [{text: 'live casino', callback_data: 'live_casino'}],
                    ]
                }
            });
            break;
        case'how_use_bonus':
            const howToUseMessage = 'Туториал , как активировать промокоды(фото, видео, гиф) \n\n или отдельная страница на продукте, или в раздел в боте '
            const howToUseUrl = await getUrlFromServer('how_use_bonus');
            const videoContactPath = await getVideoFromServer("contact")
            await bot.sendVideo(chatId, videoContactPath)
            await bot.sendMessage(chatId, howToUseMessage, {
                reply_markup: {
                    inline_keyboard: [
                        [{text: 'АКТИВИРОВАТЬ', url: howToUseUrl}],
                        [{text: 'НА ГЛАВНУЮ', callback_data: 'back_to_start'}]
                    ]
                }
            })
            break;
    }
});