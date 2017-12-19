"""SDK modules builder"""
import shutil
import os
import logging


def build():
    """Build interface modules"""

    list_dirs = ['lang']

    def _copy(source, target):
        """Copy from 'source' to 'target' with replace"""
        logging.info('Copy "%s" to "%s"', source, target)
        if os.path.exists(target):
            if os.path.isdir(target):
               shutil.rmtree(target)
            else:
               os.remove(target)
        if os.path.isdir(source):
            shutil.copytree(source, target)
        else:
            shutil.copyfile(source, target)

    set(map(lambda x: _copy(x, os.path.join('SBIS3.CONTROLS', x)), list_dirs))
    set(map(lambda x: _copy(os.path.join('components', x), os.path.join('SBIS3.CONTROLS', x)), os.listdir('components')))

if __name__ == '__main__':
    build()
