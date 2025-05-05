export const logStates = {
    START: "start",
    SUCCESS: "success",
    INFO: "info",
    WARN: "warn",
    FAIL: "fail",
    REQUEST: "request",
} as const;

type LogState = typeof logStates[keyof typeof logStates];

interface logData {
    info: LogState,
    message: string
}

type Color = "31" | "32" | "33" | "34" | "36" | "37";

export class Logger {
    static info(message: string) {
        this.log({
            info: logStates.INFO,
            message,
        })
    }
    static error(error: unknown) {
        this.log({
            info: logStates.INFO,
            message: String(error),
        })
    }
    static log({ info, message }: logData): void {
        const timestamp = new Date().toLocaleString();
        const color = this.getColor(info);
        console.log(`\x1b[${color}m[${timestamp}] [${info.toUpperCase()}] : ${message}\x1b[0m`);
    }

    static getColor(info: LogState): Color {
        switch (info) {
            case logStates.START: return "34";
            case logStates.SUCCESS: return "32";
            case logStates.INFO: return "36";
            case logStates.WARN: return "33";
            case logStates.FAIL: return "31";
            default: return "37";
        }
    }
}
