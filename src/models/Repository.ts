export class Repository {
  id: Number;
  name: string;
  path: string;
  url: string;

  protected constructor(id: Number, name: string, path: string, url: string) {
    this.id = id;
    this.name = name;
    this.path = path;
    this.url = url;
    // this.topics = topics;
  }

  static map(obj: any) {
    return new Repository(obj.id, obj.name, obj.path, obj.url);
  }
}
