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

let api = {
  'speech': null
}

if (isSupported()) {
  const synthesiser = new SpeechSynthesiser(getVoices()[0])
  api.speech = {
    'synthesiser': synthesiser,
    'voices': getVoices
  }
}

window.h5p = api

export default api

/**
 * DOM representation of HTML select element.
 * @external HTMLSelectElement
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLSelectElement|HTMLSelectElement}
 */
