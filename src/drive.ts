import { google, drive_v3 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import * as fs from "fs";

export class Drive {
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

    if (!response.data.id) {
      throw `Couldn't create folder "${name}"`;
    }
    return response.data.id;
  }

  async uploadFile(folderId: string, fileName: string, file: fs.ReadStream) {
    await this.drive.files.create({
      media: { body: file },
      requestBody: {
        name: fileName,
        mimeType: "image/jpeg",
        parents: [folderId]
      }
    });
  }
}
