export class NpmResponse {
  name: string;
  versions: Map<string, Version>;

  constructor(name: string, versions: Map<string, Version>) {
    this.name = name;
    this.versions = versions;
  }

  static map(obj: any) {
    let versionsRaw = new Map<string, Version>();
    Object.entries(obj.versions).forEach((entry: [string, any]) =>
      versionsRaw.set(
        entry[0],
        new Version(
          entry[1].name,
          entry[1].description,
          entry[1].version,
          entry[1].keywords,
        ),
      ),
    );
    return new NpmResponse(obj.any, versionsRaw);
  }
}

class Version {
  name: string;
  description: string;
  version: string;
  keywords: string[];

  constructor(
    name: string,
    description: string,
    version: string,
    keywords: string[],
  ) {
    this.name = name;
    this.description = description;
    this.version = version;
    this.keywords = keywords;
  }
}
