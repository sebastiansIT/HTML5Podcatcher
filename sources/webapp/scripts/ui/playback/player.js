/** Audio Player

    @module  h5p
    @author  Sebastian Spautz [sebastian@human-injection.de]
    @requires module:h5p/playback/player
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
/* global HTMLMediaElement MediaMetadata */
/* global POD UI */

const LOGGER = window.podcatcher.utils.createLogger('hp5/playback/player')
const SKIP_TIME = 10

/** Creates a HTML-Audio-Element.
  * @return {Promise} A promise fullfiled with the created HTML-Audio-Element.
  */
function generateAudioElement () {
  LOGGER.debug('Audio element will be created')
  return window.podcatcher.configuration.settings.get('playbackRate', 1)
    .then((playbackRate) => {
      const mediaElement = document.createElement('audio')
      mediaElement.setAttribute('controls', 'controls')
      mediaElement.setAttribute('preload', 'metadata')
      mediaElement.defaultPlaybackRate = playbackRate
      const sourceElement = document.createElement('source')
      sourceElement.setAttribute('src', '')
      mediaElement.appendChild(sourceElement)

      LOGGER.debug('Audio element is created')

      return mediaElement
    })
}

/** Announce a Episode via speach synthesis.
  * @param {Episode} episode The podcast episode that should be announced.
  * @returns {external:Promise} A promise
  */
function announceEpisode (episode) {
  return Promise.all([
    window.podcatcher.configuration.settings.get('speechSynthesisFavoriteVoices', ''),
    window.podcatcher.configuration.settings.get('speechSynthesisRate', 1),
    window.podcatcher.configuration.settings.get('speechSynthesisPitch', 1)
  ])
    .then(([favorites, rate, pitch]) => {
      window.h5p.speech.synthesiser.favoriteVoices = favorites.split(',')
      window.h5p.speech.synthesiser.rate = rate
      window.h5p.speech.synthesiser.pitch = pitch
    })
    .then(() => window.h5p.speech.synthesiser.speak(`${episode.title} by ${episode.source}`, episode.language))
    .catch((errorCodeOrError) => {
      if (errorCodeOrError.message) { // rejected with an Error
        LOGGER.warn(errorCodeOrError.message)
      } else { // rejected with an errorCode from the Web Speech API
        LOGGER.warn(`Speech synthesis has thrown an error: ${errorCodeOrError}.`)
      }
      throw errorCodeOrError
    })
}

export class Player {
  constructor () {
    this.audioElement = null
    this.activeEpisode = null
  }

  /** Eventlistner updating the episodes playback state every ten seconds.
    * @listens Timeupdate
    * @private
    * @param {external:Event} event - The timeupdate event.
    * @returns undefined
    */
  timeupdateEventListener (event) {
    LOGGER.debug(`Timecode is changed to ${UI.formatTimeCode(this.activeEpisode.playback.currentTime)}.`)
    if (this.activeEpisode &&
        (event.target.currentTime > (this.activeEpisode.playback.currentTime + 10) ||
        event.target.currentTime < (this.activeEpisode.playback.currentTime - 10))) {
      this.activeEpisode.playback.currentTime = Math.floor(event.target.currentTime / 10) * 10
      POD.storage.writeEpisode(this.activeEpisode)
    }
  }

