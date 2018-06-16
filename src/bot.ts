import Telebot from "telebot";
import authorize from "./authorize";
import Sheet from "./sheet";
import Drive from "./drive";
import { zip, maxBy, sum } from "./junkDrawer";
import * as Signs from "./signs";
import Horoscope, { Field } from "./horoscope";
import moment from "moment";

export default class Bot {
  bot: Telebot;
  drive: Drive;
  sheet: Sheet;
  folderId: string;
  conversations = new Map<string, Horoscope>();

  constructor(bot: Telebot, drive: Drive, sheet: Sheet, folderId: string) {
    this.bot = bot;
    this.drive = drive;
    this.sheet = sheet;
    this.folderId = folderId;

    this.bot.on("/start", msg => this.onStart(msg));
    this.bot.on("/next", msg =>
      this.onNext(msg).catch(err => console.log(err))
    );
    this.bot.on("photo", msg =>
      this.onPhoto(msg).catch(err => {
        msg.reply.text(
          `משהו רע קרה. אם היינו באמצע רישום הורוסקופ כדאי שנתחיל מההתחלה. דן ירצה לקבל צילום מסך של זה (אבא שלי עוד ישמע על זה!)\n${err}`
        );
        this.conversations.delete(msg.from.id);
      })
    );
    this.bot.on("text", msg => {
      this.onText(msg).catch(err => {
        msg.reply.text(
          `משהו רע קרה. אם היינו באמצע רישום הורוסקופ כדאי שנתחיל מההתחלה. דן ירצה לקבל צילום מסך של זה (אבא שלי עוד ישמע על זה!)\n${err}`
        );
        this.conversations.delete(msg.from.id);
      });
    });
  }

  public static async new(
    botToken: string,
    spreadsheetId: string,
    sheetName: string,
    folderId: string
  ): Promise<Bot> {
    const bot = new Telebot({ token: botToken });
    const auth = await authorize();
    const drive = new Drive(auth);
    const sheet = await Sheet.new(auth, spreadsheetId, sheetName);
    return new Bot(bot, drive, sheet, folderId);
  }

  public start() {
    this.bot.start();
  }

  onStart(msg: any) {
    msg.reply.text(
      "אהלן. כשיבוא לך להעלות צנזור, תשלח/י לי תמונה ואני אדריך אותך :)"
    );
  }

  async onNext(msg: any) {
    const dateStrings = await this.sheet.readColumn("N");
    const signStrings = await this.sheet.readColumn("E");
    const today = moment();
    const daysAgos = dateStrings.map(
      date => -moment(date, "DD-MM-YYYY").diff(today, "days")
    );
    const signs = signStrings.map(sign => Signs.fromString(sign));
    const appearences = new Map<Signs.Sign, number[]>();
    for (const [sign, daysAgo] of zip(signs, daysAgos)) {
      if (isNaN(daysAgo)) {
        continue;
      }
      if (sign == undefined) {
        throw "Couldn't parse sign";
      }
      if (!appearences.has(sign)) {
        appearences.set(sign, []);
      }
      (appearences.get(sign) as number[]).push(daysAgo);
    }
    const nearest = Math.min(...daysAgos.filter(n => !isNaN(n)));
    const offset = 1 - nearest;
    const grades = new Map<Signs.Sign, number>();
    for (const [sign, days] of appearences.entries()) {
      const grade = sum(days.map(n => 1 / (offset + n)));
      grades.set(sign, grade);
    }
    const smallestPairs: [Signs.Sign, number][] = Array.from(grades.entries())
      .sort((gr1, gr2) => gr1[1] - gr2[1])
      .slice(0, 3);
    const message = smallestPairs
      .map(gr => `${Signs.toString(gr[0])}: ${gr[1].toFixed(2)}`)
      .join("\n");
    msg.reply.text(`המזלות הבאים שכדאי להעלות:\n${message}`);
  }

  async onPhoto(msg: any) {
    const imageId = maxBy(msg.photo, (sz: any) => sz.file_size).file_id;
    const horoscope = new Horoscope(imageId);
    this.conversations.set(msg.from.id, horoscope);
    console.log(
      `New horoscope by ${msg.from.first_name} ${msg.from.last_name} ` +
        `(${msg.from.id})`
    );
    this.requestNextField(msg, horoscope);
  }

  async onText(msg: any) {
    if (msg.text == "/start" || msg.text == "/next") {
      return;
    }

    const horoscope = this.conversations.get(msg.from.id);
    if (horoscope == undefined) {
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
      await this.uploadHoroscope(horoscope);
      this.conversations.delete(msg.from.id);
      msg.reply.text("זהו. זו הזדמנות פז להעלות הורוסקופ נוסף");
      console.log(
        `Horoscope uploaded by ${msg.from.first_name} ${msg.from.last_name} ` +
          `(${msg.from.id})`
      );
    }
  }

  async uploadHoroscope(horoscope: Horoscope) {
    const id = await this.sheet.nextAvailableId();
    await this.drive.uploadFileFromTelegram(
      this.bot,
      horoscope.imageId,
      `${id}.jpg`,
      process.env.horoscopes_folder_id as string
    );

    const { censor, sign, content } = horoscope;
    if (censor == undefined || sign == undefined || content == undefined) {
      throw "Horoscope not ready";
    }
    const row = new Array(15);
    row.fill("");
    row[0] = id.toString();
    row[1] = censor;
    row[4] = Signs.toString(sign);
    row[5] = content;
    row[11] = "=AVERAGE(G2:K2)";
    row[14] = "TRUE";
    await this.sheet.addRow(2, row);
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
