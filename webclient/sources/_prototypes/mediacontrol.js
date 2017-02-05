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
    //Player Events
    $('#player audio').on('loadstart', function() {
        logHandler("Start loading " + $(this).attr('title'));
    });
    $('#player audio').on('loadedmetadata', function() {
        logHandler("Load metadata of " + $(this).attr('title'));
    });
    $('#player audio').on('canplay', function() {
        logHandler($(this).attr('title') + " is ready to play");
    });
    $('#player audio').on('canplaythrough', function() {
        logHandler($(this).attr('title') + " is realy ready to play (\"canplaythrough\")");
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
	playTrack($('#playlist li:first-child').find('.title a').attr('href'));
});