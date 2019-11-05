import { Repository } from "./Repository";

export class NodeRepository extends Repository{
    dependencies: Dependency[]
    devDependencies: Dependency[]

    constructor(id: Number, name: string, dependencies: Dependency[], devDependencies: Dependency[]){
        super(id, name)
        this.dependencies = dependencies
        this.devDependencies = devDependencies
    }

    public static map(obj: any){
        return new NodeRepository(
            obj.id, 
            obj.name, 
            Object.entries(obj.dependencies).map(entry => new Dependency(entry[0], <string>entry[1])), 
            Object.entries(obj.devDependencies).map(entry => new Dependency(entry[0], <string>entry[1])));
    }
}

class Dependency {
    name: string
    version: string

    constructor(name: string, version: string){
        this.name = name
        this.version = version
    }

    public static map(obj: any){
        return new Dependency(obj.name, obj.version)
    }
}