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
/*global applicationCache */
/*global escapeHtml */
/*global alert */
/*global $ */
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
    logHandler(escapeHtml(eventstring), 'error');
};
var successHandler = function(event) {
    "use strict";
    logHandler(event, 'info');
};

/** Playback */
var previousTrack = function() {
    "use strict";
    var activeTrack = $('#playlist').find('.activeTrack');
    return activeTrack.prev().find('.title a').attr('href');
};
var nextTrack = function() {
    "use strict";
    var activeTrack = $('#playlist').find('.activeTrack');
    return activeTrack.next().find('.title a').attr('href');
};
var activateTrack = function(trackurl) {
    "use strict";
    var audioTag = $('#player audio')[0];
    if (trackurl) {
        //Styling
        $('#playlist').find('.activeTrack').removeClass('activeTrack');
        $('#playlist').find('.title a[href="' + trackurl + '"]').closest('li').addClass('activeTrack');
        $(audioTag).find('source[type="audio/mpeg"]').attr('src', trackurl);
        $(audioTag).attr('title', trackurl);
    }
};
var playTrack = function(trackurl) {
    "use strict";
    var audioTag = $('#player audio')[0];
    if (trackurl) {
        activateTrack(trackurl);
        audioTag.load();
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
        playTrack($(this).find('.title a').attr('href'));
    });
    $('#playlist .functions').on('click', 'a', function(event) {
        event.stopPropagation();
    });
    $('#player audio').on('playing', function() {
        logHandler($(this).attr('title') + " is playing");
        this.autoplay = true;
    });
    $('#player audio').on('ended', function() {
        logHandler($(this).attr('title') + " is ended");
        //Plays next Track in Playlist
        playTrack(nextTrack());
    });
    //Application Cache Events
    $(applicationCache).on('checking', function() {
        logHandler("Application cache checks for updates (Cache status: " + applicationCache.status + ")", 'debug');
        $('#applicationCacheLog').prepend('<span>' + "Application cache check for updates" + '</span></br>');
    });
    $(applicationCache).on('noupdate', function() {
        logHandler("Application cache founds no update (Cache status: " + applicationCache.status + ")", 'debug');
        $('#applicationCacheLog').prepend('<span>' + "Application cache founds no update" + '</span></br>');
    });
    $(applicationCache).on('downloading', function() {
        logHandler("Application cache download updated files (Cache status: " + applicationCache.status + ")", 'debug');
        $('#applicationCacheLog').prepend('<span>' + "Application cache download updated files" + '</span></br>');
    });
    $(applicationCache).on('progress', function() {
        logHandler("Application cache downloading files (Cache status: " + applicationCache.status + ")", 'debug');
        $('#applicationCacheLog').prepend('<span>' + "Application cache downloading files" + '</span></br>');
    });
    $(applicationCache).on('cached', function() {
        logHandler("Application cached (Cache status: " + applicationCache.status + ")", 'debug');
        $('#applicationCacheLog').prepend('<span>' + "Application cached" + '</span></br>');
    });
    $(applicationCache).on('updateready', function() {
        logHandler("Application cache is updated (Cache status: " + applicationCache.status + ")", 'debug');
        $('#applicationCacheLog').prepend('<span>' + "Application cache is updated" + '</span></br>');
        applicationCache.swapCache();
        alert("An update of HTML5 Podcatcher is available. Please reload to activate the new Version");
    });
    $(applicationCache).on('obsolete', function() {
        logHandler("Application cache is corrupted and will be deletet (Cache status: " + applicationCache.status + ")", 'debug');
        $('#applicationCacheLog').prepend('<span>' + "Application cache is corrupted and will be deletet" + '</span></br>');
    });
    $(applicationCache).on('error', function() {
        logHandler("Error downloading manifest or resources (Cache status: " + applicationCache.status + ")", 'debug');
        $('#applicationCacheLog').prepend('<span>' + "Error downloading manifest or resources" + '</span></br>');
    });
    playTrack($('#playlist li:first-child').find('.title a').attr('href'));
});