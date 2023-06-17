/**
 * Manage storage subsystems for settings.
    @module  podcatcher/storage/settings
    @author  SebastiansIT [sebastian@human-injection.de]
    @license GPL-3.0-or-later
 *
    Copyright 2013-2015, 2019 Sebastian Spautz
 *
    This file is part of "HTML5 Podcatcher".
 *
    "HTML5 Podcatcher" is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    any later version.
 *
    "HTML5 Podcatcher" is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.
 *
    You should have received a copy of the GNU General Public License
    along with this program.  If not, see http://www.gnu.org/licenses/.
 */

/**
 * Interface for storage subsystems that can persists settings values.
 * @interface SettingsStorageProvider
 */

/**
 * A promise fulfilled with a settings value when a notification is created.
 * @promise ReadSettingsPromise
 * @fulfill {string} The readed value.
 * @reject {external:Error} An Error if somthing goes wrong.
 */

/**
 * A Promise that fulfilled with a readed value.
 * @function
 * @name module:podcatcher/storage/settings~SettingsStorageProvider#readSettingsValue
 * @param {string} key - The key of the application setting you want to read.
 * @returns {ReadSettingsPromise} A Promise that fulfilled with the readed value.
 */

/**
 * A Promise fulfilled undefined after writing a session value.
 * @promise WriteSettingsPromise
 * @fulfill {undefined} Fulfill empty when a settings value is writen.
 * @reject {external:Error} An Error if somthing goes wrong.
 */

/**
 * Set a value for the given key of a user setting.
 * @function
 * @name module:podcatcher/storage/settings~SettingsStorageProvider#writeSettingsValue
 * @param {external:String} key - The key of the application setting you want to set.
 * @param {(external:String|number)} value - The value for the application setting you want to set.
 * @returns {WriteSettingsPromise} A promise fulfilled undefined after writing a session value.
 */

/**
 * A Promise fulfilled with a list of key value pairs.
 * @promise ListSettingsPromise
 * @fulfill {object} A Object with properties for each stored settings value.
 * @reject {external:Error} An Error if somthing goes wrong.
 */

/**
 * List all stored settings values.
 * @function
 * @name module:podcatcher/storage/settings~SettingsStorageProvider#listSettings
 * @returns {ListSettingsPromise} A promise fulfilled with a list of key value pairs.
 */

/**
 * A Promise fullfinling empty when settings are cleared.
 * @promise ClearSettingsPromise
 * @fulfill {undefined} A Object with properties for each stored settings value.
 * @reject {external:Error} An Error if somthing goes wrong.
 */

/**
 * Remove all settings values from the storage.
 * @function
 * @name module:podcatcher/storage/settings~SettingsStorageProvider#clearSettings
 * @returns {ClearSettingsPromise} Fulfill empty when settings are cleared.
 */
