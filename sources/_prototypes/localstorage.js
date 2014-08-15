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
var logHandler = function(message, loglevel) {
    "use strict";
    console.log(loglevel + ': ' + message);
    $('#statusbar').prepend('<span class=' + loglevel + '>' + message + '</span></br>');
};

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
    var tracks = [];
    //RSS-Feed
    if ($(xml).has('rss[version="2.0"]')) {
        //RSS-Channel
        source.link = $(xml).find('channel > link').text();
        source.title = $(xml).find('channel > title').text();
        source.description = $(xml).find('channel > description').text();
        //RSS-Entries
        $(xml).find('item').has('enclosure').slice(0, 5).each(function() {
            tracks.push({'uri': $(this).find('link:first').text(), 'title': $(this).find('title:first').text(), 'mediaUrl' : $(this).find('enclosure:first').attr('url'), 'updated' : new Date($(this).find('pubDate:first').text()), 'source' : $(xml).find('channel > title').text() });
        });
    }
    return {'source': source, 'tracks': tracks};
};
var downloadSource = function(source) {
    "use strict";
    var successfunction, errorfunction, parserresult;
    successfunction = function(data, jqXHR) {
        parserresult = parseSource(data, source);
        if (jqXHR.requestURL) {
            logHandler("Loaded " + jqXHR.requestURL + " succesfully", 'error');
        }
    };
    errorfunction = function(jqXHR, textStatus, errorThrown) {
        logHandler(textStatus + " " + jqXHR.status + " : " + errorThrown, 'error');
        logHandler(source.uri + " can not loaded directly; using proxy");
        $.ajax({
                'url': './sourceparsing.py?url=' + source.uri,
                'async': false,
                'dataType': 'xml',
                'success': successfunction,
                'error': function() { logHandler(source.uri + " can not loaded using proxy", 'error'); }
            });
        logHandler("Load " + source.uri + " succesfully while using proxy");
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

/** Central 'ready' event handler */
$(document).ready(function() {
    "use strict";
    //Sources UI Events
    $(window).on('storage', function(event) {
        logHandler(event.key, 'debug');
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
        for (i = 0; i < parserresult.tracks.length; i++) {
            //TODO Save all Tracks in the parser result
            //writeTrack(parserresult.tracks[i]);
        }
    });
    $('#sources').on('click', '.deleteSource', function(event) {
        event.preventDefault();
        event.stopPropagation();
        var source, i;
        source = readSource($(this).closest('li').data('sourceuri'));
        deleteSource(source);
		for (i = 0; i < $('#sources .entries li').length; i++) {
            if ($($('#sources .entries li')[i]).data('sourceuri') === source.uri) {
                $($('#sources .entries li')[i]).slideUp(400, function(){$(this).remove();});
				break;
			}
		}
    });
    $('#sources').on('click', '.link', function(event) {
        event.preventDefault();
        event.stopPropagation();
        window.open($(this).attr('href'), '_blank');
    });
    //Initialise source list on page load
    renderSourceList(readSourceList());
});