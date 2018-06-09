import fs from "fs";
import readline from "readline";

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
