from common.argument_parser import get_parser
from common.autodiscover import autodiscrover
import logging


logging.basicConfig(level=logging.DEBUG)

autodiscrover()


if __name__ == "__main__":
    parser = get_parser()
    args = parser.parse_args()
    args.func(args)
