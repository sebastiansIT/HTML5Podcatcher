		
class Point:
	
	def __init__(self, id, key, value):
		self.id = id
		self.key = key
		self.value = value
	
	def getKey(self):
		return self.key
	
	def toJson(self):
		json = "\t{\"id\": " + str(self.id)
		json += ",\n\t \"key\": \"" + self.key + "\""
		json += ",\n\t \"value\":"  + self.value + "}"
		return json