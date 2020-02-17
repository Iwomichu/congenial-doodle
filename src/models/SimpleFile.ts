export default class SimpleFile {
  name: string;
  path: string;
  content: string;

  constructor(name: string, path: string, content: string) {
    this.name = name;
    this.path = path;
    this.content = content;
  }
}
