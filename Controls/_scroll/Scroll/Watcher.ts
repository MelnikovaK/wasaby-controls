/**
 * Created by dv.zuev on 17.01.2018.
 * Компонент слушает события "снизу". События register и сохраняет Emmitterы в списке
 * то есть, кто-то снизу сможет услышать события верхних компонентов через это отношение
 */
import Control = require('Core/Control');
import template = require('wml!Controls/_scroll/Scroll/Watcher/Watcher');
import {Registrar}  from 'Controls/event';
import Env = require('Env/Env');
import isEmpty = require('Core/helpers/Object/isEmpty');



      var SCROLL_LOAD_OFFSET = 100;
      var global = (function() {
         return this || (0, eval)('this');
      })();

      var _private = {

         getDOMContainer: function(element) {
            //TODO https://online.sbis.ru/opendoc.html?guid=d7b89438-00b0-404f-b3d9-cc7e02e61bb3
            if (element.get) {
               return element.get(0);
            }
            return element;
         },

         sendCanScroll: function(self, clientHeight, scrollHeight) {
            var eventName;
            if (clientHeight < scrollHeight) {
               if (self._canScrollCache !== true) {
                  self._canScrollCache = true;
                  eventName = 'canScroll';
               }
            } else {
               if (self._canScrollCache !== false) {
                  self._canScrollCache = false;
                  eventName = 'cantScroll';
               }
            }
            if (eventName) {
               _private.sendByRegistrar(self, eventName);
            }
         },

         sendEdgePositions: function(self, clientHeight, scrollHeight, scrollTop) {
            var eventNames = [], i;

            //Проверка на триггеры начала/конца блока
            if (scrollTop <= 0) {
               eventNames.push('listTop');
            }
            if (scrollTop + clientHeight >= scrollHeight) {
               eventNames.push('listBottom');
            }

            //Проверка на триггеры загрузки
            if (scrollTop <= SCROLL_LOAD_OFFSET) {
               eventNames.push('loadTopStart');
            } else {
               eventNames.push('loadTopStop');
            }
            if (scrollTop + clientHeight >= scrollHeight - SCROLL_LOAD_OFFSET) {
               eventNames.push('loadBottomStart');
            } else {
               eventNames.push('loadBottomStop');
            }

            for (i = 0; i < eventNames.length; i++) {
               _private.sendByRegistrar(self, eventNames[i], scrollTop);
            }
         },

         calcSizeCache: function(self, container) {
            var clientHeight, scrollHeight;

            clientHeight = container.clientHeight;
            scrollHeight = container.scrollHeight;
            self._sizeCache = {
               scrollHeight: scrollHeight,
               clientHeight: clientHeight
            };
         },

         getSizeCache: function(self, container) {
            if (isEmpty(self._sizeCache)) {
               _private.calcSizeCache(self, container);
            }
            return self._sizeCache;
         },

         onResizeContainer: function(self, container, withObserver) {
            var sizeCache = _private.getSizeCache(self, container);

            _private.calcSizeCache(self, container);
            sizeCache = _private.getSizeCache(self, container);
            _private.sendCanScroll(self, sizeCache.clientHeight, sizeCache.scrollHeight);
            if (!withObserver) {
               _private.sendEdgePositions(self, sizeCache.clientHeight, sizeCache.scrollHeight, self._scrollTopCache);
            }

         },

         onScrollContainer: function(self, container, withObserver) {
            var curPosition;
            var sizeCache = _private.getSizeCache(self, container);
            self._scrollTopCache = container.scrollTop;
            if (!sizeCache.clientHeight) {
               _private.calcSizeCache(self, container);
               sizeCache = _private.getSizeCache(self, container);
            }

            if (self._scrollTopCache <= 0) {
               curPosition = 'up';
            } else if (self._scrollTopCache + sizeCache.clientHeight >= sizeCache.scrollHeight) {
               curPosition = 'down';
            } else {
               curPosition = 'middle';
            }

            _private.sendByRegistrar(self, 'scrollMoveSync', {
               scrollTop: self._scrollTopCache,
               clientHeight: sizeCache.clientHeight,
               scrollHeight: sizeCache.scrollHeight
            });

            if (self._scrollPositionCache !== curPosition) {
               setTimeout(() => {
                  _private.sendByRegistrar(self, 'scrollMove', {
                     scrollTop: self._scrollTopCache,
                     position: curPosition,
                     clientHeight: sizeCache.clientHeight,
                     scrollHeight: sizeCache.scrollHeight
                  });
                  if (!withObserver) {
                     _private.sendEdgePositions(self, sizeCache.clientHeight, sizeCache.scrollHeight, self._scrollTopCache);
                  }
               }, 0);
               self._scrollPositionCache = curPosition;
               self._scrollTopTimer = null;
            } else {
               if (!self._scrollTopTimer) {
                  self._scrollTopTimer = setTimeout(function() {
                     if (self._scrollTopTimer) {
                        _private.sendByRegistrar(self, 'scrollMove', {
                           scrollTop: self._scrollTopCache,
                           position: curPosition,
                           clientHeight: sizeCache.clientHeight,
                           scrollHeight: sizeCache.scrollHeight
                        });
                        if (!withObserver) {
                           _private.sendEdgePositions(self, sizeCache.clientHeight, sizeCache.scrollHeight, self._scrollTopCache);
                        }
                        self._scrollTopTimer = null;
                     }
                  }, 100);
               }
            }

         },

         initIntersectionObserver: function(self, elements, component) {
            if (!self._observers[component.getInstanceId()]) {
               let eventName;
               let curObserver: IntersectionObserver;


               curObserver = new IntersectionObserver(function (changes) {
                  /**
                   * Баг IntersectionObserver на Mac OS: сallback может вызываться после описки от слежения. Отписка происходит в
                   * _beforeUnmount. Устанавливаем защиту.
                   */
                  if (self._observers === null) {
                     return;
                  }
                  for (var i = 0; i < changes.length; i++) {
                     switch (changes[i].target) {
                        case elements.topLoadTrigger:
                           if (changes[i].isIntersecting) {
                              eventName = 'loadTopStart';
                           } else {
                              eventName = 'loadTopStop';
                           }
                           break;
                        case elements.bottomLoadTrigger:
                           if (changes[i].isIntersecting) {
                              eventName = 'loadBottomStart';
                           } else {
                              eventName = 'loadBottomStop';
                           }
                           break;
                        case elements.topVirtualScrollTrigger:
                           if (changes[i].isIntersecting) {
                              eventName = 'virtualPageTopStart';
                           } else {
                               eventName = 'virtualPageTopStop';
                           }
                           break;
                        case elements.bottomVirtualScrollTrigger:
                           if (changes[i].isIntersecting) {
                              eventName = 'virtualPageBottomStart';
                           } else {
                               eventName = 'virtualPageBottomStop';
                           }
                           break;
                     }
                     if (eventName) {
                        const sizes = _private.getSizeCache(self, _private.getDOMContainer(self._container));
                        self._registrar.startOnceTarget(component, eventName, {
                           scrollTop: _private.getDOMContainer(self._container).scrollTop,
                           clientHeight: sizes.clientHeight,
                           scrollHeight: sizes.scrollHeight
                        });
                        self._notify(eventName);
                        eventName = null;
                     }
                  }
               }, {root: self._container[0] || self._container});//FIXME self._container[0] remove after https://online.sbis.ru/opendoc.html?guid=d7b89438-00b0-404f-b3d9-cc7e02e61bb3
               curObserver.observe(elements.topLoadTrigger);
               curObserver.observe(elements.bottomLoadTrigger);

               curObserver.observe(elements.topVirtualScrollTrigger);
               curObserver.observe(elements.bottomVirtualScrollTrigger);

               self._observers[component.getInstanceId()] = curObserver;
            }
         },

         onRegisterNewComponent: function(self, container, component, withObserver) {
            var sizeCache = _private.getSizeCache(self, container);
            if (!sizeCache.clientHeight) {
               _private.calcSizeCache(self, container);
               sizeCache = _private.getSizeCache(self, container);
            }
            if (sizeCache.clientHeight < sizeCache.scrollHeight) {
               self._registrar.startOnceTarget(component, 'canScroll');
            } else {
               self._registrar.startOnceTarget(component, 'cantScroll');
            }

            self._registrar.startOnceTarget(component, 'viewPortResize', [sizeCache.clientHeight]);

            if (!withObserver) {
               //TODO надо кидать не всем компонентам, а адресно одному
               _private.sendEdgePositions(self, sizeCache.clientHeight, sizeCache.scrollHeight, self._scrollTopCache);
            }
         },

         doScroll: function(self, scrollParam, container) {
            if (scrollParam === 'top') {
               self.setScrollTop(0);
            } else {
               const
                  sizeCache = _private.getSizeCache(self, container),
                  clientHeight = sizeCache.clientHeight,
                  scrollHeight = sizeCache.scrollHeight;
               if (scrollParam === 'bottom') {
                  self.setScrollTop(scrollHeight - clientHeight);
               } else if (scrollParam === 'pageUp') {
                  self.setScrollTop(container.scrollTop - clientHeight);
               } else if (scrollParam === 'pageDown') {
                  self.setScrollTop(container.scrollTop + clientHeight);
               }
            }
         },


         sendByRegistrar: function(self, eventType, params) {
            self._registrar.start(eventType, params);
            self._notify(eventType, [params]);
         }
      };

      var Scroll = Control.extend({
         _template: template,
         _canObserver: false,
         _observers: null,
         _registrar: null,
         _sizeCache: null,
         _scrollTopCache: 0,
         _scrollTopTimer: null,
         _scrollPositionCache: null,
         _canScrollCache: null,

         constructor: function() {
            Scroll.superclass.constructor.apply(this, arguments);
            this._sizeCache = {};
            this._observers = {};

            // говорим браузеру не восстанавливать скролл на то место, на котором он был перед релоадом страницы
            // TODO Kingo
            if (window && window.history && 'scrollRestoration' in window.history) {
               window.history.scrollRestoration = 'manual';
            }
         },

         _beforeMount: function() {

            //чтобы не было лишних синхронизаций при обработке событий
            //удалим по проекту
            //https://online.sbis.ru/opendoc.html?guid=11776bc8-39b7-4c55-b5b5-5cc2ea8d9fbe

            this._forceUpdate = function() {};
            this._registrar = new Registrar({register: 'listScroll'});
         },

         _afterMount: function() {
            if (!isEmpty(this._registrar._registry)) {
               _private.calcSizeCache(this, _private.getDOMContainer(this._container));
               _private.sendCanScroll(this, this._sizeCache.clientHeight, this._sizeCache.scrollHeight);
            }
            this._notify('register', ['controlResize', this, this._resizeHandlerOuter], {bubbling: true});
         },

         _scrollHandler: function(e) {
            _private.onScrollContainer(this, _private.getDOMContainer(this._container), this._canObserver);
         },

         _resizeHandler: function(e) {
            var withObserver = this._canObserver;
            _private.onResizeContainer(this, _private.getDOMContainer(this._container), withObserver);

         },
         _resizeHandlerOuter: function(e) {
            this._resizeHandler(e);
            _private.sendByRegistrar(this, 'viewPortResize', [this._sizeCache.clientHeight]);
         },

         _registerIt: function(event, registerType, component, callback, triggers) {
            if (registerType === 'listScroll') {
               this._registrar.register(event, component, callback);

               if (global && global.IntersectionObserver && triggers) {
                  this._canObserver = true;
                  _private.initIntersectionObserver(this, triggers, component);
               }

               _private.onRegisterNewComponent(this, _private.getDOMContainer(this._container), component, this._canObserver);
            }
         },

         _doScrollHandler: function(e, scrollParam) {
            _private.doScroll(this, scrollParam, _private.getDOMContainer(this._container));
         },

         doScroll: function(scrollParam) {
            _private.doScroll(this, scrollParam, _private.getDOMContainer(this._container));
         },

         _isVirtualPlaceholderMode(): boolean {
            return this._topPlaceholderSize || this._bottomPlaceholderSize;
         },

         updatePlaceholdersSize(placeholdersSizes: object): void {
            this._topPlaceholderSize = placeholdersSizes.top;
            this._bottomPlaceholderSize = placeholdersSizes.bottom;
         },

         setScrollTop(scrollTop: number): void {
            var self = this;
            const container = _private.getDOMContainer(self._container);
            if (self._isVirtualPlaceholderMode()) {
               const cachedScrollTop = scrollTop;
               const sizeCache = _private.getSizeCache(self, container);
               const realScrollTop = scrollTop - this._topPlaceholderSize;
               const triggerOffset = sizeCache.clientHeight / 3;
               if (realScrollTop >= triggerOffset &&
                  (sizeCache.scrollHeight === realScrollTop ||
                  sizeCache.scrollHeight - realScrollTop - sizeCache.clientHeight > triggerOffset)) {
                  container.scrollTop = scrollTop - self._topPlaceholderSize;
               } else {
                  _private.sendByRegistrar(self, 'virtualScrollMove', {
                     scrollTop,
                     scrollHeight: sizeCache.scrollHeight,
                     clientHeight: sizeCache.clientHeight,
                     applyScrollTopCallback: () => {
                        container.scrollTop = cachedScrollTop - self._topPlaceholderSize;
                     }
                  });
               }
            } else {
               container.scrollTop = scrollTop;
            }
         },

         _unRegisterIt: function(event, registerType, component) {
            if (registerType === 'listScroll') {
               this._registrar.unregister(event, component);
               if (this._observers && this._observers[component.getInstanceId()]) {
                  this._observers[component.getInstanceId()].disconnect();
                  delete(this._observers[component.getInstanceId()]);
               }
            }
         },

         _beforeUnmount: function() {
            if (this._observers) {
               for (let i in this._observers) {
                  if (this._observers.hasOwnProperty(i)) {
                     this._observers[i].disconnect();
                  }
               }
               this._observers = null;
            }
            this._notify('unregister', ['controlResize', this], {bubbling: true});
            this._registrar.destroy();
            this._sizeCache = null;
         }
      });

      Scroll.getOptionTypes = function() {
         return {

         };
      };

      //для тестов
      Scroll._private = _private;

      export = Scroll;
