import { ControllerInfo } from './controller-scanner';

// Tableau qui contiendra tous les contrôleurs
const Controllers: ControllerInfo[] = [];

export default Controllers;

// Si vous avez besoin d'initialiser le scanner et lancer l'analyse au démarrage:
/*
import { ControllerScanner } from './ControllerScanner';

// Initialiser le scanner
const scanner = new ControllerScanner();

// Lancer l'analyse et ajouter les contrôleurs trouvés au tableau
scanner.scanControllers();
*/