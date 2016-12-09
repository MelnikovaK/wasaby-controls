define('js!SBIS3.CONTROLS.Scrollbar', [
      'js!SBIS3.CONTROLS.CompoundControl',
      'tmpl!SBIS3.CONTROLS.Scrollbar',
      'js!SBIS3.CONTROLS.DragNDropMixinNew'
   ],
   function(CompoundControl, dotTplFn, DragNDropMixinNew) {

      'use strict';

      var BROWSER_SCROLLBAR_MIN_HEIGHT = 50;

      /**
       * Тонкий скролл.
       * @class SBIS3.CONTROLS.Scrollbar
       * @extends SBIS3.CONTROLS.CompoundControl
       *
       * @mixin SBIS3.CONTROLS.DragNDropMixinNew
       *
       * @control
       * @private
       * @autor Крайнов Дмитрий Олегович
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
            _thumbHeight: undefined,
            _containerHeight: undefined
         },

         $constructor: function() {
            this._publish('onScrollbarDrag');
         },

         init: function() {
            Scrollbar.superclass.init.call(this);

            this._thumb = this._container.find('.js-controls-Scrollbar__thumb');
            this._container.on('mousedown touchstart', '.js-controls-Scrollbar__thumb', this._getDragInitHandler());
            this._container.on('mousedown touchstart', this._onClickDragHandler.bind(this));
            this._containerHeight = this._container.height();
            this._setViewportRatio();
            this._setThumbHeight();
         },

         getPosition: function() {
            return this._options.position;
         },

         setPosition: function(position) {
            var maxPosition = this.getContentHeight() - this._containerHeight;

            position = this._calcPosition(position, 0, maxPosition);
            this._options.position = position;
            this._setThumbPosition();
         },

         getContentHeight: function() {
            return this._options.contentHeight;
         },

         setContentHeight: function(contentHeight) {
            this._containerHeight = this._container.height();
            this._options.contentHeight = contentHeight;
            this._setViewportRatio();
            this._setThumbHeight();
         },

         /**
          * Вернуть положение, требуется для того что бы проверять не превышает ли позиция свои границы.
          * если да то вернуть позицию как границу за которую мы вышли. bottom - нижняя граница,
          * top -верхняя граница.
          */
         _calcPosition: function(position, bottom, top) {
            if (position < bottom) {
               position = bottom;
            }
            else if (position > top) {
               position = top;
            }

            return position;
         },

         _onClickDragHandler: function(e) {
            if (!$(e.target).hasClass('js-controls-Scrollbar__thumb')) {
               this._beginClient = this._thumb.get(0).getBoundingClientRect().top + this._thumbHeight / 2;
               this._onDragHandler(null, e);
            }
         },

         //Вернуть метод который инициализирует DragNDrop
         _getDragInitHandler: function() {
            return (function(e) {
               this._initDrag.call(this, e);
               e.preventDefault();
            }).bind(this);
         },

         //Сдвигаем ползунок на нужную позицию
         _setThumbPosition: function() {
            this._thumbPosition =this._calcProjectionSize(this.getPosition(), this._viewportRatio);
            this._thumb.get(0).style.top = this._thumbPosition + 'px';
         },

         //Высчитываем и задаём высоту ползунка
         _setThumbHeight: function(){
            this.getContainer().toggleClass('ws-invisible', this._viewportRatio >= 1);
            this._thumbHeight = this._calcProjectionSize(this._containerHeight, this._viewportRatio);
            this._thumb.height(this._thumbHeight);
         },

         _calcProjectionSize: function(size, ratio) {
            return size * ratio;
         },

         _onResizeHandler: function() {
            this._containerHeight = this._container.height();
            this._setThumbHeight();
         },

         //Изменить отношение видимой части к размеру контента
         _setViewportRatio: function(){
            this._viewportRatio = this.getContainer().outerHeight(true) / this.getContentHeight();
         },

         _beginDragHandler: function(dragObject, e) {
            this._container.addClass('controls-Scrollbar__dragging');
            this._beginClient = e.clientY;
         },

         _onDragHandler: function(dragObject, e) {
            var newThumbPosition = this._thumbPosition + e.clientY - this._beginClient;

            this.setPosition(newThumbPosition / this._viewportRatio);
            this._notify('onScrollbarDrag', this.getPosition());

            this._beginClient = e.clientY - newThumbPosition + this._thumbPosition;
         },

         _endDragHandler: function(dragObject, droppable, e) {
            this._container.removeClass('controls-Scrollbar__dragging');
         },

         destroy: function() {
            Scrollbar.superclass.destroy.call(this);

            this.getContainer().off('mousedown touchstart');
            this._thumb = undefined;
         }
      });

      return Scrollbar;
   }
);