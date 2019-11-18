import { typeScript } from "./TypeScript";
import { javaScript, npmResolver } from "./JavaScript";
import { Language } from "./Language";
import { java } from "./Java";
import { reject } from "bluebird";

export type keywordResolver = (library: string) => Promise<string[]>
const knownLanguages = new Map<string, Language>()
const keywordResolvers = new Map<string, keywordResolver>()

knownLanguages.set("TYPESCRIPT", typeScript)
knownLanguages.set("JAVASCRIPT", javaScript)
knownLanguages.set('JAVA', java)

keywordResolvers.set("JAVASCRIPT", npmResolver);
keywordResolvers.set("TYPESCRIPT", npmResolver);
keywordResolvers.set("JAVA", (library: string) => new Promise<string[]>((resolve, reject) => resolve([])))

export { knownLanguages, keywordResolvers }