define('Controls/Container/Scroll',
   [
      'Core/Control',
      'Core/Deferred',
      'Core/detection',
      'Core/helpers/Object/isEqual',
      'Controls/Container/Scroll/Context',
      'Controls/Container/Scroll/ScrollWidthUtil',
      'Controls/Container/Scroll/ScrollHeightFixUtil',
      'tmpl!Controls/Container/Scroll/Scroll',
      'Controls/Layout/Scroll',
      'Controls/Event/Emitter',
      'Controls/Container/Scroll/Scrollbar',
      'css!Controls/Container/Scroll/Scroll'
   ],
   function(Control, Deferred, detection, isEqual, ScrollData, ScrollWidthUtil, ScrollHeightFixUtil, template) {

      'use strict';

      /**
       * Container with thin scrollbar.
       *
       * @class Controls/Container/Scroll
       * @extends Core/Control
       * @control
       * @public
       * @category Container
       *
       * @name Controls/Container/Scroll#content
       * @cfg {Content} Container contents.
       *
       * @name Controls/Container/Scroll#shadowVisible
       * @cfg {Boolean} Whether shadow should be shown (when content doesn't fit).
       *
       * @name Controls/Container/Scroll#scrollbarVisible
       * @cfg {Boolean} Whether scrollbar should be shown.
       *
       * @name Controls/Container/Scroll#style
       * @cfg {String} Color scheme (colors of the shadow and scrollbar).
       * @variant normal Default theme (for bright backgrounds).
       * @variant inverted Inverted theme (for dark backgrounds).
       */
      var
         _private = {

            /**
             * Получить расположение тени внутри контейнера в зависимости от прокрутки контента.
             * @return {String}
             */
            calcShadowPosition: function(scrollTop, containerHeight, scrollHeight) {
               var shadowPosition = '';

               if (scrollTop) {
                  shadowPosition += 'top';
               }
               if (scrollHeight - containerHeight - scrollTop) {
                  shadowPosition += 'bottom';
               }

               return shadowPosition;
            },

            getScrollHeight: function(container) {
               return container.scrollHeight;
            },

            getContainerHeight: function(container) {
               return container.offsetHeight;
            },

            getScrollTop: function(container) {
               return container.scrollTop;
            },

            setScrollTop: function(self, scrollTop) {
               self._children.content.scrollTop = scrollTop;
               self._scrollTop = scrollTop;
            },

            calcHasScroll: function(self) {
               var
                  scrollHeight = _private.getScrollHeight(self._children.content),
                  containerHeight = _private.getContainerHeight(self._children.content);

               return scrollHeight > containerHeight;
            },

            getContentHeight: function(self) {
               return _private.getScrollHeight(self._children.content);
            },

            getShadowPosition: function(self) {
               var
                  scrollTop = _private.getScrollTop(self._children.content),
                  scrollHeight = _private.getScrollHeight(self._children.content),
                  containerHeight = _private.getContainerHeight(self._children.content);

               return _private.calcShadowPosition(scrollTop, containerHeight, scrollHeight);
            },

            calcHeightFix: function(self) {
               return ScrollHeightFixUtil.calcHeightFix(self._children.content);
            },

            calcDisplayState: function(self) {
               return {
                  heightFix: _private.calcHeightFix(self),
                  hasScroll: _private.calcHasScroll(self),
                  contentHeight: _private.getContentHeight(self),
                  shadowPosition: _private.getShadowPosition(self)
               };
            },

            updateDisplayState: function(self, displayState) {
               self._displayState.hasScroll = displayState.hasScroll;
               self._displayState.heightFix = displayState.heightFix;
               self._displayState.contentHeight = displayState.contentHeight;
               self._displayState.shadowPosition = displayState.shadowPosition;
            }
         },
         Scroll = Control.extend({
            _template: template,

            /**
             * Смещение контента сверху относительно контейнера.
             * @type {number}
             */
            _scrollTop: 0,

            /**
             * Нужно ли показывать скролл при наведении.
             * @type {boolean}
             */
            _showScrollbarOnHover: true,

            /**
             * Наведен ли курсор на контейнер.
             * @type {boolean}
             */
            _hasHover: false,

            /**
             * Используется ли нативный скролл.
             * @type {boolean}
             */
            _useNativeScrollbar: null,

            _displayState: null,

            _pagingState: null,

            _beforeMount: function(options, context, receivedState) {
               var
                  self = this,
                  def;

               this._displayState = {};
               if (context.ScrollData && context.ScrollData.pagingVisible) {
                  this._pagingState = {
                     visible: true,
                     stateUp: 'disabled',
                     stateDown: 'normal'
                  };
               } else {
                  this._pagingState = {};
               }

               if (receivedState) {
                  _private.updateDisplayState(this, receivedState.displayState);
                  this._styleHideScrollbar = receivedState.styleHideScrollbar;
                  this._useNativeScrollbar = receivedState.useNativeScrollbar;
               } else {
                  def = new Deferred();

                  def.addCallback(function() {
                     var
                        displayState = {
                           heightFix: ScrollHeightFixUtil.calcHeightFix()
                        },
                        styleHideScrollbar = ScrollWidthUtil.calcStyleHideScrollbar(),

                        // На мобильных устройствах используется нативный скролл, на других платформенный.
                        useNativeScrollbar = detection.isMobileIOS || detection.isMobileAndroid || detection.isMac;

                     _private.updateDisplayState(self, displayState);
                     self._styleHideScrollbar = styleHideScrollbar;
                     self._useNativeScrollbar = useNativeScrollbar;

                     return {
                        displayState: displayState,
                        styleHideScrollbar: styleHideScrollbar,
                        useNativeScrollbar: useNativeScrollbar
                     };
                  });

                  def.callback();

                  return def;
               }
            },

            _afterMount: function() {
               /**
                * Для определения heightFix и styleHideScrollbar может требоваться DOM, поэтому проверим
                * смогли ли мы в beforeMount их определить.
                */
               if (typeof this._displayState.heightFix === 'undefined') {
                  this._displayState.heightFix = ScrollHeightFixUtil.calcHeightFix(this._children.content);

                  this._forceUpdate();
               }
               if (typeof this._styleHideScrollbar === 'undefined') {
                  this._styleHideScrollbar = ScrollWidthUtil.calcStyleHideScrollbar();

                  this._forceUpdate();
               }
            },

            _beforeUpdate: function(options, context) {
               this._pagingState.visible = context.ScrollData && context.ScrollData.pagingVisible;
            },

            _afterUpdate: function() {
               var displayState = _private.calcDisplayState(this);

               if (!isEqual(this._displayState, displayState)) {
                  this._displayState = displayState;

                  this._forceUpdate();
               }
            },

            _resizeHandler: function() {
               this._displayState = _private.calcDisplayState(this);
            },

            _scrollHandler: function() {
               if (!this._dragging) {
                  this._scrollTop = _private.getScrollTop(this._children.content);
               }
            },

            _scrollbarTaken: function(notify) {
               if (this._showScrollbarOnHover && this._displayState.hasScroll) {
                  this._hasHover = true;

                  if (notify) {
                     this._notify('scrollbarTaken', [], {bubbling: true});
                  }
               }
            },

            _arrowClickHandler: function(event, btnName) {
               var scrollParam;

               switch (btnName) {
                  case 'Begin':
                     scrollParam = 'top';
                     break;
                  case 'End':
                     scrollParam = 'bottom';
                     break;
                  case 'Prev':
                     scrollParam = 'pageUp';
                     break;
                  case 'Next':
                     scrollParam = 'pageDown';
                     break;
               }

               this._children.scrollLayout.doScroll(scrollParam);
            },

            _scrollReachTopHandler: function() {
               this._pagingState.stateUp = 'disabled';
            },

            _scrollReachBottomHandler: function() {
               this._pagingState.stateDown = 'disabled';
            },

            _scrollMoveHandler: function() {
               this._pagingState.stateUp = 'normal';
               this._pagingState.stateDown = 'normal';
            },

            _mouseenterHandler: function() {
               this._scrollbarTaken(true);
            },

            _mouseleaveHandler: function() {
               if (this._hasHover) {
                  this._hasHover = false;
                  this._notify('scrollbarReleased', [], {bubbling: true});
               }
            },

            _scrollbarTakenHandler: function() {
               this._hasHover = false;
               this._showScrollbarOnHover = false;
            },

            _scrollbarReleasedHandler: function(event) {
               if (!this._showScrollbarOnHover) {
                  this._showScrollbarOnHover = true;
                  event.preventDefault();

                  this._scrollbarTaken(false);
               }
            },

            /**
             * TODO: убрать после выполнения https://online.sbis.ru/opendoc.html?guid=93779c1a-8d18-42fe-8dc8-1bab779d0943.
             * Переделать на bind в шаблоне и избавится от прокидывания опций.
             */
            _positionChangedHandler: function(event, position) {
               _private.setScrollTop(this, position);
            },

            _draggingChangedHandler: function(event, dragging) {
               this._dragging = dragging;
            },

            getDataId: function() {
               return 'ControlsContainerScroll';
            },

            /**
             * Scrolls to the given position from the top of the container.
             * @param {Number} offset
             */
            scrollTo: function(offset) {
               _private.setScrollTop(this, offset);
            },

            /**
             * Scrolls to the top of the container.
             */
            scrollToTop: function() {
               _private.setScrollTop(this, 0);
            },

            /**
             * Scrolls to the bottom of the container.
             */
            scrollToBottom: function() {
               _private.setScrollTop(this, _private.getScrollHeight(this._children.content));
            }
         });

      Scroll.getDefaultOptions = function() {
         return {
            style: 'normal',
            shadowVisible: true,
            scrollbarVisible: true
         };
      };

      Scroll.contextTypes = function() {
         return {
            ScrollData: ScrollData
         };
      };

      Scroll._private = _private;

      return Scroll;
   }
);
