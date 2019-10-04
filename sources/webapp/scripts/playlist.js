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
/* global localStorage */
/* global $ */
/* global POD, HTML5Podcatcher */
/* global GlobalUserInterfaceHelper, UI */

class Playlist {
  // TODO Implement Property "entries"

  /** The DOM element representing the actual selected list entry.
    * @private
    * @returns {external:HTMLLIElement} DOM element.
    */
  get selectedEntryDOM () {
    return document.getElementById('playlist').querySelector('.active')
  }

  /** Change the selected list entry.
    * @param {PlaylistEntry} Sets the selected list entry.
    * @returns {undefined}
    */
  set selectedEntry (entry) {
    // Styling
    const oldActiveEntryDOM = this.selectedEntryDOM
    if (oldActiveEntryDOM) {
      oldActiveEntryDOM.classList.remove('active')
    }
    let newActiveEntryDOM
    document.querySelectorAll('#playlist li').forEach((element) => {
      if (!newActiveEntryDOM && element.dataset.episodeUri === entry.uri) {
        newActiveEntryDOM = element
      }
    })
    if (newActiveEntryDOM) {
      newActiveEntryDOM.classList.add('active')
    }
    window.podcatcher.configuration.settings.set('lastPlayed', entry.uri)
      .catch((error) => LOGGER.error(error))
  }

  /** A promise for a playable episode.
    * Playable means a playlist entry that contains a media files that is
    * availlable with the current network state.
    * @promise PlayableEntryPromise
    * @fulfill {Episode|Null} An episode that is playable
    * @reject {Error} An error - whatever it can be.
    */
  /** The playable episode that is listet before the selected entry.
    * @returns {PlayableEntryPromise} An episode or null if no previous one exists.
    */
  previousPlayableEntry () {
    let entryDOM = this.selectedEntryDOM
    return new Promise((resolve, reject) => {
      try {
        while (entryDOM.previousElementSibling) {
          if (entryDOM.previousElementSibling.matches(':not([aria-disabled="true"]):not(.news)')) {
            POD.storage.readEpisode(entryDOM.previousElementSibling.dataset.episodeUri,
              (episode) => resolve(episode))
            return
          }
          entryDOM = entryDOM.previousElementSibling
        }
        resolve(null)
      } catch (error) {
        reject(error)
      }
    })
  }

