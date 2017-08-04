define('js!SBIS3.CONTROLS.Scrollbar', [
      'js!SBIS3.CONTROLS.CompoundControl',
      'tmpl!SBIS3.CONTROLS.Scrollbar',
      'js!SBIS3.CONTROLS.DragNDropMixin',
      'css!SBIS3.CONTROLS.Scrollbar'
   ],
   function (CompoundControl, dotTplFn, DragNDropMixinNew) {

      'use strict';

      /**
       * Тонкий скролл.
       * @class SBIS3.CONTROLS.Scrollbar
       * @extends SBIS3.CONTROLS.CompoundControl
       *
       * @mixes SBIS3.CONTROLS.DragNDropMixin
       *
       * @control
       * @author Крайнов Дмитрий Олегович
       */
      var Scrollbar = CompoundControl.extend([DragNDropMixinNew], {
         _dotTplFn: dotTplFn,

         $protected: {
            _options: {
               position: 0,
               contentHeight: 1,
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
            this._publish('onScrollbarDrag');
         },

         init: function () {
            Scrollbar.superclass.init.call(this);

            this._thumb = this._container.find('.js-controls-Scrollbar__thumb');
            this._container.on('mousedown touchstart', '.js-controls-Scrollbar__thumb', this._getDragInitHandler());
            this._container.on('mousedown touchstart', this._onClickDragHandler.bind(this));
            this._containerHeight = this._container.height();
            this._containerOuterHeight = this._container.outerHeight(true);
            this._browserScrollbarMinHeght = parseFloat(getComputedStyle(this._thumb[0]).minHeight);

            this._setViewportRatio();
            this._setThumbHeight();
            this._setScrollRatio();
            this._setThumbPosition();
         },

         getPosition: function () {
            return this._options.position;
         },

         setPosition: function (position) {
            var maxPosition = this.getContentHeight() - this._containerOuterHeight;

            position = this._calcPosition(position, 0, maxPosition);
            this._options.position = position;
            this._setThumbPosition();
         },

         getContentHeight: function () {
            return this._options.contentHeight;
         },

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
               // У ползунка есть отступы сверху и снизу, а мы расчитывали высоту вместе с отступами, поэтому вычтем их.
               this._thumb.height(this._thumbHeight - this._thumb.outerHeight(true) + this._thumb.height());
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
            this._viewportRatio = this._containerOuterHeight / this.getContentHeight();
         },

         _setScrollRatio: function () {
            this._scrollRatio = (this.getContainer().height() - this._thumbHeight) / (this.getContentHeight() - this._containerOuterHeight);
         },

         // Не использовать e.clientY, потому что его нет на touch устройствах.
         _beginDragHandler: function (dragObject, e) {
            this._container.addClass('controls-Scrollbar__dragging');
            this._beginClient = e.pageY;
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