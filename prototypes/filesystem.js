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
var fileSystemSize = 1024 * 1024 * 500; /*500 MB */
var fileSystemStatus = window.PERSISTENT; //window.TEMPORARY;
// Take care of vendor prefixes.
window.URL = window.URL || window.webkitURL;
window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
window.resolveLocalFileSystemURL = window.resolveLocalFileSystemURL || window.webkitResolveLocalFileSystemURL;
navigator.persistentStorage = navigator.persistentStorage || navigator.webkitPersistentStorage;

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
var progressHandler = function(progressEvent, prefix) {
    "use strict"; //xmlHttpRequestProgressEvent
    var percentComplete;
    if (progressEvent.lengthComputable) {
        percentComplete = progressEvent.loaded / progressEvent.total;
        console.log(prefix + ': ' + (percentComplete * 100).toFixed(2) + '%');
        $('meter').attr('value', percentComplete).text((percentComplete * 100).toFixed(2) + '%');
    } else {
        console.log(prefix + '...');
    }
};
var requestFileSystemQuota = function(quota) {
    "use strict";
    if(navigator.persistentStorage) {
        navigator.persistentStorage.requestQuota(quota, function(grantedBytes) {
            logHandler('You gain access to ' + grantedBytes / 1024 / 1024 + ' MiB of memory', 'debug');
            navigator.persistentStorage.queryUsageAndQuota(function (usage, quota) {
                localStorage.setItem("configuration.quota", quota);
                var availableSpace = quota - usage;
                $('#memorySizeInput').val(quota / 1024 / 1024).attr('min', Math.ceil(usage / 1024 / 1024)).css('background', 'linear-gradient( 90deg, rgba(0,100,0,0.45) ' + Math.ceil((usage / quota)*100) + '%, transparent ' + Math.ceil((usage / quota)*100) + '%, transparent )');
                if (availableSpace <= (1024 * 1024 * 50)) {
                    logHandler('You are out of space! Please allow more then ' + Math.ceil(quota / 1024 / 1024) + ' MiB of space', 'warning');
                } else {
                    logHandler('There is ' + Math.floor(availableSpace / 1024 / 1024) + ' MiB of ' + Math.floor(quota / 1024 / 1024) + ' MiB memory available', 'info');
                }
            }, errorHandler);
        }, errorHandler);
    }
};

/** UI-Functions */
var actualiseEpisodeUI = function(episode) {
    "use strict";
    $('#playlist .entries li').each(function() {
        if ($(this).data('episodeUri') === episode.uri) {
            if (episode.offlineMediaUrl) {
                $(this).find('.download').replaceWith('<a class="delete" href="' + episode.offlineMediaUrl + '">Delete</a>');
            } else {
                $(this).find('.delete').replaceWith('<a class="download" href="' + episode.mediaUrl + '" download="' + episode.mediaUrl.slice(episode.mediaUrl.lastIndexOf()) + '">Download</a>');
            }
            return false;
        }
    });
};

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
    var event;
    //logHandler('Saving Episode with timecode ' + episode.playback.currentTime, 'debug');
    localStorage.setItem('episode.' + episode.uri, JSON.stringify(episode));
    event = new CustomEvent('episodeWriten', {
        detail: {
            'episode': episode
        },
        bubbles: false,
        cancelable: true
    });
    document.dispatchEvent(event);
};
var sortEpisodes = function(firstEpisode, secondEpisode) {
    "use strict";
    return secondEpisode.updated < firstEpisode.updated;
};

