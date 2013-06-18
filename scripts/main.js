/*global window */
/*global document */
/*global console */
/*global Blob */
/*global XMLHttpRequest */
/*global localStorage */
/*global $ */

/** Global Variables */
if (!window.TEMPORARY) {
    window.TEMPORARY = 0;
}
var fileSystemSize = 1024 * 1024 * 50; /*50 MB */
var fileSystemStatus = window.TEMPORARY;

/** General helpers */
// Take care of vendor prefixes.
window.URL = window.URL || window.webkitURL;
window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
var ErrorHandler = function(error) {
    "use strict";
    console.log('An error occured: ', error);
    $('#statusbar').prepend('<span class="error">' + error + '</span></br>');
};
var SuccessHandler = function(event) {
    "use strict";
    console.log('Operation completed: ', event);
    $('#statusbar').prepend('<span class="success">' + event + '</span></br>');
};
var logHandler = function(message) {
    "use strict";
    console.log('Log entry: ' + message);
    $('#statusbar').prepend('<span>' + message + '</span></br>');
};


/** The following functions handles the list of sources to refresh the playlist*/
var loadSourceList = function() {
    "use strict";
    var sourcelist = JSON.parse(localStorage.getItem('sourcelist'));
    if (!sourcelist) {
        sourcelist = {'feeds': [] };
    } else if (!sourcelist.feeds) {
        sourcelist.feeds = [];
    }
    return sourcelist;
};

var saveSourceList = function(sourcelist) {
    "use strict";
    localStorage.setItem('sourcelist', JSON.stringify(sourcelist));
};

var clearSourceList = function() {
    "use strict";
    localStorage.removeItem('sourcelist');
};

var renderSourceList = function(sourcelist) {
    "use strict";
    var sourcelistUI = $('#sourcelist .entries'), entryUI, i;
    sourcelistUI.empty();
    if (sourcelist && sourcelist.feeds) {
        for (i = 0; i < sourcelist.feeds.length; i++) {
            entryUI = $('<li>');
            entryUI.append('<a href="' + sourcelist.feeds[i] + '">' + sourcelist.feeds[i] + '</a>');
            //TODO delete function
            sourcelistUI.append(entryUI);
        }
    }
};


/** The following functions handles the central Playlist */
var loadPlaylist = function() {
    "use strict";
    var playlist = JSON.parse(localStorage.getItem('playlist'));
    if (!playlist) {
        playlist = {'entries': [] };
    } else if (!playlist.entries) {
        playlist.entries = [];
    }
    return playlist;
};

var savePlaylist = function(playlist) {
    "use strict";
    localStorage.setItem('playlist', JSON.stringify(playlist));
};

var clearPlaylist = function() {
    "use strict";
    localStorage.removeItem('playlist');
};

var renderPlaylist = function(playlist) {
    "use strict";
    var playlistUI = $('#playlist .entries'), playlistEntryUI, i;
    playlistUI.empty();
    if (playlist && playlist.entries) {
        for (i = 0; i < playlist.entries.length; i++) {
            playlistEntryUI = $('<li>');
            playlistEntryUI.data('trackid', playlist.entries[i].uri);
            playlistEntryUI.append('<a href="' + playlist.entries[i].uri + '">' + playlist.entries[i].title + '</a>');
            if (window.requestFileSystem) {
                if (playlist.entries[i].offlineUrl) {
                    playlistEntryUI.append(' | <a class="downloadTrackFile" href="' + playlist.entries[i].mediaUrl + '">Delete</a>');
                } else {
                    playlistEntryUI.append(' | <a class="downloadTrack" href="' + playlist.entries[i].mediaUrl + '">Download</a>');
                }
            }
            playlistUI.append(playlistEntryUI);
        }
    }
};

var loadTrack = function(trackID) {
    "use strict";
    logHandler("Load Track " + trackID);
    var playlist = loadPlaylist(), i;
    for (i = 0; i < playlist.entries.length; i++) {
        if (playlist.entries[i].uri === trackID) {
            return playlist.entries[i];
        }
    }
};

var saveTrack = function(track, blob, fileName, opt_callback) {
    "use strict";
    window.requestFileSystem(fileSystemStatus, fileSystemSize, function(filesystem) {
        filesystem.root.getFile(fileName, {create: true, exclusive: false}, function(fileEntry) {
            fileEntry.createWriter(function(writer) {
                if (opt_callback) {
                    writer.onwrite = opt_callback;
                }
                writer.write(blob);
            }, ErrorHandler);

            var playlist = loadPlaylist(), k = playlist.entries.length;
            while (k--) {
                if (track.uri === playlist.entries[k].uri) {
                    playlist.entries[k].offlineUrl = fileEntry.toURL();
                }
            }
            savePlaylist(playlist);
        }, ErrorHandler);
    }, ErrorHandler);
};

var loadActiveTrack = function() {
    "use strict";
    var track = JSON.parse(localStorage.getItem('track.active'));
    return track;
};

