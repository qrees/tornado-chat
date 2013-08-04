import os

class FileTemplate(object):

    def __init__(self, _file):
        self._file = _file

    def get_path(self):
        return os.path.join('templates', self._file)

    def render(self):
        path = self.get_path()
        with open(path) as _file_descriptor:
            return _file_descriptor.read()
