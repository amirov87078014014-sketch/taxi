const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

const client = new Client({
    authStrategy: new LocalAuth()
});

let orders = {}; // для хранения данных заказов

client.on("qr", (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
    console.log("✅ Бот запущен!");
});

client.on("message", async (msg) => {
    const chatId = msg.from;
    const text = msg.body.trim();

    if (!orders[chatId]) {
        // Начало заказа: выбор языка
        orders[chatId] = { step: 0, data: {}, lang: "ru" };
        msg.reply(
            "Выберите язык / Тілді таңдаңыз:\n1 – Русский\n2 – Қазақша"
        );
        return;
    }

    let order = orders[chatId];

    // Шаг 0. Выбор языка
    if (order.step === 0) {
        if (text === "1") order.lang = "ru";
        else if (text === "2") order.lang = "kk";
        else {
            msg.reply("❌ Введите 1 или 2");
            return;
        }

        order.step = 1;
        msg.reply(
            order.lang === "kk"
                ? "Сколько вас?\n1 – бір\n2 – екі\n3 – үш\n4 – артқы орындық\n5 – толық салон"
                : "Сколько вас?\n1 – один\n2 – двое\n3 – трое\n4 – задний салон\n5 – салон"
        );
        return;
    }

    // Шаг 1. Кол-во пассажиров или салон
    else if (order.step === 1) {
        switch (text) {
            case "1":
                order.data.passengers = order.lang === "kk" ? "1 жолаушы" : "1 пассажир";
                break;
            case "2":
                order.data.passengers = order.lang === "kk" ? "2 жолаушы" : "2 пассажира";
                break;
            case "3":
                order.data.passengers = order.lang === "kk" ? "3 жолаушы" : "3 пассажира";
                break;
            case "4":
                order.data.passengers = order.lang === "kk" ? "Артқы орындық" : "Задний салон";
                break;
            case "5":
                order.data.passengers = order.lang === "kk" ? "Толық салон" : "Весь салон";
                break;
            default:
                msg.reply(order.lang === "kk"
                    ? "❌ Қате. 1-ден 5-ке дейінгі нөмірді таңдаңыз."
                    : "❌ Ошибка. Введите номер от 1 до 5."
                );
                return;
        }

        order.step = 2;
        msg.reply(order.lang === "kk"
            ? "📍 Шығатын жерді жазыңыз:"
            : "📍 Напишите адрес отправления:"
        );
        return;
    }

    // Шаг 2. Адрес откуда
    else if (order.step === 2) {
        order.data.from = text;
        order.step = 3;
        msg.reply(order.lang === "kk"
            ? "➡️ Баратын жерді жазыңыз:"
            : "➡️ Напишите адрес назначения:"
        );
        return;
    }

    // Шаг 3. Адрес куда
    else if (order.step === 3) {
        order.data.to = text;
        order.step = 4;
        msg.reply(order.lang === "kk"
            ? "⏰ Уақытты жазыңыз (мысалы: 18:30):"
            : "⏰ Напишите время (например: 18:30):"
        );
        return;
    }

    // Шаг 4. Время
    else if (order.step === 4) {
        order.data.time = text;
        order.step = 5;
        msg.reply(order.lang === "kk"
            ? "💰 Бағаны жазыңыз:"
            : "💰 Напишите цену:"
        );
        return;
    }

    // Шаг 5. Цена
    else if (order.step === 5) {
        order.data.price = text;
        order.step = 6;
        msg.reply(order.lang === "kk"
            ? "📝 Түсініктеме жазыңыз (немесе «жоқ» деп жазыңыз):"
            : "📝 Напишите комментарий (или «нет»):"
        );
        return;
    }

    // Шаг 6. Комментарий
    else if (order.step === 6) {
        if (text.toLowerCase() !== "нет" && text.toLowerCase() !== "жоқ") {
            order.data.comment = text;
        } else {
            order.data.comment = "-";
        }

        // Отправляем заказ в группу
        const groupId = "120363421901622851@g.us"; // сюда вставляешь ID своей группы

        const orderText = `📝 Новый заказ такси
👥 ${order.data.passengers}
📍 Откуда: ${order.data.from}

➡️ Куда: ${order.data.to}
⏰ Время: ${order.data.time}
💰 Цена: ${order.data.price}
📝 Комментарий: ${order.data.comment}
📞 Клиент: ${chatId}`;

        client.sendMessage(groupId, orderText);

        msg.reply(order.lang === "kk"
            ? "✅ Тапсырыс қабылданды! Жүргізушілер жақында хабарласады."
            : "✅ Заказ принят! Водители свяжутся с вами."
        );

        delete orders[chatId]; // сбрасываем заказ
    }
});

client.initialize();
