/*  Copyright 2014, 2015 Sebastian Spautz

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
/*global window, navigator, document */
/*global console */
/*global confirm */
/*global applicationCache */
/*global localStorage */
/*global $ */
var GlobalUserInterfaceHelper = {
    formatTimeCode: function (timecode) {
        "use strict";
        //Validate Parameter to be a number
        if (isNaN(+timecode)) {
            throw new TypeError("Timecode needs to be a positiv integer");
        }
        //Validate Parameter to be a positiv number
        if (timecode < 0) {
            throw new RangeError("Timecode needs to be a positiv integer");
        }
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
        if (loglevel && loglevel.indexOf(":") >= 0) {
            loglevel = loglevel.substring(0, loglevel.indexOf(":"));
        }
        switch (loglevel) {
        case "debug":
            console.debug(message);
            break;
        case "info":
            console.info(message);
            break;
        case "warn":
            console.warn(message);
            break;
        case "error":
            console.error(message);
            break;
        default:
            console.log(loglevel + ': ' + message);
        }
        var logEntryNode = document.createElement("p");
        logEntryNode.className = loglevel;
        logEntryNode.appendChild(document.createTextNode(message));
        if (document.getElementById('log')) {
            document.getElementById('log').insertBefore(logEntryNode, document.getElementById('log').firstChild);
        }
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
        /*if (navigator.connection.type) {
            // New version      
            GlobalUserInterfaceHelper.logHandler("Connection changed to " + navigator.connection.type + " width a maximal downlink speed of " + navigator.connection.downlinkMax + " MiB", 'info');
            navigator.connection.addEventListener('typechange', function () {
                GlobalUserInterfaceHelper.logHandler("Connection changed to " + navigator.connection.type + " width a maximal downlink speed of " + navigator.connection.downlinkMax + " MiB", 'info');
            }, false);
        }*/
    },
    initGeneralUIEvents: function () {
        "use strict";
        $('#showLogView, #logView .closeDialog').on('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            $('#logView').toggleClass('fullscreen');
        });
        $('#appClose').on('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            window.open('', '_parent', '');
            window.close();
        });
    },
    renderSource: function (source) {
        "use strict";
        var entryUI;
        entryUI = $($('#sourceTemplate li')[0].cloneNode(true));
        entryUI.data('sourceUri', source.uri);
        entryUI.find('.title').text(source.title);
        entryUI.find('.link').attr('href', source.link);
        entryUI.find('.description').text(source.description);
        entryUI.find('.update').attr('href', source.uri);
        return entryUI;
    },
    renderSourceList: function (sourcelist) {
        "use strict";
        var sourcelistUI, entryUI, i;
        sourcelistUI = $('#sourceslist .entries');
        sourcelistUI.empty();
        if (sourcelist && sourcelist.length > 0) {
            for (i = 0; i < sourcelist.length; i++) {
                entryUI = this.renderSource(sourcelist[i]);
                sourcelistUI.append(entryUI);
            }
        } else {
            entryUI = $('<li class="emptyPlaceholder">no entries</li>');
            sourcelistUI.append(entryUI);
        }
    }
};
var UI = GlobalUserInterfaceHelper;