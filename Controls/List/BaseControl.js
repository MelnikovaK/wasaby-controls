define('Controls/List/BaseControl', [
   'Core/Control',
   'Core/IoC',
   'Core/core-clone',
   'Core/core-merge',
   'Core/core-instance',
   'wml!Controls/List/BaseControl/BaseControl',
   'Controls/List/resources/utils/ItemsUtil',
   'require',
   'Controls/List/Controllers/VirtualScroll',
   'Controls/Controllers/SourceController',
   'Core/helpers/Object/isEqual',
   'Core/Deferred',
   'Core/constants',
   'Controls/Utils/scrollToElement',
   'Types/collection',
   'Controls/Utils/Toolbar',
   'Controls/List/ItemActions/Utils/Actions',
   'Controls/Utils/tmplNotify',
   'Controls/Utils/keysHandler',
   'wml!Controls/List/BaseControl/Footer',
   'css!theme?Controls/List/BaseControl/BaseControl'
], function(
   Control,
   IoC,
   cClone,
   cMerge,
   cInstance,
   BaseControlTpl,
   ItemsUtil,
   require,
   VirtualScroll,
   SourceController,
   isEqualObject,
   Deferred,
   cConstants,
   scrollToElement,
   collection,
   tUtil,
   aUtil,
   tmplNotify,
   keysHandler
) {
   'use strict';

   //TODO: getDefaultOptions зовётся при каждой перерисовке, соответственно если в опции передаётся не примитив, то они каждый раз новые
   //Нужно убрать после https://online.sbis.ru/opendoc.html?guid=1ff4a7fb-87b9-4f50-989a-72af1dd5ae18
   var
      defaultSelectedKeys = [],
      defaultExcludedKeys = [];

   var
      HOT_KEYS = {
         moveMarkerToNext: cConstants.key.down,
         moveMarkerToPrevious: cConstants.key.up,
         toggleSelection: cConstants.key.space,
         enterHandler: cConstants.key.enter
      };

   var LOAD_TRIGGER_OFFSET = 100;

   var _private = {
      checkDeprecated: function(cfg) {
         if (cfg.historyIdCollapsedGroups) {
            IoC.resolve('ILogger').warn('IGrouped', 'Option "historyIdCollapsedGroups" is deprecated and removed in 19.200. Use option "groupHistoryId".');
         }
         if (cfg.groupMethod) {
            IoC.resolve('ILogger').warn('IGrouped', 'Option "groupMethod" is deprecated and removed in 19.200. Use option "groupingKeyCallback".');
         }
      },
      reload: function(self, cfg) {
         var
            filter = cClone(cfg.filter),
            sorting = cClone(cfg.sorting),
            navigation = cClone(cfg.navigation),
            resDeferred = new Deferred();
         if (cfg.beforeReloadCallback) {
            // todo parameter cfg removed by task: https://online.sbis.ru/opendoc.html?guid=f5fb685f-30fb-4adc-bbfe-cb78a2e32af2
            cfg.beforeReloadCallback(filter, sorting, navigation, cfg);
         }
         if (self._sourceController) {
            _private.showIndicator(self);

            // Need to create new Deffered, returned success result
            // load() method may be fired with errback
            self._sourceController.load(filter, sorting).addCallback(function(list) {
               var
                  markedKey, isActive,
                  listModel = self._listViewModel;

               if (cfg.dataLoadCallback instanceof Function) {
                  cfg.dataLoadCallback(list);
               }

               _private.hideIndicator(self);

               if (listModel) {
                  if (self._isActive) {
                     isActive = true;
                  }
                  listModel.setItems(list);
                  self._items = listModel.getItems();
                  markedKey = listModel.getMarkedKey();
                  if (markedKey !== null) {
                     if (listModel.getIndexByKey(markedKey) === -1) {
                        markedKey = listModel.getFirstItemKey();
                     }
                     if (markedKey !== undefined) {
                        listModel.setMarkedKey(markedKey);
                        self._restoreMarkedKey = markedKey;
                     }
                  }
                  if (isActive === true) {
                     self._children.listView.activate();
                  }
               }

               /* Перезагрузка полностью обновляет данные в рекордсете, а значит индексы, высоты элементов и распорок
                  потеряли актуальность, сбрасываем их. */
               if (self._virtualScroll) {
                  self._virtualScroll.resetItemsIndexes();
                  self._virtualScroll.setItemsCount(listModel.getCount());
                  self._virtualScroll.updateItemsIndexes('down');
                  _private.applyVirtualScroll(self);
               }

               _private.prepareFooter(self, navigation, self._sourceController);

               resDeferred.callback(list);

               // If received list is empty, make another request. If it’s not empty, the following page will be requested in resize event handler after current items are rendered on the page.
               if (!list.getCount()) {
                  _private.checkLoadToDirectionCapability(self);
               }
            }).addErrback(function(error) {
               _private.processLoadError(self, error, cfg.dataLoadErrback);
               resDeferred.callback(null);
            });
         } else {
            resDeferred.callback();
            IoC.resolve('ILogger').error('BaseControl', 'Source option is undefined. Can\'t load data');
         }
         resDeferred.addCallback(function(items) {
            if (cfg.afterReloadCallback) {
               cfg.afterReloadCallback();
            }
            return items;
         });
         return resDeferred;
      },
      scrollToItem: function(self, key) {
         scrollToElement(self._children.listView.getItemsContainer().children[self.getViewModel().getIndexByKey(key)], true);
      },
      setMarkedKey: function(self, key) {
         if (key !== undefined) {
            self.getViewModel().setMarkedKey(key);
            _private.scrollToItem(self, key);
         }
      },
      restoreMarkedKey: function(self) {
         if (self._restoreMarkedKey !== null) {
            _private.scrollToItem(self, self._restoreMarkedKey);
            self._restoreMarkedKey = null;
         }
      },
      moveMarkerToNext: function(self) {
         var
            model = self.getViewModel();
         _private.setMarkedKey(self, model.getNextItemKey(model.getMarkedKey()));
      },
      moveMarkerToPrevious: function(self) {
         var
            model = self.getViewModel();
         _private.setMarkedKey(self, model.getPreviousItemKey(model.getMarkedKey()));
      },
      enterHandler: function(self) {
         var
            model = self.getViewModel(),
            markedKey = model.getMarkedKey();
         if (markedKey !== null) {
            self._notify('itemClick', [model.getItemById(markedKey).getContents()], { bubbling: true });
         }
      },
      toggleSelection: function(self) {
         var
            model, markedKey;
         if (self._children.selectionController) {
            model = self.getViewModel();
            markedKey = model.getMarkedKey();
            self._children.selectionController.onCheckBoxClick(markedKey, model.getSelectionStatus(markedKey));
            _private.moveMarkerToNext(self);
         }
      },
      prepareFooter: function(self, navigation, sourceController) {
         var
            loadedDataCount, allDataCount;
         self._shouldDrawFooter = !!(navigation && navigation.view === 'demand' && sourceController.hasMoreData('down'));
         if (self._shouldDrawFooter) {
            loadedDataCount = sourceController.getLoadedDataCount();
            allDataCount = sourceController.getAllDataCount();
            if (typeof loadedDataCount === 'number' && typeof allDataCount === 'number') {
               self._loadMoreCaption = allDataCount - loadedDataCount;
            } else {
               self._loadMoreCaption = '...';
            }
         }
      },

      loadToDirection: function(self, direction, userCallback, userErrback) {
         _private.showIndicator(self, direction);

         //TODO https://online.sbis.ru/opendoc.html?guid=0fb7a3a6-a05d-4eb3-a45a-c76cbbddb16f
         //при добавлении пачки в начало (подгрузка по скроллу вверх нужно чтоб был минимальный проскролл, чтоб пачка ушла за границы видимой части как и должна а не отобразилась сверху)
         //Опция нужна, т.к. есть проблемы с queue при отрисовке изменений ViewModel, поэтому данный функционал включаем только по месту (в календаре)
         //разобраться с queue по задаче https://online.sbis.ru/opendoc.html?guid=ef8e4d25-1137-4c94-affd-759e20dd0d63
         if (self._options.fix1176592913 && direction === 'up') {
            self._notify('doScroll', ['scrollCompensation'], {bubbling: true});
         }

         /**/

         if (self._sourceController) {
            return self._sourceController.load(self._options.filter, self._options.sorting, direction).addCallback(function(addedItems) {
               if (userCallback && userCallback instanceof Function) {
                  userCallback(addedItems, direction);
               }

               _private.hideIndicator(self);

               if (direction === 'down') {
                  self._listViewModel.appendItems(addedItems);
               } else if (direction === 'up') {
                  self._listViewModel.prependItems(addedItems);
               }

               // If received list is empty, make another request.
               // If it’s not empty, the following page will be requested in resize event handler after current items are rendered on the page.
               if (!addedItems.getCount()) {
                  _private.checkLoadToDirectionCapability(self);
               }

               /* После догрузки данных потенциально изменяется (увеличивается) количество записей,
                  нужно пересчитать Virtual Scroll*/
               if (self._virtualScroll) {

                  // Обновляем общее количество записей
                  self._virtualScroll.setItemsCount(self._listViewModel.getCount());

                  _private.applyVirtualScroll(self, direction);
               }

               _private.prepareFooter(self, self._options.navigation, self._sourceController);
               return addedItems;

            }).addErrback(function(error) {
               return _private.processLoadError(self, error, userErrback);
            });
         }
         IoC.resolve('ILogger').error('BaseControl', 'Source option is undefined. Can\'t load data');
      },

      // Основной метод пересчета состояния Virtual Scroll
      applyVirtualScroll: function(self) {
         var
            indexes = self._virtualScroll.getItemsIndexes(),
            placeholdersSizes = self._virtualScroll.getPlaceholdersSizes();

         self._listViewModel.setIndexes(indexes.start, indexes.stop);
         self._topPlaceholderHeight = placeholdersSizes.top;
         self._bottomPlaceholderHeight = placeholdersSizes.bottom;
      },

      processLoadError: function(self, error, dataLoadErrback) {
         if (!error.canceled) {
            _private.hideIndicator(self);

            if (dataLoadErrback instanceof Function) {
               dataLoadErrback(error);
            }

            // _isOfflineMode is set to true if disconnect has happened. In that case message box will not be shown
            if (!(error.processed || error._isOfflineMode)) {
               // Control show messagebox only in clientside
               if (self._children && self._children.errorMsgOpener) {
                  self._children.errorMsgOpener.open({
                     message: error.message,
                     style: 'error',
                     type: 'ok'
                  });
               }
               error.processed = true;
            }
         }
         return error;
      },

      checkLoadToDirectionCapability: function(self) {
         if (self._needScrollCalculation) {
            if (self._loadTriggerVisibility.up) {
               _private.onScrollLoadEdge(self, 'up');
            }
            if (self._loadTriggerVisibility.down) {
               _private.onScrollLoadEdge(self, 'down');
            }
         }
      },

      onScrollLoadEdgeStart: function(self, direction) {
         self._loadTriggerVisibility[direction] = true;
         _private.onScrollLoadEdge(self, direction);
      },

      onScrollLoadEdgeStop: function(self, direction) {
         self._loadTriggerVisibility[direction] = false;
      },

      loadToDirectionIfNeed: function(self, direction) {
         //source controller is not created if "source" option is undefined
         if (self._sourceController && self._sourceController.hasMoreData(direction) && !self._sourceController.isLoading() && !self._hasUndrawChanges) {
            _private.loadToDirection(self, direction, self._options.dataLoadCallback, self._options.dataLoadErrback);
         }
      },

      // Метод, в котором опеределяется необходимость догрузки данных
      updateVirtualWindow: function(self, direction) {
         var indexes = self._virtualScroll.getItemsIndexes();

         // Если в рекордсете записей меньше, чем stopIndex, то требуется догрузка данных
         if (self._listViewModel.getCount() <= indexes.stop) {
            if (self._options.navigation && self._options.navigation.view === 'infinity') {
               _private.loadToDirectionIfNeed(self, direction);
            }
         } else {

            // Иначе пересчитываем скролл
            self._virtualScroll.updateItemsIndexes(direction);
            _private.applyVirtualScroll(self);
         }
      },

      // Метод, вызываемый при прокрутке скролла до триггера
      onScrollLoadEdge: function(self, direction) {
         if (self._virtualScroll) {
            _private.updateVirtualWindow(self, direction);
         } else if (self._options.navigation && self._options.navigation.view === 'infinity') {
            _private.loadToDirectionIfNeed(self, direction);
         }
      },

      onScrollListEdge: function(self, direction) {

      },

      scrollToEdge: function(self, direction) {
         if (self._sourceController && self._sourceController.hasMoreData(direction)) {
            self._sourceController.setEdgeState(direction);
            _private.reload(self, self._options).addCallback(function() {
               if (direction === 'up') {
                  self._notify('doScroll', ['top'], { bubbling: true });
               } else {
                  self._notify('doScroll', ['bottom'], { bubbling: true });
               }
            });
         } else if (direction === 'up') {
            self._notify('doScroll', ['top'], { bubbling: true });
         } else {
            self._notify('doScroll', ['bottom'], { bubbling: true });
         }
      },

      startScrollEmitter: function(self) {
         var
            children = self._children,
            triggers = {
               topListTrigger: children.topListTrigger,
               bottomListTrigger: children.bottomListTrigger,
               topLoadTrigger: children.topLoadTrigger,
               bottomLoadTrigger: children.bottomLoadTrigger
            };

         self._children.ScrollEmitter.startRegister(triggers);
      },

      onScrollShow: function(self) {
         self._loadOffset = LOAD_TRIGGER_OFFSET;
         if (!self._scrollPagingCtr) {
            if (_private.needScrollPaging(self._options.navigation)) {
               _private.createScrollPagingController(self).addCallback(function(scrollPagingCtr) {
                  self._scrollPagingCtr = scrollPagingCtr;
                  self._pagingVisible = true;
               });
            }
         } else if (_private.needScrollPaging(self._options.navigation)) {
            self._pagingVisible = true;
         }
      },

      onScrollHide: function(self) {
         var needUpdate = false;
         if (self._loadOffset !== 0) {
            self._loadOffset = 0;
            needUpdate = true;
         }
         if (self._pagingVisible) {
            self._pagingVisible = false;
            needUpdate = true;
         }

         if (needUpdate) {
            self._forceUpdate();
         }
      },

      createScrollPagingController: function(self) {
         var def = new Deferred();
         require(['Controls/List/Controllers/ScrollPaging'], function(ScrollPagingController) {
            var scrollPagingCtr;
            scrollPagingCtr = new ScrollPagingController({
               mode: self._options.navigation.viewConfig.pagingMode,
               pagingCfgTrigger: function(cfg) {
                  self._pagingCfg = cfg;
                  self._forceUpdate();
               }
            });

            def.callback(scrollPagingCtr);
         }, function(error) {
            def.errback(error);
         });

         return def;
      },

      showIndicator: function(self, direction) {
         self._loadingState = direction || 'all';
         self._loadingIndicatorState = self._loadingState;
         if (!self._loadingIndicatorTimer) {
            self._loadingIndicatorTimer = setTimeout(function() {
               self._loadingIndicatorTimer = null;
               if (self._loadingState) {
                  self._showLoadingIndicatorImage = true;
                  self._forceUpdate();
               }
            }, 2000);
         }
      },

      hideIndicator: function(self) {
         self._loadingState = null;
         self._showLoadingIndicatorImage = false;
         if (self._loadingIndicatorTimer) {
            clearTimeout(self._loadingIndicatorTimer);
            self._loadingIndicatorTimer = null;
         }
         if (self._loadingIndicatorState !== null) {
            self._loadingIndicatorState = self._loadingState;
            self._forceUpdate();
         }
      },

      /**
       * Обработать прокрутку списка виртуальным скроллом
       */
      handleListScroll: function(self, scrollTop, position) {
         var hasMoreData;

         // При включенном виртуальном скроле необходимо обрабатывать быстрый скролл мышью и перемещение бегунка скрола.
         if (self._virtualScroll && !self._hasUndrawChanges) {
            self._virtualScroll.updateItemsIndexesOnScrolling(scrollTop);
            _private.applyVirtualScroll(self);
         }

         if (self._scrollPagingCtr) {
            if (position === 'middle') {
               self._scrollPagingCtr.handleScroll(scrollTop);
            } else {
               // when scroll is at the edge we will send information to scrollPaging about the availability of data next/prev
               if (self._sourceController) {
                  hasMoreData = {
                     up: self._sourceController.hasMoreData('up'),
                     down: self._sourceController.hasMoreData('down')
                  };
               }
               self._scrollPagingCtr.handleScrollEdge(position, hasMoreData);
            }
         } else {
            if (_private.needScrollPaging(self._options.navigation)) {
               _private.createScrollPagingController(self).addCallback(function(scrollPagingCtr) {
                  self._scrollPagingCtr = scrollPagingCtr;
               });
            }
         }
      },

      needScrollCalculation: function(navigationOpt) {
         return navigationOpt && navigationOpt.view === 'infinity';
      },

      needScrollPaging: function(navigationOpt) {
         return (navigationOpt &&
            navigationOpt.view === 'infinity' &&
            navigationOpt.viewConfig &&
            navigationOpt.viewConfig.pagingMode
         );
      },

      getItemsCount: function(self) {
         return self._listViewModel ? self._listViewModel.getCount() : 0;
      },

      initListViewModelHandler: function(self, model) {
         model.subscribe('onListChange', function() {
            self._hasUndrawChanges = true;
            self._forceUpdate();
         });
         model.subscribe('onGroupsExpandChange', function(event, changes) {
            _private.groupsExpandChangeHandler(self, changes);
         });
      },

      showActionsMenu: function(self, event, itemData, childEvent, showAll) {
         var
            context = event.type === 'itemcontextmenu',
            showActions;
         if ((context && self._isTouch) || !itemData.itemActions) {
            return false;
         }
         showActions = (context || showAll) && itemData.itemActions.all
            ? itemData.itemActions.all
            : itemData.itemActions && itemData.itemActions.all.filter(function(action) {
               return action.showType !== tUtil.showType.TOOLBAR;
            });
         if (showActions && showActions.length) {
            var
               rs = new collection.RecordSet({ rawData: showActions });
            childEvent.nativeEvent.preventDefault();
            childEvent.stopImmediatePropagation();
            itemData.contextEvent = context;
            self._listViewModel.setActiveItem(itemData);
            require(['css!Controls/Toolbar/ToolbarPopup'], function() {
               self._children.itemActionsOpener.open({
                  opener: self._children.listView,
                  target: !context ? childEvent.target : false,
                  templateOptions: {
                     items: rs,
                     keyProperty: 'id',
                     parentProperty: 'parent',
                     nodeProperty: 'parent@',
                     dropdownClassName: 'controls-itemActionsV__popup',
                     showClose: true
                  },
                  eventHandlers: {
                     onResult: self._closeActionsMenu,
                     onClose: self._closeActionsMenu
                  },
                  closeByExternalClick: true,
                  corner: {vertical: 'top', horizontal: 'right'},
                  horizontalAlign: {side: context ? 'right' : 'left'},
                  className: 'controls-Toolbar__popup_list',
                  nativeEvent: context ? childEvent.nativeEvent : false
               });
               self._menuIsShown = true;
            });
         }
      },

      closeActionsMenu: function(self, args) {
         var
            actionName = args && args.action,
            event = args && args.event;

         function closeMenu() {
            self._listViewModel.setActiveItem(null);
            self._children.swipeControl.closeSwipe();
            self._menuIsShown = false;
         }

         if (actionName === 'itemClick') {
            var action = args.data && args.data[0] && args.data[0].getRawData();
            aUtil.itemActionsClick(self, event, action, self._listViewModel.getActiveItem());
            if (!action['parent@']) {
               self._children.itemActionsOpener.close();
               closeMenu();
            }
         } else {
            closeMenu();
         }
         self._forceUpdate();
      },

      bindHandlers: function(self) {
         self._closeActionsMenu = self._closeActionsMenu.bind(self);
      },

      groupsExpandChangeHandler: function(self, changes) {
         self._notify(changes.changeType === 'expand' ? 'groupExpanded' : 'groupCollapsed', [changes.group], { bubbling: true });
         self._notify('collapsedGroupsChanged', [changes.collapsedGroups]);
         if (self._options.historyIdCollapsedGroups || self._options.groupHistoryId) {
            requirejs(['Controls/List/resources/utils/GroupUtil'], function(GroupUtil) {
               GroupUtil.storeCollapsedGroups(changes.collapsedGroups, self._options.historyIdCollapsedGroups || self._options.groupHistoryId);
            });
         }
      },

      prepareCollapsedGroups: function(config) {
         var
            result = new Deferred();
         if (config.historyIdCollapsedGroups || config.groupHistoryId) {
            requirejs(['Controls/List/resources/utils/GroupUtil'], function(GroupUtil) {
               GroupUtil.restoreCollapsedGroups(config.historyIdCollapsedGroups || config.groupHistoryId).addCallback(function(collapsedGroupsFromStore) {
                  result.callback(collapsedGroupsFromStore || config.collapsedGroups);
               });
            });
         } else {
            result.callback(config.collapsedGroups);
         }
         return result;
      },

      getSortingOnChange: function(currentSorting, propName, sortingType) {
         var sorting = currentSorting ? currentSorting.slice() : [];
         var sortElemIndex = -1;
         var sortElem;
         var newSortElem = {};

         //use same algorithm when sortingType is not 'single', if the number of properties is equal to one
         if (sortingType !== 'single' || sorting.length === 1 && sorting[0][propName]) {
            sorting.forEach(function(elem, index) {
               if (elem.hasOwnProperty(propName)) {
                  sortElem = elem;
                  sortElemIndex = index;
               }
            });
         } else {
            sorting = [];
         }

         // change sorting direction by rules:
         // 'DESC' -> 'ASC'
         // 'ASC' -> empty
         // empty -> 'DESC'
         if (sortElem) {
            if (sortElem[propName] === 'DESC') {
               sortElem[propName] = 'ASC';
            } else {
               sorting.splice(sortElemIndex, 1);
            }
         } else {
            newSortElem[propName] = 'DESC';
            sorting.push(newSortElem);
         }

         return sorting;
      }

   };

   /**
    * Компонент плоского списка, с произвольным шаблоном отображения каждого элемента. Обладает возможностью загрузки/подгрузки данных из источника.
    * @class Controls/List/BaseControl
    * @extends Core/Control
    * @mixes Controls/interface/ISource
    * @mixes Controls/interface/IItemTemplate
    * @mixes Controls/interface/IPromisedSelectable
    * @mixes Controls/interface/IGrouped
    * @mixes Controls/interface/INavigation
    * @mixes Controls/interface/IFilter
    * @mixes Controls/interface/IHighlighter
    * @mixes Controls/List/interface/IBaseControl
    * @mixes Controls/interface/IEditableList
    * @mixes Controls/List/BaseControl/Styles
    * @control
    * @public
    * @author Авраменко А.С.
    * @category List
    */

   var BaseControl = Control.extend(/** @lends Controls/List/BaseControl.prototype */{
      _template: BaseControlTpl,
      iWantVDOM: true,
      _isActiveByClick: false,
      _restoreMarkedKey: null,

      _listViewModel: null,
      _viewModelConstructor: null,

      _loadMoreCaption: null,
      _shouldDrawFooter: false,

      _loader: null,
      _loadingState: null,
      _loadingIndicatorState: null,
      _loadingIndicatorTimer: null,

      _pagingCfg: null,
      _pagingVisible: false,

      // TODO пока спорные параметры
      _sorting: undefined,

      _itemTemplate: null,

      _needScrollCalculation: false,
      _loadTriggerVisibility: null,
      _loadOffset: 0,
      _topPlaceholderHeight: 0,
      _bottomPlaceholderHeight: 0,
      _menuIsShown: null,

      _popupOptions: null,
      _hasUndrawChanges: false,

      _beforeMount: function(newOptions, context, receivedState) {
         var
            self = this;

         _private.checkDeprecated(newOptions);

         _private.bindHandlers(this);

         this._needScrollCalculation = _private.needScrollCalculation(newOptions.navigation);

         if (this._needScrollCalculation) {
            if (newOptions.virtualScrolling === true) {
               this._virtualScroll = new VirtualScroll({
                  virtualPageSize: newOptions.virtualPageSize,
                  virtualSegmentSize: newOptions.virtualSegmentSize
               });
            }
            this._loadTriggerVisibility = {
               up: false,
               down: false
            };
         }
         this._needSelectionController = newOptions.multiSelectVisibility !== 'hidden';

         return _private.prepareCollapsedGroups(newOptions).addCallback(function(collapsedGroups) {
            var
               viewModelConfig = collapsedGroups ? cMerge(cClone(newOptions), { collapsedGroups: collapsedGroups }) : cClone(newOptions);
            if (newOptions.viewModelConstructor) {
               self._viewModelConstructor = newOptions.viewModelConstructor;
               if (receivedState) {
                  viewModelConfig.items = receivedState;
               }
               self._listViewModel = new newOptions.viewModelConstructor(viewModelConfig);
               _private.initListViewModelHandler(self, self._listViewModel);
            }

            if (newOptions.source) {
               self._sourceController = new SourceController({
                  source: newOptions.source,
                  navigation: newOptions.navigation // TODO возможно не всю навигацию надо передавать а только то, что касается source
               });

               if (receivedState) {
                  self._sourceController.calculateState(receivedState);
                  self._items = self._listViewModel.getItems();
                  if (newOptions.dataLoadCallback instanceof Function) {
                     newOptions.dataLoadCallback(self._items);
                  }
                  if (self._virtualScroll) {
                     // При серверной верстке применяем начальные значения
                     var indexes = self._virtualScroll.getItemsIndexes();
                     self._virtualScroll.setItemsCount(self._listViewModel.getCount());
                     self._listViewModel.setIndexes(indexes.start, indexes.stop);
                  }
                  _private.prepareFooter(self, newOptions.navigation, self._sourceController);
               } else {
                  return _private.reload(self, newOptions);
               }
            }
         });
      },

      getViewModel: function() {
         return this._listViewModel;
      },

      getSourceController: function() {
         return this._sourceController;
      },

      _onActivated: function() {
         this._isActive = true;
      },

      _onDeactivated: function() {
         this._isActive = false;
      },

      _afterMount: function() {
         if (this._needScrollCalculation) {
            _private.startScrollEmitter(this);
         }
         if (this._virtualScroll) {
            this._virtualScroll.setItemsContainer(this._children.listView.getItemsContainer());
         }
         if (this._options.fix1176592913 && this._hasUndrawChanges) {
            this._hasUndrawChanges = false;
         }
      },

      _beforeUpdate: function(newOptions) {
         var filterChanged = !isEqualObject(newOptions.filter, this._options.filter);
         var recreateSource = newOptions.source !== this._options.source ||
             !isEqualObject(newOptions.navigation, this._options.navigation);
         var sortingChanged = newOptions.sorting !== this._options.sorting;

         if ((newOptions.groupMethod !== this._options.groupMethod) || (newOptions.viewModelConstructor !== this._viewModelConstructor)) {
            this._viewModelConstructor = newOptions.viewModelConstructor;
            this._listViewModel = new newOptions.viewModelConstructor(newOptions);
            _private.initListViewModelHandler(this, this._listViewModel);
         }

         if (newOptions.groupMethod !== this._options.groupMethod) {
            _private.reload(this, newOptions);
         }

         if (newOptions.collapsedGroups !== this._options.collapsedGroups) {
            this._listViewModel.setCollapsedGroups(newOptions.collapsedGroups);
         }

         if (newOptions.markedKey !== this._options.markedKey) {
            this._listViewModel.setMarkedKey(newOptions.markedKey);
         }

         if (newOptions.markerVisibility !== this._options.markerVisibility) {
            this._listViewModel.setMarkerVisibility(newOptions.markerVisibility);
         }

         this._needScrollCalculation = _private.needScrollCalculation(newOptions.navigation);

         if (recreateSource) {
            if (this._sourceController) {
               this._sourceController.destroy();
            }

            this._sourceController = new SourceController({
               source: newOptions.source,
               navigation: newOptions.navigation
            });
         }

         if (newOptions.multiSelectVisibility !== this._options.multiSelectVisibility) {
            this._listViewModel.setMultiSelectVisibility(newOptions.multiSelectVisibility);
         }
         this._needSelectionController = this._options.multiSelectVisibility !== 'hidden' || this._delayedSelect;

         if (newOptions.itemTemplateProperty !== this._options.itemTemplateProperty) {
            this._listViewModel.setItemTemplateProperty(newOptions.itemTemplateProperty);
         }

         if (newOptions.itemTemplateProperty !== this._options.itemTemplateProperty) {
            this._listViewModel.setItemTemplateProperty(newOptions.itemTemplateProperty);
         }

         if (newOptions.itemTemplateProperty !== this._options.itemTemplateProperty) {
            this._listViewModel.setItemTemplateProperty(newOptions.itemTemplateProperty);
         }

         if (sortingChanged) {
            this._listViewModel.setSorting(newOptions.sorting);
         }

         if (filterChanged || recreateSource || sortingChanged) {
            _private.reload(this, newOptions);
         }

      },

      reloadItem: function(key, readMeta, replaceItem) {
         var items = this._listViewModel.getItems();
         var currentItemIndex = items.getIndexByValue(this._options.keyProperty, key);

         if (currentItemIndex === -1) {
            throw new Error('BaseControl::reloadItem no item with key ' + key);
         }

         return this._sourceController.read(key, readMeta).addCallback(function(item) {
            if (replaceItem) {
               items.replace(item, currentItemIndex);
            } else {
               items.at(currentItemIndex).merge(item);
            }
            return item;
         });
      },

      _beforeUnmount: function() {
         if (this._sourceController) {
            this._sourceController.destroy();
         }

         if (this._scrollPagingCtr) {
            this._scrollPagingCtr.destroy();
         }

         if (this._listViewModel) {
            this._listViewModel.destroy();
         }
         this._loadTriggerVisibility = null;

         BaseControl.superclass._beforeUnmount.apply(this, arguments);
      },

      _afterUpdate: function(oldOptions) {
         /*Оставляю старое поведение без опции для скролла вверх. Спилить по задаче https://online.sbis.ru/opendoc.html?guid=ef8e4d25-1137-4c94-affd-759e20dd0d63*/
         if (!this._options.fix1176592913 && this._hasUndrawChanges) {
            this._hasUndrawChanges = false;
            _private.restoreMarkedKey(this);
            _private.checkLoadToDirectionCapability(this);
            if (this._virtualScroll) {
               this._virtualScroll.updateItemsSizes();
            }
         }
         if (this._delayedSelect && this._children.selectionController) {
            this._children.selectionController.onCheckBoxClick(this._delayedSelect.key, this._delayedSelect.status);
            this._notify('checkboxClick', [this._delayedSelect.key, this._delayedSelect.status]);
            this._delayedSelect = null;
         }


         //FIXME fixing bug https://online.sbis.ru/opendoc.html?guid=d29c77bb-3a1e-428f-8285-2465e83659b9
         //FIXME need to delete after https://online.sbis.ru/opendoc.html?guid=4db71b29-1a87-4751-a026-4396c889edd2
         if (oldOptions.hasOwnProperty('loading') && oldOptions.loading !== this._options.loading) {
            if (this._options.loading) {
               _private.showIndicator(this);
            } else if (!this._sourceController.isLoading()) {
               _private.hideIndicator(this);
            }
         }
      },

      __onPagingArrowClick: function(e, arrow) {
         switch (arrow) {
            case 'Next': this._notify('doScroll', ['pageDown'], { bubbling: true }); break;
            case 'Prev': this._notify('doScroll', ['pageUp'], { bubbling: true }); break;
            case 'Begin': _private.scrollToEdge(this, 'up'); break;
            case 'End': _private.scrollToEdge(this, 'down'); break;
         }
      },

      __onEmitScroll: function(e, type, params) {
         var self = this;
         switch (type) {
            case 'loadTopStart': _private.onScrollLoadEdgeStart(self, 'up'); break;
            case 'loadTopStop': _private.onScrollLoadEdgeStop(self, 'up'); break;
            case 'loadBottomStart': _private.onScrollLoadEdgeStart(self, 'down'); break;
            case 'loadBottomStop': _private.onScrollLoadEdgeStop(self, 'down'); break;
            case 'listTop': _private.onScrollListEdge(self, 'up'); break;
            case 'listBottom': _private.onScrollListEdge(self, 'down'); break;
            case 'scrollMove': _private.handleListScroll(self, params.scrollTop, params.position); break;
            case 'canScroll': _private.onScrollShow(self); break;
            case 'cantScroll': _private.onScrollHide(self); break;
         }
      },

      _onCheckBoxClick: function(e, key, status) {
         this._children.selectionController.onCheckBoxClick(key, status);
         this._notify('checkboxClick', [key, status]);
      },

      _listSwipe: function(event, itemData, childEvent) {
         var direction = childEvent.nativeEvent.direction;
         this._children.itemActionsOpener.close();
         /**
          * TODO: Сейчас нет возможности понять предусмотрено выделение в списке или нет.
          * Опция multiSelectVisibility не подходит, т.к. даже если она hidden, то это не значит, что выделение отключено.
          * Пока единственный надёжный способ различить списки с выделением и без него - смотреть на то, приходит ли опция selectedKeysCount.
          * Если она пришла, то значит выше есть Controls/Container/MultiSelector и в списке точно предусмотрено выделение.
          *
          * По этой задаче нужно придумать нормальный способ различать списки с выделением и без:
          * https://online.sbis.ru/opendoc.html?guid=ae7124dc-50c9-4f3e-a38b-732028838290
          */
         if (direction === 'right' && !itemData.isSwiped && typeof this._options.selectedKeysCount !== 'undefined') {
            /**
             * After the right swipe the item should get selected.
             * But, because selectionController is a component, we can't create it and call it's method in the same ev handler.
             */
            this._needSelectionController = true;
            this._delayedSelect = {
               key: itemData.key,
               status: itemData.multiSelectStatus
            };
            this.getViewModel().setRightSwipedItem(itemData);
         }
         if (direction === 'right' || direction === 'left') {
            var newKey = ItemsUtil.getPropertyValue(itemData.item, this._options.keyProperty);
            this._listViewModel.setMarkedKey(newKey);
            this._listViewModel.setActiveItem(itemData);
         }
      },

      _onAnimationEnd: function(e) {
         if (e.nativeEvent.animationName === 'rightSwipe') {
            this.getViewModel().setRightSwipedItem(null);
         }
      },

      _showIndicator: function(event, direction) {
         _private.showIndicator(this, direction);
         event.stopPropagation();
      },

      _hideIndicator: function(event) {
         _private.hideIndicator(this);
         event.stopPropagation();
      },

      reload: function() {
         return _private.reload(this, this._options);
      },

      _onGroupClick: function(e, item, baseEvent) {
         if (baseEvent.target.closest('.controls-ListView__groupExpander')) {
            this._listViewModel.toggleGroup(item);
         }
      },

      _onItemClick: function(e, item, originalEvent) {
         if (originalEvent.target.closest('.js-controls-ListView__checkbox')) {
            /*
             When user clicks on checkbox we shouldn't fire itemClick event because no one actually expects or wants that.
             We can't stop click on checkbox from propagating because we can only subscribe to valueChanged event and then
             we'd be stopping the propagation of valueChanged event, not click event.
             And even if we could stop propagation of the click event, we shouldn't do that because other components
             can use it for their own reasons (e.g. something like TouchDetector can use it).
             */
            e.stopPropagation();
         }
         var newKey = ItemsUtil.getPropertyValue(item, this._options.keyProperty);
         this._listViewModel.setMarkedKey(newKey);
      },

      _viewResize: function() {
         /*TODO переношу сюда костыль сделанный по https://online.sbis.ru/opendoc.html?guid=ce307671-679e-4373-bc0e-c11149621c2a*/
         /*только под опцией для скролла вверх. Спилить по задаче https://online.sbis.ru/opendoc.html?guid=ef8e4d25-1137-4c94-affd-759e20dd0d63*/
         if (this._options.fix1176592913 && this._hasUndrawChanges) {
            this._hasUndrawChanges = false;
            _private.restoreMarkedKey(this);
            if (this._virtualScroll) {
               this._virtualScroll.updateItemsSizes();
            }
         }
      },

      beginEdit: function(options) {
         return this._options.readOnly ? Deferred.fail() : this._children.editInPlace.beginEdit(options);
      },

      beginAdd: function(options) {
         return this._options.readOnly ? Deferred.fail() : this._children.editInPlace.beginAdd(options);
      },

      cancelEdit: function() {
         return this._options.readOnly ? Deferred.fail() : this._children.editInPlace.cancelEdit();
      },

      commitEdit: function() {
         return this._options.readOnly ? Deferred.fail() : this._children.editInPlace.commitEdit();
      },

      _notifyHandler: tmplNotify,

      _closeSwipe: function(event, item) {
         this._children.itemActions.updateItemActions(item);
      },

      _commitEditActionHandler: function() {
         this._children.editInPlace.commitEdit();
      },

      _cancelEditActionHandler: function() {
         this._children.editInPlace.cancelEdit();
      },

      _showActionsMenu: function(event, itemData, childEvent, showAll) {
         _private.showActionsMenu(this, event, itemData, childEvent, showAll);
      },

      _onItemContextMenu: function(event, itemData) {
         this._showActionsMenu.apply(this, arguments);
         this._listViewModel.setMarkedKey(itemData.key);
      },

      _closeActionsMenu: function(args) {
         _private.closeActionsMenu(this, args);
      },

      _itemMouseDown: function(event, itemData, domEvent) {
         var
            items,
            dragItemIndex,
            dragStartResult;

         if (this._options.itemsDragNDrop && !domEvent.target.closest('.controls-DragNDrop__notDraggable')) {
            items = cClone(this._options.selectedKeys) || [];
            dragItemIndex = items.indexOf(itemData.key);
            if (dragItemIndex !== -1) {
               items.splice(dragItemIndex, 1);
            }
            items.unshift(itemData.key);
            dragStartResult = this._notify('dragStart', [items]);
            if (dragStartResult) {
               this._children.dragNDropController.startDragNDrop(dragStartResult, domEvent);
               this._itemDragData = itemData;
            }
         }
      },

      _onLoadMoreClick: function() {
         _private.loadToDirectionIfNeed(this, 'down');
      },

      _dragStart: function(event, dragObject) {
         this._listViewModel.setDragEntity(dragObject.entity);
         this._listViewModel.setDragItemData(this._listViewModel.getItemDataByItem(this._itemDragData.dispItem));
      },

      _dragEnd: function(event, dragObject) {
         if (this._options.itemsDragNDrop) {
            this._dragEndHandler(dragObject);
         }
      },

      _dragEndHandler: function(dragObject) {
         var targetPosition = this._listViewModel.getDragTargetPosition();

         if (targetPosition) {
            this._dragEndResult = this._notify('dragEnd', [dragObject.entity, targetPosition.item, targetPosition.position]);
         }
      },
      _onViewKeyDown: function(event) {
         keysHandler(event, HOT_KEYS, _private, this);
      },
      _dragEnter: function(event, dragObject) {
         var
            dragEnterResult,
            draggingItemProjection;

         if (!this._listViewModel.getDragEntity()) {
            dragEnterResult = this._notify('dragEnter', [dragObject.entity]);

            if (cInstance.instanceOfModule(dragEnterResult, 'Types/entity:Record')) {
               draggingItemProjection = this._listViewModel._prepareDisplayItemForAdd(dragEnterResult);
               this._listViewModel.setDragItemData(this._listViewModel.getItemDataByItem(draggingItemProjection));
               this._listViewModel.setDragEntity(dragObject.entity);
            } else if (dragEnterResult === true) {
               this._listViewModel.setDragEntity(dragObject.entity);
            }
         }
      },

      _dragLeave: function() {
         this._listViewModel.setDragTargetPosition(null);
      },

      _documentDragEnd: function() {
         var self = this;

         //Reset the state of the dragndrop after the movement on the source happens.
         if (this._dragEndResult instanceof Deferred) {
            _private.showIndicator(self);
            this._dragEndResult.addBoth(function() {
               self._documentDragEndHandler();
               _private.hideIndicator(self);
            });
         } else {
            this._documentDragEndHandler();
         }
      },

      _documentDragEndHandler: function() {
         this._listViewModel.setDragTargetPosition(null);
         this._listViewModel.setDragItemData(null);
         this._listViewModel.setDragEntity(null);
      },

      _itemMouseEnter: function(event, itemData) {
         var
            dragPosition,
            dragEntity = this._listViewModel.getDragEntity();

         if (dragEntity) {
            dragPosition = this._listViewModel.calculateDragTargetPosition(itemData);

            if (dragPosition && this._notify('changeDragTarget', [this._listViewModel.getDragEntity(), dragPosition.item, dragPosition.position]) !== false) {
               this._listViewModel.setDragTargetPosition(dragPosition);
            }
         }
      },

      _sortingChanged: function(event, propName, sortingType) {
         var newSorting = _private.getSortingOnChange(this._options.sorting, propName, sortingType);
         event.stopPropagation();
         this._notify('sortingChanged', [newSorting]);
      }
   });

   // TODO https://online.sbis.ru/opendoc.html?guid=17a240d1-b527-4bc1-b577-cf9edf3f6757
   /* ListView.getOptionTypes = function getOptionTypes(){
    return {
    dataSource: Types(ISource)
    }
    }; */
   BaseControl._private = _private;
   BaseControl.getDefaultOptions = function() {
      return {
         uniqueKeys: true,
         multiSelectVisibility: 'hidden',
         markerVisibility: 'onactivated',
         style: 'default',
         selectedKeys: defaultSelectedKeys,
         excludedKeys: defaultExcludedKeys
      };
   };
   return BaseControl;
});
