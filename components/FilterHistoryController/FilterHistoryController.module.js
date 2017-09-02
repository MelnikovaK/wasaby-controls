/**
 * Created by am.gerasimov on 07.12.2015.
 */
define('js!SBIS3.CONTROLS.FilterHistoryController',
    [
   "Core/core-functions",
   "Core/EventBus",
   "Core/IoC",
   "Core/ConsoleLogger",
   "js!SBIS3.CONTROLS.HistoryController",
   "js!WS.Data/Collection/List",
   "js!SBIS3.CONTROLS.FilterButton.FilterToStringUtil",
   "js!SBIS3.CONTROLS.FilterHistoryControllerUntil",
   "Core/helpers/Object/isEqual",
   "Core/helpers/generate-helpers",
   "Core/helpers/Function/debounce",
   "Core/helpers/Function/forAliveOnly",
   "Core/helpers/Object/find",
   "Core/HashManager",
   "Core/core-instance",
   "Core/core-merge",
   "Core/Date"
],

    function( cFunctions, EventBus, IoC, ConsoleLogger,HistoryController, List, FilterToStringUtil, FilterHistoryControllerUntil, isEqualObject, genHelpers, debounce, forAliveOnly, find, HashManager, cInstance, cMerge) {

       'use strict';

       var MAX_FILTERS_AMOUNT = 10;
       var LAST_FILTER_NUMBER = 9;
       var HISTORY_CHANNEL = EventBus.channel('FilterHistoryChannel');

       function listToArray(list) {
          var arr = [];

          list.each(function(elem) {
             arr.push(elem);
          });

          return arr;
       }

       var FilterHistoryController = HistoryController.extend({
          $protected: {
             _options: {
                /**
                 * Представление данных
                 */
                view: undefined,
                /**
                 * Кнопка фильтров
                 */
                filterButton: undefined,
                /**
                 * Быстрый фильтр
                 */
                fastDataFilter: undefined,
                /**
                 * Параметры фильтрации, которые не надо сохранять в историю
                 */
                noSaveFilters: [],
                /*
                * фильтры которые надо сохранять в историю
                */
                filtersForHistory: []
             }
          },

          $constructor: function() {
             /* Делаем клон, т.к. сериализация производится один раз, и создаётся лишь один экземпляр объекта,
                и его портить нельзя */
             this._listHistory = new List({items: cFunctions.clone(this.getHistory()) || []});
             this._prepareListHistory();
             this._changeHistoryFnc = this._changeHistoryHandler.bind(this);
             this._applyHandlerDebounced = debounce.call(forAliveOnly(this._onApplyFilterHandler, this)).bind(this);

             if(this._options.filterButton) {
                this._initFilterButton();
             }

             if(this._options.fastDataFilter) {
                this._initFastDataFilter();
             }

             /* Подпишемся на глобальный канал изменения истории,
                чтобы изменения сразу применялись ко всем реестрам, у которых один historyId */
             HISTORY_CHANNEL.subscribe('onChangeHistory', this._changeHistoryFnc);
             this._hashChangeHandlerFnc = this._hashChangeHandler.bind(this);
             if (this._options.filtersForHistory.length > 0) {
                HashManager.subscribe('onChange',this._hashChangeHandlerFnc);
                if (cInstance.instanceOfMixin(this._options.view, 'SBIS3.CONTROLS.TreeMixin')
                   && this._options.filtersForHistory.indexOf(this._options.view.getParentProperty()) > -1
                ) {
                   this._options.view.subscribe('onSetRoot', function (e, root) {
                      var filters = this._getFiltersFormHash();
                      filters[this._options.view.getParentProperty()] = root;
                      this._setFiltersToHash(filters);
                      this._onApplyFilterHandler();//сохранаяем в пользовательскую историю что бы фильтр применился при обновлении страницы
                   }.bind(this));
                }
             }
          },

          _changeHistoryHandler: function(e, id, newHistory, activeFilter, saveDeferred) {
             /* При изменении истории с другим id - ничего не делаем */
             if(this._options.historyId !== id) {
                return;
             }

             var isHistoryEqual = isEqualObject(this.getHistoryArr(), listToArray(newHistory)),
                 filterButton = this._options.filterButton,
                 currentActiveFilter = this.getActiveFilter();

             /* Если при изменении активные фильтры или вся история одинаковы,
                то не надо запускать механизм синхронизации истории */
             if (isHistoryEqual || (currentActiveFilter && activeFilter && isEqualObject(currentActiveFilter, activeFilter))) {
                /* Для случая, когда фильтр был синхронизирован из внешнего контекста (т.е. его в истории нет),
                   при сбросе фильтра, мы должны синхронизировать и другие фильтры, которые подписаны на канал изменения с одинаковым id,
                   т.е. вызвать у них сброс фильтра */
                if(!isHistoryEqual && activeFilter === false && currentActiveFilter === false) {
                   filterButton.sendCommand('reset-filter');
                }

                return;
             }

             /* Запишем новую историю */
             /* Надо обязательно клонировать историю, чтобы по ссылке не передавались изменения */
             this._listHistory.assign(cFunctions.clone(listToArray(newHistory)));
             this._saveParamsDeferred = saveDeferred;

             if(activeFilter) {
                filterButton.setFilterStructure(FilterHistoryControllerUntil.prepareStructureToApply(activeFilter.filter, filterButton.getFilterStructure()));
             } else {
                filterButton.sendCommand('reset-filter');
             }

             this._updateFilterButtonHistoryView();
          },

          _initFilterButton: function() {
             var fb = this._options.filterButton,
                 self = this;

             this.subscribeTo(fb, 'onResetFilter', function(event, internal) {
                if(!internal) {
                   self.clearActiveFilter();
                   if (!self.isNowSaving()) {
                      self.saveToUserParams();
                   }
                }
             });

             this.subscribeTo(fb, 'onApplyFilter', this._applyHandlerDebounced);

          },

          _initFastDataFilter: function() {
             this.subscribeTo(this._options.fastDataFilter, 'onApplyFilter', this._applyHandlerDebounced);
          },

          /* Структура может меняться динамически,
             этот метод сверяем стуктуру из истории и текущую стуркуру фильтров,
             и, если надо, правит структуру из истории */
          _prepareListHistory: function() {
             var toDelete = [],
                 currentStructure = this._options.filterButton.getFilterStructure(),
                 self = this,
                 needUpdateHistory = false;

             this._listHistory.each(function(historyElem) {
                FilterHistoryControllerUntil.prepareNewStructure(currentStructure, historyElem.filter);
                var linkText = FilterToStringUtil.string(historyElem.filter, 'historyItemTemplate');

                if(linkText) {
                   if(historyElem.linkText !== linkText) {
                      historyElem.linkText = linkText;
                      needUpdateHistory = true;
                   }
                } else {
                   toDelete.push(historyElem);
                }
             });

             if(toDelete.length) {
                toDelete.forEach(function(elem) {
                   self._listHistory.remove(elem);
                   needUpdateHistory = true;
                });
             }
             
             /* Обновим историю,
                чтобы остальные контролы, использующие эту же историю подхватили изменения */
             if(needUpdateHistory) {
                this.setHistory(listToArray(this._listHistory), true);
             }
          },

          _onApplyFilterHandler: function() {
             var fb = this._options.filterButton,
                 structure = fb.getFilterStructure(),
                 self = this;

             /* Если это дефолтный фильтр, то сохранять в историю не надо */
             if(!fb.getLinkedContext().getValue('filterChanged')) {
                /* Если применили дефолтный фильтр, то надо сбросить текущий активный */
                self.clearActiveFilter();
                self.saveToUserParams();
                return;
             }

             self.saveToHistory({
                linkText: FilterToStringUtil.string(structure, 'historyItemTemplate'),
                filter: FilterHistoryControllerUntil.prepareStructureToSave(structure)
             });

             self._updateFilterButtonHistoryView();
          },

          _updateFilterButtonHistoryView: function() {
             var fbPicker = this._options.filterButton._picker,
                 filterHistory;

             if(fbPicker) {
                filterHistory = fbPicker.getChildControlByName('filterHistory');
                filterHistory.updateHistoryViewItems();
                filterHistory.toggleHistoryBlock(true);
             }
          },

          activateFilterByKey: function(key) {
             var filter = this.findFilterByKey(key),
                 fb = this._options.filterButton;

             /* Применим фильтр из истории*/
             fb._setFilterStructure(FilterHistoryControllerUntil.prepareStructureToApply(filter.filter, fb.getFilterStructure()));
             fb.getContext().setValue('linkText', filter.linkText);
             fb.hidePicker();

             /* Если этот фильтр не активный, сделаем его активным и сохраним */
             if(!filter.isActiveFilter) {
                this.clearActiveFilter();
                filter.isActiveFilter = true;
                filter.viewFilter = this.prepareViewFilter();
                this.saveToUserParams();
             }
          },

          /**
           * Сохраняет объект с фильтром в историю
           * @param filterObject
           */
          saveToHistory: function(filterObject) {
             var equalFilter = find(this.getHistoryArr() ,function(item) {
                    return isEqualObject(item.filter, filterObject.filter) || item.linkText === filterObject.linkText;
                 }),
                 activeFilter = this.getActiveFilter();

             /* Если есть активный фильтр - сбросим его */
             if(activeFilter) {
                activeFilter.isActiveFilter = false;
             }
             this._setFiltersToHash(filterObject);
             /* Не сохраняем в историю, если:
                1) Ещё не сохранился предыдущий фильтр,
                2) Такой фильтр уже есть в истории
                3) Нет текстового представления фильтра (такое может быть, если какой-то параметр в историю не хотят сохранять,
                   но фильтровать по нему можно или этот фильтр выставлен "по-умолчанию" ) */
             if(this.isNowSaving() || equalFilter || !filterObject.linkText) {
                /* Если такой фильтр есть в истории, то надо его сделать активным */
                if(equalFilter && !equalFilter.isActiveFilter) {
                   equalFilter.isActiveFilter = true;
                   equalFilter.viewFilter = this.prepareViewFilter();
                   /* Если есть такой-же фильтр, обновим его структуру на свежую */
                   equalFilter.filter = filterObject.filter;
	               this.saveToUserParams()
                }
                return;
             }

             /* Если фильтров больше 10 - удалим последний */
             if (this._listHistory.getCount() === MAX_FILTERS_AMOUNT) {
                this._listHistory.removeAt(LAST_FILTER_NUMBER);
             }


             /* Добавим новый фильтр в начало набора */
             this._listHistory.add({
                id: genHelpers.randomId(),
                linkText: filterObject.linkText,
	             viewFilter: this.prepareViewFilter(),
                filter: filterObject.filter,
                isActiveFilter: true,
                isMarked: false
             });

	          this.saveToUserParams();
          },

          prepareViewFilter: function(filter) {
             var view = this._options.view,
                /* View может не быть, если кнопку фильтров используют отдельно (например в торгах,
                   там по кнопке фильтров фильтруется набор из несколькх view */
                 viewFilter = cFunctions.clone(filter || (view ? view.getFilter() : {}));

             this._options.noSaveFilters.forEach(function(filter) {
                if(viewFilter[filter]) {
                   delete viewFilter[filter];
                }
             });

             /* Т.к. в реестре задач (возможно где-то ещё)
                в поле фильтра с типом "Дата" ожидают строку даты со сдвигом(чтобы её обработать),
                а не стандартный ISO формат, то использую наш специальный метод для приведения даты в строку */
             for (var key in viewFilter) {
                if(viewFilter.hasOwnProperty(key)) {
                   if(viewFilter[key] instanceof Date) {
                      viewFilter[key] = viewFilter[key].toSQL(Date.SQL_SERIALIZE_MODE_AUTO);
                   }
                }
             }
             var hashFilter = this._getFiltersFormHash();
             return cMerge(viewFilter, hashFilter);
          },

	       /**
	        * Очищает текущий активный фильтр
	        */
          clearActiveFilter: function() {
             var activeFilter = this.getActiveFilter();

             if(activeFilter) {
                activeFilter.isActiveFilter = false;
             }
          },

          /**
           * Возвращает текущий активный фильтр
           * @private
           */
          getActiveFilter: function() {
             return find(this.getHistoryArr() ,function(item) {
                return item.isActiveFilter;
             }, this, false);
          },
          /**
           * возвращает фильтры из хеша
           * @private
           */
          _getFiltersFormHash: function () {
             var hashValue = HashManager.get(this._options.historyId),
                filtersForHistory = this._options.filtersForHistory,
                filter = {};
             if (hashValue) {
                if (filtersForHistory.length == 1) {
                   filter[filtersForHistory[0]] =  hashValue;
                } else {
                   filter = JSON.parse(hashValue);
                }
             }
             filtersForHistory.forEach(function (name) {
                if (!filter.hasOwnProperty(name)) {
                   filter[name] = null; //todo если фильтра нет то надо востановить значение по умолчанию пока тольк раздел это null
                }
             });
             return filter;
          },
          _setFiltersToHash: function (filters) {
             var filtersForHistory = this._options.filtersForHistory,
                saveFilters = {};
             if (filtersForHistory.length > 0) {
                //если сохранять надо только один фильтр то сохраняем только значение, так хеш будет короче
                if (filtersForHistory.length == 1) {
                   saveFilters = filters[filtersForHistory[0]];
                } else {
                   filtersForHistory.forEach(function (name) {
                      var value = filters[name];
                      if (typeof value  !== undefined) {
                         saveFilters[name] = filters[name];
                      }
                   }.bind(this));
                   saveFilters = JSON.stringify(saveFilters);
                }
                if (saveFilters) {
                   HashManager.set(this._options.historyId, JSON.stringify(saveFilters));
                } else {
                   HashManager.remove(this._options.historyId);
                }
             }
          },
          /**
           * Ищет фильтр по ключу
           * @param {String} key
           * @private
           */
          findFilterByKey: function(key) {
             return find(this.getHistoryArr(), function(item) {
                return item.id == key;
             }, this, false);
          },

          /**
           * Сохраняет историю в пользовательские параметры
           * @private
           */
          saveToUserParams: function() {
             this._sortHistory();
             this.setHistory(this.getHistoryArr(), true);
             HISTORY_CHANNEL.notify('onChangeHistory',
                 this._options.historyId,
                 this._listHistory,
                 this.getActiveFilter(),
                 this.getSaveDeferred()
             );
          },

          /**
           * Изменяет состояние флага отмеченности фильтра на противоположное
           * @param {String} key
           */
          toggleMarkFilter: function(key) {
             var filter = this.findFilterByKey(key);

             if(filter) {
                filter.isMarked = !filter.isMarked;
                this.saveToUserParams();
             }
          },

          getHistoryArr: function() {
             return listToArray(this._listHistory);
          },

          getFilterButton: function() {
             return this._options.filterButton;
          },

          _sortHistory: function() {
             /* Сортирует историю по флагу отмеченности и активности.
              Приоритет: отмеченные > активный > обычные. */
             this._listHistory.assign(this.getHistoryArr().sort(function(a, b) {
                if(a.isMarked && b.isMarked) {
                   return 0;
                } else if(a.isMarked) {
                   return -1;
                } else if(b.isMarked) {
                   return 1;
                } else if(a.isActiveFilter && b.isActiveFilter) {
                   return 0;
                } else if(a.isActiveFilter) {
                   return -1;
                } else if(b.isActiveFilter) {
                   return 1;
                }
                return 0;
             })
             )
          },

          _hashChangeHandler: function () {
             var view = this._options.view,
               viewFilters = view.getFilter(),
               hashFilters = this._getFiltersFormHash();
             if (
                cInstance.instanceOfMixin(this._options.view, 'SBIS3.CONTROLS.TreeMixin') &&
                this._options.filtersForHistory.indexOf(view.getParentProperty()) > -1
             ) {//если меняется раздел то надо сменить корень у дерева иначе записи не будут отображаться
                view.setRoot(hashFilters[this._options.historyId]||null);
             }
             cMerge(viewFilters, hashFilters);
             view.setFilter(viewFilters);
          },

          destroy: function() {
             HISTORY_CHANNEL.unsubscribe('onChangeHistory', this._changeHistoryFnc);
             HashManager.unsubscribe('onChange', this._hashChangeHandlerFnc);
             this._changeHistoryFnc = undefined;
             this._applyHandlerDebounced = undefined;
             FilterHistoryController.superclass.destroy.apply(this, arguments);
          }
       });

       return FilterHistoryController;

    });