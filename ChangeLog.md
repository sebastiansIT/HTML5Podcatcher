# HTML5 Podcatcher #

## Change Log ##

- 0.12.11
	* Fix a Bug on setting the last played episode after page load
- 0.12.12
	* Fix a Bug opening the eposide link in a new window
- 0.12.13
	* skip episodes with errors (i.e. download failed because of network failures)
- 0.12.14
	* Fix a Bug: switch to next/previous episode buttons does not work
- 0.12.15
	* Use Mime-Type audio/mpeg instead of audio/mp3 to generate blobs after downloading file
- 0.13.0
	* Alternative Version using IndexedDB API instead of Local Storage
- 0.14.0
	* Using IndexeDB to store Files in Firefox
- 0.14.1
	* Using own copy of jQuery
- 0.14.2
	* Fixing the rendering of Episodes: The Download link is now shown on Firefox (IndexedDB)
- 0.14.3
	* Use openFile() when activating a Episode to generate the Object-URL
- 0.14.4
	* Add Callback Functions to PlayEpisode() and ActivateEpisode() to handle the asyncron calls of the IndexedDB API
- 0.14.5
	* Fix a Bug width rendering a Episode after downloading this episodes file and structuring some code in namespace UI
- 0.14.6
	* Fixed a Bug: Dosn't delete files from IndexedDB when episode status is switched
- 0.14.7
	* Fixed a Bug: For IE changed the indexeddb-Shema-Version from String to number
- 0.14.8
	* Fixed a Bug: Missused "this" in updateIndexedDB()
- 0.14.9
	* Fixed a Bug: missing callback call in POD.web.downloadFile()
- 0.14.10
	* Fixed a Bug: set download flag when file system API used
- 0.15.0
	* Changed indexedDbStorage.saveFile(): It saves now a ArrayBuffer instead of a BLOB
- 0.15.1
	* IndexedDB has now a higher priority then file system api
- 0.15.2
- 0.15.3
- 0.16.0
	* Added Key-Events for Multimedia-Keys (Next Track, Previous Track, Play, Pause, Stop)
- 0.16.1
	* Removed inline styles
- 0.16.2
	* Extends functionality of multimedia keys: add a fast forward when "next track" is hold more then 1 second and jump to start of current track instead of previous track when current playback time is greater than 10 seconds.
- 0.16.3
	* File system API is back to highest Priority on Chromium (because IndexedDB + ObjectURL dosn't work) and Indexed DB stores blobs, not Arraybuffer, again
- 0.16.4
	* Refactoring all functions manipulating sources in Namespaces POD and UI; Added callback parameters to such functions
- 0.16.5
	* Bugfix Function Call WriteSourceS() instead of WriteSource()
- 0.16.6
	* Extends RSS parser: Now checks for guid-Elements to get the episode url
- 0.16.7
	* New Icons for Apple Web-Clip and Firefox OS
- 0.16.8
	* Refactoring all functions manipulating episodes and the playlist in Namespaces POD and UI; Added callback parameters to such functions
- 0.17.0
	* Implement storage of sources and episodes width Indexed Database API
- 0.17.1
	* Add custom events "WriteEpisode" and "WriteSource" that fires after writing a episode or source to storage; Change parseSource: this Function saves the source and its episodes automatic to database.
- 0.17.2
	* Rewrite parser function. Now the parser is indipendent from storage and return a result. This result is now stored and filtered in the download function.
- 0.17.3
	* cleanup code a litle bit
- 0.17.4
	* Polyfill custom event constructor for Internet Explorer
- 0.17.5
	* Bugfix: don't render new Episodes after update
- 0.18.0
	* Disable some functions if browser is offline (using navigator.onLine and online/offline-Events)
	* Add two lines to the NETWORK-Sektion of this file (special for Firefox)
- 0.18.1
	* add more functions disabled when offline
- 0.18.2
	* add new Style for buttons and Link-Buttons (links looking like a button)
- 0.18.3
	* Restructuring Code and Files
- 0.18.4
	* Bug fix: Call deleteSources() instead of deleteSource()
- 0.18.5
	* Bug fix: Reset download state of an episode if downloaded file is not find in storage and log an error
- 0.18.6
	* Try to fix a bug in IE9, Safari and older FireFox-Versions; extends support for Open Web Apps, add log output with parser result; print error to log if RSS-Root-Tag not found; print xml-Response to log;
- 0.18.7
	* fix URL's to apple-touch-icons
- 0.18.8
	* Use HTML-Templates instead of concatenated markup strings in javascript; some linting and refactoring
- 0.18.9
	* Removed dependencies from jQuery in lowLevelApi.js
- 0.18.10
	* Rebind Events to audio element when switching to another Episode
- 0.18.11
	* Fix a Bug in RSS-Parser: Link elements with Atom namespace are accepted now 
- 0.18.12
	* Fix Bugs in Parser and UI: empty description elements; missing encoded tags and changing feed uri and website url in some cases; Remove Download Button if no audio-file available
- 0.18.12
	* New implementation of import and export of the complete configuration
- 0.19.13
	* Variate the implementation of the multimedia-event "duration changed"
	* Refactor DownloadSource() and remove usage of local storage API from this function
- 0.19.14
	* Fix a bug in export function
- 0.20.0
	* Add functions to clear storage and save multiple episodes or sources to storage
- 0.20.1
	* Use Media Fragment URI Recomendation to address the starting playback time
- 0.21.4
	* Fix a Bug in experimental code while working on storage of array buffers