  /** The playable episode that is listet after the selected entry.
    * @returns {PlayableEntryPromise} An episode or null if next one doesn't exists.
    */
  nextPlayableEntry () {
    let entryDOM = this.selectedEntryDOM
    return new Promise((resolve, reject) => {
      try {
        while (entryDOM.nextElementSibling) {
          if (entryDOM.nextElementSibling.matches(':not([aria-disabled="true"]):not(.news)')) {
            POD.storage.readEpisode(entryDOM.nextElementSibling.dataset.episodeUri,
              (episode) => resolve(episode))
            return
          }
          entryDOM = entryDOM.nextElementSibling
        }
        resolve(null)
      } catch (error) {
        reject(error)
      }
    })
  }
}

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
      const iconButton = episodeUI.querySelector('.downloadFile')
      iconButton.querySelector('svg use')
        .setAttribute('href', 'styles/icons/delete.svg#icon_delete')
      const icon = iconButton.querySelector('svg')
      $(iconButton).replaceWith(`<button class="delete iconButton" href="${episode.mediaUrl}" aria-label="Delete"></button>`)
      episodeUI.querySelector('.delete').appendChild(icon)
    } else {
      const iconButton = episodeUI.querySelector('.delete')
      iconButton.querySelector('svg use')
        .setAttribute('href', 'styles/icons/download.svg#icon_download')
      const icon = iconButton.querySelector('svg')
      $(iconButton).replaceWith(`<a class="downloadFile iconButton" href="${episode.mediaUrl}" download="${episode.mediaUrl.slice(episode.mediaUrl.lastIndexOf('/') + 1)}" title="Download"></a>`)
      episodeUI.querySelector('.download').appendChild(icon)
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

const playlist = new Playlist()

/* Functions for playback */
/** Load a new episode in the player.
  * If neccesary the player is initialised and
  * some new event handler are added to the player to manipulate the UI and
  * the newly generated audio element to the DOM.
  * Also the selected episode is visual marked as "active".
  */
GlobalUserInterfaceHelper.activateEpisode = function (episode, onActivatedCallback) {
  'use strict'
  LOGGER.debug(`Activate episode ${JSON.stringify(episode)}.`)

  if ($('#player audio').length > 0) {
    window.h5p.player.load(episode)
    playlist.selectedEntry = episode
    if (onActivatedCallback && typeof onActivatedCallback === 'function') {
      onActivatedCallback(episode)
    }
  } else {
    $('#mediacontrol > p').remove()
    window.h5p.player.init(playlist)
      .then((audioElement) => {
        audioElement.addEventListener('playing', function (event) {
          document.getElementById('playPause').querySelector('svg use')
            .setAttribute('href', 'styles/icons/pause.svg#icon_pause')
        }, false)
        audioElement.addEventListener('pause', function (event) {
          document.getElementById('playPause').querySelector('svg use')
            .setAttribute('href', 'styles/icons/play.svg#icon_play')
        }, false)
        audioElement.addEventListener('timeupdate', function (event) {
          GlobalUserInterfaceHelper.activeEpisode((episode) => {
            if (episode && (event.target.currentTime > (episode.playback.currentTime + 2) || event.target.currentTime < (episode.playback.currentTime - 2))) {
              // Show Progress as background Gradient of Episode-UI
              const episodeUI = GlobalUserInterfaceHelper.findEpisodeUI(episode)
              let percentPlayed = ((event.target.currentTime / event.target.duration) * 100)
              percentPlayed = percentPlayed.toFixed(2)
              episodeUI.setAttribute('style', 'background: linear-gradient(to right, var(--primary-color-background) 0%, var(--primary-color-background) ' + percentPlayed + '%, transparent ' + percentPlayed + '%);')
            }
          })
        }, false)
        const errorEventListener = (event) => {
          document.getElementById('playPause').querySelector('svg use')
            .setAttribute('href', 'styles/icons/play.svg#icon_play')
        }
        const mediaControlElement = document.getElementById('mediacontrol')
        mediaControlElement.insertBefore(audioElement, mediaControlElement.firstChild)
        LOGGER.debug('Add event listener to audio element finished.')
        return window.h5p.player.load(episode)
          .then(() => {
            playlist.selectedEntry = episode
            audioElement.addEventListener('error', errorEventListener, false)
            audioElement.querySelector('source').addEventListener('error', errorEventListener, false)
            if (onActivatedCallback && typeof onActivatedCallback === 'function') {
              onActivatedCallback(episode)
            }
          })
      })
      .catch((error) => LOGGER.error(error))
  }
}

let LOGGER = null

/** Central 'ready' event handler */
document.addEventListener('DOMContentLoaded', function () {
  'use strict'
  var k, stoppedPressMouse

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
  UI.getLastPlayedEpisode(UI.activateEpisode)
  // --------------------------- //
  // -- Register Eventhandler -- //
  // --------------------------- //
  // Player UI Events
  document.getElementById('playPause').addEventListener('click', function (event) {
    event.preventDefault()
    event.stopPropagation()

    window.h5p.player.toggle()
  }, false)
  document.getElementById('playPrevious').addEventListener('click', function (event) {
    event.preventDefault()
    event.stopPropagation()

    window.h5p.player.previousTrack()
  }, false)
  document.getElementById('playNext').addEventListener('click', function (event) {
    event.preventDefault()
    event.stopPropagation()

    window.h5p.player.nextTrack()
  }, false)
  document.getElementById('jumpBackwards').addEventListener('click', function (event) {
    event.preventDefault()
    event.stopPropagation()

    window.h5p.player.seekBackward()
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
    var audioTag = document.querySelector('#player audio')

    if (audioTag.playbackRate === audioTag.defaultPlaybackRate) { // skip some seconds
      window.h5p.player.seekForward()
    } else { // come back from fast forward
      audioTag.playbackRate = audioTag.defaultPlaybackRate
      POD.logger('Playback speed ' + audioTag.playbackRate, 'debug')
    }
    stoppedPressMouse = true
  }, false)
  document.getElementById('refreshPlaylist').addEventListener('click', UI.eventHandler.refreshAllSources, false)

  // Playlist UI Events
  $('#playlist').on('click', 'li .link', function (event) {
    event.preventDefault()
    event.stopPropagation()
    // Read episode from storage and then start playback
    POD.storage.readEpisode($(this).parent('li').data('episodeUri'), UI.activateEpisode)
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