  init (playlist) {
    this.playlist = playlist
    return generateAudioElement()
      .then((audioElement) => {
        this.audioElement = audioElement

        // Bind event handler for the audio element
        this.audioElement.addEventListener('loadstart', () => {
          LOGGER.debug(`Start loading ${this.activeEpisode.title}.`)
        }, false)
        this.audioElement.addEventListener('loadedmetadata', () => {
          LOGGER.debug(`Load metadata of ${this.activeEpisode.title}.`)
        }, false)
        this.audioElement.addEventListener('canplay', () => {
          LOGGER.debug(`Episode ${this.activeEpisode.title} is ready to start playback.`)
        }, false)
        this.audioElement.addEventListener('canplaythrough', () => {
          LOGGER.debug(`Episode ${this.activeEpisode.title} can play through.`)
        }, false)
        this.audioElement.addEventListener('playing', (event) => {
          if ('mediaSession' in navigator) {
            LOGGER.info(`${this.activeEpisode.title} is playing.`)
          } else {
            LOGGER.note(`${this.activeEpisode.title} is playing.`)
          }
          event.target.autoplay = true
          event.target.dataset.autoplay = 'enabled'
        }, false)
        this.audioElement.addEventListener('pause', () => {
          LOGGER.debug(`Episode ${this.activeEpisode.title} is paused.`)
        }, false)
        this.audioElement.addEventListener('ended', () => {
          LOGGER.debug(`Episode ${this.activeEpisode.title} is at it's end.`)
          POD.toggleEpisodeStatus(this.activeEpisode)
          // Announce next Episode in Playlist and start playback
          this.playNextEpisode()
        }, false)
        const errorEventListener = (event) => {
          const readystate = event.target.parentNode.readyState
          const networkstate = event.target.parentNode.networkState
          let errormessage = `Error while playback audio file. Networkstate: ${networkstate}; ReadyState: ${readystate}.`
          if (networkstate === HTMLMediaElement.NETWORK_NO_SOURCE) {
            errormessage = `There is no valid source for ${this.activeEpisode.title}. You try ${this.activeEpisode.mediaUrl} of type ${this.activeEpisode.mediaType}.`
          } else if (readystate === HTMLMediaElement.HAVE_NOTHING) {
            errormessage = `Can't load file ${event.target.parentNode.currentSrc}.`
          } else if (event.target.parentNode.error) {
            switch (event.target.error.code) {
              case event.target.error.MEDIA_ERR_ABORTED:
                errormessage = 'You aborted the media playback.'
                break
              case event.target.error.MEDIA_ERR_NETWORK:
                errormessage = 'A network error caused the audio download to fail.'
                break
              case event.target.error.MEDIA_ERR_DECODE:
                errormessage = 'The audio playback was aborted due to a corruption problem or because the video used features your browser did not support.'
                break
              case event.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                errormessage = 'The video audio not be loaded, either because the server or network failed or because the format is not supported.'
                break
              default:
                errormessage = 'An unknown error occurred.'
                break
            }
          }
          LOGGER.error(errormessage)
          // Announce next Episode in Playlist and start playback
          this.playNextEpisode()
        }
        this.audioElement.addEventListener('error', errorEventListener, false)
        this.audioElement.querySelector('source').addEventListener('error', errorEventListener, false)

        /* Use properity MediaSession API (Chrome) to control playback with
         * multi media keys. If this API isn't available use keyboard event
         * listener. */
        if ('mediaSession' in navigator) {
          navigator.mediaSession.setActionHandler('play', this.play.bind(this))
          navigator.mediaSession.setActionHandler('pause', this.pause.bind(this))
          navigator.mediaSession.setActionHandler('seekbackward', this.seekBackward.bind(this))
          navigator.mediaSession.setActionHandler('seekforward', this.seekForward.bind(this))
          navigator.mediaSession.setActionHandler('previoustrack', this.previousTrack.bind(this))
          navigator.mediaSession.setActionHandler('nexttrack', this.nextTrack.bind(this))
        } else {
          document.addEventListener('keydown', (event) => {
            if (event.key === 'MediaNextTrack' || event.key === 'MediaTrackNext' || event.keyCode === 176) {
              // If Key ist pressed for more than one second player begins to seek
              const now = new Date()
              if (!this.multiMediaKeyDownTimestamp) {
                this.multiMediaKeyDownTimestamp = new Date()
                LOGGER.debug(`Multimediakey ${event.key} pressed down at ${this.multiMediaKeyDownTimestamp}.`)
              } else if (now - this.multiMediaKeyDownTimestamp >= 1000) {
                if (this.audioElement &&
                    this.audioElement.playbackRate === this.audioElement.defaultPlaybackRate) {
                  this.audioElement.playbackRate = Math.min(4, 2 + this.audioElement.defaultPlaybackRate)
                  LOGGER.debug(`Start seeking while pressing multimediakey ${event.key}.`)
                }
              }
            }
          }, false)
          document.addEventListener('keyup', (event) => {
            if (event.key === 'MediaNextTrack' || event.key === 'MediaTrackNext' || event.keyCode === 176) {
              const now = new Date()
              LOGGER.debug(`Multimediakey ${event.key} released at ${now}.`)
              if (now - this.multiMediaKeyDownTimestamp < 1000) { // Play next Track when key is pressed short (< 1000 miliseconds)
                this.nextTrack()
                LOGGER.debug(`Play next Track.`)
              } else { // Stop fast forward when release the key
                if (this.audioElement &&
                    this.audioElement.playbackRate !== this.audioElement.defaultPlaybackRate) {
                  this.audioElement.playbackRate = this.audioElement.defaultPlaybackRate
                  LOGGER.debug(`Stop seeking after multimediakey ${event.key} is released.`)
                }
              }
            } else if (event.key === 'MediaPreviousTrack' || event.key === 'MediaTrackPrevious' || event.keyCode === 177) {
              this.previousTrack()
            } else if (event.key === 'MediaPlayPause' || event.key === 'MediaPlay' || event.keyCode === 179) {
              this.toggle()
            } else if (event.key === 'MediaStop' || event.keyCode === 178) {
              if (this.mediaElement) {
                this.mediaElement.pause()
              }
            }
            this.multiMediaKeyDownTimestamp = undefined
          }, false)
        }

        return audioElement
      })
  }

