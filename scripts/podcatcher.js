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
/*global Blob */
/*global XMLHttpRequest */
/*global localStorage */
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
    $('#statusbar').prepend('<span class=' + loglevel + '>' + message + '</span></br>');
};
var errorHandler = function(error) {
    "use strict";
    logHandler(error, 'error');
};
var successHandler = function(event) {
    "use strict";
    logHandler(event, 'info');
};
var progressHandler = function(xmlHttpRequestProgressEvent) {
    "use strict";
    if (xmlHttpRequestProgressEvent.lengthComputable) {
        var percentComplete = xmlHttpRequestProgressEvent.loaded / xmlHttpRequestProgressEvent.total;
        console.log('Download: ' + percentComplete * 100 + '%');
    } else {
        console.log('Downloading...');
    }
};

/** Functions for configuration */
var renderConfiguration = function() {
    "use strict";
    if (localStorage.getItem("configuration.proxyUrl")) {
        $('#httpProxyInput').val(localStorage.getItem("configuration.proxyUrl"));
    }
};

/** Functions for tracks */
var readTrack = function(trackUri) {
    "use strict";
    var track;
    if (trackUri) {
        track = JSON.parse(localStorage.getItem('track.' + trackUri));
        track.updated = new Date(track.updated);
        if (!track.playback) {
            track.playback = {'played': false, 'currentTime': 0};
        }
    }
    return track;
};
var writeTrack = function(track) {
    "use strict";
    localStorage.setItem('track.' + track.uri, JSON.stringify(track));
};
var sortTracks = function(firstTrack, secondTrack) {
    "use strict";
    return secondTrack.updated < firstTrack.updated;
};
var saveBlob = function(track, arraybuffer, mimeType) {
    "use strict";
    logHandler('Saving blob to local file system');
    var blob, parts, fileName;
    blob = new Blob([arraybuffer], {type: mimeType});
    parts = track.mediaUrl.split('/');
    fileName = parts[parts.length - 1];
    // Write file to the root directory.
    window.requestFileSystem(fileSystemStatus, fileSystemSize, function(filesystem) {
        filesystem.root.getFile(fileName, {create: true, exclusive: false}, function(fileEntry) {
            fileEntry.createWriter(function(writer) {
                writer.onwrite = successHandler;
                writer.write(blob);
            }, errorHandler);
            track.offlineMediaUrl = fileEntry.toURL();
            writeTrack(track);
        }, errorHandler);
    }, errorHandler);
    logHandler('Saving blob with ' + track.mediaUrl + ' finished');
};
var deleteBlob = function(track) {
    "use strict";
    window.resolveLocalFileSystemURL(track.offlineMediaUrl, function(fileEntry) {
        fileEntry.remove(successHandler, errorHandler);
        track.offlineMediaUrl = undefined;
        writeTrack(track);
    }, errorHandler);
};
var downloadTrack = function(track, mimeType) {
    "use strict";
    var xhr = new XMLHttpRequest();
    xhr.open('GET', track.mediaUrl, true);
    xhr.responseType = 'arraybuffer';
    xhr.addEventListener("progress", progressHandler, false);
    xhr.addEventListener("abort", logHandler, false);
    xhr.addEventListener("error", function() {
        logHandler('Try proxy: ' + localStorage.getItem("configuration.proxyUrl").replace("$url$", track.mediaUrl));
        var xhrProxy = new XMLHttpRequest();
        xhrProxy.open('GET', localStorage.getItem("configuration.proxyUrl").replace("$url$", track.mediaUrl), true);
        xhrProxy.responseType = 'arraybuffer';
        xhrProxy.addEventListener("progress", progressHandler, false);
        xhrProxy.addEventListener("abort", logHandler, false);
        xhrProxy.addEventListener("error", errorHandler, false);
        xhrProxy.onload = function() {
            if (this.status === 200) {
                saveBlob(track, xhrProxy.response, mimeType);
            }
            logHandler('Download of file ' + track.mediaUrl + ' via proxy is finished');
        };
        xhrProxy.send(null);
    }, false);
    xhr.onload = function() {
        if (this.status === 200) {
            saveBlob(track, xhr.response, mimeType);
        }
    };
    xhr.send(null);
};
var toggleTrackStatus = function(track) {
    "use strict";
    track.playback.played = !track.playback.played;
    track.playback.currentTime = 0;
    deleteBlob(track);
    writeTrack(track);
};
var activeTrack = function() {
    "use strict";
    var activeTrack = $('#playlist').find('.activeTrack');
    return readTrack(activeTrack.data('trackuri'));
};
var previousTrack = function() {
    "use strict";
    var activeTrack = $('#playlist').find('.activeTrack');
    return readTrack(activeTrack.prev().data('trackuri'));
};
var nextTrack = function() {
    "use strict";
    var activeTrack = $('#playlist').find('.activeTrack');
    return readTrack(activeTrack.next().data('trackuri'));
};

