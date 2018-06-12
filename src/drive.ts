import { google, drive_v3 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import fs from "fs";
import Telebot from "telebot";
import { downloadToFile, deleteFile } from "./junkDrawer";
import tempfile from "tempfile";

export default class Drive {
  drive: drive_v3.Drive;

  constructor(auth: OAuth2Client) {
    this.drive = google.drive({ version: "v3", auth });
  }

  async addFolder(parentId: string, name: string): Promise<string> {
    const response = await this.drive.files.create({
      requestBody: {
        parents: [parentId],
        name,
        mimeType: "application/vnd.google-apps.folder"
      }
    });

    if (response.data.id == undefined) {
      throw `Couldn't create folder "${name}"`;
    }
    return response.data.id;
  }

  async uploadFile(folderId: string, fileName: string, body: any) {
    await this.drive.files.create({
      media: { body },
      requestBody: {
        name: fileName,
        mimeType: "image/jpeg",
        parents: [folderId]
      }
    });
  }

  async uploadFileFromTelegram(
    bot: Telebot,
    imageId: string,
    filename: string,
    folderId: string
  ) {
    const url = (await bot.getFile(imageId)).fileLink;
    const path = tempfile(".jpg");
    console.log(`temporary file: ${path}`);
    await downloadToFile(url, path);
    await this.uploadFile(folderId, filename, fs.createReadStream(path));
    await deleteFile(path);
  }
}
