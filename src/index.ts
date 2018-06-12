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

Bot.new().then(bot => bot.start());
