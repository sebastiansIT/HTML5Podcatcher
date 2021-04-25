/* Copyright 2014, 2019, 2021 Sebastian Spautz

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
/* global navigator */
/* global window */
/* global document */
/* global console */
/* global XMLHttpRequest */
/* global Blob */
/* global Audio */
/* global TEMPORARY */
/* global $ */
/* global UI */
const audio = new Audio()
const canPlayOgg = !!audio.canPlayType && audio.canPlayType('audio/ogg; codecs="vorbis"') !== ''
const canPlayMP3 = !!audio.canPlayType && audio.canPlayType('audio/mpeg; codecs="mp3"') !== ''
/**
 * Writes a Blob to the filesystem.
 *
 * @param {DirectoryEntry} dir The directory to write the blob into.
 * @param {Blob} blob The data to write.
 * @param {string} fileName A name for the file.
 * @param {function(ProgressEvent)} [callback] An optional callback.
 *    Invoked when the write completes.
 **/
var writeBlob = function (dir, blob, fileName, callback) {
  'use strict'
  dir.getFile(fileName, { create: true, exclusive: true }, function (fileEntry) {
    fileEntry.createWriter(function (writer) {
      if (callback) {
        writer.onwrite = callback
      }
      writer.write(blob)
    }, UI.logHandler('Error writing Blop', 'error'))
  }, UI.logHandler('Error writing Blop', 'error'))
}

/**
 * Fetches a file by URL and writes it to the filesystem.
 *
 * @param {string} url The url the resource resides under.
 * @param {string} mimeType The content type of the file.
 **/
var downloadImage = function (url, mimeType) {
  'use strict'
  var xhr = new XMLHttpRequest()
  xhr.open('GET', url, true)
  xhr.responseType = 'arraybuffer'

  xhr.onload = function () {
    if (this.status === 200) {
      var blob, parts, fileName
      blob = new Blob([xhr.response], { type: mimeType })
      parts = url.split('/')
      fileName = parts[parts.length - 1]
      window.requestFileSystem(TEMPORARY, 1024 * 1024 * 50, function (fs) {
        var onWrite = function () {
          UI.logHandler('Write completed.', 'info')
        }
        // Write file to the root directory.
        writeBlob(fs.root, blob, fileName, onWrite)
      }, UI.logHandler('Error writing Blop', 'error'))
    }
  }
  xhr.send(null)
}
// List Content
function fsEntriestoArray (list) {
  'use strict'
  return Array.prototype.slice.call(list || [], 0)
}

function listFsEntries (entries) {
  'use strict'
  // Document fragments can improve performance since they're only appended
  // to the DOM once. Only one browser reflow occurs.
  var fragment = document.createDocumentFragment()
  entries.forEach((entry) => {
    var li
    li = document.createElement('li')
    li.innerHTML = [
      '<a href="' + entry.toURL() + '" title="' + entry.name + '">', entry.name, '</a>',
      '<button type="button" value="', entry.name, '">Delete</button>'
    ].join('')
    fragment.appendChild(li)
  })
  document.querySelector('#filelist').appendChild(fragment)
}

function onInitFs (fs) {
  const dirReader = fs.root.createReader()
  let entries = []
  // Call the reader.readEntries() until no more results are returned.
  const readEntries = () => {
    dirReader.readEntries((results) => {
      if (!results.length) {
        listFsEntries(entries.sort())
      } else {
        entries = entries.concat(fsEntriestoArray(results))
        readEntries()
      }
    }, UI.errorHandler)
  }
  readEntries() // Start reading dirs.
}

function showFileSystemEntries () {
  'use strict'
  if (window.requestFileSystem) {
    window.requestFileSystem(window.TEMPORARY, 1024 * 1024 * 50, onInitFs, UI.errorHandler)
    window.requestFileSystem(window.PERSISTENT, 1024 * 1024 * 50, onInitFs, UI.errorHandler)
  }
}

