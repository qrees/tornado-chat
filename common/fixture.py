from __future__ import absolute_import


class DataTestCase(object):

    fixture = None
    data = None
    datasets = []

    def setUpFixture(self):
        if self.fixture is None:
            raise NotImplementedError("no concrete fixture to load data with")
        if not self.datasets:
            raise ValueError("there are no datasets to load")
        self.data = self.fixture.data(*self.datasets)
        self.data.setup()

    def tearDownFixture(self):
        self.data.teardown()
