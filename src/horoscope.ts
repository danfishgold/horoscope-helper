import * as Signs from "./signs";
import Telebot from "telebot";

export enum Field {
  Image,
  Source,
  Date,
  Sign,
  Content,
  Censor
}

export default class Horoscope {
  image: string;
  source?: string;
  date?: string;
  sign?: Signs.Sign;
  content?: string;
  censor?: string;
  is_uploading: boolean;

  constructor(image: string) {
    this.image = image;
    this.is_uploading = false;
  }

  public nextField(): Field | undefined {
    if (!this.source) return Field.Source;
    else if (!this.date) return Field.Date;
    else if (!this.sign) return Field.Sign;
    else if (!this.content) return Field.Content;
    else if (!this.censor) return Field.Censor;
    else return undefined;
  }

  public parseFieldText(field: Field, text: string) {
    switch (field) {
      case Field.Source:
        this.source = text;
      case Field.Date:
        this.date = text;
      case Field.Sign:
        const parsed = Signs.fromString(text);
        if (parsed) this.sign = parsed;
        else throw `Couldn't parse the sign: ${text}`;
      case Field.Content:
        this.content = text;
      case Field.Censor:
        this.censor = text;
    }
  }

  public requestField(field: Field, bot: Telebot, msg: any) {
    switch (field) {
      case Field.Source:
        return msg.reply("מאיזה עיתון זה?");
      case Field.Date:
        return msg.reply(
          "ממתי זה? אני צריך תאריך בפורמט של שנה-חודש-יום. למשל 2018-05-16 עבור ה 16 במאי. אם זה מהיום תגיב/י ״היום״."
        );

      case Field.Sign:
        return msg.reply("איזה מזל? (התחיל לרדת גשם)", {
          replyMarkup: Signs.keyboard(bot)
        });
      case Field.Content:
        return msg.reply("מה התוכן?");
      case Field.Censor:
        return msg.reply("מי צנזר???");
    }
  }
}
