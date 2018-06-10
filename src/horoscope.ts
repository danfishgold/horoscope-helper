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
}
