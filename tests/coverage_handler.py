"""
модуль для составления файла из отчетов istanbul
может вовзарщать список тестов, в зависимости какие исходные файлы изменялись

"""

import os
import json
import argparse
from collections import OrderedDict

RESULT_JSON = 'result.json'


class Coverage:
    """Составляет исходный json файл с названиями тестов и их зависимостями"""

    path_result = {}
    build_result = {}
    test_result = []
    fullpath = []


    def get_fullpath_test_name(self):
        """Получаем пути расположения файлов"""
        for root_test in (os.path.join('int', 'SBIS3.CONTROLS'), os.path.join('int','VDOM')):
            for root, dirs , filename in os.walk(root_test):
                for f in filename:
                    self.fullpath.append(os.path.join(root, f))

    def build(self, path):
        """Пробегает по всем папкам в поисках coverage.json"""

        test_path = os.listdir(path)
        for tdir in test_path:
            path_list = []
            root = os.path.join(path, tdir)
            for top, _, files in os.walk(root):
                for f in files:
                    if f.endswith('-coverage.json'):
                        path_list.append(os.path.join(top, f))
            path_test = [test for test in self.fullpath if tdir in test][0]
            self.path_result[path_test] = path_list

        for ts, item in enumerate(self.path_result):
            coverage_result = []
            print(ts, 'Name: ', item)
            for fname in self.path_result[item]:
                with open(fname, encoding='utf-8', mode='r') as f:
                    print('File: ', fname)
                    d = json.load(f, encoding='utf-8')
                    # получаем зависимости
                    for k in d:
                        # обрезаем пути, переменная берется из сборки
                        env = os.environ["WORKSPACE"]
                        k = k.replace(env, '')
                        coverage_result.append(k)
            s_result = sorted(set(coverage_result))
            self.build_result[item] = s_result

        # записываем результаты в файл
        with open(os.path.join(path, RESULT_JSON), mode='a+', encoding='utf-8') as f:
            f.write(json.dumps(OrderedDict(sorted(self.build_result.items(), key=lambda t: t[0])), indent=2))

    def get_tests(self, change_files):
        """Возвращает список файлов, которые нужно запустить"""

        with open(RESULT_JSON, encoding='utf-8') as f:
            data = json.load(f, encoding='utf-8')
            for test_name in data:
                for source in data[test_name]:
                    for file in change_files:
                        if file in source:
                            self.test_result.append(test_name)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    build = parser.add_argument_group('build')
    build.add_argument('-s', '--source_path', help='root path with inner coverage.json ')
    action = parser.add_argument_group('action')
    action.add_argument('-c', '--changelist', nargs='+', help='List changed files')
    args = parser.parse_args()
    coverage = Coverage()
    if args.source_path:
        print('Собираем покрытие', args.source_path)
        coverage.get_fullpath_test_name()
        coverage.build(args.source_path)

    if args.changelist:
        coverage.get_tests(args.changelist)
        if coverage.test_result:
            print(' '.join(set(coverage.test_result)))
