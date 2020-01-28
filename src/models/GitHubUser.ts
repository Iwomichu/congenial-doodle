export default class GitHubUser {
  email: string;
  login: string;
  name: string;

  constructor(email: string, login: string, name: string) {
    this.email = email;
    this.login = login;
    this.name = name;
  }

  public static fromGQL(obj: any) {
    return new GitHubUser(obj.email, obj.login, obj.name);
  }
}
