import importlib

from common.argument_parser import get_parser
import settings

parser = get_parser()


for app in ['common'] + settings.INSTALLED_APPS:
    app_auto_path = app + "." + "auto"
    try:
        app_auto = importlib.import_module(app_auto_path)
    except ImportError:
        continue
    if hasattr(app_auto, 'init'):
        app_auto.init()

args = parser.parse_args()
args.func(args)
