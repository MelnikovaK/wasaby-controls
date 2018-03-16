# -*- coding: utf-8 -*-
import os
import shutil

# удаление лишних папок со страницами тестов
root = os.getcwd()
dirs_for_del = ['reg', 'unit', r'stand/intest/regression']
for tmp_dir in dirs_for_del:
    if os.path.exists(tmp_dir):
        shutil.rmtree(tmp_dir)

os.chdir(r'stand/intest/integration')
root_1 = os.getcwd()
exclude = ['_VDOM', '_Grids']
tmp_list_dirs = [d for d in os.listdir(root_1) if os.path.isdir(os.path.join(root_1, d)) and d not in exclude]
for tmp_dir in tmp_list_dirs:
    shutil.rmtree(tmp_dir)

os.chdir(r'_Grids')
root_1 = os.getcwd()
exclude = ['IntTreeDataGrid']
tmp_list_dirs = [d for d in os.listdir(root_1) if os.path.isdir(os.path.join(root_1, d)) and d not in exclude]
for tmp_dir in tmp_list_dirs:
    shutil.rmtree(tmp_dir)

os.chdir(r'IntTreeDataGrid')
root_1 = os.getcwd()
exclude = ['TDG4', 'TDG_model']
tmp_list_dirs = [d for d in os.listdir(root_1) if os.path.isdir(os.path.join(root_1, d)) and d not in exclude]
for tmp_dir in tmp_list_dirs:
    shutil.rmtree(tmp_dir)

os.chdir(os.path.join(root, 'int'))
root_1 = os.getcwd()
exclude = ['smoke_test.py', 'test_todomvc.py', 'test_treedatagrid_2.py', 'test_treedatagrid_2_db.py', 'test_vdom.py']
tmp_list_files = [f for f in os.listdir(root_1) if os.path.isfile(os.path.join(root_1, f)) and f not in exclude]
for file_name in tmp_list_files:
    os.remove(f)
shutil.copy('smoke_test.py', 'test_smoke.py')