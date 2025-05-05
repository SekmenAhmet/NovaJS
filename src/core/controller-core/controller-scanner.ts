import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import Controllers from './index';

export interface ControllerInfo {
    name: string;
    filePath: string;
    methods: string[];
}

export class ControllerScanner {
    private rootPath: string;
    private possibleControllerDirNames = ['controller', 'Controller', 'controllers', 'Controllers'];

    constructor() {
        this.rootPath = process.cwd();
    }

    private findControllerFiles(): string[] {
        const srcPath = path.join(this.rootPath, 'src');
        const controllerFiles: string[] = [];

        try {
            if (!fs.existsSync(srcPath) || !fs.statSync(srcPath).isDirectory()) {
                console.error('src directory not found in project root');
                return [];
            }

            let controllerDirPath = null;

            for (const dirName of this.possibleControllerDirNames) {
                const testPath = path.join(srcPath, dirName);
                if (fs.existsSync(testPath) && fs.statSync(testPath).isDirectory()) {
                    controllerDirPath = testPath;
                    break;
                }
            }

            if (!controllerDirPath) {
                console.error('No controller directory found in src/');
                return [];
            }

            const files = fs.readdirSync(controllerDirPath);

            for (const file of files) {
                const filePath = path.join(controllerDirPath, file);
                if (fs.statSync(filePath).isFile() &&
                    (file.endsWith('.ts') || file.endsWith('.js'))) {
                    controllerFiles.push(filePath);
                }
            }

            return controllerFiles;
        } catch (error) {
            console.error(`Error finding controller files: ${error}`);
            return [];
        }
    }

    private extractClasses(filePath: string): ControllerInfo[] {
        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const sourceFile = ts.createSourceFile(
                filePath,
                fileContent,
                ts.ScriptTarget.Latest,
                true
            );

            const controllers: ControllerInfo[] = [];

            const visitNode = (node: ts.Node) => {
                if (ts.isClassDeclaration(node) && node.name) {
                    const className = node.name.text;

                    // Vérification si c'est un contrôleur par nom
                    let isController = className.includes('Controller');

                    // Si la classe a des décorateurs, vérifier s'ils contiennent "Controller"
                    if (!isController && node.modifiers) {
                        const decorators = node.modifiers.filter(ts.isDecorator);
                        isController = decorators.some(decorator => {
                            const decoratorText = decorator.getText(sourceFile);
                            return decoratorText.includes('Controller') || decoratorText.includes('controller');
                        });
                    }

                    if (isController) {
                        const methods: string[] = [];

                        node.members.forEach(member => {
                            if (ts.isMethodDeclaration(member) && member.name) {
                                if (ts.isIdentifier(member.name)) {
                                    methods.push(member.name.text);
                                }
                            }
                        });

                        controllers.push({
                            name: className,
                            filePath,
                            methods
                        });
                    }
                }

                ts.forEachChild(node, visitNode);
            };

            visitNode(sourceFile);
            return controllers;

        } catch (error) {
            console.error(`Error analyzing file ${filePath}: ${error}`);
            return [];
        }
    }

    public scanControllers(): ControllerInfo[] {
        const controllerFiles = this.findControllerFiles();

        if (controllerFiles.length === 0) {
            console.error('No controller files found');
            return [];
        }

        console.log(`Found ${controllerFiles.length} controller files`);

        const allControllers: ControllerInfo[] = [];

        for (const filePath of controllerFiles) {
            const controllers = this.extractClasses(filePath);
            allControllers.push(...controllers);
        }

        // Ajouter tous les contrôleurs trouvés dans le tableau Controllers de index
        for (const controller of allControllers) {
            // Vérifier si le contrôleur existe déjà dans le tableau
            const existingController = Controllers.find(c => c.name === controller.name);
            if (!existingController) {
                Controllers.push(controller);
            }
        }

        return allControllers;
    }
}