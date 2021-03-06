export class Language {
  name: string;
  patterns: Pattern[];
  extension: string;

  constructor(name: string, patterns: Pattern[], extension: string) {
    this.name = name;
    this.patterns = patterns;
    this.extension = extension;
  }
  processLines(lines: string[], pattern: Pattern): string[] {
    return lines
      .map(line => pattern.import.exec(line))
      .map(line => {
        if (line && pattern.dependency.test(line[1])) return line[1];
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
        .map((lines, index) => this.processLines(lines, this.patterns[index]))
        .flat()
        .filter(Boolean);
    } catch (err) {
      console.log(err);
      return [];
    }
  }
}

export interface Pattern {
  import: RegExp; // regex with first capturing group on dependency path
  dependency: RegExp;
}
