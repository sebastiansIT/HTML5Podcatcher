/*  Copyright 2013 - 2017 Sebastian Spautz

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
/*global navigator, window, document */
/*global console, localStorage, HTMLMediaElement, Notification */
/*global $ */

console.log(html5podcatcher.playlist.get()[0].toString());

/** Central 'ready' event handler */
$(document).ready(function () {
    "use strict";
	
	UI.renderEpisodeList(html5podcatcher.playlist.get(), 'desc');
});