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

/**
  * A promise fulfilled when a text is spoken.
  *
  * @promise SpeakPromise
  * @fulfill {undefined} Fulfill empty when a text is spoken.
  * @reject {external:String} A {@link https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisErrorEvent/error|error code} from the Web Speech API.
  * @reject {external:Error} A Error if no offline avaliable voice is installed.
  */

/** Logger
  * @constant {module:podcatcher/utils/logging.Logger}
  * @private
  */
const LOGGER = window.podcatcher.utils.createLogger('h5p/speech/synthesis')

/**
  * Returns true if the {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API|Web Speech API} ist supported by this platform.
  * @static
  * @returns {boolean} True if the Web Speech API is supported by this platform.
  */
export function isSupported () {
  return !!window.speechSynthesis
}

/**
  * Returns a list of voices for the Web Speech API.
  * If the usage policy is Offline only offline available voices are returned.
  * If the policy is set to Disabled no voice is returned.
  * @static
  * @returns {external:SpeechSynthesisVoice[]} Voices that are available.
  */
export function getVoices () {
  if (isSupported) {
    if (usagePolicy === USAGE_POLICIES.NONE) {
      LOGGER.info('Speech synthesis is disabled.')
      return []
    }
    const allVoices = window.speechSynthesis.getVoices()
    let voices = []
    for (let i = 0; i < allVoices.length; i++) {
      const voice = allVoices[i]
      if (usagePolicy === USAGE_POLICIES.LOCAL && !voice.localService) {
        continue
      }
      voices.push(voice)
    }
    return voices.sort(voiceComparator)
  } else {
    throw new Error('Speech Synthesis isn\'t supported by this platform.')
  }
}

/** Possible policies for usage of the speech synthesis API.
  * @readonly
  * @enum {external:String}
  */
export const USAGE_POLICIES = {
  /** Speech synthesis disabled. */
  NONE: 'none',
  /** Speech synthesis is only used when local voices are available. */
  LOCAL: 'local only',
  /** Speech synsthesis is used with online voices. */
  REMOTE: 'remote allowed'
}
/** Actual policy for usage of the speech synthesis API.
  * @private
  * @type {USAGE_POLICIES}
  */
let usagePolicy = USAGE_POLICIES.LOCAL
/** Set a new usage policy.
  * @param {USAGE_POLICIES} [policy=USAGE.POLICIES.LOCAL] The new policy.
  * @returns {undefined}
  */
export function setUsagePolicy (policy) {
  if (policy) {
    usagePolicy = policy
  } else {
    usagePolicy = USAGE_POLICIES.LOCAL
  }
}
export function getUsagePolicy () {
  return usagePolicy
}

/** A Speech synthesiser.
  * @class
  * @param {external:String[]} [favoriteVoiceNames=[]] Name of voices to favorize speaking a text.
  * @param {number} [rate=1] Rate to speak a text width.
  * @param {number} [pitch=1] Pitch to speak a text width.
  * @param {number} [volume=1] The volume to speak. A number between 0 and 1.
  */
export class Synthesiser {
  /**
    * @constructs
    */
  constructor (favoriteVoiceNames, rate, pitch, volume) {
    if (isSupported) {
      this.favoriteVoices = favoriteVoiceNames || []
      this.rate = rate || 1
      this.pitch = pitch || 1
      this.volume = volume || 1
    } else {
      throw new Error('Speech synthesis isn\'t supported by this platform.')
    }
  }

  /** Pitch for the speech synthesis.
    * A floating number in the range from 0 to 2.
    * @property pitch
    * @type {number}
    */
  set pitch (value) {
    // TODO check number
    // TODO check range 0 to 2
    this._pitch = value
  }
  get pitch () {
    return this._pitch
  }

  /** Rate for the speech synthesis.
    * A floating number in the range from 0.1 to 10.
    * @property rate
    * @type {number}
    */
  set rate (value) {
    // TODO check number
    // TODO check range 0.1 to 10
    this._rate = value
  }
  get rate () {
    return this._rate
  }

  /** Volume for the speech synthesis.
    * A floating number in the range from 0 to 1.
    * @property volume
    * @type {number}
    */
  set volume (value) {
    // TODO check number
    // TODO check range 0 to 1
    this._volume = value
  }
  get volume () {
    return this._volume
  }

  /** Favorite voices for the speech synthesis.
    * @property favoriteVoices
    * @type {string[]}
    */
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
    * @returns {SpeakPromise} A Promise that fulfill empty when the given text is spoken.
    */
  speak (text, lang) {
    lang = lang || 'en'

    // Select a voice for the given language
    const voices = getVoices()
    let selectedVoice = null
    for (let i = 0; i < voices.length; i++) {
      const voice = voices[i]
      if (voice.lang.indexOf(lang) === 0) {
        selectedVoice = voice
        if (this.favoriteVoices.includes(voice.name)) {
          break
        }
      }
    }

    if (selectedVoice) {
      const synthesiser = window.speechSynthesis
      const utterance = new SpeechSynthesisUtterance(text)

      utterance.voice = selectedVoice
      utterance.pitch = this.pitch
      utterance.rate = this.rate
      utterance.volume = this.volume
      return new Promise((resolve, reject) => {
        utterance.addEventListener('error', (/* SpeechSynthesisErrorEvent */event) => {
          LOGGER.error(`An error has occurred with the speech synthesis: ${event.error}`)
          reject(event.error)
        })
        utterance.addEventListener('end', (/* SpeechSynthesisEvent */event) => {
          LOGGER.debug(`Utterance has finished being spoken after ${event.elapsedTime} milliseconds.`)
          resolve()
        })
        synthesiser.speak(utterance)
        LOGGER.debug(`Speech text with voice ${utterance.voice.name}, pith ${utterance.pitch}, volume ${Math.floor(utterance.volume * 100)}% and rate ${Math.floor(utterance.rate * 100)}%.`)
      })
    } else {
      if (usagePolicy !== USAGE_POLICIES.NONE) {
        const error = new Error(`No usable voices installed for language ${lang}.`)
        LOGGER.warn(error.message)
        return Promise.reject(error)
      } else {
        return Promise.resolve()
      }
    }
  }
}

/** Comperate voices based on there names.
  * @private
  * @param {external:SpeechSynthesisVoice} first The first voice to compare.
  * @param {external:SpeechSynthesisVoice} second The second voice to compare.
  * @returns {number} -1 if name of the first voice is lexicographical smaller than
  *   the second. Zero if both names are identical. 0 otherwise.
  */
function voiceComparator (first, second) {
  if (first.name < second.name) {
    return -1
  } else if (first.name === second.name) {
    return 0
  } else {
    return 1
  }
}
