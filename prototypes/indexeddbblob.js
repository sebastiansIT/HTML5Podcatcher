/*  Copyright 2013 Sebastian Spautz

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
/*global navigator */
/*global window */
/*global document */
/*global console */
/*global Math */
/*global Blob */
/*global XMLHttpRequest */
/*global localStorage */
/*global CustomEvent */
/*global $ */

/** Global Variables/Objects */
// Take care of vendor prefixes.
window.URL = window.URL || window.webkitURL;

/** UI-Functions */
var findEpisodeUI = function(episode) {
    "use strict";
    var episodeUI;
    $('#playlist .entries li').each(function() {
        if ($(this).data('episodeUri') === episode.uri) {
            episodeUI = this;
            return false;
        }
    });
    return episodeUI;
};
var actualiseEpisodeUI = function(episode) {
    "use strict";
    var episodeUI;
    episodeUI = findEpisodeUI(episode);
    if (episode.offlineMediaUrl) {
        $(episodeUI).find('.download').replaceWith('<a class="delete" href="' + episode.offlineMediaUrl + '">Delete</a>');
    } else {
        $(episodeUI).find('.delete').replaceWith('<a class="download" href="' + episode.mediaUrl + '" download="' + episode.mediaUrl.slice(episode.mediaUrl.lastIndexOf()) + '">Download</a>');
    }
    $(episodeUI).find('progress').remove();
    return false;
};

/** Helper Functions */
var logHandler = function(message, loglevel) {
    "use strict";
    console.log(loglevel + ': ' + message);
    $('#statusbar').prepend('<span class=' + loglevel + '>' + message.toString() + '</span></br>');
};
var errorHandler = function(event) {
    "use strict";
    var eventstring = event.toString() + ' {';
    $.each(event, function(i, n) {
        eventstring += i + ': "' + n + '"; ';
    });
    eventstring += '}';
    logHandler(eventstring, 'error');
};
var successHandler = function(event) {
    "use strict";
    logHandler(event, 'success');
};
var progressHandler = function(progressEvent, prefix, episode) {
    "use strict"; //xmlHttpRequestProgressEvent
    var progressbar, percentComplete, episodeUI;
    episodeUI = findEpisodeUI(episode);
    if ($(episodeUI).find('progress').length) {
        progressbar = $(episodeUI).find('progress');
    } else {
        progressbar = $('<progress min="0" max="1">&helip;</progress>');
        $(episodeUI).find('.download').hide().after(progressbar);
    }
    if (progressEvent.lengthComputable) {
        percentComplete = progressEvent.loaded / progressEvent.total;
        console.log(prefix + ': ' + (percentComplete * 100).toFixed(2) + '%');
        $(episodeUI).find('progress').attr('value', percentComplete).text((percentComplete * 100).toFixed(2) + '%');
    } else {
        console.log(prefix + '...');
        $(episodeUI).find('progress').removeAttr('value').text('&helip;');
    }
};
/*var requestFileSystemQuota = function(quota) {
    "use strict";
    if (navigator.persistentStorage) {
        navigator.persistentStorage.requestQuota(quota, function(grantedBytes) {
            logHandler('You gain access to ' + grantedBytes / 1024 / 1024 + ' MiB of memory', 'debug');
            navigator.persistentStorage.queryUsageAndQuota(function (usage, quota) {
                localStorage.setItem("configuration.quota", quota);
                var availableSpace = quota - usage;
                $('#memorySizeInput').val(quota / 1024 / 1024).attr('min', Math.ceil(usage / 1024 / 1024)).css('background', 'linear-gradient( 90deg, rgba(0,100,0,0.45) ' + Math.ceil((usage / quota) * 100) + '%, transparent ' + Math.ceil((usage / quota) * 100) + '%, transparent )');
                if (availableSpace <= (1024 * 1024 * 50)) {
                    logHandler('You are out of space! Please allow more then ' + Math.ceil(quota / 1024 / 1024) + ' MiB of space', 'warning');
                } else {
                    logHandler('There is ' + Math.floor(availableSpace / 1024 / 1024) + ' MiB of ' + Math.floor(quota / 1024 / 1024) + ' MiB memory available', 'info');
                }
            }, errorHandler);
        }, errorHandler);
    }
};*/

