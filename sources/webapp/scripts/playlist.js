/*  Copyright 2013 - 2016, 2019 Sebastian Spautz

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
/* global navigator, window, document */
/* global console, localStorage, HTMLMediaElement, MediaMetadata */
/* global $ */
/* global POD, HTML5Podcatcher */
/* global GlobalUserInterfaceHelper, UI */
GlobalUserInterfaceHelper.actualiseEpisodeUI = function (episode) {
  'use strict'
  const episodeUI = GlobalUserInterfaceHelper.findEpisodeUI(episode)
  // Status
  if (episode.playback.played) {
    episodeUI.querySelector('.status').textContent = 'Status: played'
  } else {
    episodeUI.querySelector('.status').textContent = 'Status: new'
  }
  // Download/Delete link
  if (POD.storage.isFileStorageAvailable() && episode.mediaUrl) {
    if (episode.offlineMediaUrl) {
      $(episodeUI.querySelector('.downloadFile')).replaceWith('<button type="button" class="delete" href="' + episode.mediaUrl + '">Delete</button>')
    } else {
      $(episodeUI.querySelector('.delete')).replaceWith('<a class="download button" href="' + episode.mediaUrl + '" download="' + episode.mediaUrl.slice(episode.mediaUrl.lastIndexOf('/') + 1) + '">Download</a>')
    }
  } else {
    const downloadButton = episodeUI.querySelector('.functions .downloadFile')
    downloadButton.parentNode.removeChild(downloadButton)
  }
  const progressView = episodeUI.querySelector('progress')
  progressView.parentNode.removeChild(progressView)
  return false
}
GlobalUserInterfaceHelper.activeEpisode = function (onReadCallback) {
  'use strict'
  const activeEpisode = $(document.getElementById('playlist').querySelector('.active'))
  POD.storage.readEpisode(activeEpisode.data('episodeUri'), onReadCallback)
}
GlobalUserInterfaceHelper.previousEpisode = function (onReadCallback) {
  'use strict'
  const activeEpisode = $(document.getElementById('playlist').querySelector('.active'))
  POD.storage.readEpisode(activeEpisode.prevAll(':not([aria-disabled="true"])').not('.news').first().data('episodeUri'), onReadCallback)
}
GlobalUserInterfaceHelper.nextEpisode = function (onReadCallback) {
  'use strict'
  const activeEpisode = $(document.getElementById('playlist').querySelector('.active'))
  POD.storage.readEpisode(activeEpisode.nextAll(':not([aria-disabled="true"])').not('.news').first().data('episodeUri'), onReadCallback)
}

GlobalUserInterfaceHelper.getLastPlayedEpisode = function (onReadCallback) {
  'use strict'
  var lastPlayedEpisode, i
  lastPlayedEpisode = $('#playlist li:first-child').data('episodeUri')
  POD.storage.readPlaylist(false, function (playlist) {
    window.podcatcher.configuration.settings.get('lastPlayed')
      .then((lastPlayedUri) => {
        if (playlist && playlist.length > 0) {
          for (i = 0; i < playlist.length; i += 1) {
            if (playlist[i].uri === lastPlayedUri) {
              lastPlayedEpisode = playlist[i].uri
              break
            }
          }
        }
        POD.storage.readEpisode(lastPlayedEpisode, onReadCallback)
      })
      .catch((error) => {
        LOGGER.error(`Can't find last played episode due to an error: ${error}.`)
        POD.storage.readEpisode(lastPlayedEpisode, onReadCallback)
      })
  })
}

/** Creates a HTML-Audio-Element.
  * @return {Promise} A promise fullfiled with the created HTML-Audio-Element.
  */