var saveActiveTrack = function(track) {
    "use strict";
    localStorage.setItem('track.active', JSON.stringify(track));
};

/** The following functions handles Tracks */
var playTrack = function(track) {
    "use strict";
    $('#player audio').off('timeupdate');
    var audioTag = $('#player audio')[0];
    if (typeof track === 'string') {
        track = loadTrack(track);
    }
    saveActiveTrack(track);

    if (track.offlineUrl) {
        $(audioTag).attr('src', track.offlineUrl);
        audioTag.load(track.offlineUrl);
    } else {
        $(audioTag).attr('src', track.mediaUrl);
        audioTag.load(track.mediaUrl);
    }
    $(audioTag).attr('title', track.title);
    $(audioTag).attr('controls', 'controls');
};

var downloadTrack = function(trackID, url, mimeType) {
    "use strict";
    var track = loadTrack(trackID), xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';

    xhr.onload = function() {
        if (this.status === 200) {
            var blob = new Blob([xhr.response], {type: mimeType}), parts = url.split('/'), fileName = parts[parts.length - 1];
            // Write file to the root directory.
            saveTrack(track, blob, fileName, SuccessHandler);
        }
    };
    xhr.send(null);
};


/** Comunication with the obscure thing named "Internet" */
var countDownloadsPerSession = 0;
var downloadTrackList = function() {
    "use strict";
    var tracks = [], sourcelist = loadSourceList(), playlist = loadPlaylist(), successfunction, i, k, existsTrackInPlaylist;
    successfunction = function(data, textStatus, jqXHR) {
        var xml = $(data);
        $(xml).find('entry').has('link[rel=enclosure]').slice(0, 15).each(function() {
            tracks.push({'uri': $(this).find('id:first').text(), 'title': $(this).find('title:first').text(), 'mediaUrl' : $(this).find('link[rel=enclosure]:first').attr('href'), 'updated' : $(this).find('updated:first').text() });
        });
    };
    for (i = 0; i < sourcelist.feeds.length; i++) {
        $.ajax({
            'url': sourcelist.feeds[i],
            'async': false,
            'dataType': 'xml',
            'success': successfunction
        });
    }
    k = playlist.entries.length;
    existsTrackInPlaylist = false;
    for (i = 0; i < tracks.length; i++) {
        while (k--) {
            if (tracks[i].uri === playlist.entries[k].uri) {
                existsTrackInPlaylist = true;
                //TODO update entry
            }
        }
        if (!existsTrackInPlaylist) {
            playlist.entries.push(tracks[i]);
        }
    }
    countDownloadsPerSession++;
    savePlaylist(playlist);
};


/** Central 'ready" event handler */
$(document).ready(function() {
    "use strict";
    $('#playlist').on('click', 'li', function(event) {
        event.preventDefault();
        event.stopPropagation();

        //Sytyling
        $(this).parent().children('.active').removeClass('active');
        $(this).addClass('active');

        //Play track
        playTrack($(this).data('trackid'));
    });
    $('#playlist .entries').on('click', '.downloadTrack', function(event) {
        event.preventDefault();
        event.stopPropagation();

        $('#statusbar').text('Start download of file ' + $(this).attr('href') + '.');

        downloadTrack($(this).parent().data('trackid'), $(this).attr('href'), 'audio/mp3');
        renderPlaylist(loadPlaylist());
    });
    //TODO Eventhandler for Deleting Track-Files
    $('#addFeedUrlButton').on('click', function(event) {
        event.preventDefault();
        event.stopPropagation();

        var sourcelist = loadSourceList();
        sourcelist.feeds.push($('#addFeedUrlInput').val());
        saveSourceList(sourcelist);
        renderSourceList(sourcelist);
    });
    $('.refresh').on('click', function(event) {
        event.preventDefault();
        event.stopPropagation();

        downloadTrackList();
        renderPlaylist(loadPlaylist());

    });
    $('.clearPlaylist').on('click', function(event) {
        event.preventDefault();
        event.stopPropagation();

        clearPlaylist();
        renderPlaylist(loadPlaylist());
    });
    $('.clearFeeds').on('click', function(event) {
        event.preventDefault();
        event.stopPropagation();

        clearSourceList();
        renderSourceList(loadSourceList());
    });

    renderPlaylist(loadPlaylist());
    renderSourceList(loadSourceList());
    playTrack(loadActiveTrack());

    $('#player audio').on('playing', function() {
        logHandler('Playing ' + loadActiveTrack().title);
    });
    $('#player audio').on('loadedmetadata', function() {
        var track = loadActiveTrack();
        if (track.playback && track.playback.time) {
            this.currentTime = track.playback.time;
        }
        this.play();
        $(this).on('timeupdate', function(event) {
            var track = loadActiveTrack();
            if (!track.playback) {
                track.playback = {'time': 0};
            }
            track.playback.time = Math.floor(event.target.currentTime / 10) * 10;
            saveActiveTrack(track);
        });
    });
});