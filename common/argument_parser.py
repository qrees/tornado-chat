
import argparse

_parser = None


def get_parser():
    global _parser
    if _parser is None:
        _parser = argparse.ArgumentParser()
    return _parser

