import Control = require('Core/Control');
import cClone = require('Core/core-clone');
import cMerge = require('Core/core-merge');
import cInstance = require('Core/core-instance');
import BaseControlTpl = require('wml!Controls/_list/BaseControl/BaseControl');
import ItemsUtil = require('Controls/_list/resources/utils/ItemsUtil');
import VirtualScroll = require('Controls/_list/Controllers/VirtualScroll');
import Deferred = require('Core/Deferred');
import getItemsBySelection = require('Controls/Utils/getItemsBySelection');
import scrollToElement = require('Controls/Utils/scrollToElement');
import collection = require('Types/collection');
import aUtil = require('Controls/_list/ItemActions/Utils/Actions');
import tmplNotify = require('Controls/Utils/tmplNotify');
import keysHandler = require('Controls/Utils/keysHandler');
import ScrollPagingController = require('Controls/_list/Controllers/ScrollPaging');
import GroupUtil = require('Controls/_list/resources/utils/GroupUtil');
import {Controller as SourceController} from 'Controls/source';
import {isEqual} from 'Types/object';
import {showType} from 'Controls/Utils/Toolbar';
import 'wml!Controls/_list/BaseControl/Footer';
import 'css!theme?Controls/list';
import {error as dataSourceError} from 'Controls/dataSource';
import {constants, detection, IoC} from 'Env/Env';
import ListViewModel from 'Controls/_list/ListViewModel';
import {ICrud} from "Types/source";
import {TouchContextField} from 'Controls/context';
import IntertialScrolling from 'Controls/_list/resources/utils/InertialScrolling';
import {debounce, throttle} from 'Types/function';
import {CssClassList} from "../Utils/CssClassList";
import uDimension = require("Controls/Utils/getDimensions");

import { create as diCreate } from 'Types/di';

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
        enterHandler: constants.key.enter,
        keyDownHome: constants.key.home,
        keyDownEnd: constants.key.end,
        keyDownPageUp: constants.key.pageUp,
        keyDownPageDown: constants.key.pageDown
    };

