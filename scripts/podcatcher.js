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
    logHandler(event, 'info');
};
var progressHandler = function(progressEvent) {
    "use strict";
    var percentComplete;
    if (progressEvent.lengthComputable) {
        percentComplete = progressEvent.loaded / progressEvent.total;
        console.log('Download: ' + percentComplete * 100 + '%');
    } else {
        console.log('Downloading...');
    }
};

/** User interface functions */
var actualiseEpisodeUI = function(episode) {
    "use strict";
    $('#playlist .entries li').each(function() {
        if ($(this).data('episodeUri') === episode.uri) {
            // Status
            if (episode.playback.played) {
                $(this).find('.status').text("Status: played");
            } else {
                $(this).find('.status').text("Status: new");
            }
            // Download/Delete link
            if (episode.offlineMediaUrl) {
                $(this).find('.download').replaceWith('<a class="delete" href="' + episode.offlineMediaUrl + '">Delete</a>');
            } else {
                $(this).find('.delete').replaceWith('<a class="download" href="' + episode.mediaUrl + '" download="' + episode.mediaUrl.slice(episode.mediaUrl.lastIndexOf()) + '">Download</a>');
            }
            return false;
        }
    });
};

/** Functions for configuration */
var renderConfiguration = function() {
    "use strict";
    if (localStorage.getItem("configuration.proxyUrl")) {
        $('#httpProxyInput').val(localStorage.getItem("configuration.proxyUrl"));
    }
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
                writer.onwrite = function() {
                    logHandler('Writing to disk...', 'debug');
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
    xhr.addEventListener("progress", progressHandler, false);
    xhr.addEventListener("abort", logHandler, false);
    xhr.addEventListener("error", function() {
        logHandler('Direct download failed. Try proxy: ' + localStorage.getItem("configuration.proxyUrl").replace("$url$", episode.mediaUrl), 'warning');
        var xhrProxy = new XMLHttpRequest();
        xhrProxy.open('GET', localStorage.getItem("configuration.proxyUrl").replace("$url$", episode.mediaUrl), true);
        xhrProxy.responseType = 'arraybuffer';
        xhrProxy.addEventListener("progress", progressHandler, false);
        xhrProxy.addEventListener("abort", logHandler, false);
        xhrProxy.addEventListener("error", errorHandler, false);
        xhrProxy.onload = function() {
            if (this.status === 200) {
                logHandler('Download of file "' + episode.mediaUrl + '" via proxy is finished', 'debug');
                saveFile(episode, xhrProxy.response, mimeType);
            } else {
                logHandler('Error Downloading file "' + episode.mediaUrl + '" via proxy: ' + this.statusText + ' (' + this.status + ')', 'error');
            }
        };
        xhrProxy.send(null);
    }, false);
    xhr.onload = function() {
        if (this.status === 200) {
            logHandler('Download of file "' + episode.mediaUrl + '" is finished', 'debug');
            saveFile(episode, xhr.response, mimeType);
        } else {
            logHandler('Error Downloading file "' + episode.mediaUrl + '": ' + this.statusText + ' (' + this.status + ')', 'error');
        }
    };
    xhr.send(null);
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
    //logHandler('Saving Episode with timecode ' + episode.playback.currentTime, 'debug');
    localStorage.setItem('episode.' + episode.uri, JSON.stringify(episode));
    actualiseEpisodeUI(episode);
};
var sortEpisodes = function(firstEpisode, secondEpisode) {
    "use strict";
    return secondEpisode.updated < firstEpisode.updated;
};
var toggleEpisodeStatus = function(episode) {
    "use strict";
    episode.playback.played = !episode.playback.played;
    episode.playback.currentTime = 0;
    if (episode.offlineMediaUrl) {
        deleteFile(episode);
    }
    writeEpisode(episode);
};
var activeEpisode = function() {
    "use strict";
    var activeEpisode = $('#playlist').find('.activeEpisode');
    return readEpisode(activeEpisode.data('episodeUri'));
};
var previousEpisode = function() {
    "use strict";
    var activeEpisode = $('#playlist').find('.activeEpisode');
    return readEpisode(activeEpisode.prev().data('episodeUri'));
};
var nextEpisode = function() {
    "use strict";
    var activeEpisode = $('#playlist').find('.activeEpisode');
    return readEpisode(activeEpisode.next().data('episodeUri'));
};

/** Functions for Sources/Feeds */
var readSource = function(sourceUri) {
    "use strict";
    var source;
    source = JSON.parse(localStorage.getItem('source.' + sourceUri));
    if (!source) {
        source = { 'uri': sourceUri };
    }
    return source;
};
var writeSource = function(source) {
    "use strict";
    localStorage.setItem('source.' + source.uri, JSON.stringify(source));
};
var deleteSource = function(source) {
    "use strict";
    localStorage.removeItem('source.' + source.uri);
};
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
        if (localStorage.getItem("configuration.proxyUrl")) {
            logHandler(source.uri + " can not loaded directly; using proxy");
            $.ajax({
                'url': localStorage.getItem("configuration.proxyUrl").replace("$url$", source.uri),
                'async': false,
                'dataType': 'xml',
                'success': successfunction,
                'error': function() { logHandler(source.uri + " can not loaded using proxy", 'error'); }
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
    return parserresult;
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
var renderSource = function(source) {
    "use strict";
    var entryUI, entryFunctionsUI;
    entryUI = $('<li>');
    entryUI.data('sourceuri', source.uri);
    entryUI.append('<h3 class="title">' + source.title + '<h3>');
    entryUI.append('<p class="description">' + source.description + '</p>');
    entryUI.append('<p class="uri"><a href="' + source.uri + '">' + source.uri + '</a></p>');
    entryFunctionsUI = $('<span class="functions">');
    entryFunctionsUI.append('<a class="link" href="' + source.link + '">Internet</a> ');
    entryFunctionsUI.append('<a class="deleteSource" href="' + source.uri + '">Delete</a>');
    entryUI.append(entryFunctionsUI);
    return entryUI;
};
var renderSourceList = function(sourcelist) {
    "use strict";
    var sourcelistUI, entryUI, i;
    sourcelistUI = $('#sources .entries');
    sourcelistUI.empty();
    if (sourcelist && sourcelist.length > 0) {
        for (i = 0; i < sourcelist.length; i++) {
            entryUI = renderSource(sourcelist[i]);
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

/** Functions for playback */
var activateEpisode = function(episode) {
    "use strict";
    var mediaUrl, audioTag, mp3SourceTag;
    $('#player audio').off('timeupdate');
    logHandler("Timeupdate off", 'debug');
    if (episode) {
        if (episode.offlineMediaUrl) {
            mediaUrl =  episode.offlineMediaUrl;
        } else {
            mediaUrl = episode.mediaUrl;
        }
        if ($('#player audio').length > 0) {
            audioTag = $('#player audio')[0];
            $(audioTag).find('source[type="audio/mpeg"]').attr('src', mediaUrl);
            $(audioTag).attr('title', episode.title);
        } else {
            $('#mediacontrol > p').remove();
            audioTag = $('<audio controls="controls" preload="metadata">');
            mp3SourceTag = $('<source type="audio/mpeg" />');
            mp3SourceTag.attr('src', mediaUrl);
            audioTag.append(mp3SourceTag);
            audioTag.attr('title', episode.title);
            $('#mediacontrol').prepend(audioTag);
        }
        //Styling
        $('#playlist').find('.activeEpisode').removeClass('activeEpisode');
        $('#playlist li').filter(function() { return $(this).data('episodeUri') === episode.uri; }).addClass('activeEpisode');
    }
};
var playEpisode = function(episode) {
    "use strict";
    if (episode) {
        activateEpisode(episode);
        $('#player audio')[0].load();
    }
};

/** Central 'ready' event handler */
$(document).ready(function() {
    "use strict";
    //Update local storage to actual version
    var k;
    for (k = 0; k < localStorage.length; k++) {
        if (localStorage.key(k).slice(0, 6) === 'track.') {
            localStorage.setItem(localStorage.key(k).replace('track.', 'episode.'), localStorage.getItem(localStorage.key(k)));
            localStorage.removeItem(localStorage.key(k));
        }
    }
    //Player UI Events
    $('#player #playPreviousEpisode').on('click', function() {
        playEpisode(previousEpisode());
    });
    $('#player #playNextEpisode').on('click', function() {
        playEpisode(nextEpisode());
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
        //Play episode
        $('#player audio')[0].autoplay = true;
        playEpisode(readEpisode($(this).data('episodeUri')));
    });
    $('#playlist').on('click', '.download', function(event) {
        event.preventDefault();
        event.stopPropagation();
        var episode;
        episode = readEpisode($(this).closest('li').data('episodeUri'));
        logHandler('Downloading file "' + episode.mediaUrl + '" starts now.', 'info');
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
    $('#playlist').on('click', '.status', function(event) {
        event.preventDefault();
        event.stopPropagation();
        var episode;
        episode = readEpisode($(this).closest('li').data('episodeUri'));
        toggleEpisodeStatus(episode);
        if (episode.playback.played) {
            $(this).text("Status: played");
        } else {
            $(this).text("Status: new");
        }
    });
    $('#playlist .functions').on('click', 'a', function(event) {
        event.stopPropagation();
    });
    $('#playlist #updatePlaylist').on('click', function(event) {
        event.preventDefault();
        event.stopPropagation();
        var i, j, sources, parserresult;
        sources = readSourceList();
        for (i = 0; i < sources.length; i++) {
            parserresult = downloadSource(sources[i]);
            //Update source in storage
            writeSource(parserresult.source);
            //Save Episodes to local storage
            for (j = 0; j < parserresult.episodes.length; j++) {
                //Save all Episodes in the parser result
                writeEpisode(parserresult.episodes[j]);
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
    $('#sources').on('click', '.deleteSource', function(event) {
        event.preventDefault();
        event.stopPropagation();
        var source, i;
        source = readSource($(this).closest('li').data('sourceuri'));
        deleteSource(source);
        for (i = 0; i < $('#sources .entries li').length; i++) {
            if ($($('#sources .entries li')[i]).data('sourceuri') === source.uri) {
                $($('#sources .entries li')[i]).slideUp(400, function() {$(this).remove(); });
                break;
            }
        }
    });
    $('#sources').on('click', '.link', function(event) {
        event.preventDefault();
        event.stopPropagation();
        window.open($(this).attr('href'), '_blank');
    });
    $('#addSourceButton').on('click', function(event) {
        event.preventDefault();
        event.stopPropagation();
        var parserresult, entryUI, i;
        parserresult = downloadSource(readSource($('#addSourceUrlInput').val()));
        writeSource(parserresult.source);
        entryUI = renderSource(parserresult.source);
        for (i = 0; i < $('#sources .entries li').length; i++) {
            if ($($('#sources .entries li')[i]).data('sourceuri') === parserresult.source.uri) {
                $($('#sources .entries li')[i]).slideUp().html(entryUI.html()).slideDown();
                i = -1;
                break;
            }
        }
        if (i !== -1) {
            entryUI.hide();
            $('#sources .entries').append(entryUI);
            entryUI.fadeIn();
        }
        for (i = 0; i < parserresult.episodes.length; i++) {
            //Save all Episodes in the parser result
            writeEpisode(parserresult.episodes[i]);
        }
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
    //Player Events
    renderConfiguration();
    renderSourceList(readSourceList());
    renderPlaylist(readPlaylist());
    playEpisode(readEpisode($('#playlist li:first-child').data('episodeUri')));
    $('#player audio').on('loadstart', function() {
        logHandler("==============================================", 'debug');
        logHandler("Start loading " + activeEpisode().title, 'debug');
    });
    $('#player audio').on('loadedmetadata', function() {
        logHandler("Load metadata of " + activeEpisode().title);
    });
    $('#player audio').on('canplay', function() {
        logHandler(activeEpisode().title + " is ready to play");
    });
    $('#player audio').on('canplaythrough', function() {
        logHandler(activeEpisode().title + " is realy ready to play (\"canplaythrough\")");
    });
    $('#player audio').on('playing', function() {
        logHandler(activeEpisode().title + " is playing", 'info');
        this.autoplay = true;
    });
    $('#player audio').on('ended', function() {
        logHandler(activeEpisode().title + " is ended");
        var episode = activeEpisode();
        toggleEpisodeStatus(episode);
        //Plays next Episode in Playlist
        playEpisode(nextEpisode());
    });
    $('#player audio').on('error', function(error) {
        errorHandler(error);
    });
    $('#player audio').on('durationchange', function(event) {
        logHandler("Duration of " + activeEpisode().title + " is changed to " + event.currentTarget.duration + ".", 'debug');
        var episode = activeEpisode();
        if (episode && this.duration > episode.playback.currentTime && this.currentTime <= episode.playback.currentTime) {
            logHandler("CurrentTime will set to " + episode.playback.currentTime + " seconds", 'debug');
            this.currentTime = episode.playback.currentTime;
            $(this).on('timeupdate', function(event) {
                //logHandler("Timeupdate reached", 'debug');
                var episode = activeEpisode();
                if (episode && (event.target.currentTime > (episode.playback.currentTime + 10) || event.target.currentTime < (episode.playback.currentTime - 10))) {
                    episode.playback.currentTime = Math.floor(event.target.currentTime / 10) * 10;
                    writeEpisode(episode);
                    logHandler('Current timecode is ' + episode.playback.currentTime + '.', 'debug');
                }
            });
            logHandler("Timeupdate on", 'debug');
        }
    });
    playEpisode(readEpisode($('#playlist li:first-child').data('episodeUri')));
});