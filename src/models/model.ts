import { Schema, SchemaDefinition, model as MongooseModel } from "mongoose";

export abstract class Model<T> extends Schema<T> {
    constructor(definition: SchemaDefinition<T>, public collection: string) {
        super(definition);
        this.set('versionKey', false)
    }

    get model() {
        const mongooseModel = MongooseModel<T>(this.collection, this);
        mongooseModel.schema.set("toObject", {
            transform: (doc, ret) => {
                delete ret.__v;
                return ret
            }
        })

        return mongooseModel
    }

}