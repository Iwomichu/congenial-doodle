export class Commit {
  hash: string;
  author_name: string;
  url: string;

  protected constructor(hash: string, author_name: string, url: string) {
    this.hash = hash;
    this.author_name = author_name;
    this.url = url;
  }

  public static map(obj: any) {
    return new Commit(obj.hash, obj.author_name, obj.url);
  }

  public static fromGetCommit(obj: any) {
    return Commit.map({
      hash: obj.sha,
      author_name: obj.commit.author.name,
      url: obj.url,
    });
  }

  public static fromCommitSearch(obj: any) {
    return Commit.map({
      hash: obj.sha,
      author_name: obj.commit.author.name,
      url: obj.url,
    });
  }
}
