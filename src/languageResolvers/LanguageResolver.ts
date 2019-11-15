export interface LanguageResolver {
  extension: string;

  getDependencies(fileContent: string[]): string[];
}
