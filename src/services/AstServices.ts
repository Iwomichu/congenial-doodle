import { readFileSync } from 'fs';
import { parse } from 'acorn';
export class AstServices {
  parseFromFile(filepath: string) {
    const file = readFileSync(filepath);
    const tree = parse(file.toString());
  }

  async parseFromFileAsync(filepath: string) {
    return new Promise((resolve, reject) => {
      try {
        resolve(this.parseFromFile(filepath));
      } catch (err) {
        reject(err);
      }
    });
  }

  async parse(content: string) {
    return parse(content);
  }
}
