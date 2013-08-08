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
/*global window */
/*global document */
/*global console */
/*global Blob */
/*global XMLHttpRequest */
/*global localStorage */
/*global $ */
var errorHandler = function(error) {
    "use strict";
    console.log('An error occured: ', error);
    $('#statusbar').prepend('<span class="error">' + error + '</span></br>');
};
var successHandler = function(event) {
    "use strict";
    console.log('Operation completed: ', event);
    $('#statusbar').prepend('<span class="success">' + event + '</span></br>');
};
var logHandler = function(message) {
    "use strict";
    console.log('Log entry: ' + message);
    $('#statusbar').prepend('<span>' + message + '</span></br>');
};

var sortTracks = function(firstTrack, secondTrack) {
    "use strict";
    return firstTrack.updated < secondTrack.updated;
};

var renderPlaylist = function(playlist) {
    "use strict";
    var playlistUI, playlistEntryUI, entryFunctionsUI, i;
    playlistUI = $('#playlist .entries');
    playlistUI.empty();
    playlist.sort(sortTracks);
    if (playlist) {
        for (i = 0; i < playlist.length; i++) {
            playlistEntryUI = $('<li>');
            playlistEntryUI.data('trackid', playlist[i].uri);
            playlistEntryUI.append('<h3 class="title"><a href="' + playlist[i].uri + '">' + playlist[i].title + '</a></h3>');
            playlistEntryUI.append('<span class="source">' + playlist[i].source + '</span>');
            playlistEntryUI.append('<span class="updated">' + playlist[i].updated.toLocaleDateString() + " " + playlist[i].updated.toLocaleTimeString() + '</span>');
            entryFunctionsUI = $('<span class="functions">');
            entryFunctionsUI.append('<a class="origin" href="' + playlist[i].uri + '">Internet</a>');
            entryFunctionsUI.append('<a class="download" href="' + playlist[i].mediaUrl + '" download="' + playlist[i].mediaUrl.slice(playlist[i].mediaUrl.lastIndexOf()) + '">Download</a>');
            playlistEntryUI.append(entryFunctionsUI);
            playlistUI.append(playlistEntryUI);
        }
    }
};

var readSourceList = function() {
    "use strict";
    var sources = ['http://feeds.feedburner.com/cre-podcast', 'http://chaosradio.ccc.de/chaosradio-latest.rss'];
    return sources;
};

var parseFeed = function(feed, tracks) {
    "use strict";
    var xml = $(feed);
    xml.find('item').has('enclosure').slice(0, 5).each(function() {
        tracks.push({
            'uri': $(this).find('link:first').text(),
            'title': $(this).find('title:first').text(),
            'mediaUrl' : $(this).find('enclosure:first').attr('url'),
            'updated' : new Date($(this).find('pubDate:first').text()),
            'source' : xml.find('channel > title').text()
        });
    });
};
var downloadSource = function(source) {
    "use strict";
    var tracks, successfunction, errorfunction;
    tracks = [];
    successfunction = function(data) {
        parseFeed(data, tracks);
    };
    errorfunction = function() {
        $.ajax({
            'url': "sourceparsing.py?url=" + source,
            'async': false,
            'dataType': 'xml',
            'success': successfunction
        });
    };
    try {
        $.ajax({
            'url': source,
            'async': false,
            'dataType': 'xml',
            'success': successfunction,
            'error': errorfunction
        });
    } catch (ignore) {}
    return tracks;
};

/** Central 'ready' event handler */
$(document).ready(function() {
    "use strict";
    $('#playlist #updatePlaylist').on('click', function(event) {
        event.preventDefault();
        event.stopPropagation();
        var i, tracks = [], sources;
        sources = readSourceList();
        for (i = 0; i < sources.length; i++) {
            tracks = tracks.concat(downloadSource(sources[i]));
        }
        renderPlaylist(tracks);
    });
});