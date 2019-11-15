export class Repository {
  id: Number;
  name: String;
  full_name: String;

  constructor(id: Number, name: String, path: String) {
    this.id = id;
    this.name = name;
    this.full_name = path;
    // this.topics = topics;
  }
}
