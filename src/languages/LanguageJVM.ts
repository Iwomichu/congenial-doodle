import { Language, Pattern } from './Language';

// przeladowanie Language, potrzebny mechanizm wykluczania z dependencji importow wewnetrznych
interface PatternJVM extends Pattern {
  package: RegExp;
  ignoredPackages?: RegExp[];
}

export class LanguageJVM extends Language {
  patterns: PatternJVM[];

  constructor(name: string, patterns: PatternJVM[], extension: string) {
    super(name, patterns, extension);
    this.patterns = patterns;
  }

  resolveExternalDependencies(fileContent: string[]) {
    const packageString =
      fileContent.filter(line =>
        this.patterns.some(pattern => pattern.package.test(line)),
      )[0] || '$PLACEHOLDER$';
    const internalDependencyRegex = new RegExp(`^${packageString}.+`);
    const dependencies = super.resolveExternalDependencies(fileContent);
    const externalDependencies = dependencies.filter(
      dependency => !internalDependencyRegex.test(dependency),
    );
    const ignoreRegexes = this.patterns
      .map(pattern => {
        if (pattern.ignoredPackages) return pattern.ignoredPackages;
        else return [];
      })
      .filter(regex => regex)
      .flat();
    return externalDependencies.filter(depencency =>
      ignoreRegexes.every(ignoreRegex => ! ignoreRegex.test(depencency)),
    );
  }
}