/** Functions for episodes */
var readEpisode = function(episodeUri) {
    "use strict";
    var episode;
    if (episodeUri) {
        //Read Episode from local DOM-Storage
        episode = JSON.parse(localStorage.getItem('episode.' + episodeUri));
        if (!episode) {
            episode = { 'uri': episodeUri };
        }
        //Convert "updated" to date object 
        episode.updated = new Date(episode.updated);
        //Generate "playback" object if not exists
        if (!episode.playback) {
            episode.playback = {'played': false, 'currentTime': 0};
        }
    }
    return episode;
};
var writeEpisode = function(episode) {
    "use strict";
    //logHandler('Saving Episode with timecode ' + episode.playback.currentTime, 'debug');
    localStorage.setItem('episode.' + episode.uri, JSON.stringify(episode));
};
var sortEpisodes = function(firstEpisode, secondEpisode) {
    "use strict";
    return secondEpisode.updated < firstEpisode.updated;
};

/** Functions for files */
function updateIndexedDB(event) {
  "use strict";
  logHandler("Database Update from Version " + event.oldVersion + " to Version " + event.newVersion, 'info');
  var db;
  db = this.result;
  if (!db.objectStoreNames.contains('Files')) {
    db.createObjectStore('Files', {});
  }
}
function openFile(episode, onReadCallback) {
    "use strict";
    if (episode.isFileSavedOffline) {
        var request;
        request = window.indexedDB.open('HTML5PodcatcherPrototyp', 5.0);
        request.onupgradeneeded = updateIndexedDB;
        request.onblocked = function() { logHandler("Database blocked", 'debug'); };
        request.onsuccess = function () {
            var db, transaction, store, cursorRequest;
            db = this.result;
            transaction = db.transaction(['Files'], 'readonly');
            store = transaction.objectStore('Files');
            request = store.get(episode.mediaUrl);
            request.onsuccess = function(event) {
                var objectUrl, blob;
                blob = event.target.result;
                objectUrl = window.URL.createObjectURL(blob);
                episode.offlineMediaUrl = objectUrl;
                if (onReadCallback && typeof onReadCallback === 'function') {
                    onReadCallback(episode);
                }
            };
            request.onerror = function(event) { errorHandler(event); };
        };
        request.onerror = function(event) { errorHandler(event); };
    }
}
function saveFile(episode, blob, onWriteCallback) {
    "use strict";
var request;
request = window.indexedDB.open('HTML5PodcatcherPrototyp', 5.0);
request.onupgradeneeded = updateIndexedDB;
request.onsuccess = function () {
	var db, transaction, store, request;
	db = this.result;
	transaction = db.transaction(['Files'], 'readwrite');
	store = transaction.objectStore('Files');
	request = store.put(blob, episode.mediaUrl);
	request.onsuccess = function() {
		episode.isFileSavedOffline = true;
		writeEpisode(episode);
		if (onWriteCallback && typeof onWriteCallback === 'function') {
			onWriteCallback(episode);
		}
	};
	request.onerror = function(event) { errorHandler(event); };
};
request.onerror = function(event) { errorHandler(event); };
}
var deleteFile = function(episode, onDeleteCallback) {
    "use strict";
    var request;
    window.URL.revokeObjectURL(episode.offlineMediaUrl);
    request = window.indexedDB.open('HTML5PodcatcherPrototyp', 5.0);
    request.onupgradeneeded = updateIndexedDB;
    request.onblocked = function() {
        logHandler("Database blocked", 'debug');
    };
    request.onsuccess = function () {
        logHandler("Success creating/accessing IndexedDB database", 'debug');
        var db, transaction, store, request;
        db = this.result;
        transaction = db.transaction(['Files'], 'readwrite');
        store = transaction.objectStore('Files');
        request = store.delete(episode.mediaUrl);
        // Erfolgs-Event
        request.onsuccess = function() {
            episode.isFileSavedOffline = false;
            episode.offlineMediaUrl = undefined;
            writeEpisode(episode);
            logHandler('Deleting file "' + episode.mediaUrl + '" from IndexedDB finished', 'info');
            if (onDeleteCallback && typeof onDeleteCallback === 'function') {
                onDeleteCallback(episode);
            }
        };
        request.onerror = function (event) {
            logHandler('Error deleting file "' + episode.mediaUrl + '" from IndexedDB (' + event + ')', 'error');
        };
    };
    request.onerror = function () {
        logHandler("Error creating/accessing IndexedDB database", 'error');
    };
};
var downloadFile = function(episode, mimeType, onDownloadCallback) {
    "use strict";
    var xhr = new XMLHttpRequest();
    xhr.open('GET', episode.mediaUrl, true);
    xhr.responseType = 'arraybuffer';
    xhr.addEventListener("progress", function(event) {
        progressHandler(event, 'Download', episode);
    }, false);
    xhr.addEventListener("abort", logHandler, false);
    xhr.addEventListener("error", function() {
        logHandler('Direct download failed. Try proxy: filesystem.py?url=' + episode.mediaUrl, 'warning');
        var xhrProxy = new XMLHttpRequest();
        xhrProxy.open('GET', 'filesystem.py?url=' + episode.mediaUrl, true);
        xhrProxy.responseType = 'arraybuffer';
        xhrProxy.addEventListener("progress", function(event) {
            progressHandler(event, 'Download', episode);
        }, false);
        xhrProxy.addEventListener("abort", logHandler, false);
        xhrProxy.addEventListener("error", errorHandler, false);
        xhrProxy.onload = function() {
            if (this.status === 200) {
                logHandler('Download of file ' + episode.mediaUrl + ' via proxy is finished', 'debug');
                saveFile(episode, new Blob([xhrProxy.response], {type: mimeType}), onDownloadCallback);
            } else {
                logHandler('Error Downloading file ' + episode.mediaUrl + ' via proxy: ' + this.statusText + ' (' + this.status + ')', 'error');
            }
        };
        xhrProxy.send(null);
    }, false);
    xhr.onload = function() {
        if (this.status === 200) {
            logHandler('Download of file ' + episode.mediaUrl + ' is finished', 'debug');
            saveFile(episode, new Blob([xhr.response], {type: mimeType}), onDownloadCallback);
        } else {
            logHandler('Error Downloading file ' + episode.mediaUrl + ': ' + this.statusText + ' (' + this.status + ')', 'error');
        }
    };
    xhr.send(null);
};


