/**
 * Created by kraynovdo on 15.02.2018.
 */
/**
 * Created by dv.zuev on 17.01.2018.
 * Компонент слушает события "снизу". События register и сохраняет Emmitterы в списке
 * то есть, кто-то снизу сможет услышать события верхних компонентов через это отношение
 */
define('Controls/Layout/Scroll',
   [
      'Core/Control',
      'tmpl!Controls/Layout/Scroll/Scroll',
      'Controls/Event/Registrar',
      'Core/helpers/Function/throttle'
   ],
   function(Control, template, Registrar, throttle) {

      'use strict';

      var SCROLL_LOAD_OFFSET = 100;
      var global = (function() { return this || (0,eval)('this') })();

      var _private = {

         sendCanScroll: function(self, clientHeight, scrollHeight) {
            if (clientHeight < scrollHeight) {
               _private.start(self, 'canScroll');
            }
            else {
               _private.start(self, 'cantScroll');
            }
         },

         sendEdgePositions: function(self, clientHeight, scrollHeight, scrollTop) {
            //Проверка на триггеры начала/конца блока
            if (scrollTop <= 0) {
               _private.start(self, 'listTop', scrollTop);
            }
            if (scrollTop + clientHeight >= scrollHeight) {
               _private.start(self, 'listBottom', scrollTop);
            }

            //Проверка на триггеры загрузки
            if (scrollTop <= SCROLL_LOAD_OFFSET) {
               _private.start(self, 'loadTop', scrollTop);
            }
            if (scrollTop + clientHeight >= scrollHeight - SCROLL_LOAD_OFFSET) {
               _private.start(self, 'loadBottom', scrollTop);
            }
         },

         onInitScroll: function(self, container) {
            var scrollTop, clientHeight, scrollHeight;

            scrollTop = container.scrollTop;
            clientHeight = container.clientHeight;
            scrollHeight = container.scrollHeight;

            _private.sendCanScroll(self, clientHeight, scrollHeight, scrollTop);
         },

         onChangeScroll: function(self, container) {
            var scrollTop, clientHeight, scrollHeight;

            scrollTop = container.scrollTop;
            clientHeight = container.clientHeight;
            scrollHeight = container.scrollHeight;

            _private.sendCanScroll(self, clientHeight, scrollHeight);
            _private.sendEdgePositions(self, clientHeight, scrollHeight, scrollTop);
         },

         initIntersectionObserver: function(self, elements) {

            self._observer = new IntersectionObserver(function(changes) {
               for (var i = 0; i < changes.length; i++) {
                  if (changes[i].isIntersecting) {
                     switch (changes[i].target) {
                        case elements.topLoadTrigger:
                           _private.start(self, 'loadTop');
                           break;
                        case elements.bottomLoadTrigger:
                           _private.start(self, 'loadBottom');
                           break;
                        case elements.topListTrigger:
                           _private.start(self, 'listTop');
                           break;
                        case elements.bottomListTrigger:
                           _private.start(self, 'listBottom');
                           break;
                     }
                  }
               }
            }, {});
            self._observer.observe(elements.topLoadTrigger);
            self._observer.observe(elements.bottomLoadTrigger);

            self._observer.observe(elements.topListTrigger);
            self._observer.observe(elements.bottomListTrigger);
         },

         doScroll: function(self, scrollParam, container) {
            if (scrollParam === 'top') {
               self._container.scrollTop = 0;
            }
            else {
               var clientHeight, scrollHeight;
               if (scrollParam === 'bottom') {
                  scrollHeight = container.scrollHeight;
                  self._container.scrollTop = scrollHeight;
               }
               else {
                  clientHeight = container.clientHeight;
                  if (scrollParam === 'pageUp') {
                     self._container.scrollTop -= clientHeight;
                  }
                  else {
                     self._container.scrollTop += clientHeight;
                  }
               }
            }
         },

         start: function(self, eventType, scrollTop) {
            self._registrar.start(eventType, scrollTop);
         }
      };

      var Scroll = Control.extend({
         _template: template,
         _observer: null,


         _beforeMount: function(){
            this._registrar = new Registrar({register: 'listScroll'});
         },


         _scrollHandler: function(e) {
            var self = this;
            // подписка на скролл через throttle. Нужно подобрать оптимальное значение,
            // как часто кидать внутреннее событие скролла. На простом списке - раз в 100мс достаточно.
            throttle(function(){
               _private.start(self, 'scrollMove', {scrollTop: e.target.scrollTop});
               if (!self._observer) {
                  _private.onChangeScroll(self, e.target);
               }
            }, 100, true)();
         },

         _resizeHandler: function() {
            _private.onChangeScroll(this, this._container);
         },

         _registerIt: function(event, registerType, component, callback, triggers){
            if (registerType === 'listScroll') {
               this._registrar.register(event, component, callback);

               _private.onInitScroll(this, this._container);

               if (global && global.IntersectionObserver && triggers) {
                  _private.initIntersectionObserver(this, triggers);
               }
               else {
                  _private.onChangeScroll(this, this._container);
               }
            }
         },

         _doScrollHandler: function(e, scrollParam) {
            _private.doScroll(this, scrollParam, this._container);
         },




         _unRegisterIt: function(event, registerType, component){
            if (registerType === 'listScroll') {
               this._registrar.unregister(event, component, callback);
            }
         },


         _beforeUnmount: function() {
            if (this._observer) {
               this._observer.disconnect();
               this._observer = null;
            }
            this._registrar.destroy();
         }



      });

      return Scroll;
   }
);
