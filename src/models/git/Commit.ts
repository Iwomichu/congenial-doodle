export class Commit {
  hash: string;
  author_name: string;

  protected constructor(hash: string, author_name: string) {
    this.hash = hash;
    this.author_name = author_name;
  }

  public static map(obj: any) {
    return new Commit(obj.hash, obj.author_name);
  }
}
