/**
 * @module logger
 * Colored, timestamped console logger.
 *
 * @author NeoKEX (https://github.com/NeoKEX)
 * @license MIT
 */
const COLORS = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
};
class Logger {
    constructor(prefix = 'ica-neokex') {
        this.prefix = prefix;
    }
    timestamp() {
        const now = new Date();
        return [now.getHours(), now.getMinutes(), now.getSeconds()]
            .map((n) => String(n).padStart(2, '0'))
            .join(':');
    }
    format(level, color, message, data) {
        const { bright, dim, cyan, reset } = COLORS;
        let out = `${dim}[${this.timestamp()}]${reset} ${color}${bright}[${level}]${reset} ${cyan}${this.prefix}${reset} › ${message}`;
        if (data !== undefined && data !== null) {
            out += `\n${dim}${JSON.stringify(data, null, 2)}${reset}`;
        }
        return out;
    }
    info(message, data) { console.log(this.format('INFO', COLORS.blue, message, data)); }
    success(message, data) { console.log(this.format('SUCCESS', COLORS.green, message, data)); }
    warn(message, data) { console.warn(this.format('WARN', COLORS.yellow, message, data)); }
    error(message, data) { console.error(this.format('ERROR', COLORS.red, message, data)); }
    debug(message, data) { console.log(this.format('DEBUG', COLORS.magenta, message, data)); }
    event(message, data) { console.log(this.format('EVENT', COLORS.cyan, message, data)); }
    session(message) { console.log(this.format('SESSION', COLORS.green, message)); }
    login(username) {
        const { green, bright, cyan, reset } = COLORS;
        console.log(this.format('LOGIN', green, `Authenticated as ${cyan}${bright}${username}${reset}`));
    }
    message(from, preview) {
        const { bright, dim, reset } = COLORS;
        const short = preview.length > 50 ? `${preview.substring(0, 50)}…` : preview;
        console.log(this.format('MESSAGE', COLORS.cyan, `From ${bright}${from}${reset} › ${dim}${short}${reset}`));
    }
    custom(level, color, message, data) {
        console.log(this.format(level, COLORS[color], message, data));
    }
}
export default new Logger();
//# sourceMappingURL=logger.js.map