#!/usr/bin/env python

import logging
from common.argument_parser import get_parser
from common.scripts import start_app, syncdb


logging.basicConfig(level=logging.DEBUG)

parser = get_parser()

subparsers = parser.add_subparsers(help="SyncDB command")

parser_syncdb = subparsers.add_parser("syncdb", help="Syncdb parser")
parser_syncdb.set_defaults(func=syncdb)

parser_runserver = subparsers.add_parser("runserver", help="runserver parser")
parser_runserver.add_argument("--debug", help="Run in debug mode.", action="store_true")
parser_runserver.add_argument(
    "--port",
    type=int,
    default=8888,
    help="Port to use")
parser_runserver.add_argument(
    "--host",
    type=str,
    default='localhost',
    help="Hostname to listen on"
)
parser_runserver.set_defaults(func=start_app)


if __name__ == "__main__":
    parser = get_parser()
    args = parser.parse_args()
    args.func(args)
