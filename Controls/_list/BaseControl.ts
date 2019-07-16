import Control = require('Core/Control');
import cClone = require('Core/core-clone');
import cMerge = require('Core/core-merge');
import cInstance = require('Core/core-instance');
import BaseControlTpl = require('wml!Controls/_list/BaseControl/BaseControl');
import ItemsUtil = require('Controls/_list/resources/utils/ItemsUtil');
import VirtualScroll = require('Controls/_list/Controllers/VirtualScroll');
import {Controller as SourceController} from 'Controls/source';
import {isEqual} from 'Types/object';
import Deferred = require('Core/Deferred');
import getItemsBySelection = require('Controls/Utils/getItemsBySelection');
import scrollToElement = require('Controls/Utils/scrollToElement');
import collection = require('Types/collection');
import tUtil = require('Controls/Utils/Toolbar');
import aUtil = require('Controls/_list/ItemActions/Utils/Actions');
import tmplNotify = require('Controls/Utils/tmplNotify');
import keysHandler = require('Controls/Utils/keysHandler');
import ScrollPagingController = require('Controls/_list/Controllers/ScrollPaging');
import GroupUtil = require('Controls/_list/resources/utils/GroupUtil');
import 'wml!Controls/_list/BaseControl/Footer';
import 'css!theme?Controls/list';
import { error as dataSourceError } from 'Controls/dataSource';
import { detection, constants, IoC } from 'Env/Env';
import ListViewModel from 'Controls/_list/ListViewModel';
import {ICrud} from "Types/source";
import {TouchContextField} from 'Controls/context';
import {Focus} from 'Vdom/Vdom';
import throttle = require('Core/helpers/Function/throttle');
import IntertialScrolling from 'Controls/_list/resources/utils/InertialScrolling';

//TODO: getDefaultOptions зовётся при каждой перерисовке, соответственно если в опции передаётся не примитив, то они каждый раз новые
//Нужно убрать после https://online.sbis.ru/opendoc.html?guid=1ff4a7fb-87b9-4f50-989a-72af1dd5ae18
var
    defaultSelectedKeys = [],
    defaultExcludedKeys = [];

const
    HOT_KEYS = {
        moveMarkerToNext: constants.key.down,
        moveMarkerToPrevious: constants.key.up,
        toggleSelection: constants.key.space,
        enterHandler: constants.key.enter
    };

const LOAD_TRIGGER_OFFSET = 100;
const INITIAL_PAGES_COUNT = 1;
/**
 * Object with state from server side rendering
 * @typedef {Object}
 * @name ReceivedState
 * @property {*} [data]
 * @property {Controls/_dataSource/_error/ViewConfig} [errorConfig]
 */
type ReceivedState = {
    data?: any;
    errorConfig?: dataSourceError.ViewConfig;
}

/**
 * @typedef {Object}
 * @name CrudResult
 * @property {*} [data]
 * @property {Controls/_dataSource/_error/ViewConfig} [errorConfig]
 * @property {Error} [error]
 */
type CrudResult = ReceivedState & {
    error: Error;
}

type ErrbackConfig = {
    dataLoadErrback?: (error: Error) => any;
    mode?: dataSourceError.Mode;
    error: Error;
}

type LoadingState = null | 'all' | 'up' | 'down';

/**
 * Удаляет оригинал ошибки из CrudResult перед вызовом сриализатора состояния,
 * который не сможет нормально разобрать/собрать экземпляр случайной ошибки
 * @param {CrudResult} crudResult
 * @return {ReceivedState}
 */
let getState = (crudResult: CrudResult): ReceivedState => {
    delete crudResult.error;
    return crudResult;
};

/**
 * getting result from <CrudResult> wrapper
 * @param {CrudResult} [crudResult]
 * @return {Promise}
 */
let getData = (crudResult: CrudResult): Promise<any> => {
    if (!crudResult) {
        return Promise.resolve();
    }
    if (crudResult.hasOwnProperty('data')) {
        return Promise.resolve(crudResult.data);
    }
    return Promise.reject(crudResult.error);
};

