import { Logger, logStates } from "../utils/Logger";
import { InvalidData } from "../utils/HttpError";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";

async function handleRequest(req: any, middleware: any[], dto?: any, propertyKey?: string): Promise<void> {
    for (const mw of middleware) {
        await mw(req, req.res, () => { });
    }

    if (dto) {
        const instance = plainToInstance(dto, req.body);
        const errors = await validate(instance);
        if (errors.length > 0) {
            Logger.log({
                info: logStates.FAIL,
                message: `Erreur de validation sur ${propertyKey}: ${JSON.stringify(errors)}`
            });
            throw new InvalidData();
        }
    }
}


function createHttpMethodDecorator(method: string): Function {
    return function (options: { path?: string, middleware?: any[], schema?: any } = {}) {
        const { path = "", middleware = [], schema } = options;

        return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
            const routes: { path: string; method: string; handler: string; middleware: any[] }[] = Reflect.getMetadata("routes", target) || [];
            routes.push({ path, method, handler: propertyKey, middleware });
            Reflect.defineMetadata("routes", routes, target);

            const originalMethod = descriptor.value;
            descriptor.value = async function (...args: any[]) {
                const req = args[0];
                await handleRequest(req, middleware, schema, propertyKey);
                const basePath = Reflect.getMetadata('basePath', target.constructor)
                Logger.log({
                    info: logStates.REQUEST,
                    message: `${method.toUpperCase()} : ${"/" + basePath + path}`
                });
                return originalMethod.apply(this, args);
            };

            return descriptor;
        };
    };
}

export const Get = createHttpMethodDecorator("get");
export const Post = createHttpMethodDecorator("post");
export const Put = createHttpMethodDecorator("put");
export const Delete = createHttpMethodDecorator("delete");