const LOAD_TRIGGER_OFFSET = 100;
const INITIAL_PAGES_COUNT = 1;
const ITEMACTIONS_UNLOCK_DELAY = 200;
const SET_MARKER_AFTER_SCROLL_DELAY = 100;
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
        self._noDataBeforeReload = self._isMounted && (!self._listViewModel || !self._listViewModel.getCount());
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
                if (list.getCount()) {
                    self._loadedItems = list;
                }
                if (self._pagingNavigation) {
                    var hasMoreDataDown = list.getMetaData().more;
                    self._knownPagesCount = _private.calcPaging(self, hasMoreDataDown, cfg.navigation.sourceConfig.pageSize);
                    self._pagingLabelData = _private.getPagingLabelData(hasMoreDataDown, cfg.navigation.sourceConfig.pageSize, self._currentPage);
                }
                var
                    isActive,
                    listModel = self._listViewModel;

                if (cfg.afterReloadCallback) {
                    cfg.afterReloadCallback(cfg);
                }

                if (cfg.serviceDataLoadCallback instanceof Function) {
                    cfg.serviceDataLoadCallback(list);
                }

                if (cfg.dataLoadCallback instanceof Function) {
                    cfg.dataLoadCallback(list);
                }

                if (listModel) {
                    if (self._isActive) {
                        isActive = true;
                    }
                    if (self._options.useNewModel) {
                        // TODO restore marker + maybe should recreate the model completely
                        // instead of assigning items
                        // https://online.sbis.ru/opendoc.html?guid=ed57a662-7a73-4f11-b7d4-b09b622b328e
                        const modelCollection = listModel.getCollection();
                        modelCollection.setMetaData(list.getMetaData());
                        modelCollection.assign(list);
                        self._items = listModel.getCollection();
                    } else {
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
                    }
                    if (isActive === true) {
                        self._children.listView.activate();
                    }

                    if (self._sourceController) {
                        _private.setHasMoreData(listModel, self._sourceController.hasMoreData('down') || self._sourceController.hasMoreData('up'));
                    }

                    if (self._virtualScroll) {
                        self._virtualScroll.ItemsCount = listModel.getCount();
                        self._virtualScroll.resetItemsIndexes();
                        _private.applyVirtualScrollIndexesToListModel(self);
                    }
                }

                _private.prepareFooter(self, navigation, self._sourceController);
                _private.resolveIndicatorStateAfterReload(self, list);

                resDeferred.callback({
                    data: list
                });

                if (self._isMounted && self._isScrollShown) {
                    // При полной перезагрузке данных нужно сбросить состояние скролла
                    // и вернуться к началу списка, иначе браузер будет пытаться восстановить
                    // scrollTop, догружая новые записи после сброса.
                    self._resetScrollAfterReload = true;
                }

                // If received list is empty, make another request. If it’s not empty, the following page will be requested in resize event handler after current items are rendered on the page.
                if (!list.getCount()) {
                    _private.checkLoadToDirectionCapability(self, filter);
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
        if (!self._isMounted) {
            return
        }

        const hasMoreDataDown = self._sourceController.hasMoreData('down');
        const hasMoreDataUp = self._sourceController.hasMoreData('up');

        if (!list.getCount()) {
            //because of IntersectionObserver will trigger only after DOM redraw, we should'n hide indicator
            //otherwise empty template will shown
            if ((hasMoreDataDown || hasMoreDataUp) && self._needScrollCalculation) {
                if (self._listViewModel && self._listViewModel.getCount()) {
                    _private.showIndicator(self, hasMoreDataDown ? 'down' : 'up');
                } else {
                    _private.showIndicator(self);
                }
            } else {
                _private.hideIndicator(self);
            }
        } else {
            _private.hideIndicator(self);
        }
    },

    scrollToItem: function(self, key, toBottom: boolean = true) {
        // todo now is one safe variant to fix call stack: beforeUpdate->reload->afterUpdate
        // due to asynchronous reload and afterUpdate, a "race" is possible and afterUpdate is called after reload
        // changes in branch "19.110/bugfix/aas/basecontrol_reload_by_afterupdate"
        // https://git.sbis.ru/sbis/controls/merge_requests/65854
        // corrupting integration tests
        // fixed by error: https://online.sbis.ru/opendoc.html?guid=d348adda-5fee-4d1b-8cb7-9501026f4f3c
        let idx;
        if (self._virtualScroll) {
            idx = self.getViewModel().getIndexByKey(key) - (self._virtualScroll.ItemsIndexes.start);
        } else {
            idx = self.getViewModel().getIndexByKey(key);
        }
        const container = self._children.listView.getItemsContainer().children[idx];
        if (container) {
            _private.scrollToElement(container, toBottom);
        }
    },
    scrollToElement(container, toBottom) {
        scrollToElement(container, toBottom);
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
            let size = 0;
            if (self._virtualScroll) {
                size = self._saveAndRestoreScrollPosition === 'up' ?
                   self._virtualScroll.getItemsHeight(self._virtualScroll.ItemsIndexes.stop, self._savedStopIndex) :
                   self._virtualScroll.getItemsHeight(self._savedStartIndex, self._virtualScroll.ItemsIndexes.start);
            }
            self._notify('restoreScrollPosition', [ size, self._saveAndRestoreScrollPosition ], { bubbling: true });
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
        if (self._mounted) {
            self.activate();
        }
        _private.setMarkedKey(self, newMarkedKey);
    },
    moveMarkerToNext: function (self, event) {
        if (_private.isBlockedForLoading(self._loadingIndicatorState)) {
            return;
        }
        if (self._options.markerVisibility !== 'hidden') {
            event.preventDefault();
            var model = self.getViewModel();
            _private.moveMarker(self, model.getNextItemKey(model.getMarkedKey()));
        }
    },
    moveMarkerToPrevious: function (self, event) {
        if (_private.isBlockedForLoading(self._loadingIndicatorState)) {
            return;
        }
        if (self._options.markerVisibility !== 'hidden') {
            event.preventDefault();
            var model = self.getViewModel();
            _private.moveMarker(self, model.getPreviousItemKey(model.getMarkedKey()));
        }
    },
    setMarkerAfterScroll(self, event) {
       self._setMarkerAfterScroll = true;
    },
    keyDownHome: function(self, event) {
        _private.setMarkerAfterScroll(self, event);
    },
    keyDownEnd:  function(self, event) {
        _private.setMarkerAfterScroll(self, event);
    },
    keyDownPageUp:  function(self, event) {
        _private.setMarkerAfterScroll(self, event);
    },
    keyDownPageDown:  function(self, event) {
        _private.setMarkerAfterScroll(self, event);
    },

    enterHandler: function(self) {
        if (_private.isBlockedForLoading(self._loadingIndicatorState)) {
            return;
        }
        let markedItem = self.getViewModel().getMarkedItem();
        if (markedItem) {
            self._notify('itemClick', [markedItem.getContents()], { bubbling: true });
        }
    },
    toggleSelection: function(self, event) {
        if (_private.isBlockedForLoading(self._loadingIndicatorState)) {
            return;
        }
        let model, markedKey;
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

        if (navigation && navigation.view === 'demand' && sourceController.hasMoreData('down')) {
            self._shouldDrawFooter = self._options.groupingKeyCallback ? !self._listViewModel.isAllGroupsCollapsed() : true;
        } else {
            self._shouldDrawFooter = false;
        }

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

    loadToDirection: function(self, direction, userCallback, userErrback, receivedFilter) {
        const beforeAddItems = (addedItems) => {
            if (addedItems.getCount()) {
                self._loadedItems = addedItems;
            }
            if (self._options.serviceDataLoadCallback instanceof Function) {
                self._options.serviceDataLoadCallback(addedItems);
            }
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
            self._saveAndRestoreScrollPosition = 'up';
            if (self._options.useNewModel) {
                self._listViewModel.getCollection().prepend(addedItems);
            } else {
                self._listViewModel.prependItems(addedItems);
            }
            afterAddItems(countCurrentItems, addedItems);
        };

        _private.showIndicator(self, direction);

        if (self._sourceController) {
            const filter = cClone(receivedFilter || self._options.filter);
            if (self._options.beforeLoadToDirectionCallback) {
                self._options.beforeLoadToDirectionCallback(filter, self._options);
            }
            _private.setHasMoreData(self._listViewModel, self._sourceController.hasMoreData('down') || self._sourceController.hasMoreData('up'));
            return self._sourceController.load(filter, self._options.sorting, direction).addCallback(function(addedItems) {
                //TODO https://online.sbis.ru/news/c467b1aa-21e4-41cc-883b-889ff5c10747
                //до реализации функционала и проблемы из новости делаем решение по месту:
                //посчитаем число отображаемых записей до и после добавления, если не поменялось, значит прилетели элементы, попадающие в невидимую группу,
                //надо инициировать подгрузку порции записей, больше за нас это никто не сделает.
                //Под опцией, потому что в другом месте это приведет к ошибке. Хорошее решение будет в задаче ссылка на которую приведена
                const countCurrentItems = self._listViewModel.getCount();

                if (direction === 'down') {
                    beforeAddItems(addedItems);
                    if (self._options.useNewModel) {
                        self._listViewModel.getCollection().append(addedItems);
                    } else {
                        self._listViewModel.appendItems(addedItems);
                    }
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
    applyVirtualScrollIndexesToListModel(self): boolean {
        const newIndexes = self._virtualScroll.ItemsIndexes;
        const model = self._listViewModel;
        if (model.setViewIndices) {
            return model.setViewIndices(newIndexes.start, newIndexes.stop);
        } else {
            return model.setIndexes(newIndexes.start, newIndexes.stop);
        }
    },

    // Обновляет высоту распорок при виртуальном скроле
    applyPlaceholdersSizes(self): void {
        if (self._virtualScroll) {
            self._notify('updatePlaceholdersSize', [{
                top: self._virtualScroll.PlaceholdersSizes.top,
                bottom: self._virtualScroll.PlaceholdersSizes.bottom
            }], { bubbling: true });
        }
    },

    updateShadowMode(self): void {
        const demandNavigation = self._options.navigation && self._options.navigation.view === 'demand';
        self._notify('updateShadowMode', [{
            top: self._virtualScroll && self._virtualScroll.PlaceholdersSizes.top ||
                !demandNavigation && self._listViewModel && self._listViewModel.getCount() &&
                self._sourceController && self._sourceController.hasMoreData('up') ? 'visible' : 'auto',
            bottom: self._virtualScroll && self._virtualScroll.PlaceholdersSizes.bottom ||
                !demandNavigation && self._listViewModel && self._listViewModel.getCount() &&
                self._sourceController && self._sourceController.hasMoreData('down') ? 'visible' : 'auto'
        }], { bubbling: true });
    },

    checkVirtualScrollCapability: function(self) {
       if (self._virtualScroll && !self._applyScrollTopCallback) {
          if (self._virtualScrollTriggerVisibility.up) {
             _private.updateVirtualWindow(self, 'up');
          } else if (self._virtualScrollTriggerVisibility.down) {
             _private.updateVirtualWindow(self, 'down');
          }
       }
    },

    updateVirtualWindow: function(self, direction) {
        const recalculateIndexes = () => {
            self._virtualScroll.recalcToDirection(direction, self._scrollParams, self._loadOffset.top);
            _private.applyVirtualScrollIndexes(self, direction);
        };

        // Необходимо индексы отображаемых записей пересчитывать одноврменно в виртуальном скроле и модели,
        // раньше они менялись сначала в виртуальном скроле и по таймуту в модели,
        // иначе во время асинхронности, которая есть перед отрисовкаой на IPad'e,
        // могут ещё прилететь записи от подгрузки по скролу,
        // они поменяют индексы в виртуальном скроле, ещё не применнёные к модели,
        // и отрисовка произойдёт некорртекно.
        if (detection.isMobileIOS) {
            _private.getIntertialScrolling(self).callAfterScrollStopped(recalculateIndexes);
        } else {
            recalculateIndexes();
        }
    },

    throttledUpdateIndexesByVirtualScrollMove: throttle((self, params) => {
        self._virtualScroll.recalcToDirectionByScrollTop(params, self._loadOffset.top);
        if (_private.applyVirtualScrollIndexesToListModel(self)) {
            _private.applyPlaceholdersSizes(self);
            _private.updateShadowMode(self);
        } else if (self._applyScrollTopCallback) {
            // если индексы не поменялись, то зовем коллбэк, если поменялись он позовется в beforePaint
            self._applyScrollTopCallback();
            self._applyScrollTopCallback = null;
        }
    }, 150, true),

    virtualScrollMove: function(self, params) {
        if (self._virtualScroll) {
            self._applyScrollTopCallback = params.applyScrollTopCallback;
            self._scrollParams = params;
            _private.throttledUpdateIndexesByVirtualScrollMove(self, params);
        }
    },

    checkLoadToDirectionCapability: function(self, filter) {
        if (self._needScrollCalculation) {
            // TODO Когда список становится пустым (например после поиска или смены фильтра),
            // если он находится вверху страницы, нижний загрузочный триггер может "вылететь"
            // за пределы экрана (потому что у него статически задан отступ от низа списка,
            // и при пустом списке этот отступ может вывести триггер выше верхней границы
            // страницы).
            // Сейчас сделал, что если список пуст, мы пытаемся сделать загрузку данных,
            // даже если триггеры не видны (если что, sourceController.hasMore нас остановит).
            // Но скорее всего это как-то по другому нужно решать, например на уровне стилей
            // (уменьшать отступ триггеров, когда список пуст???). Выписал задачу:
            // https://online.sbis.ru/opendoc.html?guid=fb5a67de-b996-49a9-9312-349a7831f8f1
            const hasNoItems = self.getViewModel() && self.getViewModel().getCount() === 0;
            if (self._loadTriggerVisibility.up || hasNoItems) {
                _private.onScrollLoadEdge(self, 'up', filter);
            }
            if (self._loadTriggerVisibility.down || hasNoItems) {
                _private.onScrollLoadEdge(self, 'down', filter);
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

    // Вызывает обновление индексов виртуального окна при срабатывании триггера вверх|вниз и запоминает, что тригер в настоящий момент видимый
    updateVirtualWindowStart(self, direction: 'up' | 'down', params: object): void {
        if (self._virtualScroll) {
            self._virtualScrollTriggerVisibility[direction] = true;
            if (!self._applyScrollTopCallback) {
                self._scrollParams = {
                    scrollTop: params.scrollTop,
                    scrollHeight: params.scrollHeight,
                    clientHeight: params.clientHeight
                };
                _private.updateVirtualWindow(self, direction);
            }
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
        let savedStart: number;
        let savedStop: number;
        if (self._options.useNewModel) {
            savedStart = self._listViewModel.getStartIndex();
            savedStop = self._listViewModel.getStopIndex();
        }
        if (_private.applyVirtualScrollIndexesToListModel(self)) {
            if (self._options.useNewModel) {
                self._savedStartIndex = savedStart;
                self._savedStopIndex = savedStop;
            }
            self._saveAndRestoreScrollPosition = direction;
            self._shouldRestoreScrollPosition = true;
            _private.applyPlaceholdersSizes(self);
            _private.updateShadowMode(self);
        }
    },

    loadToDirectionIfNeed: function(self, direction, filter) {
        //source controller is not created if "source" option is undefined
        // todo возможно hasEnoughDataToDirection неправильная. Надо проверять startIndex +/- virtualSegmentSize
        if (!self._virtualScroll || !self._virtualScroll.hasEnoughDataToDirection(direction)) {
            if (self._sourceController && self._sourceController.hasMoreData(direction) && !self._sourceController.isLoading() && !self._loadedItems) {
                _private.setHasMoreData(self._listViewModel, self._sourceController.hasMoreData(direction));
                _private.loadToDirection(
                   self, direction,
                   self._options.dataLoadCallback,
                   self._options.dataLoadErrback,
                   filter
                );
            }
        }
    },

    // Метод, вызываемый при прокрутке скролла до триггера
    onScrollLoadEdge: function (self, direction, filter) {
        if (self._options.navigation && self._options.navigation.view === 'infinity') {
            _private.loadToDirectionIfNeed(self, direction, filter);
        }
    },

    scrollToEdge: function(self, direction) {
        _private.setMarkerAfterScroll(self);
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
    scrollPage: function(self, direction) {
        _private.setMarkerAfterScroll(self);
        self._notify('doScroll', ['page' + direction], { bubbling: true });
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
            self._setLoadOffset(self._loadOffsetTop, self._loadOffsetBottom);
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
        if (self._isScrollShown) {
            if (self._needScrollCalculation) {
                self._setLoadOffset(0, 0);
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
            dragItemIndex,
            isSelectAll;
        selected = cClone(selectedKeys) || [];
        isSelectAll = selected.indexOf(null) !== -1;
        dragItemIndex = selected.indexOf(dragKey);
        if (dragItemIndex !== -1) {
            selected.splice(dragItemIndex, 1);
        }
        if (!isSelectAll) {
            selected.unshift(dragKey);
        }

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
        if (!self._isMounted || !!self._loadingState) {
            return
        }

        self._loadingState = direction;
        if (direction === 'all') {
            self._loadingIndicatorState = self._loadingState;
        }
        if (!self._loadingIndicatorTimer) {
            self._loadingIndicatorTimer = setTimeout(function() {
                self._loadingIndicatorTimer = null;
                if (self._loadingState) {
                    self._loadingIndicatorState = self._loadingState;
                    _private.saveScrollOnToggleLoadingIndicator(self);
                    self._showLoadingIndicatorImage = true;
                    self._notify('controlResize');
                }
            }, 2000);
        }
    },

    hideIndicator: function(self) {
        if (!self._isMounted) {
            return
        }
        self._loadingState = null;
        self._showLoadingIndicatorImage = false;
        if (self._loadingIndicatorTimer) {
            clearTimeout(self._loadingIndicatorTimer);
            self._loadingIndicatorTimer = null;
        }
        if (self._loadingIndicatorState !== null) {
            _private.saveScrollOnToggleLoadingIndicator(self);
            self._loadingIndicatorState = self._loadingState;
            self._notify('controlResize');
        }
    },

    saveScrollOnToggleLoadingIndicator(self: BaseControl): void {
        if (self._loadingIndicatorState === 'up') {
            self._shouldRestoreScrollPosition = true;
            self._saveAndRestoreScrollPosition = self._loadingIndicatorState;
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
    },
    unlockItemActions: debounce(function(self) {
        self._lockItemActionsByScroll = false;
        self._canUpdateItemsActions = self._savedCanUpdateItemsActions || self._canUpdateItemsActions;
        self._savedCanUpdateItemsActions = false;
    }, ITEMACTIONS_UNLOCK_DELAY),

    setMarkerAfterScrolling: function(self, scrollTop) {
        let itemsContainer = self._children.listView.getItemsContainer();
        let topOffset = _private.getTopOffsetForItemsContainer(self, itemsContainer);
        _private.setMarkerToFirstVisibleItem(self, itemsContainer, scrollTop - topOffset + (self._options.fixedHeadersHeights || 0));
        self._setMarkerAfterScroll = false;
    },

    // TODO KINGO: Задержка нужна, чтобы расчет видимой записи производился после фиксации заголовка
    delayedSetMarkerAfterScrolling: debounce((self, scrollTop) => {
        _private.setMarkerAfterScrolling(self, self._scrollParams ? self._scrollParams.scrollTop : scrollTop);
    }, SET_MARKER_AFTER_SCROLL_DELAY),

    getTopOffsetForItemsContainer: function(self, itemsContainer) {
        let offsetTop = uDimension(itemsContainer.children[0]).top;
        let container = self._container[0] || self._container;
        offsetTop += container.offsetTop - uDimension(container).top;
        return offsetTop;
    },

    setMarkerToFirstVisibleItem: function(self, itemsContainer, verticalOffset) {
        let firstItemIndex = self._listViewModel.getStartIndex();
        firstItemIndex += _private.getFirstVisibleItemIndex(itemsContainer, verticalOffset);
        self._listViewModel.setMarkerOnValidItem(firstItemIndex);
    },

    getFirstVisibleItemIndex: function(itemsContainer, verticalOffset) {
        let items = itemsContainer.children;
        let itemsCount = items.length;
        let itemsHeight = 0;
        let i = 0;
        if (verticalOffset <= 0) {
            return 0;
        }
        itemsHeight += uDimension(items[0]).height;
        while (itemsHeight <= verticalOffset && i++ < itemsCount) {
            itemsHeight += uDimension(items[i]).height;
        }
        return i + 1;
    },


    handleListScrollSync(self, params) {
        if (self._hasItemActions){
            self._savedCanUpdateItemsActions = self._canUpdateItemsActions || self._savedCanUpdateItemsActions;
        }
        self._lockItemActionsByScroll = true;
        _private.unlockItemActions(self);
        if (detection.isMobileIOS) {
            _private.getIntertialScrolling(self).scrollStarted();
        }
        if (self._virtualScroll) {
            self._scrollParams = {
                scrollTop: params.scrollTop,
                scrollHeight: params.scrollHeight,
                clientHeight: params.clientHeight
            };
        }
        if (self._setMarkerAfterScroll) {
            _private.delayedSetMarkerAfterScrolling(self, params.scrollTop);
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

    onListChange: function(self, event, changesType, action, newItems, newItemsIndex, removedItems, removedItemsIndex) {
        // TODO Понять, какое ускорение мы получим, если будем лучше фильтровать
        // изменения по changesType в новой модели
        const newModelChanged = self._options.useNewModel && action && action !== 'ch';
        if (changesType === 'collectionChanged' || newModelChanged) {
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

                    // Сдвигаем виртуальный скролл только если он уже проинициализирован. Если коллекция
                    // изменилась после создания BaseControl'a, но до инициализации скролла, (или сразу
                    // после уничтожения BaseControl), сдвинуть его мы все равно не можем.
                    if (self._scrollParams) {
                        const direction = newItemsIndex <= self._listViewModel.getStartIndex() ? 'up' : 'down';
                        if (direction === 'down') {
                            // если это не подгрузка с БЛ по скролу и
                            // если мы были в конце списка (отрисована последняя запись и виден нижний триггер)
                            // то нужно сместить виртуальное окно вниз, чтобы отобразились новые добавленные записи
                            if (
                                self._virtualScroll.ItemsIndexes.stop === newCount - newItems.length &&
                                self._virtualScrollTriggerVisibility.down && !self._itemsFromLoadToDirection
                            ) {
                                self._virtualScroll.recalcToDirection(direction, self._scrollParams, self._loadOffset.top);
                            } else {
                                // если данные добавились сверху - просто обновляем индексы видимых записей
                                self._virtualScroll.recalcItemsIndexes(direction, self._scrollParams, self._loadOffset.top);
                            }
                        } else {
                            if (self._itemsFromLoadToDirection) {
                                // если элементы были подгружены с БЛ, то увеличиваем стартовый индекс на кол-во
                                // загруженных элементов. работаем именно через проекцию, т.к. может быть группировка и
                                // кол-во загруженных элементов может отличаться от кол-ва рисуемых элементов
                                self._savedStartIndex += newItems.length;
                                self._savedStopIndex += newItems.length;
                                self._virtualScroll.StartIndex = self._virtualScroll.ItemsIndexes.start + newItems.length;
                            }
                            self._virtualScroll.recalcItemsIndexes(direction, self._scrollParams, self._loadOffset.top);
                        }
                    }
                }
                if (action === collection.IObservable.ACTION_REMOVE || action === collection.IObservable.ACTION_MOVE) {
                    self._virtualScroll.cutItemsHeights(removedItemsIndex - 1, removedItems.length);

                    // Сдвигаем виртуальный скролл только если он уже проинициализирован. Если коллекция
                    // изменилась после создания BaseControl'a, но до инициализации скролла, (или сразу
                    // после уничтожения BaseControl), сдвинуть его мы все равно не можем.
                    if (self._scrollParams) {
                        self._virtualScroll.recalcItemsIndexes(removedItemsIndex < self._listViewModel.getStartIndex() ? 'up' : 'down', self._scrollParams, self._loadOffset.top);
                    }
                }
                _private.applyVirtualScrollIndexesToListModel(self);
            }
        }
        if (changesType === 'collectionChanged' || changesType === 'indexesChanged' || newModelChanged) {
            self._itemsChanged = true;
        }
        self._forceUpdate();
    },

    initListViewModelHandler: function(self, model, useNewModel: boolean) {
        if (useNewModel) {
            model.subscribe('onCollectionChange', (...args: any[]) => {
                _private.onListChange.apply(
                    null,
                    [
                        self,
                        args[0], // event
                        null, // changes type
                        ...args.slice(1) // the rest of the arguments
                    ]
                );
            });
        } else {
            model.subscribe('onListChange', _private.onListChange.bind(null, self));
        }

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
        const context = event.type === 'itemcontextmenu';
        const itemActions = self._options.useNewModel ? itemData.getActions() : itemData.itemActions;
        if ((context && self._isTouch) || !itemActions) {
            return false;
        }
        const showActions = showAll && itemActions.all
            ? itemActions.all
            : itemActions && itemActions.all.filter(
                (action) => action.showType !== showType.TOOLBAR
            );
        /**
         * During an opening of a menu, a row can get wrapped in a HoC and it would cause a full redraw of the row,
         * which would remove the target from the DOM.
         * So, we have to save target's ClientRect here in order to work around it.
         * But popups don't work with ClientRect, so we have to wrap it in an object with getBoundingClientRect method.
         */
        const target = context ? null : _private.mockTarget(childEvent.target);
        if (showActions && showActions.length) {
            const rs = new collection.RecordSet({ rawData: showActions, keyProperty: 'id' });
            childEvent.nativeEvent.preventDefault();
            childEvent.stopImmediatePropagation();
            self._listViewModel.setActiveItem(itemData);
            if (!self._options.useNewModel) {
                // TODO Do we need this in new model?
                self._listViewModel.setMenuState('shown');
            }
            self._itemWithShownMenu = self._options.useNewModel ? itemData.getContents() : itemData.item;
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
                    targetPoint: {vertical: 'top', horizontal: 'right'},
                    direction: {horizontal: context ? 'right' : 'left'},
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
       itemData,
       childEvent: Event,
       action: object
    ): void {
       /**
        * For now, BaseControl opens menu because we can't put opener inside ItemActionsControl, because we'd get 2 root nodes.
        * When we get fragments or something similar, it would be possible to move this code where it really belongs.
        */
       const itemActions = self._options.useNewModel ? itemData.getActions() : itemData.itemActions;
       const children = self._children.itemActions.getChildren(action, itemActions.all);
       if (children.length) {
          self._listViewModel.setActiveItem(itemData);
          if (!self._options.useNewModel) {
             // TODO Do we need this in new model?
             self._listViewModel.setMenuState('shown');
          }
          require(['css!Controls/input'], () => {
             self._children.itemActionsOpener.open({
                opener: self._children.listView,
                target: childEvent.target,
                templateOptions: {
                   items: new collection.RecordSet({ rawData: children, keyProperty: 'id' }),
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
            if (!self._options.useNewModel) {
                // TODO Do we need this in new model?
                self._listViewModel.setMenuState('hidden');
            }
            self._children.swipeControl && self._children.swipeControl.closeSwipe();
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
        _private.prepareFooter(self, self._options.navigation, self._sourceController);
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

    getPagingLabelData: function(totalItemsCount, pageSize, currentPage) {
        let pagingLabelData;
        if (typeof totalItemsCount === 'number') {
            pagingLabelData = {
                totalItemsCount: totalItemsCount,
                pageSize: pageSize,
                firstItemNumber: (currentPage - 1) * pageSize + 1,
                lastItemNumber: Math.min(currentPage * pageSize, totalItemsCount)
            };
        } else {
            pagingLabelData = null;
        }
        return pagingLabelData;
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

    needBottomPadding: function(options, items) {
        return (!!items && !!items.getCount() && options.itemActionsPosition === 'outside' && !options.footerTemplate && options.resultsPosition !== 'bottom');
    },

    isPagingNavigation: function(navigation) {
        return navigation && navigation.view === 'pages';
    },
    resetPagingNavigation: function(self, navigation) {
        self._knownPagesCount = INITIAL_PAGES_COUNT;

        //TODO: KINGO
        // нумерация страниц пейджинга начинается с 1, а не с 0 , поэтому текущая страница пейджига это страница навигации + 1
        self._currentPage = navigation && navigation.sourceConfig && navigation.sourceConfig.page + 1 || INITIAL_PAGES_COUNT;
    },

    initializeNavigation: function(self, cfg) {
        self._needScrollCalculation = _private.needScrollCalculation(cfg.navigation);
        self._pagingNavigation = _private.isPagingNavigation(cfg.navigation);

        if (self._needScrollCalculation) {
            if (cfg.virtualScrolling && !self._virtualScroll) {
                self._virtualScroll = new VirtualScroll({
                    virtualPageSize: cfg.virtualPageSize,
                    virtualSegmentSize: cfg.virtualSegmentSize
                });
            }

            // Не нужно сбрасывать видимость триггеров виртуального скролла и
            // загрузки, если она уже вычислена. Если их видимость изменится,
            // об этом скажет IntersectionObserver.
            if (!self._virtualScrollTriggerVisibility) {
                self._virtualScrollTriggerVisibility = {
                    up: false,
                    down: false
                };
            }
            if (!self._loadTriggerVisibility) {
                self._loadTriggerVisibility = {
                    up: false,
                    down: false
                };
            }
        } else {
            self._loadTriggerVisibility = null;
            self._virtualScrollTriggerVisibility = null;
            self._pagingVisible = false;
        }

        if (!self._pagingNavigation) {
            self._pagingNavigationVisible = false;
            _private.resetPagingNavigation(self, cfg.navigation);
        }
    },
    updateNavigation: function(self) {
        self._pagingNavigationVisible = self._pagingNavigation && self._knownPagesCount > 1;
    },
    isBlockedForLoading(loadingIndicatorState): boolean {
        return loadingIndicatorState === 'all';
    },
    getLoadingIndicatorClasses(hasItems: boolean, loadingIndicatorState: 'all' | 'down' | 'up'): string {
        return CssClassList.add('controls-BaseControl__loadingIndicator')
            .add(`controls-BaseControl__loadingIndicator__state-${loadingIndicatorState}`)
            .add('controls-BaseControl_empty__loadingIndicator__state-down', !hasItems && loadingIndicatorState === 'down')
            .compile();
    },
    hasItemActions: function(itemActions, itemActionsProperty) {
        return !!(itemActions || itemActionsProperty);
    },
    setIndicatorContainerHeight(self, viewPortSize) {
        const listBoundingRect = (self._container[0] || self._container).getBoundingClientRect();

        if (listBoundingRect.bottom < viewPortSize) {
            self._loadingIndicatorContainerHeight = listBoundingRect.height;
        } else {
            self._loadingIndicatorContainerHeight = viewPortSize - listBoundingRect.top;
        }
    },

    setHasMoreData(model, hasMoreData: boolean) {
        if (model) {
            model.setHasMoreData(hasMoreData);
        }
    }

};

/**
 * Компонент плоского списка, с произвольным шаблоном отображения каждого элемента. Обладает возможностью загрузки/подгрузки данных из источника.
 * @class Controls/_list/BaseControl
 * @extends Core/Control
 * @mixes Controls/_interface/ISource
 * @implements Controls/_interface/IErrorController
 * @mixes Controls/interface/IItemTemplate
 * @mixes Controls/interface/IPromisedSelectable
 * @mixes Controls/interface/IGroupedList
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
    _isMounted: false,

    _savedStartIndex: 0,
    _savedStopIndex: 0,

    _template: BaseControlTpl,
    iWantVDOM: true,
    _isActiveByClick: false,
    _markedKeyForRestoredScroll: null,
    _restoredScroll: null,

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
    _loadOffset: null,
    _loadOffsetTop: LOAD_TRIGGER_OFFSET,
    _loadOffsetBottom: LOAD_TRIGGER_OFFSET,
    _menuIsShown: null,
    _viewSize: null,
    _viewPortSize: null,
    _popupOptions: null,

    //Variables for paging navigation
    _knownPagesCount: INITIAL_PAGES_COUNT,
    _currentPage: INITIAL_PAGES_COUNT,
    _pagingNavigation: false,
    _pagingNavigationVisible: false,
    _pagingLabelData: null,

    _canUpdateItemsActions: false,
    _blockItemActionsByScroll: false,

    _needBottomPadding: false,
    _noDataBeforeReload: null,
    _intertialScrolling: null,
    _checkLoadToDirectionTimeout: null,

    _resetScrollAfterReload: false,

    _itemReloaded: false,

    constructor(options) {
        BaseControl.superclass.constructor.apply(this, arguments);
        options = options || {};
        this.__errorController = options.errorController || new dataSourceError.Controller({});
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

        // todo Костыль, т.к. построение ListView зависит от SelectionController.
        // Будет удалено при выполнении одного из пунктов:
        // 1. Все перешли на платформенный хелпер при формировании рекордсета на этапе первой загрузки и удален асинхронный код из SelectionController.beforeMount.
        // 2. Полностью переведен BaseControl на новую модель и SelectionController превращен в умный, упорядоченный менеджер, умеющий работать асинхронно.
        this._multiSelectReadyCallback = this._multiSelectReadyCallbackFn.bind(this);

        let receivedError = receivedState.errorConfig;
        let receivedData = receivedState.data;

        _private.checkDeprecated(newOptions);
        _private.checkRequiredOptions(newOptions);

        _private.bindHandlers(this);

        _private.initializeNavigation(this, newOptions);
        _private.updateNavigation(this);

        this._needSelectionController = newOptions.multiSelectVisibility !== 'hidden';

        this._hasItemActions = _private.hasItemActions(newOptions.itemActions, newOptions.itemActionsProperty);

        return _private.prepareCollapsedGroups(newOptions).addCallback(function(collapsedGroups) {
            let viewModelConfig = cClone(newOptions);
            if (collapsedGroups) {
                viewModelConfig = cMerge(viewModelConfig, { collapsedGroups });
            }

            if (!newOptions.useNewModel && newOptions.viewModelConstructor) {
                self._viewModelConstructor = newOptions.viewModelConstructor;
                if (receivedData) {
                    viewModelConfig.items = receivedData;
                }
                self._listViewModel = new newOptions.viewModelConstructor(viewModelConfig);
            } else if (newOptions.useNewModel && receivedData) {
                self._listViewModel = self._createNewModel(
                    receivedData,
                    viewModelConfig,
                    newOptions.viewModelConstructor
                );
                if (newOptions.itemsReadyCallback) {
                    newOptions.itemsReadyCallback(self._listViewModel.getCollection());
                }
            }
            if (self._listViewModel) {
                _private.initListViewModelHandler(self, self._listViewModel, newOptions.useNewModel);
            }

            if (newOptions.source) {
                self._sourceController = _private.getSourceController(newOptions);


                if (receivedData) {
                    self._sourceController.calculateState(receivedData);
                    if (newOptions.useNewModel) {
                        self._items = self._listViewModel.getCollection();
                    } else {
                        self._items = self._listViewModel.getItems();
                    }
                    self._needBottomPadding = _private.needBottomPadding(newOptions, self._items);
                    if (self._pagingNavigation) {
                        var hasMoreData = self._items.getMetaData().more;
                        self._knownPagesCount = _private.calcPaging(self, hasMoreData, newOptions.navigation.sourceConfig.pageSize);
                        self._pagingLabelData = _private.getPagingLabelData(hasMoreData, newOptions.navigation.sourceConfig.pageSize, self._currentPage);
                    }

                    if (newOptions.serviceDataLoadCallback instanceof Function) {
                        newOptions.serviceDataLoadCallback(self._items);
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
                return _private.reload(self, newOptions).addCallback((result) => {
                    if (newOptions.useNewModel && !self._listViewModel && result.data) {
                        self._listViewModel = self._createNewModel(
                            result.data,
                            viewModelConfig,
                            newOptions.viewModelConstructor
                        );
                        if (newOptions.itemsReadyCallback) {
                            newOptions.itemsReadyCallback(self._listViewModel.getCollection());
                        }
                        if (self._listViewModel) {
                            _private.initListViewModelHandler(self, self._listViewModel, newOptions.useNewModel);
                            if (self._virtualScroll) {
                                // При серверной верстке применяем начальные значения
                                self._virtualScroll.ItemsCount = self._listViewModel.getCount();
                                self._virtualScroll.resetItemsIndexes();
                                _private.applyVirtualScrollIndexesToListModel(self);
                            }
                        }
                    }
                    // TODO Kingo.
                    // В случае, когда в опцию источника передают PrefetchProxy
                    // не надо возвращать из _beforeMount загруженный рекордсет, это вызывает проблему,
                    // когда список обёрнут в DataContainer.
                    // Т.к. и список и DataContainer из _beforeMount возвращают рекордсет
                    // то при построении на сервере и последующем оживлении на клиенте
                    // при сериализации это будет два разных рекордсета.
                    // Если при загрузке данных возникла ошибка, то ошибку надо вернуть, чтобы при оживлении на клиенте
                    // не было перезапроса за данными.
                    if (result.errorConfig || !cInstance.instanceOfModule(newOptions.source, 'Types/source:PrefetchProxy')) {
                        return getState(result);
                    }
                });
            }
        });

    },

    // todo Костыль, т.к. построение ListView зависит от SelectionController.
    // Будет удалено при выполнении одного из пунктов:
    // 1. Все перешли на платформенный хелпер при формировании рекордсета на этапе первой загрузки и удален асинхронный код из SelectionController.beforeMount.
    // 2. Полностью переведен BaseControl на новую модель и SelectionController превращен в умный, упорядоченный менеджер, умеющий работать асинхронно.
    _multiSelectReadyCallbackFn: function(multiSelectReady) {
        this._multiSelectReady = multiSelectReady;
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
        this._isMounted = true;
        if (this._needScrollCalculation) {
            this._setLoadOffset(this._loadOffsetTop, this._loadOffsetBottom);
            _private.startScrollEmitter(this);
        }
        if (this._hasItemActions) {
            this._canUpdateItemsActions = true;
        }
        if (this._options.itemsDragNDrop) {
            let container = this._container[0] || this._container;
            container.addEventListener('dragstart', this._nativeDragStart);
        }
        if (this._virtualScroll) {
            this._setScrollItemContainer();
        }
        _private.updateShadowMode(this);
    },

    _beforeUpdate: function(newOptions) {
        var filterChanged = !isEqual(newOptions.filter, this._options.filter);
        var navigationChanged = !isEqual(newOptions.navigation, this._options.navigation);
        var resetPaging = this._pagingNavigation && filterChanged;
        var recreateSource = newOptions.source !== this._options.source || navigationChanged || resetPaging;
        var sortingChanged = !isEqual(newOptions.sorting, this._options.sorting);
        var self = this;
        this._needBottomPadding = _private.needBottomPadding(newOptions, this._items);
        if (!isEqual(newOptions.navigation, this._options.navigation)) {
            _private.initializeNavigation(this, newOptions);
        }
        _private.updateNavigation(this);

        if (
            !newOptions.useNewModel &&
            (
                newOptions.groupMethod !== this._options.groupMethod ||
                newOptions.viewModelConstructor !== this._viewModelConstructor
            )
        ) {
            this._viewModelConstructor = newOptions.viewModelConstructor;
            this._listViewModel = new newOptions.viewModelConstructor(cMerge(cClone(newOptions), {
                items: this._listViewModel.getItems()
            }));
            _private.initListViewModelHandler(this, this._listViewModel, newOptions.useNewModel);
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
        if (newOptions.editingConfig !== this._options.editingConfig) {
            this._listViewModel.setEditingConfig(newOptions.editingConfig);
        }
        if (recreateSource) {
            this._recreateSourceController(newOptions.source, newOptions.navigation, newOptions.keyProperty);

            //Нужно обновлять опции записи не только при наведении мыши,
            //так как запись может поменяться в то время, как курсор находится на ней
            self._canUpdateItemsActions = true;
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
            _private.resetPagingNavigation(this, newOptions.navigation);

            //return result here is for unit tests
            return _private.reload(self, newOptions);
        }

        if (this._itemsChanged) {
            this._shouldNotifyOnDrawItems = true;
            if (this._hasItemActions){
                if(!this._lockItemActionsByScroll) {
                    this._canUpdateItemsActions = true;
                    this._savedCanUpdateItemsActions = false;
                } else {
                    this._savedCanUpdateItemsActions = true;
                }
            }
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

        const loadCallback = (item): void => {
            if (replaceItem) {
                items.replace(item, currentItemIndex);
            } else {
                items.at(currentItemIndex).merge(item);
            }

            // New item has a version of 0. If the replaced item has the same
            // version, it will not be redrawn. Notify the model that the
            // item was reloaded to force its redraw.
            if (item && item.getId) {
                this._listViewModel.markItemReloaded(item.getId());
                this._itemReloaded = true;
            }
        };

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

    scrollToItem(key: string|number, toBottom: boolean): void {
        const idx = this._listViewModel.getIndexByKey(key);
        if (idx === -1) {
            return;
        }
        if (this._virtualScroll) {
            this._virtualScroll.recalcByIndex(idx);
            if (_private.applyVirtualScrollIndexesToListModel(this)) {
                this._restoredScroll = {
                    key: key,
                    toBottom: toBottom
                };
                _private.applyPlaceholdersSizes(this);
                _private.updateShadowMode(this);
            } else {
                _private.scrollToItem(this, key, toBottom);
            }
        } else {
            _private.scrollToItem(this, key, toBottom);
        }
    },

    _beforeUnmount: function() {
        if (this._checkLoadToDirectionTimeout) {
            clearTimeout(this._checkLoadToDirectionTimeout);
        }
        if (this._options.itemsDragNDrop) {
            let container = this._container[0] || this._container;
            container.removeEventListener('dragstart', this._nativeDragStart);
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

    _beforePaint(): void {
        if (this._virtualScroll && this._itemsChanged) {
            this._virtualScroll.updateItemsSizes();
            _private.applyPlaceholdersSizes(this);
        }

        _private.updateShadowMode(this);

        if (this._virtualScroll && this._applyScrollTopCallback) {
            this._applyScrollTopCallback();
            this._applyScrollTopCallback = null;
            // Видимость триггеров меняется сразу после отрисовки и если звать checkLoadToDirectionCapability синхронно,
            // то метод отработает по старому состоянию триггеров. Поэтому добавляем таймаут.
            this._checkLoadToDirectionTimeout = setTimeout(() => {
                _private.checkLoadToDirectionCapability(this);
                this._checkLoadToDirectionTimeout = null;
            });
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
            this._savedStartIndex = this._listViewModel.getStartIndex();
            this._savedStopIndex = this._listViewModel.getStopIndex();
            this._loadedItems = null;
            this._shouldRestoreScrollPosition = false;
            this._checkShouldLoadToDirection = true;
            this._forceUpdate();
        } else if (this._checkShouldLoadToDirection) {
            // Видимость триггеров меняется сразу после отрисовки и если звать checkLoadToDirectionCapability синхронно,
            // то метод отработает по старому состоянию триггеров. Поэтому добавляем таймаут.
            this._checkLoadToDirectionTimeout = setTimeout(() => {
                _private.checkLoadToDirectionCapability(this);
                this._checkLoadToDirectionTimeout = null;
            });
            this._checkShouldLoadToDirection = false;
        }

        if (this._restoredScroll !== null) {
            _private.scrollToItem(this, this._restoredScroll.key, this._restoredScroll.toBottom);
            this._restoredScroll = null;
        }
    },

    _afterUpdate: function(oldOptions) {
        if (this._needScrollCalculation) {
            _private.startScrollEmitter(this);
        }
        if (this._hasItemActions) {
            this._canUpdateItemsActions = false;
        }
        if (this._resetScrollAfterReload) {
            this._notify('doScroll', ['top'], { bubbling: true });
            this._resetScrollAfterReload = false;
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

        // After update the reloaded items have been redrawn, clear
        // the marks in the model
        if (this._itemReloaded) {
            this._listViewModel.clearReloadedMarks();
            this._itemReloaded = false;
        }
    },

    __onPagingArrowClick: function(e, arrow) {
        switch (arrow) {
            case 'Next': _private.scrollPage(this, 'Down'); break;
            case 'Prev': _private.scrollPage(this, 'Up'); break;
            case 'Begin': _private.scrollToEdge(this, 'up'); break;
            case 'End': _private.scrollToEdge(this, 'down'); break;
        }
    },
    _updateLoadOffset: function(viewSize, viewPortSize) {
        let minSize = viewSize !== null && viewPortSize !== null ? Math.min(viewSize, viewPortSize) : 0;
        let offset = Math.floor(minSize / 3);
        this._setLoadOffset(offset, offset);
    },

    _setLoadOffset: function(top, bottom) {
        if (this.__error) {
            return;
        }
        if (!this._loadOffset) {
            this._loadOffset = {};
        }
        this._loadOffset.top = top;
        this._loadOffset.bottom = bottom;

        this._loadOffsetTop = top || this._loadOffsetTop;
        this._loadOffsetBottom = bottom || this._loadOffsetBottom;

        this._children.topVirtualScrollTrigger.style.top = Math.floor(this._loadOffset.top) + 'px';
        this._children.topLoadTrigger.style.top = Math.floor(this._loadOffset.top * 1.3) + 'px';
        this._children.bottomVirtualScrollTrigger.style.bottom = Math.floor(this._loadOffset.bottom) + 'px';
        this._children.bottomLoadTrigger.style.bottom = Math.floor(this._loadOffset.bottom * 1.3) + 'px';
    },
    _onViewPortResize: function(self, viewPortSize) {
        _private.setIndicatorContainerHeight(self, viewPortSize);

        self._viewPortSize = viewPortSize;
        if (self._needScrollCalculation) {
            self._updateLoadOffset(self._viewSize, self._viewPortSize);
        }
        if (!self._isScrollShown) {
            self._setLoadOffset(0, 0);
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

            // TODO KINGO. Проверяем именно синхронный скролл, т.к. стандартный scrollMove стреляет с debounce 100 мс.
            case 'scrollMoveSync': _private.handleListScrollSync(self, params); break;
            case 'scrollMove': _private.handleListScroll(self, params); break;
            case 'virtualScrollMove': _private.virtualScrollMove(self, params); break;
            case 'canScroll': _private.onScrollShow(self); break;
            case 'cantScroll': _private.onScrollHide(self); break;

            case 'viewPortResize': self._onViewPortResize(self, params[0]); break;
        }
    },

    __needShowEmptyTemplate: function(emptyTemplate: Function | null, listViewModel: ListViewModel): boolean {
        // Described in this document: https://docs.google.com/spreadsheets/d/1fuX3e__eRHulaUxU-9bXHcmY9zgBWQiXTmwsY32UcsE
        const noData = !listViewModel.getCount();
        const noEdit = this._options.useNewModel ? !listViewModel.isEditing() : !listViewModel.getEditingItemData();
        const isLoading = this._sourceController && this._sourceController.isLoading();
        const notHasMore = !(this._sourceController && (this._sourceController.hasMoreData('down') || this._sourceController.hasMoreData('up')));
        const noDataBeforeReload = this._noDataBeforeReload;
        return emptyTemplate && noEdit && notHasMore && (isLoading ? noData && noDataBeforeReload : noData);
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
        let actionsItem = itemData.actionsItem;
        if (direction === 'left' && this._hasItemActions) {
            this._children.itemActions.updateItemActions(actionsItem);

            // FIXME: https://online.sbis.ru/opendoc.html?guid=7a0a273b-420a-487d-bb1b-efb955c0acb8
            itemData.itemActions = this.getViewModel().getItemActions(actionsItem);
        }
        if (!this._options.itemActions && typeof this._options.selectedKeysCount === 'undefined') {
            this._notify('itemSwipe', [actionsItem, childEvent]);
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
        if (this._options.useNewModel) {
            this._listViewModel.setMarkedItem(this._listViewModel.getItemBySourceItem(item));
        } else {
            var newKey = ItemsUtil.getPropertyValue(item, this._options.keyProperty);
            this._listViewModel.setMarkedKey(newKey);
        }
    },

    _viewResize: function() {
        // todo Check, maybe remove "this._virtualScroll.ItemsContainer"?
        if (this._virtualScroll && this._virtualScroll.ItemsContainer) {
            this._virtualScroll.updateItemsSizes();
            _private.applyPlaceholdersSizes(this);
            _private.updateShadowMode(this);
        }
        let viewSize = (this._container[0] || this._container).clientHeight;
        this._viewSize = viewSize;
        if (this._needScrollCalculation) {
            this._updateLoadOffset(this._viewSize, this._viewPortSize);
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
    _onAfterEndEdit: function(event, item, isAdd) {
        this._canUpdateItemsActions = true;
        return this._notify('afterEndEdit', [item, isAdd]);
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
        if (this._options.useNewModel) {
            this._listViewModel.setMarkedItem(itemData);
        } else {
            this._listViewModel.setMarkedKey(itemData.key);
        }
    },

    _closeActionsMenu: function(args) {
        _private.closeActionsMenu(this, args);
    },

    _itemMouseDown: function(event, itemData, domEvent) {
        var
            selection,
            self = this,
            dragStartResult;

        if (!(domEvent.nativeEvent.button) && !this._options.readOnly && this._options.itemsDragNDrop && !domEvent.target.closest('.controls-DragNDrop__notDraggable')) {
            //Support moving with mass selection.
            //Full transition to selection will be made by: https://online.sbis.ru/opendoc.html?guid=080d3dd9-36ac-4210-8dfa-3f1ef33439aa
            selection = _private.getSelectionForDragNDrop(this._options.selectedKeys, this._options.excludedKeys, itemData.key);
            selection.recursive = false;
            getItemsBySelection(selection, this._options.source, this._listViewModel.getItems(), this._options.filter).addCallback(function(items) {
                const dragKeyPosition = items.indexOf(itemData.key);
                // If dragged item is in the list, but it's not the first one, move
                // it to the front of the array
                if (dragKeyPosition > 0) {
                    items.splice(dragKeyPosition, 1);
                    items.unshift(itemData.key);
                }
                dragStartResult = self._notify('dragStart', [items]);
                if (dragStartResult) {
                    if (self._options.dragControlId) {
                        dragStartResult.dragControlId = self._options.dragControlId;
                    }
                    self._children.dragNDropController.startDragNDrop(dragStartResult, domEvent);
                    self._itemDragData = itemData;
                }
            });
        }
    },

    _onLoadMoreClick: function() {
        _private.loadToDirectionIfNeed(this, 'down');
    },

    _nativeDragStart: function(event) {
        // preventDefault нужно делать именно на нативный dragStart:
        // 1. getItemsBySelection может отрабатывать асинхронно (например при массовом выборе всех записей), тогда
        //    preventDefault в startDragNDrop сработает слишком поздно, браузер уже включит нативное перетаскивание
        // 2. На mouseDown ставится фокус, если на нём сделать preventDefault - фокус не будет устанавливаться
        event.preventDefault();
    },

    _dragStart: function(event, dragObject, domEvent) {
        this._savedCanUpdateItemsActions = this._canUpdateItemsActions || this._savedCanUpdateItemsActions;
        this._listViewModel.setDragEntity(dragObject.entity);
        this._listViewModel.setDragItemData(this._listViewModel.getItemDataByItem(this._itemDragData.dispItem));
    },

    _dragEnd: function(event, dragObject) {
        this._canUpdateItemsActions = this._savedCanUpdateItemsActions || this._canUpdateItemsActions;
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
        let key = event.nativeEvent.keyCode;
        let dontStop = key === 33
                    || key === 34
                    || key === 35
                    || key === 36;
        keysHandler(event, HOT_KEYS, _private, this, dontStop);
    },
    _dragEnter: function(event, dragObject) {
        var
            dragEnterResult,
            draggingItemProjection;

        if (
            !this._listViewModel.getDragEntity() &&
            cInstance.instanceOfModule(dragObject.entity, 'Controls/dragnDrop:ItemsEntity')
        ) {
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
        if (this._dragEndResult instanceof Promise) {
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

    _itemMouseMove(event, itemData, nativeEvent) {
        this._notify('itemMouseMove', [itemData, nativeEvent]);
    },
    _itemMouseLeave(event, itemData, nativeEvent) {
        this._notify('itemMouseLeave', [itemData, nativeEvent]);
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

    },

    _getLoadingIndicatorClasses(): string {
        const hasItems = !!this._items && !!this._items.getCount();
        return _private.getLoadingIndicatorClasses(hasItems, this._loadingIndicatorState);
    },
    _onHoveredItemChanged: function(e, item, container) {
        if (this._hasItemActions){
            let isDragging = !!this._listViewModel.getDragEntity();

            // itemMouseEnter иногда срабатывает между _beforeUpdate и _afterUpdate.
            // при этом, в _afterUpdate затирается _canUpdateItemsActions, и обновления опций не происходит
            // hoveredItemChanged происходит вне цикла обновления списка, поэтому, когда требуется, опции обновятся

            // do not need to update itemAction on touch devices, if mouseenter event was fired,
            // otherwise actions will updated and redraw, because of this click on action will not work.
            // actions on touch devices drawing on swipe.
            if (!this._context.isTouch.isTouch){
                if(!this._lockItemActionsByScroll && !isDragging && item) {
                    this._canUpdateItemsActions = true;
                    this._savedCanUpdateItemsActions = false;
                } else {
                    this._savedCanUpdateItemsActions = true;
                }
            }
        }
        this._notify('hoveredItemChanged', [item, container]);
    },

    _createNewModel(items, modelConfig, modelName) {
        // Подразумеваем, что Controls/display уже загружен. Он загружается при подключении
        // библиотеки Controls/listRender
        if (typeof modelName !== 'string') {
            throw new TypeError('BaseControl: model name has to be a string when useNewModel is enabled');
        }
        return diCreate(modelName, { ...modelConfig, collection: items });
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
