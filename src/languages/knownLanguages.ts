import { typeScript, typeScriptGitDiff } from './TypeScript';
import { javaScript, npmResolver } from './JavaScript';
import { Language } from './Language';
import { java } from './Java';
import { reject } from 'bluebird';

export type keywordResolver = (library: string) => Promise<string[]>;
const knownLanguages = new Map<string, Language>();
const knownGitDiffLanguages = new Map<string, Language>();
const knownGitDiffExtensions = new Map<string, Language>();
const keywordResolvers = new Map<string, keywordResolver>();
const knownExtensions = new Map<string, Language>();

knownLanguages.set('TYPESCRIPT', typeScript);
knownLanguages.set('JAVASCRIPT', javaScript);
knownLanguages.set('JAVA', java);

knownExtensions.set('js', javaScript);
knownExtensions.set('ts', typeScript);

knownGitDiffLanguages.set('TYPESCRIPT', typeScriptGitDiff);

knownGitDiffExtensions.set(typeScriptGitDiff.extension, typeScriptGitDiff);

keywordResolvers.set('JAVASCRIPT', npmResolver);
keywordResolvers.set('TYPESCRIPT', npmResolver);
keywordResolvers.set(
  'JAVA',
  (library: string) => new Promise<string[]>((resolve, reject) => resolve([])),
);

export {
  knownLanguages,
  knownExtensions,
  keywordResolvers,
  knownGitDiffExtensions,
  knownGitDiffLanguages,
};