  load (episode) {
    if (!this.audioElement) {
      return Promise.reject(new Error('Please init the player befor loading episodes.'))
    }
    if (!episode) {
      return Promise.reject(new Error('The parameter "episode" is needed.'))
    }

    // The removing and adding of timeupdate and durationchagne event
    // listeners in this function is needed due to the behavior of Browsers based on
    // Chromium.
    // Such browsers already trigger an timeupdate event with timestamp 0
    // before the file is loaded. Then they trigger a durationchange event
    // with then duration and than begins to play.
    this.audioElement.removeEventListener('timeupdate', this.timeupdateEventListener, false)

    this.activeEpisode = episode

    return new Promise((resolve, reject) => {
      POD.storage.openFile(episode, (episode) => {
        let mediaUrl
        if (episode.offlineMediaUrl) {
          mediaUrl = episode.offlineMediaUrl
        } else {
          mediaUrl = episode.mediaUrl
        }

        if (mediaUrl) {
          let mediaType
          if (episode.mediaType) {
            mediaType = episode.mediaType
            mediaType = mediaType.replace('/x-mpeg', '/mpeg').replace('/mp3', '/mpeg')
          } else {
            // the most audio files in the internet I have ever seen are MP3-Files, so I expect the media type of 'audio/mpeg' when nothing else is set.
            mediaType = 'audio/mpeg'
          }

          // Add media fragment to playback URI
          mediaUrl = mediaUrl + '#t=' + episode.playback.currentTime

          this.audioElement.querySelector('source').setAttribute('type', mediaType)
          this.audioElement.querySelector('source').setAttribute('src', mediaUrl)
          this.audioElement.setAttribute('title', episode.title)

          if ('mediaSession' in navigator) {
            const metadata = {}
            if (episode.title) {
              metadata.title = episode.title
            }
            if (episode.source) {
              metadata.artist = episode.source
            }
            if (episode.image) {
              metadata.artwork = [
                { src: episode.image }
              ]
            }
            navigator.mediaSession.metadata = new MediaMetadata(metadata)
          }

          const durationChangeEventListener = (event) => {
            LOGGER.debug(`Duration of ${episode.title} is changed to ${UI.formatTimeCode(event.currentTarget.duration)}.`)
            if (episode && this.audioElement.duration > episode.playback.currentTime) {
              this.audioElement.removeEventListener('durationchange', durationChangeEventListener, false)
              if (this.audioElement.currentTime <= episode.playback.currentTime) {
                LOGGER.debug(`CurrentTime will set to ${UI.formatTimeCode(episode.playback.currentTime)} seconds.`)
                this.audioElement.currentTime = episode.playback.currentTime
              }
              this.audioElement.addEventListener('timeupdate', this.timeupdateEventListener.bind(this), false)
            }
          }
          this.audioElement.addEventListener('durationchange', durationChangeEventListener, false)
          this.audioElement.load()
        } else {
          reject(new Error('Episode contains no audio file to load'))
        }
      })
    })
  }

