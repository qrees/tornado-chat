

class MultiDict(dict):

    def getlist(self, key):
        return [self[key]]
