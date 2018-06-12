import Telebot from "telebot";
import { google } from "googleapis";
import Sheet from "./sheet";
import Drive from "./drive";
import { maxBy } from "./junkDrawer";
import * as Signs from "./signs";
import Horoscope, { Field } from "./horoscope";
import Bot from "./bot";
import dotenv from "dotenv";
dotenv.config();

Bot.new(
  process.env.telegram_token as string,
  process.env.spreadsheet_id as string,
  process.env.sheet_name as string,
  process.env.horoscopes_folder_id as string
).then(bot => bot.start());
