import { GameWeb } from './web'
import window from './window'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
window.document.addEventListener('DOMContentLoaded', (event) => {
  const game = <GameWeb />;
  ReactDOM.render(game, window.document.getElementById('app'));
  window.game = window.game || game;
})