/** Load and Render Playlist*/
var readPlaylist = function(showAll) {
    "use strict";
    if (!showAll) {
        showAll = false;
    }
    var i, episode, playlist = [];
    for (i = 0; i < localStorage.length; i++) {
        if (localStorage.key(i).slice(0, 8) === 'episode.') {
            episode = readEpisode(localStorage.key(i).substring(8));
            if (episode.playback.played === false || showAll === true) {
                playlist.push(episode);
            }
        }
    }
    playlist.sort(sortEpisodes);
    return playlist;
};
var renderPlaylist = function(playlist) {
    "use strict";
    var playlistUI, entryUI, entryFunctionsUI, i;
    playlistUI = $('#playlist .entries');
    playlistUI.empty();
    if (playlist && playlist.length > 0) {
        for (i = 0; i < playlist.length; i++) {
            entryUI = $('<li>');
            entryUI.data('episodeUri', playlist[i].uri);
            entryUI.append('<h3 class="title"><a href="' + playlist[i].uri + '">' + playlist[i].title + '</a></h3>');
            entryUI.append('<span class="source">' + playlist[i].source + '</span>');
            entryUI.append('<span class="updated">' + playlist[i].updated.toLocaleDateString() + " " + playlist[i].updated.toLocaleTimeString() + '</span>');
            entryFunctionsUI = $('<span class="functions">');
            if (playlist[i].playback.played) {
                entryFunctionsUI.append('<a class="status" href="#">Status: played</a>');
            } else {
                entryFunctionsUI.append('<a class="status" href="#">Status: new</a>');
            }
            entryFunctionsUI.append('<a class="origin" href="' + playlist[i].uri + '">Internet</a>');
            if (window.indexedDB) {
                if (playlist[i].isFileSavedOffline) {
                    entryFunctionsUI.append('<a class="delete" href="' + playlist[i].mediaUrl + '">Delete</a>');
                } else {
                    entryFunctionsUI.append('<a class="download" href="' + playlist[i].mediaUrl + '" download="' + playlist[i].mediaUrl.slice(playlist[i].mediaUrl.lastIndexOf()) + '">Download</a>');
                }
            }
            entryUI.append(entryFunctionsUI);
            playlistUI.append(entryUI);
        }
    } else {
        entryUI = $('<li>no entries</li>');
        playlistUI.append(entryUI);
    }
};

