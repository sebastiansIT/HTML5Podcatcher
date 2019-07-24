# HTML5 Podcatcher #

-  Change Log -

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
- 0.30.1
	* A new User Interface
- 0.30.2
	*  Make a difference betwean (hosted-) webapp and installed Open-Web-App when creating a Ajax-Request (Using System-Request without limitations of SOP in privileged apps)
- 0.30.4
	*  Test: Adding proxy.py to NETWORK-Section solved the connectivity-Problem in Firefox (Android)?
- 0.30.5
	*  Test: Try a boolean index on episode store in Indexed DB (not working)
- 0.31.0
	*  Add support for different audio formats (set the mime-type of the html source element dynamicaly)
- 0.31.1
	*  Add mime-type to merge function to fix a bug in 0.30.0
- 0.32.0
	*  Add partial support for "Podlove Simple Chapters" [see http://podlove.org/simple-chapters/]
- 0.32.1
	*  Jump betwean chapters (based on Podlove Simple Chapters) when click on "Next/Previous Track"-Button instead of skip to next/previous Track
- 0.32.2
	*  Jumps now one second bevor the target when skip to previous section. This avoids endless Jump to same chapter when clicking multiple times on "previous Chapter"-Button;
	*  Better handling of multimedia keys (can now also use Chapters)
- 0.33.0
    * Add a detail page for feeds
- 0.33.1
	* Use Local Storage to transfer parameters to new detail page (instead of URL parameters; URL parameters are problematic in combination with App Cache)
- 0.33.2
	* Adding a index over the source of episodes (Indexed Database API)
- 0.33.3
	* Save all episodes in a feed instead of the top 5; alle episodes without the newest 5 are set automaticaly to played
- 0.33.4
	* Fix a bug: RSS link elements have now higher priority than gudi element when selecting the uri of an episode
- 0.33.5
	* Transfer mime-type audio/opus to "audio/ogg; codec=opus" (Firefox only understand the last one)
- 0.33.6
	* Show error messages at foot of main region
	* some litle changes on css
	* fix open web app manifest for FirefoxOS
	* Use Autoprefixer in build process for Open Web App
- 0.33.7
	* litte changes handling app cache events
	* replace background images with SVG files
- 0.33.8
	* open links in source.html externaly
- 0.33.9
	* repair export/import functions in settings page
	* manipulate symbol of play/pause-Button when media events error or pause occures
- 0.33.10
	* using audio channel api on firefox os runtime
- 0.33.11
	* now you can configure log level to reduce logging messages to debug, info, warning or error level
- 0.33.12
	* Disabled buttons are now shown in light grey color
	* using "autoprefixer" to get a better browser support
- 0.33.13
	* Fix a bug in source.html: class "external" is set to wrong element in feed markup
- 0.33.14
	* Fix a bug in logging function "logHandler()"
	* Disable some functions when device is offline
- 0.33.15
	* Disable episodes in offline mode when audio file isn't saved/downloaded to device
- 0.34.0
	* Add a Configuration to allow descending or ascending order of playlist
- 0.35.0
	* Add a loader animation to each page
- 0.35.1
	* Fix a bug in Firefox 40: Implementation of CSP changed behavior for "blob" URL-Schema (see https://developer.mozilla.org/en-US/Firefox/Releases/40#Security)
- 0.36.0
	* Refactor Storage API
- 0.36.3
	* Fix a bug on rendering Episodes when App is offline
- 0.37.1
	* Testing a syncronisation Endpoint
- 0.37.2
- 0.37.3
	* Add Settings and Episodes to sync data receiver
- 0.37.4
	* Fix a bug detecting the next (or previous) episode in the playlist
- 0.38.0
	* Button "Fast Forward" now changes playback to double speed when the button is pressed for more than 500 miliseconds
- 0.38.1
	* Replace jquery event registration to find a bug in Firefox for Android 41
- 0.38.2
	* Try to solve strange error situation in Firefox 41
- 0.38.3
	* Fix a Bug: Initialisation of file storage provider isn't called
- 0.39.0
	* Extends Logger with Web Notification API for messages with level note
- 0.39.1
  * Fix a Bug in settings page (relevant on Chrome only)
- 0.39.2
  * Add a storage provider interface for settings
- 0.40.0
  * Add a user setting to configure the playback rate
- 0.40.1
  * Add a default value parameter to settings.get(key) and visualise playback rate as percent
- 0.40.2
  * Fix a critical Bug: A File is lost while publishing to Mozilla Webstore
- 0.40.3
  * Fix some UI bugs
  * add a progress visualisation for "Update Playlilst" button
- 0.40.4
  * Add status information to finished callback functions
- 0.41.0
  * Add Subtitle of episodes to Detail-View of Sources
- 0.40.1
  * Fix a Bug: Visualisation of download status of episodes is't shown on podcast details page
- 0.40.2
  * Update jQuery to 3.1 (slim build)
- 0.40.3
  * Prevent multiple downloads of the same file
- 0.40.4
  * Remove redundant function parameter "mime-Type"
- 0.42.0
  * Use language information from RSS 2.0 feeds and activate hyphens in UI
- 0.43.0
	* Add CSS-Feature Scroll-Snap to Stylesheet (available on Chromium)
	* Add theme-color for Chrome on Android to HTML-head
	* Update jQuery to 3.3.1
	* Remove all Files and Build-Targets for FirefoxOS
- 0.44.0
  * Switch from ApplicationCache to ServiceWorker
- 0.45.0
  * Add a function to export the source list as OPML
- 0.45.1
  * Update all Sources after import or syncronisation of configuration
- 0.45.3
  * Fix some non standard conform HTML structures
  * Fix a Bug in fileSystemProvider that avoid the callback function to be called.
- 0.46.0
  * Add a Webmanifest to the hosted app
- 0.46.1
  * Fix a Bug that prevent UI to update changed episodes
- 0.46.2
  * Fix a Bug that prevent UI showing new episodes
- 0.46.3
	* Use CSS-Variables to theme the ui
	* Fix some minor bugs in function to update episodes UI
- 0.46.4
	* Fix a bug in the bugfix before
- 0.46.5
  * Visualisation of download and update status uses CSS variables
- 0.46.7
	* Init ProxyUrl from local storage in settings page
	* replace mime type from RSS feed with "audio/mpeg" if it is audio/x-mpeg
- 0.48.0
  * Implement voice synthesis to speak out the titles of the played episodes.
- 0.48.1
  * Filter the list of voices, only show voices that are offline available.
	* Sort the list of Sources
- 0.48.2
  * Sort List of voices
	* Only speak if voice for the relevant language is offline isFileStorage
	* Wrap the speach API in a promise
	* Add volume configuration to settings page
- 0.48.3
  * Only announce episode with speech synthesis when next or previous track is played
- 0.48.4
  * Announce next episode with speech synthesis befor automaticaly play it.
- 0.48.5
  * Fix syntax error
- 0.48.7
  * Fix an Error that is thrown while parsing a RSS file: Can't parse items without a publication date
	* Sort Source now case insensitive
- 0.48.8
  * Rewrite Settings Storage Provider
- 0.49.0
  * Use Media Session API to pimp Media Notifications and lock screen on Android using Chrome
	* Only announce episodes with Speech API when voices are offline available
- 0.50.0
  * Use Media Session API to handle multimedia Keys
	* Refactor some Parts of the page "Playlist"
	* Change default Value for Sync endpoint to relative URL
	* Update list of voices in settings page when it has changed by the os
- 0.50.1
  * Selection of Voice for given language is now case insensitive
