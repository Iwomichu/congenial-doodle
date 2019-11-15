export class Language {
  name: string;
  patterns: Pattern[];
  extension: string;

  constructor(name: string, patterns: Pattern[], extension: string) {
    this.name = name;
    this.patterns = patterns;
    this.extension = extension;
  }
  processLine(lines: string[], pattern: Pattern): string[] {
    return lines
      .map(line => pattern.import.exec(line))
      .map(line => {
        if (line && pattern.externalDependency.test(line[1])) return line[1];
        else return '';
      });
  }
  resolveExternalDependencies(fileContent: string[]) {
    let matches: string[][] = [];
    try {
      this.patterns.forEach(pattern =>
        matches.push(fileContent.filter(line => pattern.import.test(line))),
      );
      return matches
        .map((lines, index) => this.processLine(lines, this.patterns[index]))
        .flat();
    } catch (err) {
      console.log(err);
      return [];
    }
  }
}

export interface Pattern {
  import: RegExp;
  externalDependency: RegExp;
}
