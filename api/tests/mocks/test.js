import API from '../../sources/api';
import StaticDataProvider from './storage/staticDataStorageProvider';  

API.storagemanagement.registerDataStorage(new StaticDataProvider());

export default API;