GlobalUserInterfaceHelper.GenerateAudioElement = function () {
  'use strict'

  LOGGER.debug('Audio element will be created')
  // The following promise is only a quick and dirty solution. The hole function should be async.
  return window.podcatcher.configuration.settings.get('playbackRate', 1)
    .then((playbackRate) => {
      const mediaElement = document.createElement('audio')
      mediaElement.setAttribute('controls', 'controls')
      mediaElement.setAttribute('preload', 'metadata')
      mediaElement.defaultPlaybackRate = playbackRate
      mediaElement.appendChild(document.createElement('source'))

      if (window.navigator.mozApps) {
        // if app started in Firefox OS Runtime...
        mediaElement.setAttribute('mozaudiochannel', 'content')
        POD.logger('Activate content audio channel', 'debug', 'playback')
        // Handling interruptions by heigher audio channels
        mediaElement.addEventListener('mozinterruptbegin', function () {
          POD.logger('Playback is interrupted', 'info', 'playback')
        })
        mediaElement.addEventListener('mozinterruptend', function () {
          POD.logger('Playback is resumed', 'info', 'playback')
        })
        if (navigator.mozAudioChannelManager) {
          // Set Volumn Control of device to "content" audio channel
          navigator.mozAudioChannelManager.volumeControlChannel = 'content'
          // Handling connection/disconnection of headphones
          navigator.mozAudioChannelManager.onheadphoneschange = function () {
            if (navigator.mozAudioChannelManager.headphones === true) {
              POD.logger('Headphones plugged in!', 'debug', 'playback')
              if (mediaElement.autoplay === true || mediaElement.dataset.autoplay === 'enabled') {
                mediaElement.play()
              }
            } else {
              POD.logger('Headphones unplugged!', 'debug', 'playback')
              mediaElement.pause()
            }
          }
        }
      }

      LOGGER.debug('Audio element is created')

      return mediaElement
    })
}

