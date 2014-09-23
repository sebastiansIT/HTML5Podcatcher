﻿/*  Copyright 2014 Sebastian Spautz

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
/*global console */
/*global confirm */
/*global applicationCache */
/*global localStorage */
/*global $ */
var GlobalUserInterfaceHelper = {
    formatTimeCode: function (timecode) {
        "use strict";
        var hours, minutes, seconds;
        hours = Math.floor(timecode / 3600);
        minutes = Math.floor((timecode % 3600) / 60);
        seconds = timecode % 60;
        hours = (hours < 10) ? "0" + hours : hours;
        minutes = (minutes < 10) ? "0" + minutes : minutes;
        seconds = (seconds < 10) ? "0" + seconds : seconds;
        return hours + ':' + minutes + ':' + seconds;
    },
    escapeHtml: function (text) {
        "use strict";
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },
    logHandler: function (message, loglevel) {
        "use strict";
        if (loglevel.indexOf(":") >= 0) {
            loglevel = loglevel.substring(0, loglevel.indexOf(":"));
        }
        console.log(loglevel + ': ' + message);
        $('#statusbar').prepend('<span class=' + loglevel + '>' + message + '</span></br>');
    },
    errorHandler: function (event) {
        "use strict";
        var eventstring = event.toString() + ' {';
        $.each(event, function (i, n) {
            eventstring += i + ': "' + n + '"; ';
        });
        eventstring += '}';
        this.logHandler(this.escapeHtml(eventstring), 'error');
    },
    successHandler: function (event) {
        "use strict";
        this.logHandler(event, 'info');
    },
    settings: {
        set: function (key, value) {
            "use strict";
            localStorage.setItem('settings.' + key, value);
        },
        get: function (key) {
            "use strict";
            return localStorage.getItem('settings.' + key);
        }
    },
    initApplicationCacheEvents: function () {
        "use strict";
        $(applicationCache).on('checking', function () {
            GlobalUserInterfaceHelper.logHandler("Application cache checks for updates (Cache status: " + applicationCache.status + ")", 'debug');
            $('#applicationCacheLog').prepend('<span>' + "Application cache check for updates" + '</span></br>');
        });
        $(applicationCache).on('noupdate', function () {
            GlobalUserInterfaceHelper.logHandler("Application cache founds no update (Cache status: " + applicationCache.status + ")", 'debug');
            $('#applicationCacheLog').prepend('<span>' + "Application cache founds no update" + '</span></br>');
        });
        $(applicationCache).on('downloading', function () {
            GlobalUserInterfaceHelper.logHandler("Application cache download updated files (Cache status: " + applicationCache.status + ")", 'debug');
            $('#applicationCacheLog').prepend('<span>' + "Application cache download updated files" + '</span></br>');
        });
        $(applicationCache).on('progress', function () {
            GlobalUserInterfaceHelper.logHandler("Application cache downloading files (Cache status: " + applicationCache.status + ")", 'debug');
            $('#applicationCacheLog').prepend('<span>' + "Application cache downloading files" + '</span></br>');
        });
        $(applicationCache).on('cached', function () {
            GlobalUserInterfaceHelper.logHandler("Application cached (Cache status: " + applicationCache.status + ")", 'debug');
            $('#applicationCacheLog').prepend('<span>' + "Application cached" + '</span></br>');
        });
        $(applicationCache).on('updateready', function () {
            GlobalUserInterfaceHelper.logHandler("Application cache is updated (Cache status: " + applicationCache.status + ")", 'info');
            $('#applicationCacheLog').prepend('<span>' + "Application cache is updated" + '</span></br>');
            applicationCache.swapCache();
            if (confirm("An update of HTML5 Podcatcher is available. Do you want to reload now?")) {
                window.location.reload();
            }
        });
        $(applicationCache).on('obsolete', function () {
            GlobalUserInterfaceHelper.logHandler("Application cache is corrupted and will be deletet (Cache status: " + applicationCache.status + ")", 'error');
            $('#applicationCacheLog').prepend('<span>' + "Application cache is corrupted and will be deletet" + '</span></br>');
        });
        $(applicationCache).on('error', function () {
            GlobalUserInterfaceHelper.logHandler("Error downloading manifest or resources (Cache status: " + applicationCache.status + ")", 'error');
            $('#applicationCacheLog').prepend('<span>' + "Error downloading manifest or resources" + '</span></br>');
        });
    },
    initConnectionStateEvents: function () {
        "use strict";
        window.addEventListener('online',  function () {
            GlobalUserInterfaceHelper.logHandler("Online now", 'info');
            $('#updatePlaylist, .updateSource, .downloadFile').removeAttr('disabled');
        }, false);
        window.addEventListener('offline', function () {
            GlobalUserInterfaceHelper.logHandler("Offline now", 'info');
            $('#updatePlaylist, .updateSource, .downloadFile').attr('disabled', 'disabled');
        }, false);
    },
    initGeneralUIEvents: function () {
        "use strict";
        $('#statusbar').on('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            $(this).parent().toggleClass('fullscreen');
        });
    }
};
var UI = GlobalUserInterfaceHelper;