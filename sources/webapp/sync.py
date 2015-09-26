#!/usr/bin/python
#"C:\Program Files\Python\Python2\python.exe"

import cgi, cgitb
import sys
import os
import datetime
import sqlite3
import SyncronisationModel
import SyncronisationDAO
import json
from urlparse import urlparse, parse_qsl

cgitb.enable()
	
def DoPost():
	print( "Access-Control-Allow-Origin: http://human-injection.de")
	
	request = json.load(sys.stdin)
	key = request["key"];
	value = request["value"];
	#httpPostData = cgi.FieldStorage()
	#if "key" in httpPostData:
	#	key = httpPostData["key"].value.decode('utf-8')
	#else:
	#	key = None
	#if "value" in httpPostData:
	#	value = httpPostData["value"].value.decode('utf-8')
	#else:
	#	value = None
		
	if key and value:
		try:
			#print("Content-Type: text/html; charset=utf-8")
			#print("Status:200")
			#print
			#print("<p>" + str(httpPostData) + "</p>")
			db = SyncronisationDAO.Sqlite3DAO("db/sync.db")
			result = db.Save(key, json.dumps(value))
		
			accepttypes = os.environ['HTTP_ACCEPT'].split(',')
			for type in accepttypes:
				if type == "application/json" or type == "text/javascript":
					DoJsonPost(result[0]);
					break
				else:
					DoJsonPost(result[0])
					break
		except sqlite3.Error, e:
			print("Content-Type: text/html; charset=utf-8")
			print("Status:500")
			print
			print("<p>Error on insert into db " + str(e) + "</p>")
			print("<p>" + str(httpPostData) + "</p>")
	else:
		print("Status:400")
		print 
		print("<p>No Data transmited</p>")
		print("<p>" + str(httpPostData) + "</p>")
				
def DoJsonPost(result):	
	# HTTP-Header
	print "Content-Type: application/json; charset=utf-8"
	print "Status:201"
	print "Location: http://lab.human-injection.de/podcatcher/sync.py?key=" + result.getKey()
	print
		
	#HTML
	print "{\"status\": 201, \"saved\": " + result.toJson() + "}"
	
def DoGet():
	print "Access-Control-Allow-Origin: http://lab.human-injection.de"
	accepttypes = os.environ['HTTP_ACCEPT'].split(',')
	for type in accepttypes:
		if type == "application/json" or type == "text/javascript":
			DoJsonGet()
			break
		else:
			DoJsonGet()
			break

def DoJsonGet():
	entries = ReadFromDatabase()
	json = "{\n\t"
	json = json + "\"status\": 200,\n\t"
	json = json + " \"entries\": [\n"
	for entry in entries:
		json = json + entry.toJson() + ",\n"
	json = json[:-2]
	json = json + "\n\t]\n}"
	#HTTP-Header
	print "Content-Type: application/json; charset=utf-8"
	print "Status:200"
	print 
	print json.encode('utf-8')

def ReadFromDatabase():
	httpGetParameter = cgi.FieldStorage()
	if "key" in httpGetParameter:
		key = httpGetParameter["key"].value.decode('utf-8')
	else:
		key = None
	
	if key:
		db = SyncronisationDAO.Sqlite3DAO("db/sync.db")
		entries = db.Select(key)
		return entries
	else:
		return {}
	
if os.environ['REQUEST_METHOD'] == 'POST' or os.environ['REQUEST_METHOD'] == 'PUT':
	DoPost()
if os.environ['REQUEST_METHOD'] == 'GET':
	DoGet()
if os.environ['REQUEST_METHOD'] == 'DELETE':
	DoDelete()
