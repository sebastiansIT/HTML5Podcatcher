import WebManager from './web/web2.mjs'
import FetchManager from './web/fetch.mjs'

/* global XMLSerializer */

const webManager = new WebManager('https://podcatcher.sebastiansit.de/proxy.py?url=$url$')
const fetchManager = new FetchManager('https://podcatcher.sebastiansit.de/proxy.py?url=$url$')

console.log(fetchManager.sopProxyPattern)

webManager.downloadXML('/tests/csslint.result.junit.xml')
  .then(doc => console.log(`Success ${(new XMLSerializer()).serializeToString(doc)}.`))
  .catch(error => console.log(`Failure ${error}!`))

const urls = ['http://test.example/switch.to.proxy', '/tests/csslint.result.junit.xml', '/tests/csslint.result.txt', '/missing.xml']
urls.forEach(url => {
  fetchManager.downloadXML(url)
    .then(doc => console.log(`Success ${(new XMLSerializer()).serializeToString(doc)}.`))
    .catch(error => console.log(`Failure ${error}!`))
})

console.log(window.test)