/** Functions for Sources/Feeds */
var readSource = function(sourceUri) {
    "use strict";
    var source;
    source = JSON.parse(localStorage.getItem('source.' + sourceUri));
    return source;
};
var writeSource = function(source) {
    "use strict";
    if (localStorage.getItem('source.' + source.uri)) {
        //TODO Update einbauen
    } else {
        localStorage.setItem('source.' + source.uri, JSON.stringify(source));
    }
};
var parseFeed = function(feed, tracks) {
    "use strict";
    var xml = $(feed);
    //RSS-Feed
    $(xml).find('item').has('enclosure').slice(0, 5).each(function() {
        tracks.push({'uri': $(this).find('link:first').text(), 'title': $(this).find('title:first').text(), 'mediaUrl' : $(this).find('enclosure:first').attr('url'), 'updated' : new Date($(this).find('pubDate:first').text()), 'source' : $(xml).find('channel > title').text() });
    });
    //ATOM-Feed
    $(xml).find('entry').has('link[rel=enclosure]').slice(0, 5).each(function() {
        tracks.push({'uri': $(this).find('id:first').text(), 'title': $(this).find('title:first').text(), 'mediaUrl' : $(this).find('link[rel=enclosure]:first').attr('href'), 'updated' : new Date($(this).find('updated:first').text()) });
    });
};
var downloadSource = function(source) {
    "use strict";
    var tracks, successfunction, errorfunction;
    tracks = [];
    successfunction = function(data, jqXHR) {
        parseFeed(data, tracks);
        if (jqXHR.requestURL) {
            logHandler("Load " + jqXHR.requestURL + " succesfully");
        }
    };
    errorfunction = function(jqXHR, textStatus, errorThrown) {
        errorHandler(textStatus + " " + jqXHR.status + " : " + errorThrown);
        if (localStorage.getItem("configuration.proxyUrl")) {
            logHandler(source.uri + " can not loaded directly; using proxy");
            $.ajax({
                'url': localStorage.getItem("configuration.proxyUrl").replace("$url$", source.uri),
                'async': false,
                'dataType': 'xml',
                'success': successfunction,
                'error': function() { errorHandler(source.uri + " can not loaded using proxy"); }
            });
            logHandler("Load " + source.uri + " succesfully while using proxy");
        }
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
    return tracks;
};
var readSourceList = function() {
    "use strict";
    var i, sourcelist = [];
    for (i = 0; i < localStorage.length; i++) {
        if (localStorage.key(i).slice(0, 7) === 'source.') {
            sourcelist.push(readSource(localStorage.key(i).substring(7)));
        }
    }
    return sourcelist;
};
var renderSourceList = function(sourcelist) {
    "use strict";
    var sourcelistUI, entryUI, i;
    sourcelistUI = $('#sources .entries');
    sourcelistUI.empty();
    if (sourcelist && sourcelist.length > 0) {
        for (i = 0; i < sourcelist.length; i++) {
            entryUI = $('<li>');
            entryUI.append('<a href="' + sourcelist[i].uri + '">' + sourcelist[i].uri + '</a>');
            //TODO delete function
            sourcelistUI.append(entryUI);
        }
    } else {
        entryUI = $('<li>no entries</li>');
        sourcelistUI.append(entryUI);
    }
};

/** Load and Render Playlist*/
var readPlaylist = function(showAll) {
    "use strict";
    if (!showAll) {
        showAll = false;
    }
    var i, track, playlist = [];
    for (i = 0; i < localStorage.length; i++) {
        if (localStorage.key(i).slice(0, 6) === 'track.') {
            track = readTrack(localStorage.key(i).substring(6));
            if (track.playback.played === false || showAll === true) {
                playlist.push(track);
            }
        }
    }
    playlist.sort(sortTracks);
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
            entryUI.data('trackuri', playlist[i].uri);
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

/** Functions for playback */
var activateTrack = function(track) {
    "use strict";
    var mediaUrl, audioTag, mp3SourceTag;
    $(audioTag).off('timeupdate');
    if (track) {
        if (track.offlineMediaUrl) {
            mediaUrl =  track.offlineMediaUrl;
        } else {
            mediaUrl = track.mediaUrl;
        }
        if ($('#player audio').length > 0) {
            audioTag = $('#player audio')[0];
            $(audioTag).find('source[type="audio/mpeg"]').attr('src', mediaUrl);
            $(audioTag).attr('title', track.title);
        } else {
            $('#mediacontrol > p').remove();
            audioTag = $('<audio controls="controls" preload="metadata">');
            mp3SourceTag = $('<source type="audio/mpeg" />');
            mp3SourceTag.attr('src', mediaUrl);
            audioTag.append(mp3SourceTag);
            audioTag.attr('title', track.title);
            $('#mediacontrol').prepend(audioTag);
        }
        //Styling
        $('#playlist').find('.activeTrack').removeClass('activeTrack');
        $('#playlist li').filter(function() { return $(this).data('trackuri') === track.uri; }).addClass('activeTrack');
    }
};
var playTrack = function(track) {
    "use strict";
    if (track) {
        activateTrack(track);
        $('#player audio')[0].load();
    }
};

/** Central 'ready' event handler */
$(document).ready(function() {
    "use strict";
    //Player UI Events
    $('#player #playPreviousTrack').on('click', function() {
        playTrack(previousTrack());
    });
    $('#player #playNextTrack').on('click', function() {
        playTrack(nextTrack());
    });
    $('#player #jumpBackwards').on('click', function() {
        var audioTag = $('#player audio')[0];
        audioTag.currentTime = Math.max(0, audioTag.currentTime - 10);
    });
    $('#player #jumpForwards').on('click', function() {
        var audioTag = $('#player audio')[0];
        audioTag.currentTime = Math.min(audioTag.duration, audioTag.currentTime + 10);
    });
    //Playlist UI Events
    $('#playlist').on('click', 'li', function(event) {
        event.preventDefault();
        event.stopPropagation();
        //Play track
        $('#player audio')[0].autoplay = true;
        playTrack(readTrack($(this).data('trackuri')));
    });
    $('#playlist').on('click', '.download', function(event) {
        event.preventDefault();
        event.stopPropagation();
        var track;
        track = readTrack($(this).closest('li').data('trackuri'));
        logHandler('Downloading file ' + track.mediaUrl);
        downloadTrack(track, 'audio/mp3');
    });
    $('#playlist').on('click', '.delete', function(event) {
        event.preventDefault();
        event.stopPropagation();
        var track;
        track = readTrack($(this).closest('li').data('trackuri'));
        deleteBlob(track);
    });
    $('#playlist').on('click', '.status', function(event) {
        event.preventDefault();
        event.stopPropagation();
        var track;
        track = readTrack($(this).closest('li').data('trackuri'));
        toggleTrackStatus(track);
    });
    $('#playlist .functions').on('click', 'a', function(event) {
        event.stopPropagation();
    });
    $('#playlist #updatePlaylist').on('click', function(event) {
        event.preventDefault();
        event.stopPropagation();
        var i, j, sources, tracks;
        sources = readSourceList();
        for (i = 0; i < sources.length; i++) {
            tracks = downloadSource(sources[i]);
            //Save Tracks to local storage
            for (j = 0; j < tracks.length; j++) {
                if (localStorage.getItem('track.' + tracks[j].uri)) {
                    //TODO Update einbauen
                } else {
                    writeTrack(tracks[j]);
                }
            }
        }
        renderPlaylist(readPlaylist());
    });
    $('#playlist #showFullPlaylist').on('click', function(event) {
        event.preventDefault();
        event.stopPropagation();
        renderPlaylist(readPlaylist(true));
    });
    //Sources UI Events
    $('#addFeedUrlButton').on('click', function(event) {
        event.preventDefault();
        event.stopPropagation();
        writeSource({'uri': $('#addFeedUrlInput').val()});
        downloadSource(readSource($('#addFeedUrlInput').val()));
        renderSourceList(readSourceList());
        renderPlaylist(readPlaylist());
    });
    //Configuration UI Events
    $('#configuration #saveConfigurationButton').on('click', function(event) {
        event.preventDefault();
        event.stopPropagation();
        localStorage.setItem("configuration.proxyUrl", $('#httpProxyInput').val());
    });
    navigator.persistentStorage.queryUsageAndQuota(function (usage, quota) {
        var availableSpace = quota - usage;
        if (availableSpace <= (1024 * 1024 * 20)) {
            logHandler('You are out of space! Please allow more then ' + quota / 1024 / 1024 + 'MB of space');
        }
    }, errorHandler);
    navigator.persistentStorage.requestQuota(1024 * 1024 * 500, function(grantedBytes) {
        logHandler('Allow access to local file system with ' + grantedBytes / 1024 / 1024 + 'MB');
    }, function(e) {
        errorHandler(e);
    });
    renderConfiguration();
    renderSourceList(readSourceList());
    renderPlaylist(readPlaylist());
    playTrack(readTrack($('#playlist li:first-child').data('trackuri')));
    //Player Events
    $('#player audio').on('loadstart', function() {
        logHandler("==============================================", 'debug');
        logHandler("Start loading " + activeTrack().title, 'debug');
    });
    $('#player audio').on('loadedmetadata', function() {
        logHandler("Load metadata of " + activeTrack().title);
        $(this).on('timeupdate', function(event) {
            var track = activeTrack();
            if (track) {
                if (event.target.currentTime > (track.playback.currentTime + 10) || event.target.currentTime < (track.playback.currentTime - 10)) {
                    track.playback.currentTime = Math.floor(event.target.currentTime / 10) * 10;
                    writeTrack(track);
                    logHandler('Current timecode is ' + track.playback.currentTime + '.', 'debug');
                }
            }
        });
    });
    $('#player audio').on('canplay', function() {
        logHandler(activeTrack().title + " is ready to play");
    });
    $('#player audio').on('canplaythrough', function() {
        logHandler(activeTrack().title + " is realy ready to play (\"canplaythrough\")");
    });
    $('#player audio').on('playing', function() {
        logHandler(activeTrack().title + " is playing", 'info');
        this.autoplay = true;
    });
    $('#player audio').on('ended', function() {
        logHandler(activeTrack().title + " is ended");
        var track = activeTrack();
        toggleTrackStatus(track);
        //Plays next Track in Playlist
        playTrack(nextTrack());
    });
    $('#player audio').on('error', function(error) {
        errorHandler(error);
    });
    $('#player audio').on('error', function(error) {
        errorHandler(error);
    });
    $('#player audio').on('durationchange', function(event) {
        logHandler("Duration of " + activeTrack().title + " is changed to " + event.currentTarget.duration + ".", 'info');
        var track = activeTrack();
        if (track && this.duration > track.playback.currentTime && this.currentTime < track.playback.currentTime) {
            this.currentTime = track.playback.currentTime;
        }
    });
});