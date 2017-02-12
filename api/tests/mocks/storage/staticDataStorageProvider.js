import Episode from '../../../sources/model/episodes';

var StaticStorageProvider = function () {
    /** 
	  * Array of episodes in the playlist
	  * @private
	  * @type {module:html5podcatcher/model/episodes~Episode[]}
	  */
	this.playlist = [];
	this.playlist.push(new Episode('http://www.podcast.de/episodeA', {title: 'Episode A', subTitle: 'Summary of Episode A', source: 'Source X', playback: {}, updated: new Date()}));
	this.playlist.push(new Episode('http://www.podcast.local/episode1', {title: 'Episode 1', subTitle: 'Summary of Episode 1', source: 'Source 1', playback: {}, updated: new Date()}));
	this.playlist.push(new Episode('http://www.podcast.local/episode2', {title: 'Episode 2', source: 'Source 1', playback: {}, updated: new Date()}));
	this.playlist.push(new Episode('http://www.podcast.local/episode3', {title: 'Episode 3', source: 'Source 2', playback: {}, updated: new Date()}));
};

StaticStorageProvider.prototype.readEpisodesByStatus = function (listenState) {
    var storage = this;
	
	return new Promise(function (resolve, reject) {
		resolve({data: storage.playlist, messages: []});
	});
};

StaticStorageProvider.prototype.isSupportedByCurrentPlatform = function () {
	return true;
}

StaticStorageProvider.prototype.priority = 0;

export default StaticStorageProvider;