/** Functions for playback */
GlobalUserInterfaceHelper.activateEpisode = function (episode, onActivatedCallback) {
  'use strict'
  var mediaUrl, mediaType, audioTag
  $('#player audio').off('timeupdate')
  HTML5Podcatcher.logger('Timeupdate off', 'debug', 'playback')
  if (episode) {
    POD.storage.openFile(episode, function (episode) {
      if (episode.offlineMediaUrl) {
        mediaUrl = episode.offlineMediaUrl
      } else {
        mediaUrl = episode.mediaUrl
      }
      if (mediaUrl) {
        const init = function () {
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
          // Bind or rebind event handler for the audio element
          $('#player audio').on('loadstart', function () {
            HTML5Podcatcher.logger('==============================================', 'debug')
            GlobalUserInterfaceHelper.activeEpisode(function (episode) {
              HTML5Podcatcher.logger('Start loading ' + episode.title, 'debug', 'playback')
            })
          })
          $('#player audio').on('loadedmetadata', function () {
            GlobalUserInterfaceHelper.activeEpisode(function (episode) {
              HTML5Podcatcher.logger('Load metadata of ' + episode.title, 'debug', 'playback')
            })
          })
          $('#player audio').on('canplay', function () {
            GlobalUserInterfaceHelper.activeEpisode(function (episode) {
              HTML5Podcatcher.logger(episode.title + ' is ready to play', 'debug', 'playback')
            })
          })
          $('#player audio').on('canplaythrough', function () {
            GlobalUserInterfaceHelper.activeEpisode(function (episode) {
              HTML5Podcatcher.logger(episode.title + ' is realy ready to play ("canplaythrough")', 'debug', 'playback')
            })
          })
          $('#player audio').on('playing', function (event) {
            var audioElement = event.target
            $('#playPause').data('icon', 'pause')
            $('#playPause').attr('data-icon', 'pause')
            GlobalUserInterfaceHelper.activeEpisode(function (episode) {
              if ('mediaSession' in navigator) {
                LOGGER.info(`${episode.title} is playing.`)
              } else {
                LOGGER.note(`${episode.title} is playing.`)
              }

              audioElement.autoplay = true
              audioElement.dataset.autoplay = 'enabled'
            })
          })
          $('#player audio').on('pause', function () {
            $('#playPause').data('icon', 'play')
            $('#playPause').attr('data-icon', 'play')
          })
          $('#player audio').on('ended', function () {
            GlobalUserInterfaceHelper.activeEpisode(function (episode) {
              LOGGER.debug(episode.title + ' is ended')
              POD.toggleEpisodeStatus(episode)
              // Announce next Episode in Playlist and start playback
              GlobalUserInterfaceHelper.nextEpisode((nextEpisode) => {
                GlobalUserInterfaceHelper.announceEpisode(nextEpisode)
                  .then(() => {
                    GlobalUserInterfaceHelper.playEpisode(nextEpisode)
                  })
                  .catch((errorCodeOrError) => {
                    GlobalUserInterfaceHelper.playEpisode(nextEpisode)
                  })
              })
            })
          })
          $('#player audio, #player audio source').on('error', function (event) {
            var errormessage, readystate, networkstate
            if (!event || !event.target || !$(event.target).parent()[0] || !$(event.target).parent()[0].readyState) {
              // no valid state - Firefox 41 throws this error after page navigation. Why?
              return
            }
            readystate = $(event.target).parent()[0].readyState
            networkstate = $(event.target).parent()[0].networkState
            errormessage = 'Error on playback of audio file. Networkstate: ' + networkstate + '; ReadyState: ' + readystate
            if (networkstate === HTMLMediaElement.NETWORK_NO_SOURCE) {
              errormessage = 'There is no valid source for ' + episode.title + '. See ' + episode.mediaUrl + ' of type ' + episode.mediaType
            } else if (readystate === HTMLMediaElement.HAVE_NOTHING) {
              errormessage = "Can't load file " + $(event.target).parent()[0].currentSrc
            } else if ($(event.target).parent()[0].error) {
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
            $('#playPause').data('icon', 'play')
            $('#playPause').attr('data-icon', 'play')
            LOGGER.error(errormessage)
            // Announce next Episode in Playlist and start playback
            GlobalUserInterfaceHelper.nextEpisode((nextEpisode) => {
              GlobalUserInterfaceHelper.announceEpisode(nextEpisode)
                .then(() => {
                  GlobalUserInterfaceHelper.playEpisode(nextEpisode)
                })
                .catch((errorCodeOrError) => {
                  GlobalUserInterfaceHelper.playEpisode(nextEpisode)
                })
            })
          })
          $('#player audio').on('durationchange', function (event) {
            var audioElement = event.target
            var percentPlayed, episodeUI
            GlobalUserInterfaceHelper.activeEpisode(function (episode) {
              HTML5Podcatcher.logger('Duration of ' + episode.title + ' is changed to ' + UI.formatTimeCode(event.currentTarget.duration) + '.', 'debug', 'playback')
              if (episode && audioElement.duration > episode.playback.currentTime) {
                $(audioElement).off('durationchange')
                if (audioElement.currentTime <= episode.playback.currentTime) {
                  HTML5Podcatcher.logger('CurrentTime will set to ' + UI.formatTimeCode(episode.playback.currentTime) + ' seconds', 'debug')
                  audioElement.currentTime = episode.playback.currentTime
                }
                $(audioElement).on('timeupdate', function (event) {
                  if (episode && (event.target.currentTime > (episode.playback.currentTime + 10) || event.target.currentTime < (episode.playback.currentTime - 10))) {
                    episode.playback.currentTime = Math.floor(event.target.currentTime / 10) * 10
                    POD.storage.writeEpisode(episode)
                    HTML5Podcatcher.logger('Current timecode is ' + UI.formatTimeCode(episode.playback.currentTime) + '.', 'debug')
                  }
                  if (episode && (event.target.currentTime > (episode.playback.currentTime + 2) || event.target.currentTime < (episode.playback.currentTime - 2))) {
                    // Show Progress as background Gradient of Episode-UI
                    episodeUI = GlobalUserInterfaceHelper.findEpisodeUI(episode)
                    percentPlayed = ((event.target.currentTime / audioElement.duration) * 100)
                    percentPlayed = percentPlayed.toFixed(2)
                    $(episodeUI).attr('style', 'background: linear-gradient(to right, var(--primary-color-background) 0%, var(--primary-color-background) ' + percentPlayed + '%, #ffffff ' + percentPlayed + '%);')
                  }
                })
                HTML5Podcatcher.logger('Timeupdate on', 'debug')
              }
            })
          })
          // Styling
          $('#playlist').find('.active').removeClass('active')
          $('#playlist li').filter(function () {
            return $(this).data('episodeUri') === episode.uri
          }).addClass('active')
          if (onActivatedCallback && typeof onActivatedCallback === 'function') {
            onActivatedCallback(episode)
          }
        }

        if (episode.mediaType) {
          mediaType = episode.mediaType
          mediaType = mediaType.replace('/x-mpeg', '/mpeg').replace('/mp3', '/mpeg')
        } else {
          // the most audio files in the internet I have ever seen are MP3-Files, so I expect the media type of 'audio/mpeg' when nothing else is set.
          mediaType = 'audio/mpeg'
        }
        // Add media fragment to playback URI
        mediaUrl = mediaUrl + '#t=' + episode.playback.currentTime
        if ($('#player audio').length > 0) {
          audioTag = $('#player audio')[0]
          $(audioTag).off()
          $(audioTag).find('source').off()
          $(audioTag).find('source').attr('type', mediaType).attr('src', mediaUrl)
          $(audioTag).attr('title', episode.title)
          init()
        } else {
          $('#mediacontrol > p').remove()
          UI.GenerateAudioElement()
            .then((audioElement) => {
              audioTag = $(audioElement)
              audioTag.find('source').attr('type', mediaType).attr('src', mediaUrl)
              audioTag.attr('title', episode.title)
              $('#mediacontrol').prepend(audioTag)
              init()
            })
            .catch((error) => LOGGER.error(error))
        }
      }
    })
  }
}
GlobalUserInterfaceHelper.playEpisode = function (episode, onPlaybackStartedCallback) {
  'use strict'
  if (episode) {
    GlobalUserInterfaceHelper.activateEpisode(episode, function (episode) {
      window.podcatcher.configuration.settings.set('lastPlayed', episode.uri)
        .catch((error) => LOGGER.error(error))
      let audioElement = document.querySelector('#player audio')
      audioElement.load()
      if (audioElement.dataset.autoplay === 'enabled') {
        audioElement.play()
          .then(() => {
            if (onPlaybackStartedCallback && typeof onPlaybackStartedCallback === 'function') {
              onPlaybackStartedCallback(episode)
            }
          })
          .catch((error) => HTML5Podcatcher.logger(error, 'error'))
      } else {
        HTML5Podcatcher.logger('AudioElement isn\'t configurated for autoplay yet.', 'debug')
        if (onPlaybackStartedCallback && typeof onPlaybackStartedCallback === 'function') {
          onPlaybackStartedCallback(episode)
        }
      }
    })
  }
}
GlobalUserInterfaceHelper.playPrevious = function () {
  'use strict'
  var audioTag = $('#player audio')[0]
  audioTag.pause()
  UI.activeEpisode(function (episode) {
    var jumppoint = {}
    var currentTime = audioTag.currentTime
    var i
    jumppoint.time = 0
    if (episode.jumppoints) {
      for (i = 0; i < episode.jumppoints.length; i += 1) {
        if (episode.jumppoints[i].time < currentTime && episode.jumppoints[i].time > jumppoint.time) {
          jumppoint = episode.jumppoints[i]
        }
      }
    }
    if (jumppoint.time > 1) {
      audioTag.currentTime = jumppoint.time - 1
      audioTag.play()
    } else if (currentTime > 10) {
      audioTag.currentTime = 0
      audioTag.play()
    } else {
      UI.previousEpisode((prevEpisode) => {
        UI.playEpisode(prevEpisode)
      })
    }
  })
}
GlobalUserInterfaceHelper.playNext = function () {
  'use strict'
  const audioTag = document.querySelector('#player audio')
  audioTag.pause()
  UI.activeEpisode(function (episode) {
    var jumppoint = {}
    var currentTime = audioTag.currentTime
    var i
    jumppoint.time = audioTag.duration
    if (episode.jumppoints) {
      for (i = 0; i < episode.jumppoints.length; i += 1) {
        if (episode.jumppoints[i].time > currentTime && episode.jumppoints[i].time < jumppoint.time) {
          jumppoint = episode.jumppoints[i]
        }
      }
    }
    if (jumppoint.time < audioTag.duration) {
      audioTag.currentTime = jumppoint.time
      audioTag.play()
    } else {
      UI.nextEpisode((nextEpisode) => {
        UI.playEpisode(nextEpisode)
      })
    }
  })
}
GlobalUserInterfaceHelper.togglePauseStatus = function () {
  'use strict'
  var audioTag = $('#player audio')[0]
  if (audioTag) {
    if (audioTag.paused) {
      audioTag.play()
      $('#playPause').data('icon', 'pause')
      $('#playPause').attr('data-icon', 'pause')
    } else {
      audioTag.pause()
      $('#playPause').data('icon', 'play')
      $('#playPause').attr('data-icon', 'play')
    }
  }
}

/** Announce a Episode via speach synthesis.
  * @param {Episode} episode The podcast episode that should be announced.
  * @returns {external:Promise} A promise
  */
GlobalUserInterfaceHelper.announceEpisode = function (episode) {
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

let LOGGER = null

/** Central 'ready' event handler */
$(document).ready(function () {
  'use strict'
  var k, multiMediaKeyDownTimestemp, stoppedPressMouse

  LOGGER = window.podcatcher.utils.createLogger('hp5/view/playlist')

  // Init Events from PWA installing process
  UI.initWebManifest()
  // Register ServiceWorker
  UI.initServiceWorker()
  // Configurate POD
  LOGGER.debug('Open Playlist')
  Promise.all([
    window.podcatcher.configuration.settings.get('speechSynthesisPolicy'),
    window.podcatcher.configuration.settings.get('proxyUrl')
  ])
    .then(([synthesiserPolicy, proxyUrlPattern]) => {
      window.h5p.speech.policy(synthesiserPolicy)
      HTML5Podcatcher.api.configuration.proxyUrlPattern = proxyUrlPattern
    })
    .catch((error) => LOGGER.error(error))
  // --------------------- //
  // -- Database Update -- //
  // --------------------- //
  // -- Update local storage to actual version of key-names (changed "track" to "episode"; changed "configuration" to "settings")
  for (k = 0; k < localStorage.length; k += 1) {
    if (localStorage.key(k).slice(0, 6) === 'track.') {
      localStorage.setItem(localStorage.key(k).replace('track.', 'episode.'), localStorage.getItem(localStorage.key(k)))
      localStorage.removeItem(localStorage.key(k))
    } else if (localStorage.key(k).slice(0, 14) === 'configuration.') {
      localStorage.setItem(localStorage.key(k).replace('configuration.', 'settings.'), localStorage.getItem(localStorage.key(k)))
      localStorage.removeItem(localStorage.key(k))
    }
  }
  // -------------------------- //
  // -- Check Pre Conditions -- //
  // -------------------------- //
  UI.preConditionCheck(function (preConditionCheckResult) {
    if (preConditionCheckResult === 'missing proxy') {
      window.location.href = 'settings.html'
    } else if (preConditionCheckResult === 'missing sources') {
      window.location.href = 'sources.html'
    }
  })
  // ------------------- //
  // -- Initialise UI -- //
  // ------------------- //
  // Quota and Filesystem initialisation
  window.podcatcher.configuration.settings.get('quota')
    .then((value) => {
      HTML5Podcatcher.api.storage.StorageProvider.init({ quota: value })
    })
    .catch((error) => LOGGER.error(error))
  // Render playlist
  POD.storage.readPlaylist(false, function (episodes) {
    window.podcatcher.configuration.settings.get('playlistSort')
      .then((sort) => UI.renderEpisodeList(episodes, sort))
      .catch((error) => LOGGER.error(error))
  })
  // Initialise player
  UI.getLastPlayedEpisode(UI.playEpisode)
  // --------------------------- //
  // -- Register Eventhandler -- //
  // --------------------------- //
  // Player UI Events
  document.getElementById('playPause').addEventListener('click', function (event) {
    event.preventDefault()
    event.stopPropagation()

    GlobalUserInterfaceHelper.togglePauseStatus()
  }, false)
  document.getElementById('playPrevious').addEventListener('click', function (event) {
    event.preventDefault()
    event.stopPropagation()

    UI.playPrevious()
  }, false)
  document.getElementById('playNext').addEventListener('click', function (event) {
    event.preventDefault()
    event.stopPropagation()

    UI.playNext()
  }, false)
  document.getElementById('jumpBackwards').addEventListener('click', function (event) {
    event.preventDefault()
    event.stopPropagation()

    var secondsToSkip
    var audioTag = document.querySelector('#player audio')

    if (audioTag.currentTime < 10) {
      UI.playPrevious()
    } else {
      secondsToSkip = 10 * audioTag.defaultPlaybackRate
      audioTag.currentTime = Math.max(0, audioTag.currentTime - secondsToSkip)
    }
  }, false)
  window.registerPointerEventListener(document.getElementById('jumpForwards'), 'pointerdown', function () {
    var audioTag = document.querySelector('#player audio')

    stoppedPressMouse = false
    window.setTimeout(function () {
      if (stoppedPressMouse === false) {
        audioTag.playbackRate = Math.min(4, 2 + audioTag.defaultPlaybackRate)
      }
      POD.logger('Playback speed ' + audioTag.playbackRate, 'debug')
    }, 500)
  }, false)
  window.registerPointerEventListener(document.getElementById('jumpForwards'), 'pointerup', function () {
    var secondsToSkip
    var audioTag = document.querySelector('#player audio')

    if (audioTag.playbackRate === audioTag.defaultPlaybackRate) { // skip some seconds
      secondsToSkip = 10 * audioTag.defaultPlaybackRate
      audioTag.currentTime = Math.min(audioTag.duration, audioTag.currentTime + secondsToSkip)
    } else { // come back from fast forward
      audioTag.playbackRate = audioTag.defaultPlaybackRate
      POD.logger('Playback speed ' + audioTag.playbackRate, 'debug')
    }
    stoppedPressMouse = true
  }, false)
  document.addEventListener('keydown', function (event) {
    var now, audioTag

    if (event.key === 'MediaNextTrack' || event.key === 'MediaTrackNext' || event.keyCode === 176) {
      now = new Date()
      if (!multiMediaKeyDownTimestemp) {
        multiMediaKeyDownTimestemp = new Date()
      } else if (now - multiMediaKeyDownTimestemp >= 1000) {
        audioTag = document.querySelector('#player audio')
        if (audioTag && audioTag.playbackRate === audioTag.defaultPlaybackRate) {
          audioTag.playbackRate = Math.min(4, 2 + audioTag.defaultPlaybackRate)
        }
      }
    }
  }, false)
  document.addEventListener('keyup', function (event) {
    var now, audioTag

    if (event.key === 'MediaNextTrack' || event.key === 'MediaTrackNext' || event.keyCode === 176) {
      now = new Date()
      if (now - multiMediaKeyDownTimestemp < 1000) { // Play next Track when key is pressed short (< 1000 miliseconds)
        UI.playNext()
      } else { // Stop fast forward when release the key
        audioTag = document.querySelector('#player audio')
        if (audioTag && audioTag.playbackRate !== audioTag.defaultPlaybackRate) {
          audioTag.playbackRate = audioTag.defaultPlaybackRate
        }
      }
    } else if (event.key === 'MediaPreviousTrack' || event.key === 'MediaTrackPrevious' || event.keyCode === 177) {
      UI.playPrevious()
    } else if (event.key === 'MediaPlayPause' || event.key === 'MediaPlay' || event.keyCode === 179) {
      GlobalUserInterfaceHelper.togglePauseStatus()
    } else if (event.key === 'MediaStop' || event.keyCode === 178) {
      audioTag = document.querySelector('#player audio')
      if (audioTag) {
        audioTag.pause()
        audioTag.setAttribute('data-icon', 'play')
      }
    }
    multiMediaKeyDownTimestemp = undefined
  }, false)

  document.getElementById('refreshPlaylist').addEventListener('click', UI.eventHandler.refreshAllSources, false)

  // Playlist UI Events
  $('#playlist').on('click', 'li .link', function (event) {
    event.preventDefault()
    event.stopPropagation()
    // Read episode from storage an then start playback
    POD.storage.readEpisode($(this).parent('li').data('episodeUri'), UI.playEpisode)
  })
  $('#playlist').on('click', '.downloadFile', UI.eventHandler.downloadEpisodeFile)
  $('#playlist').on('click', '.delete', function (event) {
    event.preventDefault()
    event.stopPropagation()
    POD.storage.readEpisode($(this).closest('li').data('episodeUri'), function (episode) {
      UI.logHandler('Deleting file "' + episode.offlineMediaUrl + '" starts now', 'info')
      POD.storage.deleteFile(episode)
    })
  })
  $('#playlist').on('click', '.status', function (event) {
    event.preventDefault()
    event.stopPropagation()
    POD.storage.readEpisode($(this).closest('li').data('episodeUri'), function (episode) {
      POD.toggleEpisodeStatus(episode)
    })
  })

  document.addEventListener('writeEpisode', function (event) {
    const episode = event.detail.episode
    let episodeUI = UI.renderEpisode(episode)
    const playlistEntries = document.getElementById('playlist').querySelectorAll('.entries li')

    // find episode in HTML markup
    for (let i = 0; i < playlistEntries.length; i++) {
      if (playlistEntries[i].dataset.episodeUri === episode.uri) {
        const isActive = playlistEntries[i].classList.contains('active')
        episodeUI.querySelector('li').setAttribute('style', playlistEntries[i].getAttribute('style'))
        if (isActive) {
          episodeUI.querySelector('li').classList.add('active')
        }
        playlistEntries[i].replaceWith(episodeUI)
        return
      }
    }

    // show unlisend episode if not listed before
    if (!episode.playback.played) {
      const emptyPlaceholder = document.querySelector('.emptyPlaceholder')
      if (emptyPlaceholder) {
        emptyPlaceholder.parentNode.removeChild(emptyPlaceholder)
      }
      episodeUI = $(episodeUI)
      episodeUI.hide()
      window.podcatcher.configuration.settings.get('playlistSort', 'asc')
        .then((order) => {
          if (order === 'asc') {
            $('#playlist').find('.entries').append(episodeUI)
          } else {
            $('#playlist').find('.entries').prepend(episodeUI)
          }
          episodeUI.fadeIn()
        })
        .catch((error) => LOGGER.error(error))
    }
  }, false)
  UI.initGeneralUIEvents()
  // Disable online functions when device is offline
  if (!navigator.onLine) {
    $('#refreshPlaylist, .update, #showAddSourceView, #updateSource, #openSourceWebsite, .origin, .downloadFile').attr('disabled', 'disabled')
  }
  UI.initConnectionStateEvents()
})