/** Functions for Sources/Feeds */
var parseSource = function(xml, source) {
    "use strict";
    var episode, tracks = [];
    //RSS-Feed
    if ($(xml).has('rss[version="2.0"]')) {
        //RSS-Channel
        source.link = $(xml).find('channel > link').text();
        source.title = $(xml).find('channel > title').text();
        source.description = $(xml).find('channel > description').text();
        //RSS-Entries
        $(xml).find('item').has('enclosure').slice(0, 5).each(function() {
            episode = readEpisode($(this).find('link:first').text());
            episode.title = $(this).find('title:first').text();
            episode.mediaUrl = $(this).find('enclosure:first').attr('url');
            episode.updated = new Date($(this).find('pubDate:first').text());
            episode.source = source.title;
            tracks.push(episode);
        });
    }
    return {'source': source, 'episodes': tracks};
};
var downloadSource = function(source) {
    "use strict";
    var successfunction, errorfunction, parserresult;
    successfunction = function(data, jqXHR) {
        parserresult = parseSource(data, source);
        if (jqXHR.requestURL) {
            logHandler("Loaded " + jqXHR.requestURL + " succesfully", 'info');
        }
    };
    errorfunction = function(jqXHR, textStatus, errorThrown) {
        logHandler(textStatus + " " + jqXHR.status + " : " + errorThrown, 'error');
        logHandler(source.uri + " can not loaded directly; using proxy");
        $.ajax({
            'url': "sourceparsing.py?url=" + source.uri,
            'async': false,
            'dataType': 'xml',
            'success': successfunction,
            'error': function() { logHandler(source.uri + " can not loaded using proxy", 'error'); }
        });
        logHandler("Load " + source.uri + " succesfully while using proxy");
    };
    //Load Feed and Parse Entries
    try {
        $.ajax({
            'url': source.uri,
            'async': false,
            'dataType': 'xml',
            'beforeSend': function(jqXHR, settings) { jqXHR.requestURL = settings.url; },
            'success': successfunction,
            'error': errorfunction
        });
    } catch (ignore) {}
    return parserresult;
};
/* Prototype with two fix entries. */
var readSourceList = function() {
    "use strict";
    var sources = [{ 'uri': 'http://feeds.feedburner.com/cre-podcast'}, { 'uri': 'http://chaosradio.ccc.de/chaosradio-latest.rss'}];
    return sources;
};

/** Central 'ready' event handler */
$(document).ready(function() {
    "use strict";
    //Playlist UI Events
    $('#playlist #updatePlaylist').on('click', function(event) {
        event.preventDefault();
        event.stopPropagation();
        var i, j, sources, parserresult;
        sources = readSourceList();
        for (i = 0; i < sources.length; i++) {
            parserresult = downloadSource(sources[i]);
            //Save Episodes to local storage
            for (j = 0; j < parserresult.episodes.length; j++) {
                //Save all Episodes in the parser result
                writeEpisode(parserresult.episodes[j]);
            }
        }
        renderPlaylist(readPlaylist());
    });
    $('#playlist').on('click', '.download', function(event) {
        event.preventDefault();
        event.stopPropagation();
        var episode;
        episode = readEpisode($(this).closest('li').data('episodeUri'));
        logHandler('Downloading file "' + episode.mediaUrl + '" starts now', 'info');
        downloadFile(episode, 'audio/mp3', function(episode) {
            openFile(episode, function(episode) {
                logHandler("ObjectURL is " + episode.offlineMediaUrl);
                renderPlaylist(readPlaylist());
            });
        });
    });
    $('#playlist').on('click', '.delete', function(event) {
        event.preventDefault();
        event.stopPropagation();
        var episode;
        episode = readEpisode($(this).closest('li').data('episodeUri'));
        logHandler('Deleting file "' + episode.mediaUrl + '" starts now', 'info');
        deleteFile(episode, function() {
            logHandler("ObjectURL is " + episode.mediaUrl);
            renderPlaylist(readPlaylist());
        });
    });
    $('#playlist').on('click', 'h3 a', function(event) {
        event.preventDefault();
        event.stopPropagation();
        var episode;
        episode = readEpisode($(this).closest('li').data('episodeUri'));
        openFile(episode, function(episode) {
            logHandler("ObjectURL is " + episode.offlineMediaUrl);
        });
    });
    $('#playlist #listFiles').on('click', function(event) {
        event.preventDefault();
        event.stopPropagation();
        var request;
        request = window.indexedDB.open('HTML5PodcatcherPrototyp', 5.0);
        request.onupgradeneeded = updateIndexedDB;
        request.onblocked = function() { logHandler("Database blocked", 'debug'); };
        request.onsuccess = function () {
            var db, transaction, store, cursorRequest;
            db = this.result;
            transaction = db.transaction(['Files'], 'readonly');
            store = transaction.objectStore('Files');
            cursorRequest = store.openCursor();
            cursorRequest.onsuccess = function(event) {
                var result = event.target.result;
                if (result) {
                    logHandler(result.key);
                    result.continue();
                } else {
                    logHandler("No more Files in there");
                }
            };
        };
    });
    renderPlaylist(readPlaylist());
});
