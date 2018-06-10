import { google, sheets_v4 } from "googleapis";
import { OAuth2Client } from "google-auth-library";

export default class Sheet {
  sheets: sheets_v4.Sheets;
  spreadsheetId: string;
  sheet: sheets_v4.Schema$Sheet;

  private constructor(
    sheets: sheets_v4.Sheets,
    spreadsheetId: string,
    sheet: sheets_v4.Schema$Sheet
  ) {
    this.sheets = sheets;
    this.spreadsheetId = spreadsheetId;
    this.sheet = sheet;
  }

  public static async new(
    auth: OAuth2Client,
    spreadsheetId: string,
    sheetName: string
  ): Promise<Sheet> {
    const sheets = google.sheets({ version: "v4", auth });

    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    if (!spreadsheet.data.sheets) {
      throw "Couldn't load spreadsheet";
    }
    const sheet = spreadsheet.data.sheets.find(
      sheet => (sheet.properties ? sheet.properties.title == sheetName : false)
    );
    if (!sheet) {
      throw `Couldn't find the sheet named "${sheetName}"`;
    }

    return new Sheet(sheets, spreadsheetId, sheet);
  }

  sheetId(): number {
    if (!this.sheet.properties || !this.sheet.properties.sheetId) {
      throw "Can't find properties for sheet.";
    }
    return this.sheet.properties.sheetId;
  }

  sheetName(): string {
    if (!this.sheet.properties || !this.sheet.properties.title) {
      throw "Can't find properties for sheet.";
    }
    return this.sheet.properties.title;
  }

  public async addRow(rowIndex: number, row: string[]) {
    // Insert a new empty row
    const range = {
      sheetId: this.sheetId(),
      dimension: "ROWS",
      startIndex: rowIndex - 1,
      endIndex: rowIndex
    };
    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId: this.spreadsheetId,
      requestBody: { requests: [{ insertDimension: { range } }] }
    });

    // Fill in the new row
    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: `${this.sheetName()}!A${rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] }
    });
  }

  public async nextAvailableId(): Promise<number> {
    const idData = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: "צינזורים!A2:A"
    });
    if (!idData.data.values) {
      throw "Couldn't load the id column";
    }
    const idArrayOfArrays: number[][] = idData.data.values;
    const idArray: number[] = [].concat
      .apply([], idArrayOfArrays)
      .map((id: string) => parseInt(id));
    const idSet = new Set(idArray);
    const maxId = Math.max(...idArray);
    for (let i = 1; i < maxId; i++) {
      if (!idSet.has(i)) return i;
    }
    return maxId + 1;
  }
}
