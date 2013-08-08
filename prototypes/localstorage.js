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
var parseSource = function(xml, source) {
    "use strict";
    var tracks = [];
    //RSS-Feed
    if ($(xml).has('rss[version="2.0"]')) {
        //RSS-Channel
        source.link = $(xml).find('channel link').text();
        source.title = $(xml).find('channel title').text();
        source.description = $(xml).find('channel description').text();
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
        if (localStorage.getItem("configuration.proxyUrl")) {
            logHandler(source.uri + " can not loaded directly; using proxy");
            $.ajax({
                'url': localStorage.getItem("configuration.proxyUrl").replace("$url$", source.uri),
                'async': false,
                'dataType': 'xml',
                'success': successfunction,
                'error': function() { logHandler(source.uri + " can not loaded using proxy", 'error'); }
            });
            logHandler("Load " + source.uri + " succesfully while using proxy");
        }
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
var renderSource = function(source) {
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
var renderSourceList = function(sourcelist) {
    "use strict";
    var sourcelistUI, entryUI, i;
    sourcelistUI = $('#sources .entries');
    sourcelistUI.empty();
    if (sourcelist && sourcelist.length > 0) {
        for (i = 0; i < sourcelist.length; i++) {
            entryUI = $('<li>');
            entryUI.append('<a href="' + sourcelist[i].uri + '">' + sourcelist[i].uri + '</a>');
            //TODO delete function
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
    $('#addSourceButton').on('click', function(event) {
        event.preventDefault();
        event.stopPropagation();
        var parserresult, i;
        parserresult = downloadSource(readSource($('#addSourceUrlInput').val()));
        writeSource(parserresult.source);
        for (i = 0; i < parserresult.tracks.length; i++) {
            //TODO Save all Tracks in the parserresult
            //writeTrack(parserresult.tracks[i]);
        }
    });
    renderSourceList(readSourceList());
});