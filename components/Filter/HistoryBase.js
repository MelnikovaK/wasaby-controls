/**
 * Created by am.gerasimov on 23.01.2017.
 */
define('SBIS3.CONTROLS/Filter/HistoryBase', [
   'Core/helpers/Object/isEqual',
   'Core/helpers/Object/find',
   'SBIS3.CONTROLS/CompoundControl',
   'SBIS3.CONTROLS/History/HistoryListUtils',
   'SBIS3.CONTROLS/History/HistoryList',
   'Core/CommandDispatcher',
   'SBIS3.CONTROLS/Utils/InformationPopupManager',
   'Core/helpers/collection-helpers',
   'SBIS3.CONTROLS/Filter/HistoryView'
], function(
   isEqualObject,
   find,
   CompoundControl,
   HistoryListUtils,
   HistoryList,
   CommandDispatcher,
   InformationPopupManager,
   colHelpers
) {

      'use strict';

      var _private =  {
         itemActionHandler: function(item, isAdd) {
            var self = this;

            if(isAdd) {
               this.sendCommand('addReportHistory', item);
            } else {
               InformationPopupManager.showConfirmDialog({
                  message: rk('Удалить шаблон из избранного?'),
                  opener: self
               }, function positiveCallback() {
                  self.sendCommand('deleteReportHistory', item.get('id'), true, item.get('data').get('globalParams'));
               });
            }
         },

         favoriteSortMethod: function(item1, item2) {
            var isGlobal1 = item1.item.getContents().get('globalParams'),
               isGlobal2 = item2.item.getContents().get('globalParams');

            if((isGlobal1 && isGlobal2) || (!isGlobal1 && !isGlobal2)) {
               return 0;
            } else if(isGlobal1) {
               return 1;
            } else if(isGlobal2) {
               return -1;
            }
         }
      };

      var HistoryBase = CompoundControl.extend({
         $protected: {
            _options: {
               _favoriteSortMethod: _private.favoriteSortMethod,
               _filterProperty: 'viewFilter',
               _structureProperty: 'filter',
               _favoriteAction: {
                  command: 'favorite',
                  name: 'favorite',
                  icon: 'icon-24 icon-Unfavourite icon-disabled action-hover',
                  isMainAction: true
               },
               _unFavoriteAction: {
                  command: 'unfavorite',
                  name: 'unfavorite',
                  icon: 'icon-24 icon-Favourite icon-disabled action-hover',
                  isMainAction: true
               },
               idProperty: 'internalValueField',
               displayProperty: 'linkText',

               historyId: ''
            },
            _favoriteView: null,
            _historyView: null
         },

         $constructor: function() {
            var self = this,
               favoriteList = this._getHistoryList(true),
               favoriteAllList = this._getHistoryList(true, true),
               historyList = this._getHistoryList();

            this._publish('onItemActivate');

            function deleteReportHistory(id, isFavorite, isGlobal) {
               var index = -1,
                  list;

               if(isGlobal) {
                  list = favoriteAllList;
               } else if(isFavorite) {
                  list = favoriteList;
               } else {
                  list = historyList;
               }

               list.each(function(item, idx) {
                  if(id === item.get('id')) {
                     index = idx;
                  }
               });

               if(index !== -1) {
                  list.removeAt(index);
               }
               return true;
            }

            function addReportHistory(item) {
               var action = this.getChildControlByName('editFavorite'),
                  self = this,
                  toEditItem = item.get('data').clone();

               /* Подготавливаем запись к редктированию */
               toEditItem.set('toSaveFields', {});
               toEditItem.set('editedTextValue', '');

               action.execute({
                  item: toEditItem,
                  componentOptions: {
                     textValue: toEditItem.get(self._options.displayProperty),
                     handlers: {
                        onBeforeUpdateModel: function (event, record) {
                           var toSaveFields = record.get('toSaveFields'),
                              filter = record.get(self._options._filterProperty),
                              globalParams = record.get('globalParams'),
                              editedTextValue = record.get('editedTextValue'),//Текст, который хочет сохранить пользователь
                              textValue = record.get(self._options.displayProperty),//Оригинальный текст
                              editableFieldsCount = record.get(self._options._structureProperty).reduce(function(result, elem) {
                                 return isEqualObject(elem.value, elem.resetValue) ? result : ++result;
                              }, 0),
                              reportItem, filterItems;

                           /* Не сохраняем запись, если нет параметров для сохранения */
                           if(editableFieldsCount <= Object.keys(toSaveFields).length) {
                              record.acceptChanges(); // Чтобы formController не запустил обновление записи
                              return;
                           }

                           /* Сбрасываем поля, которые не надо сохранять после редактирования */
                           if(!Object.isEmpty(toSaveFields)) {
                              filterItems = record.get(self._options._structureProperty);
                              colHelpers.forEach(toSaveFields, function(value, key) {
                                 if(!value) {
                                    reportItem = find(filterItems, function(obj) {
                                       return obj[self._options.idProperty] === key;
                                    });

                                    if(reportItem) {
                                       reportItem.value = reportItem.resetValue;
                                       textValue = textValue.replace(new RegExp('\s?' + reportItem[self._options.displayProperty] + ',?\s?'), '');
                                       textValue = textValue.replace(/ {1,}/g, ' ');
                                       reportItem[self._options.displayProperty] = '';
                                       delete filter[key];
                                    }
                                 }
                              });
                              /* Сделаем set полей, чтобы они попали в "сырые" данные */
                              record.set(self._options._structureProperty, filterItems);
                              record.set(self._options._filterProperty, filter);
                           }
                           textValue = String.trim(textValue);
                           /* Затираем ненужные для сохранения поля */
                           record.has('toSaveFields') && record.removeField('toSaveFields');
                           record.has('editedTextValue') && record.removeField('editedTextValue');
                           /* Если пользователь что-то ввёл, то сохраняем это как текст */
                           record.set(self._options.displayProperty, editedTextValue ? editedTextValue : textValue);
                           if(editedTextValue && editedTextValue !== textValue) {
                              record.set('fullTextValue', textValue);
                           }
                           record.acceptChanges();
                           self.sendCommand('deleteReportHistory', item.get('id'));
                           (globalParams ? favoriteAllList : favoriteList).prepend(record);
                        }
                     }
                  },
                  dialogOptions: { resizable : false }
               });

               return true;
            }

            /* Комманды на добавление в историю / список избранных */
            CommandDispatcher.declareCommand(this, 'deleteReportHistory', deleteReportHistory);
            CommandDispatcher.declareCommand(this, 'addReportHistory', addReportHistory);
            CommandDispatcher.declareCommand(this, 'favorite', function(item) {
               _private.itemActionHandler.call(self._historyView, item.record, true);
            });
            CommandDispatcher.declareCommand(this, 'unfavorite', function(item) {
               _private.itemActionHandler.call(self._favoriteView, item.record, false);
            });

            this.once('onInit', function() {
               self._favoriteView = this.getChildControlByName('ReportFavoriteView');
               self._historyView = this.getChildControlByName('ReportHistoryView');


               /* Добавление записей "Для всех" в список, т.к. они хранятся отдельно */
               this.subscribeTo(favoriteAllList, 'onHistoryUpdate', function(event, history) {
                  var favoriteViewItems = self._favoriteView.getItems();

                  if(favoriteViewItems) {
                     favoriteViewItems.assign(favoriteList.getHistory().clone());
                  } else {
                     self._favoriteView.setItems(favoriteList.getHistory().clone());
                  }
                  self._favoriteView.getItems().prepend(history.clone());
                  checkItems(self._favoriteView);
               });

               this.subscribeTo(self._favoriteView, 'onItemsReady', function() {
                  self._favoriteView.getItems().prepend(favoriteAllList.getHistory().clone());
                  checkItems(self._favoriteView);
               });

               self._favoriteView.getItems().prepend(favoriteAllList.getHistory().clone());

               function checkItems(view) {
                  var viewBlock = view.getContainer().parent();
                  viewBlock.toggleClass('ws-hidden', !view.getItems().getCount());
               }

               this.processViews(function(view) {
                  self.subscribeTo(view, 'onItemActivate', function(event, itemObj) {
                     self._notify('onItemActivate', itemObj, this === self._favoriteView, itemObj.item.get('data').get('globalParams'));
                  });
               });

               this.processViews(function(view) {
                  self.subscribeTo(view, 'onItemsReady', function() {
                     checkItems(view);
                  });
               });

               this.processViews(checkItems);
            });

            this.once('onDestroy', function() {
               historyList.destroy();
               favoriteList.destroy();
               favoriteAllList.destroy();
            });
         },

         processViews: function(callback) {
            callback(this._favoriteView);
            callback(this._historyView);
         },

         _getHistoryList: function(isFavorite, isGlobal) {
            return HistoryListUtils.getHistoryList(this._options.historyId, isFavorite, isGlobal);
         },

         hasHistory: function() {
            var hasHistory = false;

            this.processViews(function(view) {
               hasHistory |= view.getItems() && view.getItems().getCount();
            });

            return !!hasHistory;
         },

         destroy: function () {
            this._favoriteView = undefined;
            this._historyView = undefined;
            HistoryBase.superclass.destroy.apply(this, arguments);
         }
      });

      HistoryBase.getHistoryList = HistoryListUtils.getHistoryList;

      return HistoryBase;

   });