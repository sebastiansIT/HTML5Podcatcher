/*  Copyright 2016 Sebastian Spautz

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
/*global self */
"use strict";

self.importScripts('lowLevelWorkerApi.js');
self.importScripts('../web/web.js', '../parser/parser.js', '../parser/rss_2-0.js');

self.addEventListener('message', function (event) {
    var cmd = event.data.cmd, param = event.data.parameter;

    self.HTML5Podcatcher.api.configuration.proxyUrlPattern = param.settings.proxyUrl;

    if (cmd === 'start') {
        var amount, sources, results = {sources: [], episodes: []};
        
        sources = param.sources;
        amount = sources.length;
        
        sources.forEach(function (source/*, index, array*/) {
            self.HTML5Podcatcher.api.web.downloadXML(source.uri, function (xmlDocument) {
                var parserResult;
                
                self.HTML5Podcatcher.logger('Downloaded source feed from ' + source.uri, 'debug');
                parserResult = HTML5Podcatcher.api.parser.SourceParser.parse(xmlDocument);
                self.HTML5Podcatcher.logger('Parsed source feed from ' + source.uri, 'debug');
                results.sources.push(parserResult.source);
                results.episodes.concat(parserResult.episodes);
                amount = amount - 1;
                if (amount === 0) {
                    self.postMessage({
                        cmd: 'exit',
                        parameters: {
                            message: 'Finished update of sources.',
                            data: results
                        }
                    });
                }
            });
        });
    }
}, false);