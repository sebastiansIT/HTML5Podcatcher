/** The HTML5Podcatcher UI library

    @module  h5p
    @author  Sebastian Spautz [sebastian@human-injection.de]
    @requires module:h5p/speech/synthesis
    @license Copyright 2019 Sebastian Spautz

    This file is part of "HTML5 Podcatcher".

    "HTML5 Podcatcher" is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    any later version.

    "HTML5 Podcatcher" is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see http://www.gnu.org/licenses/.
*/

import { Synthesiser as SpeechSynthesiser, getVoices, isSupported } from './speech/synthesis.js'
import { UiLogAppender } from './utils/logging/uilogger.js'
import { NotificationLogAppender } from './utils/logging/notificationlogger.js'

let api = {
  'speech': null
}

if (isSupported()) {
  const synthesiser = new SpeechSynthesiser()
  api.speech = {
    'synthesiser': synthesiser,
    'voices': getVoices
  }
}

window.h5p = api

// TODO transfer access to settings to an ES6 module
let allowedLevel = 2 // GlobalUserInterfaceHelper.settings.get('logLevel') || 1
switch (allowedLevel) {
  case 1:
    allowedLevel = 'debug'
    break
  case 2:
    allowedLevel = 'info'
    break
  case 2.5:
    allowedLevel = 'note'
    break
  case 3:
    allowedLevel = 'warn'
    break
  case 4:
    allowedLevel = 'error'
    break
  case 5:
    allowedLevel = 'fatal'
    break
}
window.podcatcher.configuration.logging.addLogRule(new UiLogAppender(), allowedLevel)
window.podcatcher.configuration.logging.addLogRule(new NotificationLogAppender(), 'note', 'note')

export default api
