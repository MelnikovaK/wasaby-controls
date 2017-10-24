/**
 * Created by as.avramenko on 24.01.2017.
 */

define('js!SBIS3.CONTROLS.ColumnsEditorArea',
   [
      'js!SBIS3.CONTROLS.CompoundControl',
      'js!SBIS3.CONTROLS.ColumnsEditorModel',
      'js!SBIS3.CONTROLS.ItemsMoveController',
      'Core/CommandDispatcher',
      'WS.Data/Functor/Compute',
      'WS.Data/Collection/RecordSet',
      'tmpl!SBIS3.CONTROLS.ColumnsEditorArea',
      'tmpl!SBIS3.CONTROLS.ColumnsEditorArea/resources/preset',
      'tmpl!SBIS3.CONTROLS.ColumnsEditorArea/resources/presetEdit',
      'tmpl!SBIS3.CONTROLS.ColumnsEditorArea/resources/selectableGroupContent',
      'tmpl!SBIS3.CONTROLS.ColumnsEditorArea/resources/selectableItemContent',
      'css!SBIS3.CONTROLS.ColumnsEditorArea',
      'js!SBIS3.CONTROLS.Button',
      'js!SBIS3.CONTROLS.ListView',
      'js!SBIS3.CONTROLS.CheckBoxGroup',
      'js!SBIS3.CONTROLS.ScrollContainer'
   ],

   function (CompoundControl, ColumnsEditorModel, ItemsMoveController, CommandDispatcher, ComputeFunctor, RecordSet, dotTplFn) {
      'use strict';

      /**
       * Класс контрола "Редактор колонок".
       *
       * @author Авраменко Алексей Сергеевич
       * @class SBIS3.CONTROLS.ColumnsEditorArea
       * @public
       * @extends SBIS3.CONTROLS.CompoundControl
       */
      var ColumnsEditorArea = CompoundControl.extend(/** @lends SBIS3.CONTROLS.ColumnsEditorArea.prototype */ {
         _dotTplFn: dotTplFn,
         $protected: {
            _options: {
               columns: undefined,
               selectedColumns: [],
               moveColumns: true,
               title: ''
            },
            _presetView: undefined,
            _fixedView: undefined,
            _selectableView: undefined
         },

         _modifyOptions: function () {
            var cfg = ColumnsEditorArea.superclass._modifyOptions.apply(this, arguments);
            cfg._optsPreset = {
               items: _makePresetItems(cfg.getPresets(), cfg.getSelectedPreset())
            };
            var prepared = _prepareItems(cfg.columns, cfg.selectedColumns, cfg.moveColumns);
            cfg._optsFixed = prepared.fixed;
            cfg._optsSelectable = prepared.selectable;
            cfg._optsSelectable.onItemClick = _onItemClick;
            if (!cfg.moveColumns) {
               // Добавляем автосортировку отмеченных элементов - они должны отображаться перед неотмеченными
               cfg._optsSelectable.itemsSortMethod = _getItemsSortMethod();
               cfg._optsSelectable.onSelectedItemsChange = _onSelectedItemsChange;
            }
            return cfg;
         },

         $constructor: function () {
            CommandDispatcher.declareCommand(this, 'applyColumns', this._commandApplyColumns);
            this._publish('onSelectedColumnsChange');
         },

         init: function () {
            ColumnsEditorArea.superclass.init.apply(this, arguments);
            this._presetView = this.getChildControlByName('controls-ColumnsEditorArea__Preset');
            this._fixedView = this.getChildControlByName('controls-ColumnsEditorArea__FixedList');
            this._selectableView = this.getChildControlByName('controls-ColumnsEditorArea__SelectableList');

            _updatePresetView(this, true);
            //this._presetView.setItemsHover(false);
            //this.subscribeTo(this._presetView, 'onChangeHoveredItem', this._presetView.setItemsHover.bind(this._presetView, false));
            this._presetView.setItemsActions(_makeItemsActions(this));
            this.subscribeTo(this._presetView, 'onAfterBeginEdit', this._presetView.setItemsActions.bind(this._presetView, []));
            this.subscribeTo(this._presetView, 'onEndEdit', function (evtName, model, withSaving) {
               if (withSaving) {
                  this.sendCommand('changePreset', model.get('title')).addCallback(function (isSuccess) {
                     if (!isSuccess) {
                        // TODO: Изменение не сохранено - откатится назад
                     }
                  });
               }
            }.bind(this));
            this.subscribeTo(this._presetView, 'onAfterEndEdit', function (evtName, model, $target, withSaving) {
               this._presetView.setItemsActions(_makeItemsActions(this));
            }.bind(this));

            // В опциях могут быть указаны группы, которые нужно свернуть при открытии
            var groupCollapsing = this._options.groupCollapsing;
            if (groupCollapsing) {
               for (var group in groupCollapsing) {
                  if (groupCollapsing[group]) {
                     this._selectableView.collapseGroup(group);
                  }
               }
            }
            if (this._options.moveColumns) {
               this._itemsMoveController = new ItemsMoveController({
                  linkedView: this._selectableView
               });
            }
         },

         _commandApplyColumns: function () {
            var
               list = this._selectableView,
               selectedColumns = [].concat(list.getSelectedKeys()),
               items = list.getItems();
            // Сортируем выделенные записи согласно их положению в рекордсете
            selectedColumns.sort(function (el1, el2) {
               return items.getIndex(items.getRecordById(el1)) - items.getIndex(items.getRecordById(el2));
            });
            this._options.selectedColumns = selectedColumns;
            this._notifyOnPropertyChanged('selectedColumns');
            this._notify('onSelectedColumnsChange', selectedColumns);
         },

         destroy: function () {
            if (this._itemsMoveController) {
               this._itemsMoveController.destroy();
            }
            ColumnsEditorArea.superclass.destroy.apply(this, arguments);
         }
      });



      // Private methods:

      var _prepareItems = function (columns, selectedColumns, moveColumns) {
         var
            preparingItems = [],
            fixed = {
               items: [],
               markedKeys: []
            },
            selectable = {
               items: [],
               markedKeys: []
            };
         columns.each(function (column) {
            var columnId = column.getId();
            var colData = column.getRawData();
            if (column.get('fixed')) {
               fixed.items.push(colData);
               fixed.markedKeys.push(columnId);
            }
            else {
               if (moveColumns) {
                  selectable.items.push(colData)
               }
               else {
                  // При отключенном перемещении необходимо сформировать рекордсет с собственной моделью.
                  // Подготавливаем для него исходные данные.
                  preparingItems.push(colData);
               }
               if (selectedColumns.indexOf(columnId) !== -1) {
                  selectable.markedKeys.push(columnId);
               }
            }
         });
         if (moveColumns) {
            // При включенном перемещении сортируем записи, согласно переданному состоянию массива отмеченных записей
            selectable.items.sort(function (el1, el2) {
               var
                  idx1 = selectedColumns.indexOf(el1.id),
                  idx2 = selectedColumns.indexOf(el2.id);
               if (idx1 !== -1) {
                  return idx2 !== -1 ? idx1 - idx2 : -1;
               }
               return idx2 !== -1 ? 1 : -1;
            });
         }
         else {
            // При отключенном перемещении будем использовать рекордсет с собственной моделью
            // для осуществления автосортировки отмеченных записей
            selectable.items = new RecordSet({
               rawData: preparingItems,
               idProperty: 'id',
               model: ColumnsEditorModel
            });
            _applySelectedToItems(selectable.markedKeys, selectable.items);
         }
         return {fixed:fixed, selectable:selectable};
      };

      var _applySelectedToItems = function (selectedArray, items) {
         selectedArray.forEach(function (id) {
            items.getRecordById(id).set('selected', true);
         });
      };

      var _getItemsSortMethod = function () {
         return new ComputeFunctor(function (el1, el2) {
            // Смещаем отмеченные элементы в начало списка (учитывая их начальный index)
            if (el1.collectionItem.get('selected')) {
               if (el2.collectionItem.get('selected')) {
                  return el1.index - el2.index;
               }
               return -1;
            }
            if (el2.collectionItem.get('selected')) {
               return 1;
            }
            return el1.index - el2.index;
         }, ['selected']);
      };

      var _makePresetItems = function (presets, selectedPreset) {
         var recordset = new RecordSet({idProperty:'title'});
         recordset.add(presets.getRecordById(selectedPreset));
         return recordset;
      };

      var _updatePresetView = function (self, dontSet) {
         if (!dontSet) {
            self._presetView.setItems(_makePresetItems(self._options.getPresets(), self._options.getSelectedPreset()));
         }
         var dropdown = self._presetView.getChildControlByName('controls-controls-ColumnsEditorArea__Preset-item-title');
         if (dropdown) {
            self.subscribeTo(dropdown, 'onSelectedItemsChange', function (evtName, selected, changes) {
               self.sendCommand('selectPreset', selected[0]);
               _updatePresetView(self);
            });
         }
      };

      var _makeItemsActions = function (self) {
         return [
            {name:'edit', title:rk('Редактировать'), icon:'sprite:icon-16 icon-Edit icon-primary action-hover'},
            {name:'clone', title:rk('Дублировать'), icon:'sprite:icon-16 icon-Copy icon-primary action-hover'},
            {name:'delete', title:rk('Удалить'), icon:'sprite:icon-16 icon-Erase icon-error'}
         ].map(function (inf) {
            return {
               name: inf.name,
               icon: inf.icon,
               caption: inf.title,
               tooltip: inf.title,
               isMainAction: true,
               onActivated: function ($item, itemId, itemModel, action) {
                  _applyTemplateAction(self, action, itemModel);
               }
            };
         });
      };

      var _applyTemplateAction = function (self, action, model) {
         switch (action) {
            case 'edit':
               self._presetView.beginEdit(model, false);
               break;
            case 'clone':
            case 'delete':
               var commands = {'clone':'clonePreset', 'delete':'deletePreset'};
               self.sendCommand(commands[action]).addCallback(function (isSuccess) {
                  if (!isSuccess) {
                     // TODO: Изменение не сохранено - откатится назад
                  }
               });
               _updatePresetView(self);
               break;
         }
      };



      // ListView event handlers:

      var _onItemClick = function (e, id) {
         this.toggleItemsSelection([id]);
      };

      var _onSelectedItemsChange = function (e, ids, changes) {
         var items = this.getItems();
         changes.added.forEach(function (id) {
            items.getRecordById(id).set('selected', true);
         });
         changes.removed.forEach(function (id) {
            items.getRecordById(id).set('selected', false);
         });
      };



      return ColumnsEditorArea;
   }
);
