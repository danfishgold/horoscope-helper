import * as Signs from "./signs";
import Telebot from "telebot";
import Drive from "./drive";

export enum Field {
  Sign,
  Content,
  Censor
}

export default class Horoscope {
  imageId: string;
  sign?: Signs.Sign;
  content?: string;
  censor?: string;

  constructor(imageId: string) {
    this.imageId = imageId;
  }

  public nextEmptyField(): Field | undefined {
    if (!this.sign) return Field.Sign;
    else if (!this.content) return Field.Content;
    else if (!this.censor) return Field.Censor;
    else return undefined;
  }

  public parseFieldText(field: Field, text: string) {
    switch (field) {
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
