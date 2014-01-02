#!/usr/bin/python

import cgi, cgitb
import sys
import os
import datetime

def DoGet():
	now = datetime.datetime.now()
	print("Type:text/cache-manifest")
	print
	print("CACHE MANIFEST\n")
	print("# Version " + now.strftime("%Y-%m-%d %H:%M") + "\n")
	print("CACHE:")
	print("./ApplicationCache.html")
	print("./ApplicationCache.js")
	print("../css/main.css\n")
	print("NETWORK:")
	print("*\n")

if os.environ['REQUEST_METHOD'] == 'GET':
	DoGet()
else:
	print("Status:405 Method Not Allowed")
	print
	print("405 Method Not Allowed")
