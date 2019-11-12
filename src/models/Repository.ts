
export class Repository {
    id: Number
    name: String
    path: String

    constructor(id:Number, name:String, path: String){
        this.id = id;
        this.name = name;
        this.path = path
        // this.topics = topics;
    }
}