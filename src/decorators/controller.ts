import "reflect-metadata";

export function Controller(): Function {
    return function (target: any) {
        const basePath = target.name.replace("Controller", "").toLowerCase();
        Reflect.defineMetadata("basePath", basePath, target);
    };
}