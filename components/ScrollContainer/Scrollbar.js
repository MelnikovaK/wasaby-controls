define('SBIS3.CONTROLS/ScrollContainer/Scrollbar', [
      'SBIS3.CONTROLS/CompoundControl',
      'tmpl!SBIS3.CONTROLS/ScrollContainer/Scrollbar/Scrollbar',
      'SBIS3.CONTROLS/Mixins/DragNDropMixin',
      'Core/detection',
      'css!SBIS3.CONTROLS/ScrollContainer/Scrollbar/Scrollbar'
   ],
   function (CompoundControl, dotTplFn, DragNDropMixinNew, detection) {

      'use strict';

      /**
       * Класс контрола "Тонкий скролл".
       * @class SBIS3.CONTROLS/ScrollContainer/Scrollbar
       * @extends SBIS3.CONTROLS/CompoundControl
       *
       * @mixes SBIS3.CONTROLS/Mixins/DragNDropMixin
       *
       * @public
       * @control
       * @author Крайнов Дмитрий Олегович
       */
      var Scrollbar = CompoundControl.extend([DragNDropMixinNew], /** @lends SBIS3.CONTROLS/ScrollContainer/Scrollbar.prototype */{
          /**
           * @event onScrollbarDrag Происходит при изменении позиции скролла.
           * @param {Core/EventObject} eventObject Дескриптор события.
           * @param {Number} position Позиция скролла.
           */

         _dotTplFn: dotTplFn,

         $protected: {
            _options: {
               /**
                * @cfg {Number}
                */
               position: 0,
               /**
                * @cfg {Number}
                */
               contentHeight: 1,
               /**
                * @cfg {Number}
                */
               tabindex: 0
            },
            _thumb: undefined,
            _beginClient: undefined,
            _thumbPosition: 0,
            _viewportRatio: undefined,
            //Отношение видимой части трека к невидимой части контента
            _scrollRatio: undefined,
            _thumbHeight: undefined,
            _containerHeight: undefined,
            _containerOuterHeight: undefined,
            //Является ли высота ползунка константой
            _isConstThumb: undefined,
            _browserScrollbarMinHeght: undefined
         },

         $constructor: function () {
            this._publish('onScrollbarStartDrag', 'onScrollbarDrag', 'onScrollbarEndDrag');
         },

         init: function () {
            Scrollbar.superclass.init.call(this);

            this._thumb = this._container.find('.js-controls-Scrollbar__thumb');
            this._wheelHandler = this._wheelHandler.bind(this);

            this._container.on('mousedown touchstart', '.js-controls-Scrollbar__thumb', this._getDragInitHandler());
            this._container.on('mousedown touchstart', this._onClickDragHandler.bind(this));
            if (detection.firefox) {
               this._container.on('MozMousePixelScroll', this._wheelHandler);
            } else {
               this._container.on('wheel', this._wheelHandler);
            }

            this._containerHeight = this._container.height();
            this._containerOuterHeight = this._container.outerHeight(true);
            /**
             * Так как отступы сверху и снизу у ползунка одинаковые, то можно умножить верхний отступ на 2.
             * Так мы получим сумму отступов сверху и снизу.
             * Не использовать margin, потому что в firefox у getComputedStyle(), такого поля нет.
             */
            this._scrollbarMargin = 2 * parseFloat(getComputedStyle(this._thumb[0]).marginTop);
            this._browserScrollbarMinHeght = parseFloat(getComputedStyle(this._thumb[0]).minHeight);

            this._setViewportRatio();
            this._setThumbHeight();
            this._setScrollRatio();
            this._setThumbPosition();
         },
          /**
           *
           * @returns {*}
           */
         getPosition: function () {
            return this._options.position;
         },
          /**
           *
           * @param position
           */
         setPosition: function (position) {
            var maxPosition = this.getContentHeight() - this._containerOuterHeight;

            position = this._calcPosition(position, 0, maxPosition);
            this._options.position = position;
            this._setThumbPosition();
         },
          /**
           *
           * @returns {number|SBIS3.CONTROLS.ScrollContainer._scrollbar.contentHeight|*}
           */
         getContentHeight: function () {
            return this._options.contentHeight;
         },
          /**
           *
           * @param contentHeight
           */
         setContentHeight: function (contentHeight) {
            this._containerHeight = this._container.height();
            this._containerOuterHeight = this._container.outerHeight(true);
            this._options.contentHeight = contentHeight;
            this._setViewportRatio();
            this._setThumbHeight();
            this._setScrollRatio();
         },

         /**
          * Вернуть положение, требуется для того что бы проверять не превышает ли позиция свои границы.
          * если да то вернуть позицию как границу за которую мы вышли. bottom - нижняя граница,
          * top -верхняя граница.
          */
         _calcPosition: function (position, bottom, top) {
            if (position < bottom) {
               position = bottom;
            }
            else if (position > top) {
               position = top;
            }

            return position;
         },

         _onClickDragHandler: function (e) {
            if (!$(e.target).hasClass('js-controls-Scrollbar__thumb')) {
               this._beginClient = this._thumb.get(0).getBoundingClientRect().top + this._thumbHeight / 2;
               this._onDragHandler(null, e);
            }
         },

         //Вернуть метод который инициализирует DragNDrop
         _getDragInitHandler: function () {
            return (function (e) {
               this._initDrag.call(this, e);
               e.preventDefault();
            }).bind(this);
         },

         //Сдвигаем ползунок на нужную позицию
         _setThumbPosition: function () {
            if (this._thumb) {
               this._thumbPosition = this._calcProjectionSize(this.getPosition(), this._scrollRatio);
               this._thumb.get(0).style.top = this._thumbPosition + 'px';
            }
         },

         //Высчитываем и задаём высоту ползунка
         _setThumbHeight: function () {
            this.getContainer().toggleClass('ws-invisible', this._viewportRatio >= 1);
            this._thumbHeight = this._calcProjectionSize(this._containerHeight, this._viewportRatio);
            //Проверим не является ли высота ползунка меньше минимальной.
            if (this._thumbHeight < this._browserScrollbarMinHeght) {
               this._thumbHeight = this._browserScrollbarMinHeght;
               this._isConstThumb = true;
            } else {
               this._isConstThumb = false;
            }
            if (this._thumb) {
               // Вычтем из высоты размеры отступов.
               this._thumb.height(this._thumbHeight - this._scrollbarMargin);
               // Высота ползунка должна учитывать margin.
               this._thumbHeight = this._thumb.outerHeight(true);
            }
         },

         _calcProjectionSize: function (size, ratio) {
            return size * ratio;
         },

         _onResizeHandler: function () {
            this._containerHeight = this._container.height();
            this._containerOuterHeight = this._container.outerHeight(true);
            this._setThumbHeight();
         },

         //Изменить отношение видимой части к размеру контента
         _setViewportRatio: function () {
            /**
             * Если размер скроллирования меньше 1px, то нет смысла показывать скролл.
             * Это избавит нас от проблем связанных с разным поведением браузеров.
             * Например в FF: если контейнер, в котором лежит скроллбар, имеет высоту с дробной частью и
             * равной своему контенту, то его scrollHeight будет округлен в большую сторону. Если передать
             * такой scrollHeight в скроллбар, то по логике должен быть скроллбар, хотя это не так.
             */
            if (this.getContentHeight() - this._containerOuterHeight > 1) {
               this._viewportRatio = this._containerOuterHeight / this.getContentHeight();
            } else {
               this._viewportRatio = 1;
            }
         },

         _setScrollRatio: function () {
            this._scrollRatio = (this.getContainer().height() - this._thumbHeight) / (this.getContentHeight() - this._containerOuterHeight);
         },

         // Не использовать e.clientY, потому что его нет на touch устройствах.
         _beginDragHandler: function (dragObject, e) {
            this._container.addClass('controls-Scrollbar__dragging');
            this._beginClient = e.pageY;
            this._notify('onScrollbarStartDrag', this.getPosition());
         },

         // Не использовать e.clientY, потому что его нет на touch устройствах.
         _onDragHandler: function (dragObject, e) {
            var newThumbPosition = this._thumbPosition + e.pageY - this._beginClient;

            this.setPosition(newThumbPosition / this._scrollRatio);
            this._notify('onScrollbarDrag', this.getPosition());

            this._beginClient = e.pageY - newThumbPosition + this._thumbPosition;
         },

         // Не использовать e.clientY, потому что его нет на touch устройствах.
         _endDragHandler: function (dragObject, droppable, e) {
            this._container.removeClass('controls-Scrollbar__dragging');
            this._notify('onScrollbarEndDrag', this.getPosition());
         },

         _wheelHandler: function(event) {
            var deltaY;

            switch (event.type) {
               case 'wheel':
                  deltaY = event.originalEvent.deltaY;
                  break;
               case 'MozMousePixelScroll':
                  deltaY = event.originalEvent.detail;
                  break;
            }

            this.setPosition(this.getPosition() + deltaY);
            this._notify('onScrollbarDrag', this.getPosition());

            event.preventDefault();
         },

         destroy: function () {
            Scrollbar.superclass.destroy.call(this);

            this.getContainer().off('mousedown touchstart');
            this._thumb = undefined;
         }
      });

      return Scrollbar;
   }
);