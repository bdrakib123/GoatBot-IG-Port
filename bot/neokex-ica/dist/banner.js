/**
 * @module banner
 * CLI startup banner for ica-neokex.
 *
 * @author NeoKEX (https://github.com/NeoKEX)
 * @license MIT
 */
const C = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};
class Banner {
    showSimple(version = '1.0.0') {
        const { bright, dim, green, yellow, cyan, reset } = C;
        console.log('');
        console.log(`${cyan}${bright}┌────────────────────────────────────────────────┐${reset}`);
        console.log(`${cyan}${bright}│${reset}  ${green}${bright}ICA-NEOKEX${reset}  ${dim}Instagram Chat API${reset}          ${cyan}${bright}│${reset}`);
        console.log(`${cyan}${bright}│${reset}  ${yellow}v${version}${reset}  •  ${green}Ready${reset}  •  ${dim}github.com/NeoKEX${reset}  ${cyan}${bright}│${reset}`);
        console.log(`${cyan}${bright}└────────────────────────────────────────────────┘${reset}`);
        console.log('');
    }
    showFull(version = '1.0.0', methodCount = 0) {
        const { bright, dim, green, yellow, blue, magenta, cyan, reset } = C;
        console.log('');
        console.log(`${cyan}${bright}╔══════════════════════════════════════════════════════════════╗${reset}`);
        console.log(`${cyan}${bright}║${reset}                                                              ${cyan}${bright}║${reset}`);
        console.log(`${cyan}${bright}║${reset}   ${green}${bright}█ █▀▀ ▄▀█     █▄ █ █▀▀ █▀█ █▄▀ █▀▀ ▀▄▀${reset}              ${cyan}${bright}║${reset}`);
        console.log(`${cyan}${bright}║${reset}   ${green}${bright}█ █▄▄ █▀█  ▄  █ ▀█ ██▄ █▄█ █ █ ██▄ █ █${reset}              ${cyan}${bright}║${reset}`);
        console.log(`${cyan}${bright}║${reset}                                                              ${cyan}${bright}║${reset}`);
        console.log(`${cyan}${bright}║${reset}   ${yellow}Instagram Chat API${reset} ${dim}v${version}${reset}                              ${cyan}${bright}║${reset}`);
        console.log(`${cyan}${bright}║${reset}   ${dim}by NeoKEX — github.com/NeoKEX${reset}                          ${cyan}${bright}║${reset}`);
        console.log(`${cyan}${bright}║${reset}                                                              ${cyan}${bright}║${reset}`);
        console.log(`${cyan}${bright}╠══════════════════════════════════════════════════════════════╣${reset}`);
        console.log(`${cyan}${bright}║${reset}  ${blue}${bright}Package${reset}                                                    ${cyan}${bright}║${reset}`);
        console.log(`${cyan}${bright}║${reset}     ${dim}├─${reset} Name:        ${green}ica-neokex${reset}                                ${cyan}${bright}║${reset}`);
        console.log(`${cyan}${bright}║${reset}     ${dim}├─${reset} TypeScript:  ${yellow}full support${reset}                            ${cyan}${bright}║${reset}`);
        console.log(`${cyan}${bright}║${reset}     ${dim}├─${reset} Node.js:     ${magenta}>=20.0.0${reset}                                ${cyan}${bright}║${reset}`);
        console.log(`${cyan}${bright}║${reset}     ${dim}└─${reset} Methods:     ${cyan}${methodCount} available${reset}                       ${cyan}${bright}║${reset}`);
        console.log(`${cyan}${bright}║${reset}                                                              ${cyan}${bright}║${reset}`);
        console.log(`${cyan}${bright}║${reset}  ${blue}${bright}Features${reset}                                                   ${cyan}${bright}║${reset}`);
        console.log(`${cyan}${bright}║${reset}     ${green}✓${reset} Direct messaging & group chats                        ${cyan}${bright}║${reset}`);
        console.log(`${cyan}${bright}║${reset}     ${green}✓${reset} Adaptive polling with circuit breaker                 ${cyan}${bright}║${reset}`);
        console.log(`${cyan}${bright}║${reset}     ${green}✓${reset} Photo, video, voice, GIF, carousel                    ${cyan}${bright}║${reset}`);
        console.log(`${cyan}${bright}║${reset}     ${green}✓${reset} Feed, stories, posts, profile management              ${cyan}${bright}║${reset}`);
        console.log(`${cyan}${bright}║${reset}     ${green}✓${reset} Full TypeScript support with .d.ts declarations       ${cyan}${bright}║${reset}`);
        console.log(`${cyan}${bright}║${reset}                                                              ${cyan}${bright}║${reset}`);
        console.log(`${cyan}${bright}╚══════════════════════════════════════════════════════════════╝${reset}`);
        console.log('');
    }
}
export default new Banner();
//# sourceMappingURL=banner.js.map