  play () {
    this.audioElement.play()
      .catch((error) => LOGGER.error(error))
  }
  pause () {
    this.audioElement.pause()
  }
  toggle () {
    if (this.audioElement.paused) {
      this.play()
    } else {
      this.pause()
    }
  }

  seekBackward () {
    this.seek(SKIP_TIME * -1)
  }
  seekForward () {
    this.seek(SKIP_TIME)
  }
  /** Jump a given amount of seconds forwards or backwards.
    * @private
    * @para {number} seconds Amount of seconds to jump forward (positive numbers) or backward (negative numbers).
    * @returns {undefined}
    */
  seek (seconds) {
    const secondsToSkip = seconds * this.audioElement.defaultPlaybackRate
    const newTimestamp = Math.min(this.audioElement.duration,
      Math.max(0, this.audioElement.currentTime + secondsToSkip))
    this.audioElement.currentTime = newTimestamp
    LOGGER.debug(`Skipped ${secondsToSkip} seconds. Continue playback at second ${newTimestamp}.`)
  }

  previousTrack () {
    this.pause()

    var jumppoint = {}
    var currentTime = this.audioElement.currentTime
    var i
    jumppoint.time = 0
    if (this.activeEpisode.jumppoints) {
      for (i = 0; i < this.activeEpisode.jumppoints.length; i += 1) {
        if (this.activeEpisode.jumppoints[i].time < currentTime && this.activeEpisode.jumppoints[i].time > jumppoint.time) {
          jumppoint = this.activeEpisode.jumppoints[i]
        }
      }
    }
    if (jumppoint.time > 1) {
      this.audioElement.currentTime = jumppoint.time - 1
      this.play()
    } else if (currentTime > 10) {
      this.audioElement.currentTime = 0
      this.play()
    } else {
      this.playPreviousEpisode()
    }
  }
  nextTrack () {
    this.pause()

    // Find the next jump point
    let currentTime = this.audioElement.currentTime
    let jumppoint = {
      time: this.audioElement.duration
    }
    if (this.activeEpisode.jumppoints) {
      for (let i = 0; i < this.activeEpisode.jumppoints.length; i += 1) {
        if (this.activeEpisode.jumppoints[i].time > currentTime &&
          this.activeEpisode.jumppoints[i].time < jumppoint.time) {
          jumppoint = this.activeEpisode.jumppoints[i]
        }
      }
    }

    if (jumppoint.time < this.audioElement.duration) {
      this.audioElement.currentTime = jumppoint.time
      this.play()
    } else {
      this.playNextEpisode()
    }
  }

  /**
    * @private
    */
  playPreviousEpisode () {
    let prevPlayableEntry
    this.playlist.previousPlayableEntry()
      .then((entry) => {
        prevPlayableEntry = entry
        if (entry) {
          this.playlist.selectedEntry = entry
          announceEpisode(entry)
            .then(() => this.load(prevPlayableEntry), (errorCodeOrError) => this.load(prevPlayableEntry))
            .catch((error) => LOGGER.error(error))
        } else {
          LOGGER.info('No previous episodes to play.')
        }
      })
  }
  /**
    * @private
    */
  playNextEpisode () {
    let nextPlayableEntry
    this.playlist.nextPlayableEntry()
      .then((entry) => {
        nextPlayableEntry = entry
        if (entry) {
          this.playlist.selectedEntry = entry
          announceEpisode(entry)
            .then(() => this.load(nextPlayableEntry), (errorCodeOrError) => {
              LOGGER.error(errorCodeOrError)
              this.load(nextPlayableEntry)
            })
            .catch((error) => {
              LOGGER.error(error)
            })
        } else {
          LOGGER.info('No more episodes to play.')
        }
      })
  }
}

// TODO need Events for loaded, timeupdate, ?
