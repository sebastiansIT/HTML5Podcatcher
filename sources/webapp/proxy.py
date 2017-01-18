#!/usr/bin/python

import cgi, cgitb
import sys
import os
import urllib2
import ssl

#Ausgabe bei Fehler
cgitb.enable()

def DoGet():
	httpGetParameter = cgi.FieldStorage()
	if not ("secret" in httpGetParameter and httpGetParameter["secret"].value.decode('utf-8') == "yyse4rfvv"):
		print("Status:401 Unauthorized")
		print
		print("401 Unauthorized")
		return
	if "url" in httpGetParameter:
		url = httpGetParameter["url"].value.decode('utf-8')
	else:
		url = None
	if url:
		ctx = ssl.create_default_context()
		#ctx.check_hostname = False
		#ctx.verify_mode = ssl.CERT_NONE
		hdr = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11'}
		req = urllib2.Request(url, headers=hdr)
		filehandle = urllib2.urlopen(req, context=ctx)
		for header in filehandle.info().headers:
			if not header.startswith("Server") and not header.startswith("Set-Cookie"):
				sys.stdout.write(header.replace("\n", "").replace("\r", "")+"\n")
		#print "Content-Type:" + filehandle.info().gettype()		
		sys.stdout.write("Access-Control-Allow-Origin: http://podcatcher.sebastiansit.de, \n")
		sys.stdout.write("\n")
		
		CHUNK = 16 * 1024
		while True:
			chunk = filehandle.read(CHUNK)
			if not chunk: break
			sys.stdout.write(chunk)
		
		#file = filehandle.read()
		#sys.stdout.write(file)
	else:
		print("Status:404")
		print
		print('Parameter "url" not found')

if os.environ['REQUEST_METHOD'] == 'GET':
	DoGet()
else:
	print("Status:405 Method Not Allowed")
	print
	print("405 Method Not Allowed")