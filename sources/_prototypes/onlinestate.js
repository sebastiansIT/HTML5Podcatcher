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
/*global navigator */
/*global XMLHttpRequest */
/*global localStorage */
/*global $ */
navigator.connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
function logHandler(message) {
    "use strict";
    console.log('Log entry: ' + message);
    $('#statusbar').append('<span>' + message + '</span></br>');
}
function updateOnlineStatus(event) {
    "use strict";
    var message, condition;
    condition = navigator.onLine ? "online" : "offline";
    message = "This Browser is " + condition;
    if (navigator.connection) {
        if (navigator.connection.type) {
            message += " (connected via " + navigator.connection.type + ")";
        }
        if (navigator.connection.bandwidth) {
            message += " width a bandwidth of " + navigator.connection.bandwidth + " MB/s.";
        }
        if (navigator.connection.metered) {
            message +=  "<br />Attention! This Connection is payed by time or volume!";
        }
    }
    logHandler(message);
    if (event) {
        logHandler("Event: " + event.type);
    }
}
/** Central 'ready' event handler */
$(document).ready(function () {
    "use strict";
    updateOnlineStatus();
    window.addEventListener('online',  updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    navigator.connection.addEventListener('change', updateOnlineStatus, false);
    navigator.connection.addEventListener('typechange', updateOnlineStatus, false);
});