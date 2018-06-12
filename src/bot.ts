import Telebot from "telebot";
import authorize from "./authorize";
import Sheet from "./sheet";
import Drive from "./drive";
import { maxBy } from "./junkDrawer";
import * as Signs from "./signs";
import Horoscope, { Field } from "./horoscope";
import dotenv from "dotenv";
dotenv.config();

export default class Bot {
  bot: Telebot = new Telebot({ token: process.env.telegram_token as string });
  conversations = new Map<string, Horoscope>();
  drive: Drive;
  sheet: Sheet;

  constructor(drive: Drive, sheet: Sheet) {
    this.drive = drive;
    this.sheet = sheet;

    this.bot.on("/start", msg => this.onStart(msg));
    this.bot.on("photo", msg => this.onPhoto(msg));
    this.bot.on("text", msg => {
      this.onText(msg).catch(err => {
        msg.reply.text(
          `משהו רע קרה. אם היינו באמצע רישום הורוסקופ כדאי שנתחיל מההתחלה. דן ירצה לקבל צילום מסך על זה (אבא שלי עוד ישמע על זה!)\n${err}`
        );
        this.conversations.delete(msg.from.id);
      });
    });
  }

  public static async new(): Promise<Bot> {
    const auth = await authorize();
    const drive = new Drive(auth);
    const sheet = await Sheet.new(
      auth,
      process.env.spreadsheet_id as string,
      process.env.sheet_name as string
    );
    return new Bot(drive, sheet);
  }

  public start() {
    this.bot.start();
  }

  onStart(msg: any) {
    msg.reply.text(
      "אהלן. כשיבוא לך להעלות צנזור, תשלח/י לי תמונה ואני אדריך אותך :)"
    );
  }

  onPhoto(msg: any) {
    const imageId = maxBy(msg.photo, (sz: any) => sz.file_size).file_id;
    const horoscope = new Horoscope(imageId);
    this.conversations.set(msg.from.id, horoscope);
    this.requestNextField(msg, horoscope);
  }

  async onText(msg: any) {
    const horoscope = this.conversations.get(msg.from.id);
    if (!horoscope) {
      msg.reply.text("מה עם איזו תמונה או משהו בסגנון?");
      return;
    }

    switch (horoscope.nextEmptyField()) {
      case undefined:
        msg.reply.text("אני עדיין באמצע ההעלאה");
        return;
      case Field.Sign:
        const parsed = Signs.fromString(msg.text);
        if (parsed != undefined) {
          horoscope.sign = parsed;
        } else {
          msg.reply.text("לא הבנתי, אפשר שוב?", {
            replyMarkup: Signs.keyboard(this.bot)
          });
          return;
        }
        break;
      case Field.Content:
        horoscope.content = msg.text;
        break;
      case Field.Censor:
        horoscope.censor = msg.text;
        break;
    }

    if (horoscope.nextEmptyField()) {
      this.requestNextField(msg, horoscope);
    } else {
      msg.reply.text("שניה, אני מעלה את ההורוסקופ");
      await this.uploadHoroscope(this.bot, horoscope, this.drive, this.sheet);
      this.conversations.delete(msg.from.id);
      msg.reply.text("זהו. זו הזדמנות פז להעלות הורוסקופ נוסף");
    }
  }

  async uploadHoroscope(
    bot: Telebot,
    horoscope: Horoscope,
    drive: Drive,
    sheet: Sheet
  ) {
    const id = await sheet.nextAvailableId();
    await drive.uploadFileFromTelegram(
      bot,
      horoscope.imageId,
      `${id}.jpg`,
      process.env.horoscopes_folder_id as string
    );

    const { censor, sign, content } = horoscope;
    if (!censor || !sign || !content) {
      throw "Horoscope not ready";
    }
    const row = new Array(15);
    row.fill("");
    row[0] = id.toString();
    row[1] = censor;
    row[4] = Signs.toString(sign);
    row[5] = content;
    row[14] = "TRUE";
    await sheet.addRow(2, row);
  }

  requestNextField(msg: any, horoscope: Horoscope) {
    switch (horoscope.nextEmptyField()) {
      case Field.Sign:
        msg.reply.text("איזה מזל? (התחיל לרדת גשם)", {
          replyMarkup: Signs.keyboard(this.bot)
        });
        break;
      case Field.Content:
        msg.reply.text("מה התוכן?");
        break;
      case Field.Censor:
        msg.reply.text("מי צנזר???");
        break;
    }
  }
}
