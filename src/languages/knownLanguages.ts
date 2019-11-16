import { typeScript } from "./TypeScript";
import { javaScript } from "./JavaScript";
import { Language } from "./Language";
import { java } from "./Java";

const knownLanguages = new Map<string, Language>()

knownLanguages.set("TYPESCRIPT", typeScript)
knownLanguages.set("JAVASCRIPT", javaScript)
knownLanguages.set('JAVA', java)

export {knownLanguages}