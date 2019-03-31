/** Implements functions for speech synthesis.

    @module  h5p/speech/synthesis
    @author  Sebastian Spautz [sebastian@human-injection.de]
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
/**
 * Voice object for the Speech API
 * @external SpeechSynthesisVoice
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice|SpeechSynthesisVoice}
 */
/* global SpeechSynthesisUtterance */

export function isSupported () {
  return !!window.speechSynthesis
}

export function getVoices () {
  if (isSupported) {
    return window.speechSynthesis.getVoices()
  } else {
    throw new Error('Speech Synthesis isn\'t supported by this platform.')
  }
}

/** A Speech synthesiser.
  * @class
  * @param {external:String[]} [favoriteVoiceNames=[]] Name of voices to favorize speaking a text.
  * @param {number} [rate=1] Rate to speak a text width.
  * @param {number} [pitch=1] Pitch to speak a text width.
  */
export class Synthesiser {
  constructor (favoriteVoiceNames, rate, pitch) {
    if (isSupported) {
      this.favoriteVoices = favoriteVoiceNames || []
      this.rate = rate || 1
      this.pitch = pitch || 1
    } else {
      throw new Error('Speech synthesis isn\'t supported by this platform.')
    }
  }

  set pitch (value) {
    // TODO check number
    // TODO check range 0 to 2
    this._pitch = value
  }
  get pitch () {
    return this._pitch
  }

  set rate (value) {
    // TODO check number
    // TODO check range 0.1 to 10
    this._rate = value
  }
  get rate () {
    return this._rate
  }

  set favoriteVoices (favoriteVoiceNames) {
    // TODO check Array
    // TODO check String-Items
    this._favoriteVoices = favoriteVoiceNames
  }
  get favoriteVoices () {
    return this._favoriteVoices
  }

  /** Speak a text in the given language.
    * @param {external:String} text Text to speak
    * @param {external:String} [lang=en] Language to speak in.
    * @returns {undefined}
    */
  speak (text, lang) {
    const synthesiser = window.speechSynthesis
    const utterance = new SpeechSynthesisUtterance(text)

    lang = lang || 'en'

    // Select Voice for the given language
    for (let i = 0; i < getVoices().length; i++) {
      const voice = getVoices()[i]
      if (voice.localService) {
        if (voice.lang.indexOf(lang) === 0) {
          utterance.voice = voice
          if (this.favoriteVoices.includes(voice.name)) {
            break
          }
        }
      }
    }
    utterance.pitch = this.pitch
    utterance.rate = this.rate
    synthesiser.speak(utterance)
  }
}
