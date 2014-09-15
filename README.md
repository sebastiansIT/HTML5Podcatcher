<img src="resources/images/logoPodcatcher.svg?raw=true" title="Logo of HTML5 Podcatcher" style="float:left; width:200px" />

# HTML5 Podcatcher #

A podcast player based on web technology.

This is a experimental implementation of an podcast player. Primary 
targets are playback of audio files, loading and parsing podcast feeds 
and save audio files from the internet. Secondary targets are a completely  
client side/browser side implementation and offline availability of the app, 
the data and the audio files.

I use different APIs and technologies, specified in the HTML5 universe, to reach this target:

1. Offline Availability: [AppCache](https://developer.mozilla.org/en-US/docs/Web/HTML/Using_the_application_cache)
2. Access to Feeds and Files: [AJAX](https://developer.mozilla.org/en-US/docs/Glossary/AJAX)
3. Storage for app data: [Local Storage](https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/Storage#localStorage) or [Indexed Database API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
4. Storage for audio files: [Indexed Database API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) or [File System API](https://developer.mozilla.org/en-US/docs/WebGuide/API/File_System)
5. Playback: [Media API](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio)

## Status and Features ##

At the moment the app can …

- Parse RSS feeds (version 2)
- Identify MP3-Files in this feeds
- Manage subscription of feeds
- Download and save files (in some Browsers)
- Play/Pause podcast episodes
- Manage a playlist
- Persist playback status (timecode) of podcast episodes
- hold code and markup in app cache for offline availability

## Problems ##
### SOP ###
The same origin policy restricts the access to internet resources. 
So I need a solution to solve this Problem. At the moment I try 
transformations to installable webb apps for Firefox OS/Firefox Marketplace, 
Android, Chrome Web Store and other platforms.

### Design ###
I'm not a Designer! Contact me if you would help.

## Build ##
I use Grunt to build the app in different versions: A web app to host on 
your own web server and a packaged app for Firefox OS/Firefox Marketplace. 
More will come later.

Installation and usaged
At the moment you can use the web version 
at http://lab.human-injection.de/podcatcher/playlist.html but you need a 
proxy to avoid SOP-Errors.

## Screenshots

![Playlist](/resources/images/HTML5Podcatcher_Playlist.png?raw=true "Playlist Screenshot")