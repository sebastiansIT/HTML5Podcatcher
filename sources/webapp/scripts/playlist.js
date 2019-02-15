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
/* global console, localStorage, HTMLMediaElement */
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
    if (playlist && playlist.length > 0) {
      for (i = 0; i < playlist.length; i += 1) {
        if (playlist[i].uri === UI.settings.get('lastPlayed')) {
          lastPlayedEpisode = playlist[i].uri
          break
        }
      }
    }
    POD.storage.readEpisode(lastPlayedEpisode, onReadCallback)
  })
}

/** Creates a HTML-Audio-Element.
  * @return {HTMLAudioElement} The created HTML-Audio-Element.
  */
GlobalUserInterfaceHelper.GenerateAudioElement = function () {
  'use strict'
  var playbackRate = POD.api.configuration.settings.get('playbackRate') || 1
  var mediaElement

  POD.logger('Audio element will be created', 'debug')

  mediaElement = document.createElement('audio')
  mediaElement.setAttribute('controls', 'controls')
  mediaElement.setAttribute('preload', 'metadata')
  mediaElement.defaultPlaybackRate = playbackRate
  mediaElement.appendChild(document.createElement('source'))

  if (window.navigator.mozApps) {
    // if app started in Firefox OS Runtime...
    mediaElement.setAttribute('mozaudiochannel', 'content')
    POD.logger('Activate content audio channel', 'debug')
    // Handling interruptions by heigher audio channels
    mediaElement.addEventListener('mozinterruptbegin', function () {
      POD.logger('Playback is interrupted', 'info')
    })
    mediaElement.addEventListener('mozinterruptend', function () {
      POD.logger('Playback is resumed', 'info')
    })
    if (navigator.mozAudioChannelManager) {
      // Set Volumn Control of device to "content" audio channel
      navigator.mozAudioChannelManager.volumeControlChannel = 'content'
      // Handling connection/disconnection of headphones
      navigator.mozAudioChannelManager.onheadphoneschange = function () {
        if (navigator.mozAudioChannelManager.headphones === true) {
          POD.logger('Headphones plugged in!', 'debug')
          if (mediaElement.autoplay === true) {
            mediaElement.play()
          }
        } else {
          POD.logger('Headphones unplugged!', 'debug')
          mediaElement.pause()
        }
      }
    }
  }

  POD.logger('Audio element is created', 'debug')

  return mediaElement
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
        if (episode.mediaType) {
          mediaType = episode.mediaType
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
        } else {
          $('#mediacontrol > p').remove()
          audioTag = $(UI.GenerateAudioElement())
          audioTag.find('source').attr('type', mediaType).attr('src', mediaUrl)
          audioTag.attr('title', episode.title)
          $('#mediacontrol').prepend(audioTag)
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
            HTML5Podcatcher.logger(episode.title + ' is playing', 'note', 'playback')
            audioElement.autoplay = true
          })
        })
        $('#player audio').on('pause', function () {
          $('#playPause').data('icon', 'play')
          $('#playPause').attr('data-icon', 'play')
        })
        $('#player audio').on('ended', function () {
          GlobalUserInterfaceHelper.activeEpisode(function (episode) {
            HTML5Podcatcher.logger(episode.title + ' is ended', 'debug', 'playback')
            POD.toggleEpisodeStatus(episode)
            // Plays next Episode in Playlist
            GlobalUserInterfaceHelper.nextEpisode(GlobalUserInterfaceHelper.playEpisode)
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
          HTML5Podcatcher.logger(errormessage, 'error', 'playback')
          GlobalUserInterfaceHelper.nextEpisode(GlobalUserInterfaceHelper.playEpisode)
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
                  $(episodeUI).attr('style', 'background: linear-gradient(to right, rgba(0, 100, 0, 0.2) 0%,rgba(0, 100, 0, 0.2) ' + percentPlayed + '%, #ffffff ' + percentPlayed + '%);')
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
    })
  }
}
GlobalUserInterfaceHelper.playEpisode = function (episode, onPlaybackStartedCallback) {
  'use strict'
  if (episode) {
    GlobalUserInterfaceHelper.activateEpisode(episode, function (episode) {
      UI.settings.set('lastPlayed', episode.uri)
      $('#player audio')[0].load()
      if (onPlaybackStartedCallback && typeof onPlaybackStartedCallback === 'function') {
        onPlaybackStartedCallback(episode)
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
      UI.previousEpisode(UI.playEpisode)
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
      UI.nextEpisode(UI.playEpisode)
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

/** Central 'ready' event handler */
$(document).ready(function () {
  'use strict'
  var k, multiMediaKeyDownTimestemp, stoppedPressMouse
  // Init Events from PWA installing process
  UI.initWebManifest()
  // Register ServiceWorker
  UI.initServiceWorker()
  // Configurate POD
  POD.logger('Open Playlist', 'debug')
  HTML5Podcatcher.api.configuration.proxyUrlPattern = UI.settings.get('proxyUrl')
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
  HTML5Podcatcher.api.storage.StorageProvider.init({ quota: UI.settings.get('quota') })
  // Render playlist
  POD.storage.readPlaylist(false, function (episodes) {
    UI.renderEpisodeList(episodes, UI.settings.get('playlistSort'))
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
    const order = UI.settings.get('playlistSort')
    const playlistEntries = document.getElementById('playlist').querySelectorAll('.entries li')

    // find episode in HTML markup
    for (let i = 0; i < playlistEntries.length; i++) {
      if (playlistEntries[i].dataset.episodeUri === episode.uri) {
        const isActive = playlistEntries[i].classList.contains('active')
        playlistEntries[i].replaceWith(episodeUI)
        if (isActive) {
          playlistEntries[i].classList.add('active')
        }
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
      if (!order || order === 'asc') {
        $('#playlist').find('.entries').append(episodeUI)
      } else {
        $('#playlist').find('.entries').prepend(episodeUI)
      }
      episodeUI.fadeIn()
    }
  }, false)
  UI.initGeneralUIEvents()
  // Disable online functions when device is offline
  if (!navigator.onLine) {
    $('#refreshPlaylist, .update, #showAddSourceView, #updateSource, #openSourceWebsite, .origin, .downloadFile').attr('disabled', 'disabled')
  }
  UI.initConnectionStateEvents()
})
