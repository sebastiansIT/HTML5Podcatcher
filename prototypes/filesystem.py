#!/usr/bin/python

import cgi, cgitb
import sys
import os
import urllib

#Ausgabe bei Fehler
cgitb.enable()

def DoGet():
	httpGetParameter = cgi.FieldStorage()
	if "url" in httpGetParameter:
		url = httpGetParameter["url"].value.decode('utf-8')
		if not (url.startswith("http://ftp.c3d2.de/") or url.startswith("http://feedproxy.google.com/~r/cre-podcast/") or url.startswith("http://chaosradio.ccc.de/chaosradio-latest.rss")):
			url = None
	else:
		url = None
	
	if url:
		filehandle = urllib.urlopen(url)
		for header in filehandle.info().headers:
			if not header.startswith("Server") and not header.startswith("Set-Cookie"):
				sys.stdout.write(header.replace("\n", "").replace("\r", "")+"\n")
		
		sys.stdout.write("Access-Control-Allow-Origin: http://lab.human-injection.de\n")
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
		print('Parameter "url" not found or illegal value')

if os.environ['REQUEST_METHOD'] == 'GET':
	DoGet()
else:
	print("Status:405 Method Not Allowed")
	print
	print("405 Method Not Allowed")