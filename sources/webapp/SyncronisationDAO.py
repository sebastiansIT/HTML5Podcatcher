import sqlite3
import datetime
import SyncronisationModel
import cgi, cgitb

cgitb.enable()	
class Sqlite3DAO:
	
	def __init__(self, fileName):
		self.dbFileName = fileName
	
	def DataBaseInitialisation():
		connection = sqlite3.connect(self.dbFileName)
		cursor = connection.cursor()

		sql = "CREATE TABLE SyncPoints(ID INTEGER PRIMARY KEY, Key VARCHAR(100) UNIQUE, Value TEXT) "
		cursor.execute(sql)

		connection.commit()
		connection.close()
	
	def Select(self, key=None):
		connection = sqlite3.connect(self.dbFileName)
		cursor = connection.cursor()
		sql = 	"SELECT ID, Key, Value FROM SyncPoints"
		try:
			if key != None:
				sql = sql + " WHERE Key = ?"
				cursor.execute(sql, (key,))
			entries = []
			for row in cursor:
				entry = SyncronisationModel.Point(row[0], row[1], row[2])
				entries.append(entry)
		except:
			entries = ["error"]
			 
		connection.commit()
		connection.close()
		
		return entries
	
	def Insert(self, key, value):
		connection = sqlite3.connect(self.dbFileName)
		cursor = connection.cursor()
		
		sql = "INSERT INTO SyncPoints(Key, Value) VALUES (?, ?)"
		
		cursor.execute(sql, (key, value))
		
		connection.commit()
		connection.close()

		return self.Select(key=key)
	
	def Update(self, key, value):
		connection = sqlite3.connect(self.dbFileName)
		cursor = connection.cursor()
		
		sql = "UPDATE SyncPoints SET Value = ? WHERE Key = ?"
		cursor.execute(sql, (value, key))
		
		connection.commit()
		connection.close()

		return self.Select(key)
	
	def Delete(self, key):
		connection = sqlite3.connect(self.dbFileName)
		cursor = connection.cursor()
		
		sql = "DELETE FROM SyncPoints WHERE Key = ?"
		cursor.execute(sql, (key,))
		
		connection.commit()
		connection.close()
		
	def Save(self, key, value):
		if len(self.Select(key)) > 0:
			#return [SyncronisationModel.Point(7, "test", "{test}")]
			return self.Update(key, value)
		else:
			return self.Insert(key, value)