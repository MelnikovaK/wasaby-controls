define('Controls/Container/resources/Scrollbar',
   [
      'Core/Control',
      'Core/detection',
      'tmpl!Controls/Container/resources/Scrollbar/Scrollbar',
      'Controls/Event/Emitter',
      'css!Controls/Container/resources/Scrollbar/Scrollbar'
   ],
   function(Control, detection, template) {

      'use strict';

      /**
       * Класс контрола "Тонкий скролл".
       * @class Controls/Container/resources/Scrollbar
       * @extends Core/Control
       *
       * @event scrollbarBeginDrag Начала перемещения ползунка мышью.
       * @param {SyntheticEvent} eventObject Дескриптор события.
       *
       * @event scrollbarEndDrag Конец перемещения ползунка мышью.
       * @param {SyntheticEvent} eventObject Дескриптор события.
       *
       * @name Controls/Container/resources/Scrollbar#position
       * @cfg {Number} Позиция ползунка спроецированная на контент.
       *
       * @name Controls/Container/resources/Scrollbar#contentHeight
       * @cfg {Number} Высота контента на который проецируется тонкий скролл.
       * @remark Не может быть меньше высоты контейнера или 0.
       *
       * @name Controls/Container/resources/Scrollbar#style
       * @cfg {String} Цветовая схема контейнера. Влияет на цвет тени и полоски скролла. Используется для того чтобы контейнер корректно отображался как на светлом так и на темном фоне.
       * @variant normal стандартная схема
       * @variant opposite противоположная схема
       *
       * @public
       * @control
       * @author Журавлев Максим Сергеевич
       */
      var
         _private = {
            /**
             * Позиция курсора относительно страницы, в начале перемещения.
             */
            beginPageY: null,
            /**
             * Посчитать позицию ползунка учитывая граници за которые он не может выйти.
             * @param {number} position позиция ползунка.
             * @param {number} bottom нижняя граница ползунка.
             * @param {number} top верхняя граница ползунка.
             * @return {number} позиция ползунка
             */
            calcPosition: function(position, bottom, top) {
               return Math.min(Math.max(bottom, position), top);
            },
            /**
             * Посчитать отношение высот контейнера ползунка к контенту.
             * @param {number} scrollbarHeight высота контейнера ползунка.
             * @param {number} contentHeight высота контента.
             * @return {number} отношение высот контейнера ползунка к контенту.
             */
            calcViewportRatio: function(scrollbarHeight, contentHeight) {
               return scrollbarHeight / contentHeight;
            },
            /**
             * Получить отношение высот отображения скрытого контента и самого скрытого контента.
             * @param {number} scrollbarHeight высота контейнера ползунка.
             * @param {number} scrollbarAvailableHeight высота контейнера по которому может перемещаться ползунок.
             * @param {number} thumbHeight высота ползунка.
             * @param {number} contentHeight высота контента.
             * @return {number} отношение высот отображения скрытого контента и самого скрытого контента.
             */
            calcScrollRatio: function(scrollbarHeight, scrollbarAvailableHeight, thumbHeight, contentHeight) {
               return (scrollbarAvailableHeight - thumbHeight) / (contentHeight - scrollbarHeight);
            },
            /**
             * Посчитать высоту ползунка.
             * @param thumb ползунок.
             * @param {number} scrollbarAvailableHeight высота контейнера по которому может перемещаться ползунок.
             * @param {number} viewportRatio отношение высот контейнера ползунка к контенту.
             * @return {number} высота ползунка.
             */
            calcThumbHeight: function(thumb, scrollbarAvailableHeight, viewportRatio) {
               thumb.style.height = scrollbarAvailableHeight * viewportRatio + 'px';

               return thumb.offsetHeight;
            },
            calcDelta: function(firefox, delta) {
               /**
                * Определяем смещение ползунка.
                * В firefox в дескрипторе события в свойстве deltaY лежит маленькое значение,
                * поэтому установим его сами.
                * TODO: Нормальное значение есть в дескрипторе события MozMousePixelScroll в
                * свойстве detail, но на него нельзя подписаться.
                * https://online.sbis.ru/opendoc.html?guid=3e532f22-65a9-421b-ab0c-001e69d382c8
                */
               if (firefox) {
                  delta = 100;
               }

               return delta;
            }
         },
         Scrollbar = Control.extend({
            _template: template,

            /**
             * Перемещается ли ползунок.
             * @type {boolean}
             */
            _drag: false,

            /**
             * Позиция ползунка спроецированная на контент в границах трека.
             * @type {number}
             */
            _position: 0,

            constructor: function(options) {
               Scrollbar.superclass.constructor.call(this, options);

               this._scrollbarOnDragHandler = this._scrollbarOnDragHandler.bind(this);
               this._scrollbarEndDragHandler = this._scrollbarEndDragHandler.bind(this);
            },

            /**
             * Изменить позицию ползунка.
             * @param {number} position новая позиция.
             * @param {boolean} notify стрелять ли событием при изменении позиции.
             * @return {boolean} изменилась ли позиция.
             * @protected
             */
            _setPosition: function(position, notify) {
               var top = (this._children.scrollbar.clientHeight - this._thumbHeight) / this._scrollRatio;

               position = _private.calcPosition(position, 0, top);

               if (this._position === position) {
                  return false;
               } else {
                  this._position = position;

                  if (notify) {
                     this._notify('positionChanged', [position]);
                  }

                  return true;
               }
            },

            /**
             * Изменить свойства контрола отвечающего за размеры.
             * @param contentHeight высота контента.
             * @return {boolean} изменились ли размеры.
             * @protected
             */
            _setSizes: function(contentHeight) {
               var
                  scrollbar = this._children.scrollbar,
                  scrollbarHeight = scrollbar.offsetHeight,
                  scrollbarAvailableHeight = scrollbar.clientHeight,
                  thumbHeight, scrollRatio;

               thumbHeight = _private.calcThumbHeight(
                  this._children.thumb,
                  scrollbarAvailableHeight,
                  _private.calcViewportRatio(scrollbarHeight, contentHeight)
               );
               scrollRatio = _private.calcScrollRatio(scrollbarHeight, scrollbarAvailableHeight, thumbHeight, contentHeight);

               if (this._thumbHeight === thumbHeight && this._scrollRatio === scrollRatio) {
                  return false;
               } else {
                  this._thumbHeight = thumbHeight;
                  this._scrollRatio = scrollRatio;

                  return true;
               }
            },

            _afterMount: function() {
               this._resizeHandler();

               this._forceUpdate();
            },

            _afterUpdate: function(oldOptions) {
               var
                  forceUpdate = false,
                  setPosition = oldOptions.position !== this._options.position;

               if (oldOptions.contentHeight !== this._options.contentHeight) {
                  forceUpdate |= this._setSizes(this._options.contentHeight);
                  setPosition = true;
               }
               if (setPosition) {
                  forceUpdate |= this._setPosition(this._options.position);
               }
               if (forceUpdate) {
                  this._forceUpdate();
               }
            },

            /**
             * Добавляем обработчики перемещения ползунка мышью.
             * @protected
             */
            _addMoveUpHandlers: function() {
               document.addEventListener('mousemove', this._scrollbarOnDragHandler);
               document.addEventListener('mouseup', this._scrollbarEndDragHandler);
            },

            /**
             * Удаляем обработчики перемещения ползунка мышью.
             * @protected
             */
            _removeMoveUpHandlers: function() {
               document.removeEventListener('mousemove', this._scrollbarOnDragHandler);
               document.removeEventListener('mouseend', this._scrollbarEndDragHandler);
            },

            /**
             * Обработчик начала перемещения ползунка мышью.
             * @param {SyntheticEvent} event дескриптор события.
             * @protected
             */
            _scrollbarBeginDragHandler: function(event) {
               var delta;

               _private.beginPageY = event.nativeEvent.pageY;

               if (event.target.getAttribute('name') === 'scrollbar') {
                  delta = _private.beginPageY - this._children.thumb.getBoundingClientRect().top - this._thumbHeight / 2;
                  delta /= this._scrollRatio;
                  this._setPosition(this._position + delta, true);
               }

               this._drag = true;
               this._addMoveUpHandlers();
               this._notify('scrollbarBeginDrag');
            },

            /**
             * Обработчик перемещения ползунка мышью.
             * @param {Event} event дескриптор события.
             * @protected
             */
            _scrollbarOnDragHandler: function(event) {
               if (this._setPosition(this._position + (event.pageY - _private.beginPageY) / this._scrollRatio, true)) {
                  _private.beginPageY = event.pageY;

                  this._forceUpdate();
               }
            },

            /**
             * Обработчик конца перемещения ползунка мышью.
             * @protected
             */
            _scrollbarEndDragHandler: function() {
               this._drag = false;
               this._removeMoveUpHandlers();
               this._notify('scrollbarEndDrag');

               this._forceUpdate();
            },

            /**
             * Обработчик прокрутки колесиком мыши.
             * @param {SyntheticEvent} event дескриптор события.
             * @protected
             */
            _wheelHandler: function(event) {
               this._setPosition(this._position + _private.calcDelta(detection.firefox, event.nativeEvent.deltaY), true);

               event.preventDefault();
            },

            /**
             * Обработчик изменения размеров скролла.
             * @protected
             */
            _resizeHandler: function() {
               this._setSizes(this._options.contentHeight);
               this._setPosition(this._options.position);
            }
         });

      Scrollbar.getDefaultOptions = function() {
         return {
            position: 0,
            style: 'normal'
         }
      };

      Scrollbar._private = _private;

      return Scrollbar;
   }
);