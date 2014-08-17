/*
    Copyright 2014 Sebastian Spautz

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
/*global alert */
/*global confirm */

// This URL must be a full url.
var manifestUrl = 'http://lab.human-injection.de/podcatcher/download/package.manifest';
if (confirm("Do you want to install \"HTML5 Posdcatcher\"?")) {
    var req = navigator.mozApps.installPackage(manifestUrl);
    req.onsuccess = function () {
        "use strict";
        alert(this.result.origin);
    };
    req.onerror = function () {
        "use strict";
        alert(this.error.name);
    };
}