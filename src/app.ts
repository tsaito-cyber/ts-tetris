import {WebGame} from './web'
declare global {
    interface Window { webgame: any; }
}
window.document.addEventListener('DOMContentLoaded', (event) => {
    const webgame = new WebGame()
    window.webgame = window.webgame|| webgame;
    webgame.run()
})