var _private = {
    checkDeprecated: function(cfg) {
        if (cfg.historyIdCollapsedGroups) {
            IoC.resolve('ILogger').warn('IGrouped', 'Option "historyIdCollapsedGroups" is deprecated and removed in 19.200. Use option "groupHistoryId".');
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
            _private.hideError(self);

            // Need to create new Deffered, returned success result
            // load() method may be fired with errback
            self._sourceController.load(filter, sorting).addCallback(function(list) {
                self._loadedItems = list;
                if (self._pagingNavigation) {
                    var hasMoreDataDown = list.getMetaData().more;
                    self._knownPagesCount = _private.calcPaging(self, hasMoreDataDown, cfg.navigation.sourceConfig.pageSize);
                }
                var
                    isActive,
                    listModel = self._listViewModel;

                if (cfg.afterReloadCallback) {
                    cfg.afterReloadCallback(cfg);
                }

                if (cfg.dataLoadCallback instanceof Function) {
                    cfg.dataLoadCallback(list);
                }

                if (listModel) {
                    if (self._isActive) {
                        isActive = true;
                    }
                    const curKey = listModel.getMarkedKey();
                    listModel.setItems(list);
                    const nextKey = listModel.getMarkedKey();
                    if (nextKey && nextKey !== curKey
                        && self._listViewModel.getCount() && self._isScrollShown
                        && !self._options.task46390860 && !self._options.task1177182277
                    ) {
                        self._markedKeyForRestoredScroll = nextKey;
                    }
                    self._items = listModel.getItems();
                    if (isActive === true) {
                        self._children.listView.activate();
                    }
                }

                if (self._virtualScroll) {
                    self._virtualScroll.ItemsCount = listModel.getCount();
                    self._virtualScroll.resetItemsIndexes();
                    _private.applyVirtualScrollIndexesToListModel(self);
                }

                _private.prepareFooter(self, navigation, self._sourceController);
                _private.resolveIndicatorStateAfterReload(self, list);

                resDeferred.callback({
                    data: list
                });

                // If received list is empty, make another request. If it’s not empty, the following page will be requested in resize event handler after current items are rendered on the page.
                if (!list.getCount()) {
                    _private.checkLoadToDirectionCapability(self);
                }
            }).addErrback(function(error) {
                return _private.processError(self, {
                    error: error,
                    dataLoadErrback: cfg.dataLoadErrback
                }).then(function(result: CrudResult) {
                    if (cfg.afterReloadCallback) {
                        cfg.afterReloadCallback(cfg);
                    }
                    resDeferred.callback({
                        data: null,
                        ...result
                    });
                });
            });
        } else {
            if (cfg.afterReloadCallback) {
                cfg.afterReloadCallback(cfg);
            }
            resDeferred.callback();
            IoC.resolve('ILogger').error('BaseControl', 'Source option is undefined. Can\'t load data');
        }
        return resDeferred;
    },

    resolveIndicatorStateAfterReload: function(self, list):void {
        const hasMoreDataDown = self._sourceController.hasMoreData('down');
        const hasMoreDataUp = self._sourceController.hasMoreData('up');

        if (!list.getCount()) {
            //because of IntersectionObserver will trigger only after DOM redraw, we should'n hide indicator
            //otherwise empty template will shown
            if ((hasMoreDataDown || hasMoreDataUp) && self._needScrollCalculation) {
                _private.showIndicator(self, hasMoreDataDown ? 'down' : 'up');
            } else {
                _private.hideIndicator(self);
            }
        } else {
            _private.hideIndicator(self);
        }
    },

    scrollToItem: function(self, key) {
        // todo now is one safe variant to fix call stack: beforeUpdate->reload->afterUpdate
        // due to asynchronous reload and afterUpdate, a "race" is possible and afterUpdate is called after reload
        // changes in branch "19.110/bugfix/aas/basecontrol_reload_by_afterupdate"
        // https://git.sbis.ru/sbis/controls/merge_requests/65854
        // corrupting integration tests
        // fixed by error: https://online.sbis.ru/opendoc.html?guid=d348adda-5fee-4d1b-8cb7-9501026f4f3c
        var
            container = self._children.listView.getItemsContainer().children[self.getViewModel().getIndexByKey(key)];
        if (container) {
            scrollToElement(container, true);
        }
    },
    setMarkedKey: function(self, key) {
        if (key !== undefined) {
            self.getViewModel().setMarkedKey(key);
            _private.scrollToItem(self, key);
        }
    },
    restoreScrollPosition: function(self) {
        if (self._saveAndRestoreScrollPosition) {
            /**
             * This event should bubble, because there can be anything between Scroll/Container and the list,
             * and we can't force everyone to manually bubble it.
             */
            self._notify('restoreScrollPosition', [], {
                bubbling: true
            });
            self._saveAndRestoreScrollPosition = false;
            return;
        }

        if (self._markedKeyForRestoredScroll !== null) {
            _private.scrollToItem(self, self._markedKeyForRestoredScroll);
            self._markedKeyForRestoredScroll = null;
        }
    },
    moveMarker: function(self, newMarkedKey) {
        // activate list when marker is moving. It let us press enter and open current row
        // must check mounted to avoid fails on unit tests
        if (this._mounted) {
            this.activate();
        }
        _private.setMarkedKey(self, newMarkedKey);
    },
    moveMarkerToNext: function (self, event) {
        if (self._options.markerVisibility !== 'hidden') {
            event.preventDefault();
            var model = self.getViewModel();
            _private.moveMarker(self, model.getNextItemKey(model.getMarkedKey()));
        }
    },
    moveMarkerToPrevious: function (self, event) {
        if (self._options.markerVisibility !== 'hidden') {
            event.preventDefault();
            var model = self.getViewModel();
            _private.moveMarker(self, model.getPreviousItemKey(model.getMarkedKey()));
        }
    },
    enterHandler: function(self) {
        let markedItem = self.getViewModel().getMarkedItem();
        if (markedItem) {
            self._notify('itemClick', [markedItem.getContents()], { bubbling: true });
        }
    },
    toggleSelection: function(self, event) {
        var
            model, markedKey;
        if (self._children.selectionController) {
            model = self.getViewModel();
            markedKey = model.getMarkedKey();
            self._children.selectionController.onCheckBoxClick(markedKey, model.getSelectionStatus(markedKey));
            _private.moveMarkerToNext(self, event);
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
        const beforeAddItems = (addedItems) => {
            self._loadedItems = addedItems;
            if (userCallback && userCallback instanceof Function) {
                userCallback(addedItems, direction);
            }

            _private.resolveIndicatorStateAfterReload(self, addedItems);

            if (self._virtualScroll) {
                self._itemsFromLoadToDirection = true;
            }
        };

        const afterAddItems = (countCurrentItems, addedItems) => {
            const cnt2 = self._listViewModel.getCount();
            // If received list is empty, make another request.
            // If it’s not empty, the following page will be requested in resize event
            // handler after current items are rendered on the page.
            if (!addedItems.getCount() || (self._options.task1176625749 && countCurrentItems === cnt2)) {
                _private.checkLoadToDirectionCapability(self);
            }
            if (self._virtualScroll) {
                self._itemsFromLoadToDirection = false;
            }

            _private.prepareFooter(self, self._options.navigation, self._sourceController);
        };

        const drawItemsUp = (countCurrentItems, addedItems) => {
            beforeAddItems(addedItems);
            self._saveAndRestoreScrollPosition = true;
            self._listViewModel.prependItems(addedItems);
            afterAddItems(countCurrentItems, addedItems);
        };

        _private.showIndicator(self, direction);

        if (self._sourceController) {
            const filter = cClone(self._options.filter);
            if (self._options.beforeLoadToDirectionCallback) {
                self._options.beforeLoadToDirectionCallback(filter, self._options);
            }
            return self._sourceController.load(filter, self._options.sorting, direction).addCallback(function(addedItems) {
                //TODO https://online.sbis.ru/news/c467b1aa-21e4-41cc-883b-889ff5c10747
                //до реализации функционала и проблемы из новости делаем решение по месту:
                //посчитаем число отображаемых записей до и после добавления, если не поменялось, значит прилетели элементы, попадающие в невидимую группу,
                //надо инициировать подгрузку порции записей, больше за нас это никто не сделает.
                //Под опцией, потому что в другом месте это приведет к ошибке. Хорошее решение будет в задаче ссылка на которую приведена
                const countCurrentItems = self._listViewModel.getCount();

                if (direction === 'down') {
                    beforeAddItems(addedItems);
                    self._listViewModel.appendItems(addedItems);
                    afterAddItems(countCurrentItems, addedItems);
                } else if (direction === 'up') {
                    /**
                     * todo KINGO.
                     * Демо на jsFiddle: https://jsfiddle.net/alex111089/9q0hgdre/
                     * Устанавливаем в true флаг _saveAndRestoreScrollPosition, чтобы при ближайшей перерисовке
                     * запомнить позицию скролла непосредственно до перерисовки и восстановить позицию скролла
                     * сразу после перерисовки.
                     * Пробовали запоминать позицию скролла здесь, в loadToDirection. Из-за асинхронности отрисовки
                     * получается неактуальным запомненная позиция скролла и происходит дерганье контента таблицы.
                     */
                    if (detection.isMobileIOS) {
                        _private.getIntertialScrolling(self).callAfterScrollStopped(() => {
                            drawItemsUp(countCurrentItems, addedItems);
                        });
                    } else {
                        drawItemsUp(countCurrentItems, addedItems);
                    }
                }
                return addedItems;
            }).addErrback(function(error) {
                return _private.crudErrback(self, {
                    error,
                    dataLoadErrback: userErrback
                });
            });
        }
        IoC.resolve('ILogger').error('BaseControl', 'Source option is undefined. Can\'t load data');
    },

    // Применяем расчитанные и хранимые на virtualScroll стартовый и конечный индексы на модель.
    applyVirtualScrollIndexesToListModel(self): void {
        const newIndexes = self._virtualScroll.ItemsIndexes;
        const model = self._listViewModel;
        if (newIndexes.start !== model.getStartIndex() || newIndexes.stop !== model.getStopIndex()) {
            model.setIndexes(newIndexes.start, newIndexes.stop);
            return true;
        }
    },

    // Обновляет высоту распорок при виртуальном скроле
    applyPlaceholdersSizes(self): void {
        if (self._virtualScroll) {
            self._topPlaceholderSize = self._virtualScroll.PlaceholdersSizes.top;
            self._bottomPlaceholderSize = self._virtualScroll.PlaceholdersSizes.bottom;
        }
    },

   isFullPlaceholderVisibility: function(self, direction, params) {
      if (direction === 'up') {
         return params ? self._topPlaceholderSize - params.scrollTop > params.clientHeight : false;
      } else {
         return params ? params.scrollHeight - self._bottomPlaceholderSize < params.scrollTop : false;
      }
   },

    checkVirtualScrollCapability: function(self) {
       if (self._virtualScroll) {
          if (self._virtualScrollTriggerVisibility.up) {
             _private.updateVirtualWindow(self, 'up');
          } else if (self._virtualScrollTriggerVisibility.down) {
             _private.updateVirtualWindow(self, 'down');
          }
       }
    },

   updateVirtualWindow: function(self, direction) {
      if (_private.isFullPlaceholderVisibility(self, direction, self._cachedScrollParams)) {
         self._recalcVirtualScrollIndexes(direction);
      } else {
         self._virtualScroll.recalcToDirection(direction, self._cachedScrollParams, self._loadOffset.top);
         _private.applyVirtualScrollIndexes(self, direction);
      }
   },

    checkLoadToDirectionCapability: function(self) {
        if (self._needScrollCalculation) {
            if (self._loadTriggerVisibility.up) {
                _private.onScrollLoadEdge(self, 'up');
            }
            if (self._loadTriggerVisibility.down) {
                _private.onScrollLoadEdge(self, 'down');
            }
            _private.checkVirtualScrollCapability(self);
        }
    },
    onScrollLoadEdgeStart: function (self, direction) {
        self._loadTriggerVisibility[direction] = true;
        _private.onScrollLoadEdge(self, direction);
    },

    onScrollLoadEdgeStop: function(self, direction) {
        self._loadTriggerVisibility[direction] = false;
    },

    cacheScrollParams(self, params): void {
       self._cachedScrollParams = {
          scrollTop: params.scrollTop,
          scrollHeight: params.scrollHeight,
          clientHeight: params.clientHeight
       };
    },

    // Вызывает обновление индексов виртуального окна при срабатывании триггера вверх|вниз и запоминает, что тригер в настоящий момент видимый
    updateVirtualWindowStart(self, direction: 'up' | 'down', params): void {
        if (self._virtualScroll) {
            _private.cacheScrollParams(self, params);
            self._virtualScrollTriggerVisibility[direction] = true;
            _private.checkVirtualScrollCapability(self);
        }
    },

    // Запоминает, что тригер в настоящий момент скрыт
    updateVirtualWindowStop(self, direction: 'up'|'down'): void {
        if (self._virtualScroll) {
            self._virtualScrollTriggerVisibility[direction] = false;
        }
    },

    // Обновляет стартовый и конечный индексы виртуального окна
    applyVirtualScrollIndexes(self, direction): void {
        const updateIndexes = () => {
            if (_private.applyVirtualScrollIndexesToListModel(self)) {
                if (direction === 'up' && self._topPlaceholderSize === 0) {
                    self._saveAndRestoreScrollPosition = true;
                }
                self._shouldRestoreScrollPosition = true;
                self._virtualScroll.updatePlaceholdersSizes();
                _private.applyPlaceholdersSizes(self);
            }
        };

        if (detection.isMobileIOS && direction === 'up' && self._topPlaceholderSize === 0) {
            _private.getIntertialScrolling(self).callAfterScrollStopped(updateIndexes);
        } else {
            updateIndexes();
        }
    },

    loadToDirectionIfNeed: function(self, direction) {
        //source controller is not created if "source" option is undefined
        // todo возможно hasEnoughDataToDirection неправильная. Надо проверять startIndex +/- virtualSegmentSize
        if (!self._virtualScroll || !self._virtualScroll.hasEnoughDataToDirection(direction)) {
            if (self._sourceController && self._sourceController.hasMoreData(direction) && !self._sourceController.isLoading() && !self._loadedItems) {
                _private.loadToDirection(
                   self, direction,
                   self._options.dataLoadCallback,
                   self._options.dataLoadErrback
                );
            }
        }
    },

    // Метод, вызываемый при прокрутке скролла до триггера
    onScrollLoadEdge: function (self, direction) {
        if (self._options.navigation && self._options.navigation.view === 'infinity') {
            _private.loadToDirectionIfNeed(self, direction);
        }
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
        if (self.__error) {
            return;
        }
        const children = self._children;
        const scrollEmitter = children.ScrollEmitter;
        if (scrollEmitter.__started) {
            return;
        }
        const triggers = {
                topVirtualScrollTrigger: children.topVirtualScrollTrigger,
                bottomVirtualScrollTrigger: children.bottomVirtualScrollTrigger,
                topLoadTrigger: children.topLoadTrigger,
                bottomLoadTrigger: children.bottomLoadTrigger
            };

        // https://online.sbis.ru/opendoc.html?guid=b1bb565c-43de-4e8e-a6cc-19394fdd1eba
        scrollEmitter.startRegister(triggers);
        scrollEmitter.__started = true;
    },

    onScrollShow: function(self) {
        // ToDo option "loadOffset" is crutch for contacts.
        // remove by: https://online.sbis.ru/opendoc.html?guid=626b768b-d1c7-47d8-8ffd-ee8560d01076
        if (self._needScrollCalculation) {
            self._setLoadOffset(self._loadOffsetTop, self._loadOffsetBottom, false);
        }
        self._isScrollShown = true;
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
        if (!self._loadOffset || !self._loadOffset.isNull) {
            if (self._needScrollCalculation) {
                self._setLoadOffset(0, 0, true);
            }
            needUpdate = true;
        }
        if (self._pagingVisible) {
            self._pagingVisible = false;
            needUpdate = true;
        }
        self._isScrollShown = false;

        if (needUpdate) {
            self._forceUpdate();
        }
    },

    createScrollPagingController: function(self) {
        var def = new Deferred();

        var scrollPagingCtr = new ScrollPagingController({
            mode: self._options.navigation.viewConfig.pagingMode,
            pagingCfgTrigger: function(cfg) {
                self._pagingCfg = cfg;
                self._forceUpdate();
            }
        });

        def.callback(scrollPagingCtr);

        return def;
    },

    getSelectionForDragNDrop: function(selectedKeys, excludedKeys, dragKey) {
        var
            selected,
            excluded,
            dragItemIndex;

        selected = cClone(selectedKeys) || [];
        dragItemIndex = selected.indexOf(dragKey);
        if (dragItemIndex !== -1) {
            selected.splice(dragItemIndex, 1);
        }
        selected.unshift(dragKey);

        excluded = cClone(excludedKeys) || [];
        dragItemIndex = excluded.indexOf(dragKey);
        if (dragItemIndex !== -1) {
            excluded.splice(dragItemIndex, 1);
        }

        return {
            selected: selected,
            excluded: excluded
        };
    },

    showIndicator: function(self, direction = 'all') {
        self._loadingState = direction;
        if (direction === 'all') {
            self._loadingIndicatorState = self._loadingState;
        }
        if (!self._loadingIndicatorTimer) {
            self._loadingIndicatorTimer = setTimeout(function() {
                self._loadingIndicatorTimer = null;
                if (self._loadingState) {
                    self._loadingIndicatorState = self._loadingState;
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
    handleListScroll: function(self, params) {
        var hasMoreData;

        if (self._scrollPagingCtr) {
            if (params.position === 'middle') {
                self._scrollPagingCtr.handleScroll(params.scrollTop);
            } else {
                // when scroll is at the edge we will send information to scrollPaging about the availability of data next/prev
                if (self._sourceController) {
                    hasMoreData = {
                        up: self._sourceController.hasMoreData('up'),
                        down: self._sourceController.hasMoreData('down')
                    };
                }
                self._scrollPagingCtr.handleScrollEdge(params.position, hasMoreData);
            }
        } else {
            if (_private.needScrollPaging(self._options.navigation)) {
                _private.createScrollPagingController(self).addCallback(function(scrollPagingCtr) {
                    self._scrollPagingCtr = scrollPagingCtr;
                });
            }
        }

        if (self._virtualScroll) {
            _private.cacheScrollParams(self, params);
            if (self._virtualScrollTriggerVisibility.down) {
               if (_private.isFullPlaceholderVisibility(self, 'down', self._cachedScrollParams)) {
                  self._recalcVirtualScrollIndexes('down');
               }
            } else if (self._virtualScrollTriggerVisibility.up) {
               if (_private.isFullPlaceholderVisibility(self, 'up', self._cachedScrollParams)) {
                  self._recalcVirtualScrollIndexes('up');
               }
            }
        }

        if (detection.isMobileIOS) {
            _private.getIntertialScrolling(self).scrollStarted();
        }
    },

    getIntertialScrolling: function(self): IntertialScrolling {
        return self._intertialScrolling || (self._intertialScrolling = new IntertialScrolling());
    },

    needScrollCalculation: function (navigationOpt) {
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
        model.subscribe('onListChange', function(event, changesType, action, newItems, newItemsIndex, removedItems, removedItemsIndex) {
            if (changesType === 'collectionChanged') {

                //TODO костыль https://online.sbis.ru/opendoc.html?guid=b56324ff-b11f-47f7-a2dc-90fe8e371835
                if (self._options.navigation && self._options.navigation.source) {
                    self._sourceController.setState(self._listViewModel);
                }
                if (action === collection.IObservable.ACTION_REMOVE && self._menuIsShown) {
                    if (removedItems.find((item) => item.getContents().getId() === self._itemWithShownMenu.getId())) {
                        self._closeActionsMenu();
                        self._children.itemActionsOpener.close();
                    }
                }

                if (!!action && self._virtualScroll) {
                    let
                       newCount = self.getViewModel().getCount();
                    self._virtualScroll.ItemsCount = newCount;
                    if (action === collection.IObservable.ACTION_ADD || action === collection.IObservable.ACTION_MOVE) {
                        self._virtualScroll.insertItemsHeights(newItemsIndex - 1, newItems.length);
                        const
                           direction = newItemsIndex <= self._listViewModel.getStartIndex() ? 'up' : 'down';
                        if (direction === 'down') {
                            // если это не подгрузка с БЛ по скролу и
                            // если мы были в конце списка (отрисована последняя запись и виден нижний триггер)
                            // то нужно сместить виртуальное окно вниз, чтобы отобразились новые добавленные записи
                            if (self._virtualScroll.ItemsIndexes.stop === newCount - newItems.length &&
                               self._virtualScrollTriggerVisibility.down && !self._itemsFromLoadToDirection) {
                               self._virtualScroll.recalcToDirection(direction, self._cachedScrollParams, self._loadOffset.top);
                            } else {
                                // если данные добавились сверху - просто обновляем индексы видимых записей
                                self._virtualScroll.recalcItemsIndexes(direction, self._cachedScrollParams, self._loadOffset.top);
                            }
                        } else {
                            if (self._itemsFromLoadToDirection) {
                                // если элементы были подгружены с БЛ, то увеличиваем стартовый индекс на кол-во
                                // загруженных элементов. работаем именно через проекцию, т.к. может быть группировка и
                                // кол-во загруженных элементов может отличаться от кол-ва рисуемых элементов
                                self._virtualScroll.StartIndex = self._virtualScroll.ItemsIndexes.start + newItems.length;
                            }
                            self._virtualScroll.recalcItemsIndexes(direction, self._cachedScrollParams, self._loadOffset.top);
                        }
                    }
                    if (action === collection.IObservable.ACTION_REMOVE || action === collection.IObservable.ACTION_MOVE) {
                        self._virtualScroll.cutItemsHeights(removedItemsIndex - 1, removedItems.length);
                        self._virtualScroll.recalcItemsIndexes(removedItemsIndex < self._listViewModel.getStartIndex() ? 'up' : 'down', self._cachedScrollParams, self._loadOffset.top);
                    }
                    _private.applyVirtualScrollIndexesToListModel(self);
                }
            }
            if (changesType === 'collectionChanged' || changesType === 'indexesChanged') {
                self._itemsChanged = true;
            }
            self._forceUpdate();
        });

        model.subscribe('onGroupsExpandChange', function(event, changes) {
            _private.groupsExpandChangeHandler(self, changes);
        });
    },

    mockTarget(target: HTMLElement): {
       getBoundingClientRect: () => ClientRect
    } {
        const clientRect = target.getBoundingClientRect();
        return {
            getBoundingClientRect: () => clientRect
        };
    },

    showActionsMenu: function(self, event, itemData, childEvent, showAll) {
        var
            context = event.type === 'itemcontextmenu',
            showActions;
        if ((context && self._isTouch) || !itemData.itemActions) {
            return false;
        }
        showActions = showAll && itemData.itemActions.all
            ? itemData.itemActions.all
            : itemData.itemActions && itemData.itemActions.all.filter(function(action) {
                return action.showType !== tUtil.showType.TOOLBAR;
            });
        /**
         * During an opening of a menu, a row can get wrapped in a HoC and it would cause a full redraw of the row,
         * which would remove the target from the DOM.
         * So, we have to save target's ClientRect here in order to work around it.
         * But popups don't work with ClientRect, so we have to wrap it in an object with getBoundingClientRect method.
         */
        const target = context ? null : _private.mockTarget(childEvent.target);
        if (showActions && showActions.length) {
            var
                rs = new collection.RecordSet({ rawData: showActions });
            childEvent.nativeEvent.preventDefault();
            childEvent.stopImmediatePropagation();
            self._listViewModel.setActiveItem(itemData);
            self._listViewModel.setMenuState('shown');
            self._itemWithShownMenu = itemData.item;
            require(['css!theme?Controls/toolbars'], function() {
                const defaultMenuConfig = {
                   items: rs,
                   keyProperty: 'id',
                   parentProperty: 'parent',
                   nodeProperty: 'parent@',
                   dropdownClassName: 'controls-itemActionsV__popup',
                   showClose: true
                };

                if (self._options.contextMenuConfig) {
                   if (typeof self._options.contextMenuConfig === 'object') {
                      cMerge(defaultMenuConfig, self._options.contextMenuConfig);
                   } else {
                      IoC.resolve('ILogger').error('CONTROLS.ListView',
                         'Некорректное значение опции contextMenuConfig. Ожидается объект');
                   }
                }

                self._children.itemActionsOpener.open({
                    opener: self._children.listView,
                    target,
                    templateOptions: defaultMenuConfig,
                    eventHandlers: {
                        onResult: self._closeActionsMenu,
                        onClose: self._closeActionsMenu
                    },
                    closeOnOutsideClick: true,
                    corner: {vertical: 'top', horizontal: 'right'},
                    horizontalAlign: {side: context ? 'right' : 'left'},
                    className: 'controls-Toolbar__popup__list_theme-' + self._options.theme,
                    nativeEvent: context ? childEvent.nativeEvent : false
                });
                self._menuIsShown = true;
                self._forceUpdate();
            });
        }
    },

    showActionMenu(
       self: Control,
       itemData: object,
       childEvent: Event,
       action: object
    ): void {
       /**
        * For now, BaseControl opens menu because we can't put opener inside ItemActionsControl, because we'd get 2 root nodes.
        * When we get fragments or something similar, it would be possible to move this code where it really belongs.
        */
       const children = self._children.itemActions.getChildren(action, itemData.itemActions.all);
       if (children.length) {
          self._listViewModel.setActiveItem(itemData);
          self._listViewModel.setMenuState('shown');
          require(['css!Controls/input'], () => {
             self._children.itemActionsOpener.open({
                opener: self._children.listView,
                target: childEvent.target,
                templateOptions: {
                   items: new collection.RecordSet({ rawData: children }),
                   keyProperty: 'id',
                   parentProperty: 'parent',
                   nodeProperty: 'parent@',
                   groupTemplate: self._options.contextMenuConfig && self._options.contextMenuConfig.groupTemplate,
                   groupingKeyCallback: self._options.contextMenuConfig && self._options.contextMenuConfig.groupingKeyCallback,
                   rootKey: action.id,
                   showHeader: true,
                   dropdownClassName: 'controls-itemActionsV__popup',
                   headConfig: {
                       caption: action.title
                   }
                },
                eventHandlers: {
                   onResult: self._closeActionsMenu,
                   onClose: self._closeActionsMenu
                },
                className: 'controls-DropdownList__margin-head'
             });
             self._actionMenuIsShown = true;
             self._forceUpdate();
          });
       }
    },

    closeActionsMenu: function(self, args) {
        var
            actionName = args && args.action,
            event = args && args.event;

        function closeMenu() {
            self._listViewModel.setActiveItem(null);
            self._listViewModel.setMenuState('hidden');
            self._children.swipeControl.closeSwipe();
            self._menuIsShown = false;
            self._itemWithShownMenu = null;
            self._actionMenuIsShown = false;
        }

        if (actionName === 'itemClick') {
            var action = args.data && args.data[0] && args.data[0].getRawData();
            aUtil.itemActionsClick(self, event, action, self._listViewModel.getActiveItem(), self._listViewModel);
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
            GroupUtil.storeCollapsedGroups(changes.collapsedGroups, self._options.historyIdCollapsedGroups || self._options.groupHistoryId);
        }
    },

    prepareCollapsedGroups: function(config) {
        var
            result = new Deferred();
        if (config.historyIdCollapsedGroups || config.groupHistoryId) {
            GroupUtil.restoreCollapsedGroups(config.historyIdCollapsedGroups || config.groupHistoryId).addCallback(function(collapsedGroupsFromStore) {
                result.callback(collapsedGroupsFromStore || config.collapsedGroups);
            });
        } else {
            result.callback(config.collapsedGroups);
        }
        return result;
    },

    getSortingOnChange: function(currentSorting, propName, sortingType) {
        var sorting = cClone(currentSorting || []);
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
    },

    /**
     * @param {Controls/_list/BaseControl} self
     * @param {ErrbackConfig} config
     * @return {Promise}
     * @private
     */
    crudErrback(self: BaseControl, config: ErrbackConfig): Promise<CrudResult>{
        return _private.processError(self, config).then(getData);
    },

    /**
     * @param {Controls/_list/BaseControl} self
     * @param {ErrbackConfig} config
     * @return {Promise.<CrudResult>}
     * @private
     */
    processError(self: BaseControl, config: ErrbackConfig): Promise<CrudResult> {
        if (config.dataLoadErrback instanceof Function) {
            config.dataLoadErrback(config.error);
        }
        if (!config.error.canceled) {
            _private.hideIndicator(self);
        }
        return self.__errorController.process({
            error: config.error,
            mode: config.mode || dataSourceError.Mode.include
        }).then((errorConfig) => {
            _private.showError(self, errorConfig);
            return {
                error: config.error,
                errorConfig: errorConfig
            };
        });
    },

    /**
     * @param {Controls/_list/BaseControl} self
     * @param {Controls/dataSource:error.ViewConfig} errorConfig
     * @private
     */
    showError(self: BaseControl, errorConfig: dataSourceError.ViewConfig): void {
        self.__error = errorConfig;
        self._forceUpdate();
    },

    hideError(self: BaseControl): void {
        if (self.__error) {
            self.__error = null;
            self._forceUpdate();
        }
    },

    calcPaging(self, hasMore: number | boolean, pageSize: number): number {
        let newKnownPagesCount = self._knownPagesCount;

        if (typeof hasMore === 'number') {
            newKnownPagesCount = Math.ceil(hasMore / pageSize);
        } else if (typeof hasMore === 'boolean' && hasMore && self._currentPage === self._knownPagesCount) {
            newKnownPagesCount++;
        }

        return newKnownPagesCount;
    },

    getSourceController: function({source, navigation, keyProperty}:{source: ICrud, navigation: object, keyProperty:string}): SourceController {
        return new SourceController({
            source: source,
            navigation: navigation,
            keyProperty: keyProperty
        })
    },

    checkRequiredOptions: function(options) {
        if (options.keyProperty === undefined) {
            IoC.resolve('ILogger').warn('BaseControl', 'Option "keyProperty" is required.');
        }
    },

    needBottomPadding: function(options) {
        return (options.itemActionsPosition === 'outside' && !options.footerTemplate && options.resultsPosition !== 'bottom');
    },

    isPagingNavigation: function(navigation) {
        return navigation && navigation.view === 'pages';
    },
    resetPagingNavigation: function(self) {
        self._knownPagesCount = INITIAL_PAGES_COUNT;
        self._currentPage = INITIAL_PAGES_COUNT;
    },

    initializeNavigation: function(self, cfg, resetPaging) {
        self._needScrollCalculation = _private.needScrollCalculation(cfg.navigation);
        self._pagingNavigation = _private.isPagingNavigation(cfg.navigation);

        if (self._needScrollCalculation) {
            if (cfg.virtualScrolling && !self._virtualScroll) {
                self._virtualScroll = new VirtualScroll({
                    virtualPageSize: cfg.virtualPageSize,
                    virtualSegmentSize: cfg.virtualSegmentSize
                });
            }
            self._virtualScrollTriggerVisibility = {
                up: false,
                down: false
            };
            self._loadTriggerVisibility = {
                up: false,
                down: false
            };
        } else {
            self._loadTriggerVisibility = null;
            self._virtualScrollTriggerVisibility = null;
            self._pagingVisible = false;
        }

        if (self._pagingNavigation) {
            if (resetPaging) {
                _private.resetPagingNavigation(self);
            }
        } else {
            self._pagingNavigationVisible = false;
            _private.resetPagingNavigation(self);
        }
    },
    updateNavigation: function(self) {
        self._pagingNavigationVisible = self._pagingNavigation && self._knownPagesCount > 1;
    }

};

/**
 * Компонент плоского списка, с произвольным шаблоном отображения каждого элемента. Обладает возможностью загрузки/подгрузки данных из источника.
 * @class Controls/_list/BaseControl
 * @extends Core/Control
 * @mixes Controls/_interface/ISource
 * @mixes Controls/interface/IErrorController
 * @mixes Controls/interface/IItemTemplate
 * @mixes Controls/interface/IPromisedSelectable
 * @mixes Controls/interface/IGrouped
 * @mixes Controls/interface/INavigation
 * @mixes Controls/interface/IFilter
 * @mixes Controls/interface/IHighlighter
 * @mixes Controls/_list/interface/IBaseControl
 * @mixes Controls/interface/IEditableList
 * @mixes Controls/_list/BaseControl/Styles
 * @control
 * @private
 * @author Авраменко А.С.
 * @category List
 */

var BaseControl = Control.extend(/** @lends Controls/_list/BaseControl.prototype */{
    _template: BaseControlTpl,
    iWantVDOM: true,
    _isActiveByClick: false,
    _markedKeyForRestoredScroll: null,

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

    _itemTemplate: null,

    _isScrollShown: false,
    _needScrollCalculation: false,
    _loadTriggerVisibility: null,
    _virtualScrollTriggerVisibility: null,
    _cachedScrollParams: null,
    _loadOffset: null,
    _loadOffsetTop: LOAD_TRIGGER_OFFSET,
    _loadOffsetBottom: LOAD_TRIGGER_OFFSET,
    _topPlaceholderSize: 0,
    _bottomPlaceholderSize: 0,
    _menuIsShown: null,

    _popupOptions: null,

    //Variables for paging navigation
    _knownPagesCount: INITIAL_PAGES_COUNT,
    _currentPage: INITIAL_PAGES_COUNT,
    _pagingNavigation: false,
    _pagingNavigationVisible: false,

    _canUpdateItemsActions: false,

    _needBottomPadding: false,
    _emptyTemplateVisibility: true,
    _intertialScrolling: null,

    constructor(options) {
        BaseControl.superclass.constructor.apply(this, arguments);
        options = options || {};
        this.__errorController = options.errorController || new dataSourceError.Controller({});
        this._recalcVirtualScrollIndexes = throttle(function(direction) {
            this._virtualScroll.recalcToDirectionByScrollTop(direction, this._cachedScrollParams, this._loadOffset.top);
            _private.applyVirtualScrollIndexes(this, direction);
        }.bind(this), 50, true);
    },

    /**
     * @param {Object} newOptions
     * @param {Object} context
     * @param {ReceivedState} receivedState
     * @return {Promise}
     * @protected
     */
    _beforeMount: function(newOptions, context, receivedState: ReceivedState = {}) {
        var self = this;

        let receivedError = receivedState.errorConfig;
        let receivedData = receivedState.data;

        _private.checkDeprecated(newOptions);
        _private.checkRequiredOptions(newOptions);

        _private.bindHandlers(this);

        _private.initializeNavigation(this, newOptions);
        _private.updateNavigation(this);
        this._needBottomPadding = _private.needBottomPadding(newOptions);

        this._needSelectionController = newOptions.multiSelectVisibility !== 'hidden';

        return _private.prepareCollapsedGroups(newOptions).addCallback(function(collapsedGroups) {
            var
                viewModelConfig = collapsedGroups ? cMerge(cClone(newOptions), { collapsedGroups: collapsedGroups }) : cClone(newOptions);
            if (newOptions.viewModelConstructor) {
                self._viewModelConstructor = newOptions.viewModelConstructor;
                if (receivedData) {
                    viewModelConfig.items = receivedData;
                }
                self._listViewModel = new newOptions.viewModelConstructor(viewModelConfig);
                _private.initListViewModelHandler(self, self._listViewModel);
            }

            if (newOptions.source) {
                self._sourceController = _private.getSourceController(newOptions);


                if (receivedData) {
                    self._sourceController.calculateState(receivedData);
                    self._items = self._listViewModel.getItems();
                    if (self._pagingNavigation) {
                        var hasMoreData = self._items.getMetaData().more;
                        self._knownPagesCount = _private.calcPaging(self, hasMoreData, newOptions.navigation.sourceConfig.pageSize);
                    }
                    if (newOptions.dataLoadCallback instanceof Function) {
                        newOptions.dataLoadCallback(self._items);
                    }

                    if (self._virtualScroll) {
                        // При серверной верстке применяем начальные значения
                        self._virtualScroll.ItemsCount = self._listViewModel.getCount();
                        self._virtualScroll.resetItemsIndexes();
                        _private.applyVirtualScrollIndexesToListModel(self);
                    }
                    _private.prepareFooter(self, newOptions.navigation, self._sourceController);
                    return;
                }
                if (receivedError) {
                    return _private.showError(self, receivedError);
                }
                return _private.reload(self, newOptions).addCallback(getState);
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
            this._setLoadOffset(this._loadOffsetTop, this._loadOffsetBottom, false);
            _private.startScrollEmitter(this);
        }

        if (this._virtualScroll) {
            this._setScrollItemContainer();
        }
    },

    _beforeUpdate: function(newOptions) {
        var filterChanged = !isEqual(newOptions.filter, this._options.filter);
        var navigationChanged = !isEqual(newOptions.navigation, this._options.navigation);
        var resetPaging = this._pagingNavigation && filterChanged;
        var recreateSource = newOptions.source !== this._options.source || navigationChanged || resetPaging;
        var sortingChanged = !isEqual(newOptions.sorting, this._options.sorting);
        var self = this;
        this._needBottomPadding = _private.needBottomPadding(newOptions);
        if (newOptions.navigation !== this._options.navigation) {
            _private.initializeNavigation(this, newOptions, resetPaging);
        }
        _private.updateNavigation(this);

        if ((newOptions.groupMethod !== this._options.groupMethod) || (newOptions.viewModelConstructor !== this._viewModelConstructor)) {
            this._viewModelConstructor = newOptions.viewModelConstructor;
            this._listViewModel = new newOptions.viewModelConstructor(cMerge(cClone(newOptions), {
                items: this._listViewModel.getItems()
            }));
            _private.initListViewModelHandler(this, this._listViewModel);
        }

        if (newOptions.groupMethod !== this._options.groupMethod) {
            _private.reload(this, newOptions);
        }

        if (newOptions.collapsedGroups !== this._options.collapsedGroups) {
            this._listViewModel.setCollapsedGroups(newOptions.collapsedGroups);
        }

        if (newOptions.keyProperty !== this._options.keyProperty) {
            this._listViewModel.setKeyProperty(newOptions.keyProperty);
        }

        if (newOptions.markedKey !== this._options.markedKey) {
            this._listViewModel.setMarkedKey(newOptions.markedKey);
        }

        if (newOptions.markerVisibility !== this._options.markerVisibility) {
            this._listViewModel.setMarkerVisibility(newOptions.markerVisibility);
        }

        if (newOptions.searchValue !== this._options.searchValue) {
            this._listViewModel.setSearchValue(newOptions.searchValue);
        }

        if (recreateSource) {
            this._recreateSourceController(newOptions.source, newOptions.navigation, newOptions.keyProperty);
        }

        if (newOptions.multiSelectVisibility !== this._options.multiSelectVisibility) {
            this._listViewModel.setMultiSelectVisibility(newOptions.multiSelectVisibility);
        }
        this._needSelectionController = newOptions.multiSelectVisibility !== 'hidden' || this._delayedSelect;

        if (newOptions.itemTemplateProperty !== this._options.itemTemplateProperty) {
            this._listViewModel.setItemTemplateProperty(newOptions.itemTemplateProperty);
        }

        if (sortingChanged) {
            this._listViewModel.setSorting(newOptions.sorting);
        }

        if (filterChanged || recreateSource || sortingChanged) {
            _private.resetPagingNavigation(this);

            //return result here is for unit tests
            return _private.reload(self, newOptions);
        }

        if (this._itemsChanged) {
            this._shouldNotifyOnDrawItems = true;
        }

        if (this._loadedItems) {
            this._shouldRestoreScrollPosition = true;
        }
    },

    reloadItem: function(key:String, readMeta:Object, replaceItem:Boolean, reloadType = 'read'):Deferred {
        const items = this._listViewModel.getItems();
        const currentItemIndex = items.getIndexByValue(this._options.keyProperty, key);
        const sourceController = _private.getSourceController(this._options);

        let reloadItemDeferred;
        let filter;
        let itemsCount;

        function loadCallback(item):void {
            if (replaceItem) {
                items.replace(item, currentItemIndex);
            } else {
                items.at(currentItemIndex).merge(item);
            }
        }

        if (currentItemIndex === -1) {
            throw new Error('BaseControl::reloadItem no item with key ' + key);
        }

        if (reloadType === 'query') {
            filter = cClone(this._options.filter);
            filter[this._options.keyProperty] = [key];
            reloadItemDeferred = sourceController.load(filter).addCallback((items) => {
                itemsCount = items.getCount();

                if (itemsCount === 1) {
                    loadCallback(items.at(0));
                } else if (itemsCount > 1) {
                    IoC.resolve('ILogger').error('BaseControl', 'reloadItem::query returns wrong amount of items for reloadItem call with key: ' + key);
                } else {
                    IoC.resolve('ILogger').info('BaseControl', 'reloadItem::query returns empty recordSet.');
                }
                return items;
            });
        } else {
            reloadItemDeferred = sourceController.read(key, readMeta).addCallback((item) => {
                if (item) {
                    loadCallback(item);
                } else {
                    IoC.resolve('ILogger').info('BaseControl', 'reloadItem::read do not returns record.');
                }
                return item;
            });
        }

        return reloadItemDeferred.addErrback((error) => {
            return _private.crudErrback(this, {
                error: error,
                mode: dataSourceError.Mode.dialog
            });
        });
    },

    _beforeUnmount: function() {
        if (this._focusTimeout) {
            clearTimeout(this._focusTimeout);
        }
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
        this._virtualScrollTriggerVisibility = null;

        BaseControl.superclass._beforeUnmount.apply(this, arguments);
    },

    _beforeRender(): void {
        if (this._saveAndRestoreScrollPosition) {
            /**
             * This event should bubble, because there can be anything between Scroll/Container and the list,
             * and we can't force everyone to manually bubble it.
             */
            this._notify('saveScrollPosition', [], { bubbling: true });
        }
    },

    _beforePaint():void {
        if (this._virtualScroll && this._itemsChanged) {
            this._virtualScroll.updateItemsSizes();
            _private.applyPlaceholdersSizes(this);
        }

        // todo KINGO.
        // При вставке новых записей в DOM браузер сохраняет текущую позицию скролла.
        // Таким образом триггер загрузки данных срабатывает ещё раз и происходит зацикливание процесса загрузки.
        // Демо на jsFiddle: https://jsfiddle.net/alex111089/9q0hgdre/
        // Чтобы предотвратить эту ошибку - восстанавливаем скролл на ту позицию, которая была до вставки новых записей.
        // todo 2 Фантастически, но свежеиспеченный afterRender НЕ ПОДХОДИТ! Падают тесты. ХФ на носу, разбираться
        // некогда, завел подошибку: https://online.sbis.ru/opendoc.html?guid=d83711dd-a110-4e10-b279-ade7e7e79d38
        if (this._shouldRestoreScrollPosition) {
            _private.restoreScrollPosition(this);
            this._loadedItems = null;
            this._shouldRestoreScrollPosition = false;
            this._checkShouldLoadToDirection = true;
            this._forceUpdate();
        } else if (this._checkShouldLoadToDirection) {
           setTimeout(function() {
              _private.checkLoadToDirectionCapability(this);
           }.bind(this));
            this._checkShouldLoadToDirection = false;
        }
    },

    _afterUpdate: function(oldOptions) {
        if (this._needScrollCalculation) {
            _private.startScrollEmitter(this);
        }
        if (this._options.itemActions) {
            this._canUpdateItemsActions = false;
        }
        if (this._shouldNotifyOnDrawItems) {
            this._notify('drawItems');
            this._shouldNotifyOnDrawItems = false;
            this._itemsChanged = false;
        }
        if (this._delayedSelect && this._children.selectionController) {
            this._children.selectionController.onCheckBoxClick(this._delayedSelect.key, this._delayedSelect.status);
            this._notify('checkboxClick', [this._delayedSelect.key, this._delayedSelect.status]);
            this._delayedSelect = null;
        }

        //FIXME need to delete after https://online.sbis.ru/opendoc.html?guid=4db71b29-1a87-4751-a026-4396c889edd2
        if (oldOptions.hasOwnProperty('loading') && oldOptions.loading !== this._options.loading) {
            if (this._options.loading && this._loadingState === null) {
                _private.showIndicator(this);
            } else if (!this._sourceController.isLoading() && this._loadingState === 'all') {
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

    _setLoadOffset: function(top, bottom, isNull) {
        if (!this._loadOffset) {
            this._loadOffset = {};
        }
        this._loadOffset.top = top;
        this._loadOffset.bottom = bottom;

        this._loadOffsetTop = top || this._loadOffsetTop;
        this._loadOffsetBottom = bottom || this._loadOffsetBottom;

        this._loadOffset.isNull = isNull;
        this._children.topVirtualScrollTrigger.style.top = Math.floor(this._loadOffset.top) + 'px';
        this._children.topLoadTrigger.style.top = Math.floor(this._loadOffset.top * 1.3) + 'px';
        this._children.bottomVirtualScrollTrigger.style.bottom = Math.floor(this._loadOffset.bottom) + 'px';
        this._children.bottomLoadTrigger.style.bottom = Math.floor(this._loadOffset.bottom * 1.3) + 'px';
    },
    _onViewPortResize: function(self, viewPortSize) {
        if (self._needScrollCalculation && !self._loadOffset.isNull) {
            let offset = Math.floor(viewPortSize / 3);
            self._setLoadOffset(offset, offset, false);
        }
    },

    __onEmitScroll: function(e, type, params) {
        var self = this;
        switch (type) {
            case 'loadTopStart': _private.onScrollLoadEdgeStart(self, 'up'); break;
            case 'loadTopStop': _private.onScrollLoadEdgeStop(self, 'up'); break;
            case 'loadBottomStart': _private.onScrollLoadEdgeStart(self, 'down'); break;
            case 'loadBottomStop': _private.onScrollLoadEdgeStop(self, 'down'); break;

            case 'virtualPageTopStart': _private.updateVirtualWindowStart(self, 'up', params); break;
            case 'virtualPageTopStop': _private.updateVirtualWindowStop(self, 'up'); break;
            case 'virtualPageBottomStart': _private.updateVirtualWindowStart(self, 'down', params); break;
            case 'virtualPageBottomStop': _private.updateVirtualWindowStop(self, 'down'); break;


            case 'scrollMove': _private.handleListScroll(self, params); break;
            case 'canScroll': _private.onScrollShow(self); break;
            case 'cantScroll': _private.onScrollHide(self); break;

            case 'viewPortResize': self._onViewPortResize(self, params[0]); break;
        }
    },

    __needShowEmptyTemplate: function(emptyTemplate: Function | null, listViewModel: ListViewModel, loadingState: LoadingState): boolean {
        const newEmptyTemplateVisibility = emptyTemplate &&
                                           !listViewModel.getCount() && !listViewModel.getEditingItemData() &&
                                           (!loadingState || loadingState === 'all');

        // TODO: KINGO
        // Загружаются данные по скролу, первые несколько страниц оказываются пустыми (как в реестре контакы),
        // в этот момент вызывают перезагрузку реестра (например поиском или фильтрацией)
        // и мы не должны показывать в этом случае заглушку, что нет данных,
        // пока реестр не загрузится
        return this._emptyTemplateVisibility = newEmptyTemplateVisibility && (this._emptyTemplateVisibility || !loadingState);
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
             * But, because selectionController is a component, we can't create it and call it's method in the same event handler.
             */
            this._needSelectionController = true;
            this._delayedSelect = {
                key: itemData.key,
                status: itemData.multiSelectStatus
            };

            //Animation should be played only if checkboxes are visible.
            if (this._options.multiSelectVisibility !== 'hidden') {
                this.getViewModel().setRightSwipedItem(itemData);
            }
        }
        if (direction === 'right' || direction === 'left') {
            var newKey = ItemsUtil.getPropertyValue(itemData.item, this._options.keyProperty);
            this._listViewModel.setMarkedKey(newKey);
            this._listViewModel.setActiveItem(itemData);
        }
        if (direction === 'left' && (this._options.itemActions || this._options.itemActionsProperty)) {
            this._children.itemActions.updateItemActions(itemData.item);

            // FIXME: https://online.sbis.ru/opendoc.html?guid=7a0a273b-420a-487d-bb1b-efb955c0acb8
            itemData.itemActions = this.getViewModel().getItemActions(itemData.item);
        }
        if (!this._options.itemActions && typeof this._options.selectedKeysCount === 'undefined') {
            this._notify('itemSwipe', [itemData.item, childEvent]);
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
        return _private.reload(this, this._options).addCallback(getData);
    },

    getVirtualScroll: function() {
        return this._virtualScroll;
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

        // При перерисовке элемента списка фокус улетает на body. Сейчас так восстаначливаем фокус. Выпилить после решения
        // задачи https://online.sbis.ru/opendoc.html?guid=38315a8d-2006-4eb8-aeb3-05b9447cd629
        // !!!!! НЕ ПЫТАТЬСЯ ВЫНЕСТИ В MOUSEDOWN, ИНАЧЕ НЕ БУДЕТ РАБОТАТЬ ВЫДЕЛЕНИЕ ТЕКСТА В СПИСКАХ !!!!!!
        // https://online.sbis.ru/opendoc.html?guid=f47f7476-253c-47ff-b65a-44b1131d459c
        var target = originalEvent.target;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.closest('[contenteditable=true]') && !target.closest('.controls-InputRender, .controls-Render, .controls-EditableArea, .controls-Dropdown, .controls-Suggest_list')) {
            this.focus();
        }
    },

    focus: function() {
        this._focusTimeout = setTimeout(() => {
            if (this._children.fakeFocusElem) {
                Focus.focus(this._children.fakeFocusElem);
            }
        }, 0);
    },

    _viewResize: function() {
        // todo Check, maybe remove "this._virtualScroll.ItemsContainer"?
        if (this._virtualScroll && this._virtualScroll.ItemsContainer) {
            this._virtualScroll.updateItemsSizes();
            _private.applyPlaceholdersSizes(this);
        }
    },
    _setScrollItemContainer: function () {
        if (!this._children.listView || !this._virtualScroll) {
            return;
        }
        this._virtualScroll.ItemsContainer = this._children.listView.getItemsContainer();
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

    _onAfterBeginEdit: function (event, item, isAdd) {

        /*
        * TODO: KINGO
        * При начале редактирования нужно обновить операции наз записью у редактируемого элемента списка, т.к. в режиме
        * редактирования и режиме просмотра они могут отличаться. На момент события beforeBeginEdit еще нет редактируемой
        * записи. В данном месте цикл синхронизации itemActionsControl'a уже случился и обновление через выставление флага
        * _canUpdateItemsActions  приведет к показу неактуальных операций.
        */
        this._children.itemActions.updateItemActions(item);
        return this._notify('afterBeginEdit', [item, isAdd]);
    },

   _showActionMenu(
      event: Event,
      itemData: object,
      childEvent: Event,
      action: object
   ): void {
      _private.showActionMenu(this, itemData, childEvent, action);
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
            selection,
            self = this,
            dragStartResult;

        if (!this._options.readOnly && this._options.itemsDragNDrop && !domEvent.target.closest('.controls-DragNDrop__notDraggable')) {

            //Support moving with mass selection.
            //Full transition to selection will be made by: https://online.sbis.ru/opendoc.html?guid=080d3dd9-36ac-4210-8dfa-3f1ef33439aa
            selection = _private.getSelectionForDragNDrop(this._options.selectedKeys, this._options.excludedKeys, itemData.key);
            getItemsBySelection(selection, this._options.source, this._listViewModel.getItems(), this._options.filter).addCallback(function(items) {
                dragStartResult = self._notify('dragStart', [items]);
                if (dragStartResult) {
                    self._children.dragNDropController.startDragNDrop(dragStartResult, domEvent);
                    self._itemDragData = itemData;
                }
            });
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

        // do not need to update itemAction on touch devices, if mouseenter event was fired,
        // otherwise actions will updated and redraw, because of this click on action will not work.
        // actions on touch devices drawing on swipe.
        if (!this._context.isTouch.isTouch) {
            this._canUpdateItemsActions = true;
        }
    },

    _itemMouseMove(event, itemData, nativeEvent){
        this._notify('itemMouseMove', [itemData, nativeEvent]);
    },

    _sortingChanged: function(event, propName, sortingType) {
        var newSorting = _private.getSortingOnChange(this._options.sorting, propName, sortingType);
        event.stopPropagation();
        this._notify('sortingChanged', [newSorting]);
    },

    __pagingChangePage: function (event, page) {
        this._currentPage = page;
        var newNavigation = cClone(this._options.navigation);
        newNavigation.sourceConfig.page = page - 1;
        this._recreateSourceController(this._options.source, newNavigation, this._options.keyProperty);
        var self = this;
        _private.reload(self, self._options);
        this._shouldRestoreScrollPosition = true;
    },

    _recreateSourceController: function(newSource, newNavigation, newKeyProperty) {

        if (this._sourceController) {
            this._sourceController.destroy();
        }
        this._sourceController = new SourceController({
            source: newSource,
            navigation: newNavigation,
            keyProperty: newKeyProperty
        });

    }


});

// TODO https://online.sbis.ru/opendoc.html?guid=17a240d1-b527-4bc1-b577-cf9edf3f6757
/* ListView.getOptionTypes = function getOptionTypes(){
 return {
 dataSource: Types(ISource)
 }
 }; */
BaseControl._private = _private;

BaseControl.contextTypes = function contextTypes() {
    return {
        isTouch: TouchContextField
    };
};

BaseControl.getDefaultOptions = function() {
    return {
        uniqueKeys: true,
        multiSelectVisibility: 'hidden',
        markerVisibility: 'onactivated',
        style: 'default',
        selectedKeys: defaultSelectedKeys,
        excludedKeys: defaultExcludedKeys,
        markedKey: null,
        stickyHeader: true
    };
};
export = BaseControl;
