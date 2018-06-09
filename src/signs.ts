import Telebot from "telebot";

export enum Sign {
  Tale,
  Shor,
  Teomim,
  Sartan,
  Arie,
  Betula,
  Moznaim,
  Akrav,
  Kashat,
  Gdi,
  Dli,
  Dagim
}

export function toString(sign: Sign): string {
  switch (sign) {
    case Sign.Tale:
      return "טלה";
    case Sign.Shor:
      return "שור";
    case Sign.Teomim:
      return "תאומים";
    case Sign.Sartan:
      return "סרטן";
    case Sign.Arie:
      return "אריה";
    case Sign.Betula:
      return "בתולה";
    case Sign.Moznaim:
      return "מאזניים";
    case Sign.Akrav:
      return "עקרב";
    case Sign.Kashat:
      return "קשת";
    case Sign.Gdi:
      return "גדי";
    case Sign.Dli:
      return "דלי";
    case Sign.Dagim:
      return "דגים";
  }
}

export function fromString(text: string): Sign | undefined {
  switch (text) {
    case "טלה":
      return Sign.Tale;
    case "שור":
      return Sign.Shor;
    case "תאומים":
      return Sign.Teomim;
    case "סרטן":
      return Sign.Sartan;
    case "אריה":
      return Sign.Arie;
    case "בתולה":
      return Sign.Betula;
    case "מאזניים":
      return Sign.Moznaim;
    case "עקרב":
      return Sign.Akrav;
    case "קשת":
      return Sign.Kashat;
    case "גדי":
      return Sign.Gdi;
    case "דלי":
      return Sign.Dli;
    case "דגים":
      return Sign.Dagim;
    default:
      return undefined;
  }
}

const allSigns = [
  [Sign.Tale, Sign.Shor, Sign.Teomim, Sign.Sartan],
  [Sign.Arie, Sign.Betula, Sign.Moznaim, Sign.Akrav],
  [Sign.Kashat, Sign.Gdi, Sign.Dli, Sign.Dagim]
];

export function keyboard(bot: Telebot) {
  return bot.keyboard(allSigns);
}
