/** @module  HTML5Podcatcher/Parser/RSS_2-0
    @author  SebastiansIT [sebastian@human-injection.de]
    @license Copyright 2016 Sebastian Spautz

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

/*
    Specification of RSS 2.0: https://cyber.harvard.edu/rss/rss.html
*/
/* global HTML5Podcatcher */

var RssParser = (function () {
  'use strict'

  var RSS20SourceParser

  // ======================================= //
  // === Implementation of ISourceParser === //
  // ======================================= //
  /** Parses RSS 2.0 XML documents.
  * @class
  * @implements module:HTML5Podcatcher/Parser~ISourceParser
  */
  RSS20SourceParser = function () {
    this.allowedDocumentMimeTypes = ['application/xml+rss']
  }
  RSS20SourceParser.prototype = new HTML5Podcatcher.api.parser.ISourceParser()
  RSS20SourceParser.prototype.constructor = RSS20SourceParser
  RSS20SourceParser.prototype.toString = function () {
    return 'RSS 2.0 Parser'
  }

  RSS20SourceParser.prototype.parse = function (source, xmlDocument) {
    var parserResult

    parserResult = { 'source': {}, 'episodes': [] }
    parserResult.source.uri = source.uri

    if (!xmlDocument) {
      HTML5Podcatcher.logger(`No XML document found at ${source.uri}.`, 'error', 'parser')
      return undefined
    } else {
      var rootElement, currentElementList, currentElement, contentElement, itemArray, enclosureArray, i, j, item, episode
      // RSS-Feed
      rootElement = xmlDocument.querySelector('rss[version="2.0"]')
      if (rootElement) {
        // RSS-Channel
        // * Actualise URI from atom link element with relation of "self"
        currentElementList = rootElement.querySelectorAll('channel > link') // find all Link-Elements in the feed
        for (i = 0; i < currentElementList.length; i += 1) {
          currentElement = currentElementList[i]
          if (currentElement.namespaceURI === 'http://www.w3.org/2005/Atom' && currentElement.attributes.rel === 'self') {
            parserResult.source.uri = currentElement.href
            break
          }
        }
        // * Link to Website (<link> or <atom:link rel="self">)
        //   uses same list of elements (currentElementList) as the previous section
        for (i = 0; i < currentElementList.length; i += 1) {
          currentElement = currentElementList[i]
          if (!currentElement.namespaceURI) { // undefined Namespace is mostly the rss 'namespace' ;)
            parserResult.source.link = currentElement.childNodes[0].nodeValue
            break
          }
        }
        //   set default: Website is equals to Feed-URI
        if (!parserResult.source.link) {
          parserResult.source.link = parserResult.source.uri
        }
        // * Title (<title>)
        currentElement = rootElement.querySelector('channel > title')
        if (currentElement && currentElement.childNodes.length > 0) {
          parserResult.source.title = currentElement.childNodes[0].nodeValue
        } else {
          parserResult.source.title = parserResult.source.link
        }
        // * Description (<description>)
        currentElement = rootElement.querySelector('channel > description')
        if (currentElement && currentElement.childNodes.length > 0) {
          parserResult.source.description = currentElement.childNodes[0].nodeValue
        } else {
          parserResult.source.description = ''
        }
        // * License (<copyright>)
        currentElement = rootElement.querySelector('channel > copyright')
        if (currentElement && currentElement.childNodes.length > 0) {
          parserResult.source.license = currentElement.childNodes[0].nodeValue
        } else {
          parserResult.source.license = undefined
        }
        // * Language (<language>)
        currentElement = rootElement.querySelector('channel > language')
        if (currentElement && currentElement.childNodes.length > 0) {
          parserResult.source.language = currentElement.childNodes[0].nodeValue
        } else {
          parserResult.source.language = undefined
        }
        // RSS-Entries
        itemArray = rootElement.querySelectorAll('channel > item')
        for (i = 0; i < itemArray.length; i += 1) {
          item = itemArray[i]
          episode = {
            'language': parserResult.source.language
          }
          // * URI of episode
          if (item.querySelector('link')) {
            // Try to get from RSS link element
            episode.uri = item.querySelector('link').childNodes[0].nodeValue
          } else if (item.querySelector('guid')) {
            // If there is no link element try to get it from GUID element
            episode.uri = item.querySelector('guid').childNodes[0].nodeValue
          } else {
            HTML5Podcatcher.logger('No URI found - invalid RSS item', 'error')
            break
          }
          // * Title of episode
          episode.title = item.querySelector('title').childNodes[0].nodeValue
          // * Subtitle of episode
          currentElement = item.getElementsByTagNameNS('http://www.itunes.com/dtds/podcast-1.0.dtd', 'subtitle')
          if (currentElement && currentElement.length > 0 && currentElement[0].childNodes.length > 0) {
            episode.subTitle = currentElement[0].childNodes[0].nodeValue
          }
          // * Duration of episode
          currentElement = item.getElementsByTagNameNS('http://www.itunes.com/dtds/podcast-1.0.dtd', 'duration')
          if (currentElement && currentElement.length > 0 && currentElement[0].childNodes.length > 0) {
            episode.duration = this.parseNormalPlayTime(currentElement[0].childNodes[0].nodeValue)
          }
          // * pubDate of episode
          const pubDateElement = item.querySelector('pubDate')
          if (pubDateElement && pubDateElement.childNodes.length >= 1) {
            if (/^\d/.test(pubDateElement.childNodes[0].nodeValue)) {
              episode.updated = new Date('Sun ' + pubDateElement.childNodes[0].nodeValue)
            } else {
              episode.updated = new Date(pubDateElement.childNodes[0].nodeValue)
            }
          } else {
            episode.updated = undefined
          }
          // * Source of this episode
          episode.source = parserResult.source.title
          // * Audio-File (Atachement | Enclosure)
          // use files linked with enclosure elements or ...
          enclosureArray = item.querySelectorAll('enclosure')
          for (j = 0; j < enclosureArray.length; j += 1) {
            // accept only audio files
            if (enclosureArray[j].attributes.type.value.indexOf('audio') >= 0) {
              // map audio/opus to audio/ogg with codec of opus (Firefox don't understand audio/opus)
              if (enclosureArray[j].attributes.type.value === 'audio/opus') {
                episode.mediaType = 'audio/ogg; codecs=opus'
              } else {
                episode.mediaType = enclosureArray[j].attributes.type.value
              }
              episode.mediaUrl = enclosureArray[j].attributes.url.value
            }
          }
          // ... or use anker tags in the full content markup of the item
          if (!episode.mediaUrl && item.querySelector('encoded') && item.querySelector('encoded').childNodes[0].nodeValue) {
            // contentElement = xmlDocument.createElement('encoded');
            contentElement = document.createDocumentFragment() // use document instead of xmlDocument because the nodeValue can contains HTML-Entities that are not supported in XML.
            var nodeValue = item.querySelector('encoded').childNodes[0].nodeValue
            contentElement.innerHTML = nodeValue
            if (contentElement.querySelector('a[href$=".m4a"]')) {
              episode.mediaUrl = contentElement.querySelector('a[href$=".m4a"]').attributes.href.value
              episode.mediaType = 'audio/mp4'
            } else if (contentElement.querySelector('a[href$=".mp3"]')) {
              episode.mediaUrl = contentElement.querySelector('a[href$=".mp3"]').attributes.href.value
              episode.mediaType = 'audio/mpeg'
            } else if (contentElement.querySelector('a[href$=".oga"]')) {
              episode.mediaUrl = contentElement.querySelector('a[href$=".oga"]').attributes.href.value
              episode.mediaType = 'audio/ogg'
            } else if (contentElement.querySelector('a[href$=".opus"]')) {
              episode.mediaUrl = contentElement.querySelector('a[href$=".opus"]').attributes.href.value
              episode.mediaType = 'audio/ogg; codecs=opus'
            }
          }
          // Parse Podlove Simple Chapters Format
          episode.jumppoints = this.parsePodloveSimpleChapters(item.getElementsByTagNameNS('http://podlove.org/simple-chapters', 'chapters'), episode)
          parserResult.episodes.push(episode)
        }
        parserResult.episodes.sort(HTML5Podcatcher.sortEpisodes)
      } else {
        HTML5Podcatcher.logger(`No root element (&lt;rss&gt;) found in parsed document: ${xmlDocument}`, 'error', 'parser')
        return undefined
      }

      return parserResult
    }
  }

  // ====================================== //
  // === Export public Elements         === //
  // ====================================== //
  return new RSS20SourceParser()
}())

// Register this Implementation
HTML5Podcatcher.api.parser.SourceParser.registerSourceParser(RssParser)
