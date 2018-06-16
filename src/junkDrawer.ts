import fs from "fs";
import readline from "readline";
import request from "request";
import { Stream } from "stream";

export function readFile(path: string): Promise<any> {
  return new Promise(function(resolve, reject) {
    fs.readFile(path, function(err: Error, content: any) {
      if (err) reject(err);
      else resolve(content);
    });
  });
}

export function writeFile(path: string, data: any): Promise<null> {
  return new Promise(function(resolve, reject) {
    fs.writeFile(path, data, function(err: Error) {
      if (err) reject(err);
      else resolve();
    });
  });
}

export function fileExists(path: string): Promise<boolean> {
  return new Promise(function(resolve, reject) {
    fs.stat(path, function(err: Error, stats: any) {
      if (err) resolve(false);
      else resolve(stats.isFile());
    });
  });
}

export function deleteFile(path: string): Promise<null> {
  return new Promise(function(resolve, reject) {
    fs.unlink(path, function(err: Error) {
      if (err) reject(err);
      else resolve();
    });
  });
}

export async function downloadToFile(url: string, file: string): Promise<any> {
  return new Promise(function(resolve, reject) {
    const stream = request(url).pipe(fs.createWriteStream(file));
    stream.on("finish", function(err) {
      if (err) reject(err);
      else resolve();
    });
  });
}

export function readLine(question: string): Promise<string> {
  return new Promise(function(resolve, reject) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question(question, function(answer: string) {
      rl.close();
      resolve(answer);
    });
  });
}

export function minBy<T>(array: T[], value: (_: T) => number): T | undefined {
  if (array.length == 0) {
    return;
  }
  let minValue = value(array[0]);
  let minIndex = 0;
  for (let i = 1; i < array.length; i++) {
    const val = value(array[i]);
    if (val < minValue) {
      minValue = val;
      minIndex = i;
    }
  }
  return array[minIndex];
}

export function maxBy<T>(array: T[], value: (_: T) => number): T | undefined {
  return minBy(array, x => -value(x));
}

export function flatten<T>(arrayOfArrays: T[][]): T[] {
  return [].concat.apply([], arrayOfArrays);
}

export function zip<T, S>(a1: T[], a2: S[]): [T, S][] {
  let res: [T, S][] = [];
  a1.forEach((t, idx) => {
    if (idx >= a2.length) {
      return;
    }
    const s = a2[idx];
    res.push([t, s]);
  });
  return res;
}

export function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}