/** Functions for files */
var saveFile = function(episode, arraybuffer, mimeType) {
    "use strict";
    logHandler('Saving file "' + episode.mediaUrl + '" to local file system starts now', 'debug');
    var blob, parts, fileName;
    blob = new Blob([arraybuffer], {type: mimeType});
    parts = episode.mediaUrl.split('/');
    fileName = parts[parts.length - 1];
    // Write file to the root directory.
    window.requestFileSystem(fileSystemStatus, fileSystemSize, function(filesystem) {
        filesystem.root.getFile(fileName, {create: true, exclusive: false}, function(fileEntry) {
            fileEntry.createWriter(function(writer) {
                writer.onwrite = function(event) {
                    progressHandler(event, 'Write');
                };
                writer.onwriteend = function() { //success
                    episode.offlineMediaUrl = fileEntry.toURL();
                    writeEpisode(episode);
                    logHandler('Saving file "' + episode.mediaUrl + '" to local file system finished', 'info');
                };
                writer.onerror = function(event) {
                    logHandler('Error on saving file "' + episode.mediaUrl + '" to local file system (' + event + ')', 'error');
                };
                writer.write(blob);
            }, errorHandler);
        }, errorHandler);
    }, errorHandler);
};
var deleteFile = function(episode) {
    "use strict";
    window.resolveLocalFileSystemURL(episode.offlineMediaUrl, function(fileEntry) { //success
        fileEntry.remove(function() { //success
            var url;
            url = episode.offlineMediaUrl;
            episode.offlineMediaUrl = undefined;
            writeEpisode(episode);
            logHandler('Deleting file "' + url + '" finished', 'info');
        }, errorHandler);
    }, function(event) { //error
        if (event.code === event.NOT_FOUND_ERR) {
            var url;
            url = episode.offlineMediaUrl;
            episode.offlineMediaUrl = undefined;
            writeEpisode(episode);
            logHandler('File "' + url + '"not found. But that\'s OK', 'info');
        } else {
            errorHandler(event);
        }
    });
};
var downloadFile = function(episode, mimeType) {
    "use strict";
    var xhr = new XMLHttpRequest();
    xhr.open('GET', episode.mediaUrl, true);
    xhr.responseType = 'arraybuffer';
    xhr.addEventListener("progress", function(event) {
        progressHandler(event, 'Write');
    }, false);
    xhr.addEventListener("abort", logHandler, false);
    xhr.addEventListener("error", function() {
        logHandler('Direct download failed. Try proxy: filesystem.py?url=' + episode.mediaUrl, 'warning');
        var xhrProxy = new XMLHttpRequest();
        xhrProxy.open('GET', 'filesystem.py?url=' + episode.mediaUrl, true);
        xhrProxy.responseType = 'arraybuffer';
        xhrProxy.addEventListener("progress", function(event) {
            progressHandler(event, 'Write');
        }, false);
        xhrProxy.addEventListener("abort", logHandler, false);
        xhrProxy.addEventListener("error", errorHandler, false);
        xhrProxy.onload = function() {
            if (this.status === 200) {
                logHandler('Download of file ' + episode.mediaUrl + ' via proxy is finished', 'debug');
                saveFile(episode, xhrProxy.response, mimeType);
            } else {
                logHandler('Error Downloading file ' + episode.mediaUrl + ' via proxy: ' + this.statusText + ' (' + this.status + ')', 'error');
            }
        };
        xhrProxy.send(null);
    }, false);
    xhr.onload = function() {
        if (this.status === 200) {
            logHandler('Download of file ' + episode.mediaUrl + ' is finished', 'debug');
            saveFile(episode, xhr.response, mimeType);
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
            if (window.requestFileSystem) {
                if (playlist[i].offlineMediaUrl) {
                    entryFunctionsUI.append('<a class="delete" href="' + playlist[i].offlineMediaUrl + '">Delete</a>');
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
    $(document).on('episodeWriten', function(event) {
        actualiseEpisodeUI(event.originalEvent.detail.episode);
    });
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
        downloadFile(episode, 'audio/mp3');
    });
    $('#playlist').on('click', '.delete', function(event) {
        event.preventDefault();
        event.stopPropagation();
        var episode;
        episode = readEpisode($(this).closest('li').data('episodeUri'));
        logHandler('Deleting file "' + episode.offlineMediaUrl + '" starts now', 'info');
        deleteFile(episode);
    });
    $('#configuration #memorySizeForm').on('submit', function(event) {
        event.preventDefault();
        event.stopPropagation();
        if ($('#memorySizeInput')[0].checkValidity()) {
            requestFileSystemQuota($('#memorySizeInput').val() * 1024 * 1024);
        } else {
            logHandler('Please insert a number', 'error');
        }
    });
    var quota = localStorage.getItem("configuration.quota");
    if (!quota) { quota = 1024 * 1024 * 200; }
    requestFileSystemQuota(quota);
    renderPlaylist(readPlaylist());
});
