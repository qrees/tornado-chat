import importlib
import settings


def autodiscrover():
    for app in ['common'] + settings.INSTALLED_APPS:
        app_auto_path = app + "." + "auto"
        try:
            app_auto = importlib.import_module(app_auto_path)
        except ImportError:
            continue
        if hasattr(app_auto, 'init'):
            app_auto.init()
