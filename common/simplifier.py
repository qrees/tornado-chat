import collections


class Simplifier(object):

    def __init__(self, ctx):
        self.ctx = ctx

    def simplify(self, obj):
        if isinstance(obj, basestring):
            return obj

        if isinstance(obj, (int, float, long)):
            return obj

        if isinstance(obj, dict):
            return dict(map(self.simplify, obj.items()))

        if isinstance(obj, collections.Iterable):
            return map(self.simplify, obj)

        if isinstance(obj, SimpleObject):
            return obj.as_simple_object()

        raise TypeError("Cannot simplify %r" % (obj,))


class SimpleObject(object):

    def as_simple_object(self):
        raise NotImplementedError("as_simple_object is not implementedin %r" % (self,))

    def __instancecheck__(self, instance):
        return hasattr(instance, 'as_simple_object')
