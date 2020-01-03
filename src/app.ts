import {run} from './web'
import window from './window'
window.document.addEventListener('DOMContentLoaded', (event) => {
    const vm = run()
    window.vm = window.vm || vm;
})