function deleteFile (filename, callback) {
  window.requestFileSystem(window.PERSISTENT, 1024 * 1024 * 50, (fs) => {
    fs.root.getFile(filename, { create: false }, (fileEntry) => {
      fileEntry.remove(() => {
        UI.logHandler('File removed', 'debug')
        callback()
      }, UI.errorHandler)
    }, UI.errorHandler)
  }, UI.errorHandler)
}

function showIndexDbEntries (event) {
  'use strict'
  event.preventDefault()
  event.stopPropagation()
  var request
  request = window.indexedDB.open('HTML5Podcatcher', 4.0)
  request.onblocked = function () { UI.logHandler('Database blocked', 'debug') }
  request.onsuccess = function () {
    var db, transaction, store, cursorRequest
    db = this.result
    transaction = db.transaction(['files'], 'readonly')
    store = transaction.objectStore('files')
    cursorRequest = store.openCursor()
    cursorRequest.onsuccess = function (event) {
      var result = event.target.result
      if (result) {
        $(this).append('<li>' + result.key + '</li>')
        result.continue()
      } else {
        UI.logHandler('No more Files in there')
      }
    }
  }
}

function saveZwerg () {
  'use strict'
  downloadImage('zwerg.png', 'image/png')
}

function deleteZwerg () {
  'use strict'
  window.requestFileSystem(window.TEMPORARY, 1024 * 1024 * 50, function (fs) {
    fs.root.getFile('zwerg.png', { create: false }, function (fileEntry) {
      fileEntry.remove(function () {
        console.log('File removed.')
      }, UI.errorHandler)
    }, UI.errorHandler)
    fs.root.getFile('Revision1.mp3', { create: false }, function (fileEntry) {
      fileEntry.remove(function () {
        console.log('File removed.')
      }, UI.errorHandler)
    }, UI.errorHandler)
  }, UI.errorHandler)
}

/** Central 'ready' event handler */
$(document).ready(function () {
  'use strict'
  // test file system api
  var infoFileSystemAPI = document.getElementById('SupportFilesystemAPI')
  if (window.requestFileSystem && window.URL) {
    infoFileSystemAPI.innerHTML = 'Your browser does support the HTML5 filesystem API.'
  } else {
    infoFileSystemAPI.innerHTML = 'Your browser <strong>does not</strong> support the HTML5 filesystem API.'
  }
  // event handler for key settings
  $('#previousTrackKey1, #nextTrackKey1, #playTrackKey1').on('keydown', function (event) {
    $(this).val(event.keyCode || event.key)
  })

  // see https://developers.google.com/web/updates/2017/08/estimating-available-storage-space
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    navigator.storage.estimate().then(({ usage, quota }) => {
      document.getElementById('storageQuota').textContent = `Using ${usage} out of ${quota} (${(usage / quota).toFixed(5)}%).`
      console.log(`Using ${usage} out of ${quota} bytes.`)
    })
  }

  if (navigator.persistentStorage) {
    navigator.persistentStorage.queryUsageAndQuota(function (usage, quota) {
      var availableSpace = quota - usage
      document.getElementById('persistentStorage').textContent = `Using ${usage} out of ${quota} bytes.`
      console.log(`File System API uses ${usage} out of ${quota} bytes. ${availableSpace} bytes are available.`)
    })
  }

  if (navigator.storageQuota) {
    navigator.storageQuota.queryInfo('temporary').then(function (info) {
      document.getElementById('quotaManagementTemp').textContent = `Using ${info.usage} out of ${info.quota} bytes.`
      console.log(`Storage Quota uses ${info.usage} out of ${info.quota} bytes.`)
    })
  }

  document.getElementById('filelist').addEventListener('click', (event) => {
    const list = event.currentTarget
    if (event.target.nodeName === 'BUTTON') {
      deleteFile(event.target.value, () => {
        list.innerHTML = ''
        showFileSystemEntries()
      })
    }
  })
  showFileSystemEntries()

  /* Check if autoplay on audio elements is allowed */
  const audioElement = document.createElement('audio')
  audioElement.autoplay = true
  document.getElementById('autoplayallowed').textContent = audioElement.autoplay

  UI.initGeneralUIEvents()
})
