import { typeScript } from "./TypeScript";
import { javaScript } from "./JavaScript";
import { Language } from "./Language";

const knownLanguages = new Map<string, Language>()

knownLanguages.set("TYPESCRIPT", typeScript)
knownLanguages.set("JAVASCRIPT", javaScript)

export {knownLanguages}