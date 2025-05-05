import express, { Express, Request, Response } from "express";
import "reflect-metadata";
import { Logger, logStates } from "../utils/Logger";
import * as fs from 'fs';
import * as path from 'path';

export type HttpMethod = "get" | "post" | "put" | "delete";

export interface ControllerClass {
    new(app: Express): any;
    name: string;
    prototype: any;
}

const controllers: ControllerClass[] = [];

export function registerController(controller: ControllerClass): void {
    controllers.push(controller);
}

export class Server {
    private app: Express;
    private port: number;

    constructor(port: number = 3000) {
        this.app = express();
        this.port = port;

        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));

        this.scanControllers();
    }

    private scanControllers(): void {
        const possibleDirs = ['controller', 'Controller', 'controllers', 'Controllers'];
        let controllersDir = '';

        const srcPath = path.join(process.cwd(), 'src');
        if (fs.existsSync(srcPath)) {
            for (const dir of possibleDirs) {
                const testPath = path.join(srcPath, dir);
                if (fs.existsSync(testPath) && fs.statSync(testPath).isDirectory()) {
                    controllersDir = testPath;
                    break;
                }
            }
        }

        if (controllersDir) {
            try {
                const files = fs.readdirSync(controllersDir);
                files.forEach(file => {
                    if (file.endsWith('.ts') || file.endsWith('.js')) {
                        Logger.log({
                            info: logStates.INFO,
                            message: `Contrôleur trouvé: ${file}`,
                        });
                    }
                });
            } catch (error) {
                Logger.log({
                    info: logStates.FAIL,
                    message: `Erreur lors du scan des contrôleurs: ${error}`,
                });
            }
        }
    }

    start(): void {
        controllers.forEach((controller: ControllerClass) => {
            const instance = new controller(this.app);
            const basePath: string = Reflect.getMetadata(
                "basePath",
                controller
            );

            const routes: { path: string; method: string; handler: string; middleware: any[] }[] =
                Reflect.getMetadata("routes", controller.prototype) || [];

            Logger.log({
                info: logStates.INFO,
                message: `${controller.name} initialisé`,
            });

            routes.forEach(({ path, method, handler, middleware }) => {
                const cleanPath = `/${basePath}${path}`;
                const lowerMethod = method.toLowerCase() as keyof Express;

                if (!(lowerMethod in this.app)) {
                    return Logger.log({
                        info: logStates.FAIL,
                        message: `Méthode HTTP invalide : ${method}`,
                    });
                }

                this.app[lowerMethod](
                    cleanPath,
                    async (req: Request, res: Response) => {
                        try {
                            await (instance as any)[handler](req, res);
                        } catch (error) {
                            Logger.log({
                                info: logStates.FAIL,
                                message: `Erreur ${method} ${cleanPath}: ${error}`,
                            });
                            res.status(500).json({ error: "Internal Server Error" });
                        }
                    }
                );

                Logger.log({
                    info: logStates.INFO,
                    message: `${method.toUpperCase()} : ${cleanPath} init`,
                });
            });
        });

        this.app.listen(this.port, () =>
            Logger.log({
                info: logStates.START,
                message: `Serveur démarré sur http://localhost:${this.port}`,
            })
        );
    }
}

export { controllers };