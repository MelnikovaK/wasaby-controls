import Control = require('Core/Control');
import Deferred = require('Core/Deferred');
import Env = require('Env/Env');
import ScrollData = require('Controls/_scroll/Scroll/Context');
import StickyHeaderContext = require('Controls/_scroll/StickyHeader/Context');
import stickyHeaderUtils = require('Controls/_scroll/StickyHeader/Utils');
import ScrollWidthUtil = require('Controls/_scroll/Scroll/ScrollWidthUtil');
import ScrollHeightFixUtil = require('Controls/_scroll/Scroll/ScrollHeightFixUtil');
import template = require('wml!Controls/_scroll/Scroll/Scroll');
import tmplNotify = require('Controls/Utils/tmplNotify');
import {isEqual} from 'Types/object';
import 'Controls/_scroll/Scroll/Watcher';
import 'Controls/event';
import 'Controls/_scroll/Scroll/Scrollbar';
import 'css!theme?Controls/scroll';


/**
 * Контейнер с тонким скроллом.
 * Для контрола требуется {@link Controls/_scroll/Scroll/Context context}.
 *
 * @class Controls/_scroll/Container
 * @extends Core/Control
 * @control
 * @public
 * @author Красильников А.С.
 * @category Container
 * @demo Controls-demo/Container/Scroll
 *
 */

/*
 * Container with thin scrollbar.
 * For the component, a {@link Controls/_scroll/Scroll/Context context} is required.
 *
 * @class Controls/_scroll/Container
 * @extends Core/Control
 * @control
 * @public
 * @author Красильников А.С.
 * @category Container
 * @demo Controls-demo/Container/Scroll
 *
 */

/**
 * @event scroll Скроллируемая область.
 * @param {SyntheticEvent} eventObject.
 * @param {Number} scrollTop Скролл располагается сверху относительно контейнера.
 */

/*
 * @event scroll Scrolling content.
 * @param {SyntheticEvent} eventObject.
 * @param {Number} scrollTop Top position of content relative to container.
 */

/**
 * @name Controls/_scroll/Container#content
 * @cfg {Content} Содержимое контейнера.
 */

/*
 * @name Controls/_scroll/Container#content
 * @cfg {Content} Container contents.
 */

/**
 * @name Controls/_scroll/Container#shadowVisible
 * @cfg {Boolean} Следует ли показывать тень (когда содержимое не подходит).
 */

/*
 * @name Controls/_scroll/Container#shadowVisible
 * @cfg {Boolean} Whether shadow should be shown (when content doesn't fit).
 */

/**
 * @name Controls/_scroll/Container#scrollbarVisible
 * @cfg {Boolean} Следует ли отображать скролл.
 */

/*
 * @name Controls/_scroll/Container#scrollbarVisible
 * @cfg {Boolean} Whether scrollbar should be shown.
 */

/**
 * @name Controls/_scroll/Container#style
 * @cfg {String} Цветовая схема (цвета тени и скролла).
 * @variant normal Тема по умолчанию (для ярких фонов).
 * @variant inverted Преобразованная тема (для темных фонов).
 */

/*
 * @name Controls/_scroll/Container#style
 * @cfg {String} Color scheme (colors of the shadow and scrollbar).
 * @variant normal Default theme (for bright backgrounds).
 * @variant inverted Inverted theme (for dark backgrounds).
 */
var
   _private = {
      SHADOW_HEIGHT: 8,

      /**
       * Получить расположение тени внутри контейнера в зависимости от прокрутки контента.
       * @return {String}
       */
      calcShadowPosition: function(scrollTop, containerHeight, scrollHeight) {
         var shadowPosition = '';

         if (scrollTop > 0) {
            shadowPosition += 'top';
         }

         // The scrollHeight returned by the browser is more, because of the invisible elements
         // that climbs outside of the fixed headers (shadow and observation targets).
         // We take this into account when calculating. 8 pixels is the height of the shadow.
         if ((Env.detection.firefox || Env.detection.isIE) && stickyHeaderUtils.isStickySupport()) {
            scrollHeight -= _private.SHADOW_HEIGHT;
         }

         // Compare with 1 to prevent rounding errors in the scale do not equal 100%
         if (scrollHeight - containerHeight - scrollTop >= 1) {
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

      getScrollTop: function(self, container) {
         return container.scrollTop + self._topPlaceholderSize;
      },

      setScrollTop: function(self, scrollTop) {
         self._children.scrollWatcher.setScrollTop(scrollTop);
         self._scrollTop = scrollTop;
         self._notify('scroll', [scrollTop]);
      },

      calcHasScroll: function(self) {
         var
            scrollHeight = _private.getScrollHeight(self._children.content),
            containerHeight = _private.getContainerHeight(self._children.content);

         /**
          * In IE, if the content has a rational height, the height is rounded to the smaller side,
          * and the scrollable height to the larger side. Reduce the scrollable height to the real.
          */
         if (Env.detection.isIE) {
            scrollHeight--;
         }

         return scrollHeight > containerHeight;
      },

      getContentHeight: function(self) {
         return _private.getScrollHeight(self._children.content) - self._headersHeight.top -
            self._headersHeight.bottom + self._topPlaceholderSize + self._bottomPlaceholderSize;
      },

      getShadowPosition: function(self) {
         var
            scrollTop = _private.getScrollTop(self, self._children.content),
            scrollHeight = _private.getScrollHeight(self._children.content),
            containerHeight = _private.getContainerHeight(self._children.content);

         return _private.calcShadowPosition(scrollTop, containerHeight, scrollHeight + self._topPlaceholderSize + self._bottomPlaceholderSize);
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

      calcPagingStateBtn: function (self) {
         const {scrollTop, clientHeight, scrollHeight} = self._children.content;

         if (scrollTop <= 0) {
            self._pagingState.stateUp = 'disabled';
            self._pagingState.stateDown = 'normal';
         } else if (scrollTop + clientHeight >= scrollHeight) {
            self._pagingState.stateUp = 'normal';
            self._pagingState.stateDown = 'disabled';
         } else {
            self._pagingState.stateUp = 'normal';
            self._pagingState.stateDown = 'normal';
         }
      },

      updateDisplayState: function(self, displayState) {
         self._displayState.hasScroll = displayState.hasScroll;
         self._displayState.heightFix = displayState.heightFix;
         self._displayState.contentHeight = displayState.contentHeight;
         self._displayState.shadowPosition = displayState.shadowPosition;
      },

      proxyEvent: function(self, event, eventName, args) {
         // Forwarding bubbling events makes no sense.
         if (!event.propagating()) {
            self._notify(eventName, args);
         }
      }
   },
   Scroll = Control.extend({
      _template: template,

      // Т.к. в VDOM'e сейчас нет возможности сделать компонент прозрачным для событий
      // Или же просто проксирующий события выше по иерархии, то необходимые событие с контента просто пока
      // прокидываем руками
      // EVENTSPROXY
      _tmplNotify: tmplNotify,

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

      _shadowVisiblityMode: null,

      /**
             * @type {Controls/_scroll/Context|null}
       * @private
       */
      _stickyHeaderContext: null,

      _headersHeight: null,
      _scrollbarStyles: '',

      _topPlaceholderSize: 0,
      _bottomPlaceholderSize: 0,

      constructor: function(cfg) {
         Scroll.superclass.constructor.call(this, cfg);
      },

      _beforeMount: function(options, context, receivedState) {
         var
            self = this,
            def;

         this._shadowVisiblityMode = {
            top: 'auto',
            bottom: 'auto'
         }
         this._displayState = {};
         this._stickyHeaderContext = new StickyHeaderContext({
            shadowPosition: options.shadowVisible ? 'bottom' : ''
         });
         this._headersHeight = {
            top: 0,
            bottom: 0
         };

         if (context.ScrollData && context.ScrollData.pagingVisible) {
            //paging buttons are invisible. Control calculates height and shows buttons after mounting.
            this._pagingState = {
               visible: false,
               stateUp: 'disabled',
               stateDown: 'normal'
            };
         } else {
            this._pagingState = {};
         }

         if (receivedState) {
            _private.updateDisplayState(this, receivedState.displayState);
            this._styleHideScrollbar = receivedState.styleHideScrollbar || ScrollWidthUtil.calcStyleHideScrollbar();
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
                  useNativeScrollbar = Env.detection.isMobileIOS || Env.detection.isMobileAndroid;

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

            // При построении на клиенте не возвращаем def, т.к. используется в старых компонентах
            // и там ассинхронного построения
            if (typeof window === 'undefined') {
               return def;
            }
         }
      },

      _afterMount: function() {
         /**
          * Для определения heightFix и styleHideScrollbar может требоваться DOM, поэтому проверим
          * смогли ли мы в beforeMount их определить.
          */
         var needUpdate = false, calculatedOptionValue;

         if (typeof this._displayState.heightFix === 'undefined') {
            this._displayState.heightFix = ScrollHeightFixUtil.calcHeightFix(this._children.content);
            needUpdate = true;
         }

         /**
          * The following states cannot be defined in _beforeMount because the DOM is needed.
          */

         calculatedOptionValue = _private.calcHasScroll(this);
         if (calculatedOptionValue) {
            this._displayState.hasScroll = calculatedOptionValue;
            needUpdate = true;
         }

         this._displayState.contentHeight = _private.getContentHeight(this);

         calculatedOptionValue = _private.getShadowPosition(this);
         if (calculatedOptionValue) {
            this._displayState.shadowPosition = calculatedOptionValue;
            needUpdate = true;
         }

         this._updateStickyHeaderContext();
         this._adjustContentMarginsForBlockRender();

         // Create a scroll container with a "overflow-scrolling: auto" style and then set
         // "overflow-scrolling: touch" style. Otherwise, after switching on the overflow-scrolling: auto,
         // the page will scroll entirely. This solution fixes the problem, but in the old controls the container
         // was created with "overflow-scrolling: touch" style style.
         // A task has been created to investigate the problem more.
         // https://online.sbis.ru/opendoc.html?guid=1c9b807c-41ab-4fbf-9f22-bf8b9fcbdc8d
         if (Env.detection.isMobileIOS) {
            this._overflowScrolling = true;
            needUpdate = true;
         }

         if (needUpdate) {
            this._forceUpdate();
         }
      },

      _beforeUpdate: function(options, context) {
         this._pagingState.visible = context.ScrollData && context.ScrollData.pagingVisible && this._displayState.hasScroll;
         this._updateStickyHeaderContext(options.shadowVisible);
      },

      _afterUpdate: function() {
         var displayState = _private.calcDisplayState(this);

         if (!isEqual(this._displayState, displayState)) {
            this._displayState = displayState;
            if (this._isShadowVisibleMode()) {
               this._displayState.hasScroll = true;
            }
            this._updateStickyHeaderContext();

            this._forceUpdate();
         }
      },

      _isShadowVisibleMode: function() {
         return this._shadowVisiblityMode.top === 'visible' || this._shadowVisiblityMode.bottom === 'visible';
      },

      _shadowVisible: function(position) {
         // Костыль для 320. Разобраться почему стало падать по
         // https://online.sbis.ru/opendoc.html?guid=cd7105de-9c05-4f91-964a-36c7f08765ad
         if (typeof this._displayState.shadowPosition !== 'string') {
            return false;
         }

         // Do not show shadows on the scroll container if there are fixed headers. They display their own shadows.
         if (this._children.stickyController.hasFixed(position)) {
            return false;
         }

         // On ipad with inertial scrolling due to the asynchronous triggering of scrolling and caption fixing  events,
         // sometimes it turns out that when the first event is triggered, the shadow must be displayed,
         // and immediately after the second event it is not necessary.
         // These conditions appear during scrollTop < 0. Just do not display the shadow when scrollTop < 0.
         if (Env.detection.isMobileIOS && position === 'top' && _private.getScrollTop(this, this._children.content) < 0) {
            return false;
         }

         if (this._shadowVisiblityMode[position] === 'visible') {
            return true;
         }

         return this._displayState.shadowPosition.indexOf(position) !== -1;
      },

      _updateShadowMode(event, shadowVisibleObject): void {
         this.setShadowMode(shadowVisibleObject);
      },

      setShadowMode: function(shadowVisibleObject) {
         this._shadowVisiblityMode = shadowVisibleObject;
      },

      setOverflowScrolling: function(value: string) {
          this._children.content.style.webkitOverflowScrolling = value;
      },

      /**
       * Если используем верстку блоков, то на content появится margin-right.
       * Его нужно добавить к margin-right для скрытия нативного скролла.
       * TODO: метод нужно порефакторить. Делаем для сдачи в план, в 600 будет переработано.
       * https://online.sbis.ru/opendoc.html?guid=0cb8e81e-ba7f-4f98-8384-aa52d200f8c8
       */
      _adjustContentMarginsForBlockRender: function() {
         var computedStyle = getComputedStyle(this._children.content);
         var marginTop = parseInt(computedStyle.marginTop, 10);
         var marginRight = parseInt(computedStyle.marginRight, 10);

         this._contentStyles = this._styleHideScrollbar.replace(/-?\d+/g, function(found) {
            return parseInt(found, 10) + marginRight;
         });

         if (this._stickyHeaderContext.top !== -marginTop) {
            this._stickyHeaderContext.top = -marginTop;
            this._stickyHeaderContext.updateConsumers();
         }
      },

      _resizeHandler: function() {
         const displayState = _private.calcDisplayState(this);

         if (!isEqual(this._displayState, displayState)) {
            this._displayState = displayState;
            if (this._isShadowVisibleMode()) {
               this._displayState.hasScroll = true;
            }
         }

         _private.calcPagingStateBtn(this);
      },

      _scrollHandler: function(ev) {
         const scrollTop = _private.getScrollTop(this, this._children.content);
         // Проверяем, изменился ли scrollTop, чтобы предотвратить ложные срабатывания события.
         // Например, при пересчете размеров перед увеличением, плитка может растянуть контейнер между перерисовок,
         // и вернуться к исходному размеру.
         // После этого  scrollTop остается прежним, но срабатывает незапланированный нативный scroll
         if (this._scrollTop !== scrollTop) {
            if (!this._dragging) {
               this._scrollTop = scrollTop;
               this._notify('scroll', [this._scrollTop]);
            }
            this._children.scrollDetect.start(ev);
         }
      },

      _keydownHandler: function(ev) {
         // если сами вызвали событие keydown (горячие клавиши), нативно не прокрутится, прокрутим сами
         if (!ev.nativeEvent.isTrusted) {
            let offset: number;
            const scrollTop: number = _private.getScrollTop(this, this._children.content);
            if (ev.nativeEvent.which === Env.constants.key.pageDown) {
               offset = scrollTop + this._children.content.clientHeight;
            }
            if (ev.nativeEvent.which === Env.constants.key.down) {
               offset = scrollTop + 40;
            }
            if (ev.nativeEvent.which === Env.constants.key.pageUp) {
               offset = scrollTop - this._children.content.clientHeight;
            }
            if (ev.nativeEvent.which === Env.constants.key.up) {
               offset = scrollTop - 40;
            }
            if (offset !== undefined) {
               this.scrollTo(offset);
               ev.preventDefault();
            }

            if (ev.nativeEvent.which === Env.constants.key.home) {
               this.scrollToTop();
               ev.preventDefault();
            }
            if (ev.nativeEvent.which === Env.constants.key.end) {
               this.scrollToBottom();
               ev.preventDefault();
            }
         }
      },

      _scrollbarTaken: function() {
         if (this._showScrollbarOnHover && this._displayState.hasScroll) {
            this._notify('scrollbarTaken', [], { bubbling: true });
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

         this._children.scrollWatcher.doScroll(scrollParam);
      },

      _scrollMoveHandler: function(e, scrollData) {
         if (this._pagingState.visible) {
            if (scrollData.position === 'up') {
               this._pagingState.stateUp = 'disabled';
               this._pagingState.stateDown = 'normal';
            } else if (scrollData.position === 'down') {
               this._pagingState.stateUp = 'normal';
               this._pagingState.stateDown = 'disabled';
            } else {
               this._pagingState.stateUp = 'normal';
               this._pagingState.stateDown = 'normal';
            }
            this._forceUpdate();
         }
      },

      _mouseenterHandler: function(event) {
         this._scrollbarTaken(true);
      },

      _mouseleaveHandler: function(event) {
         if (this._showScrollbarOnHover) {
            this._notify('scrollbarReleased', [], { bubbling: true });
         }
      },

      _scrollbarTakenHandler: function() {
         this._showScrollbarOnHover = false;

         // todo _forceUpdate тут нужен, потому что _showScrollbarOnHover не используется в шаблоне, так что изменение
         // этого свойства не запускает перерисовку. нужно явно передавать это свойство в методы в шаблоне, в которых это свойство используется
         this._forceUpdate();
      },

      _scrollbarReleasedHandler: function(event) {
         if (!this._showScrollbarOnHover) {
            this._showScrollbarOnHover = true;

            // todo _forceUpdate тут нужен, потому что _showScrollbarOnHover не используется в шаблоне, так что изменение
            // этого свойства не запускает перерисовку. нужно явно передавать это свойство в методы в шаблоне, в которых это свойство используется
            this._forceUpdate();
            event.preventDefault();
         }
      },

      _scrollbarVisibility: function() {
         return Boolean(!this._useNativeScrollbar && this._options.scrollbarVisible && this._displayState.hasScroll && this._showScrollbarOnHover);
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

      /**
       * Update the context value of sticky header.
       * TODO: Плохой метод. Дублирование tmpl и вызов должен только в методе изменения видимости тени. Будет поправлено по https://online.sbis.ru/opendoc.html?guid=01c0fb63-9121-4ee4-a652-fe9c329eec8f
       * @param shadowVisible
       * @private
       */
      _updateStickyHeaderContext: function(shadowVisible) {
         var
            shadowPosition = '',
            shadowVisible = { top: false, bottom: false };

         if ((shadowVisible || this._options.shadowVisible) && this._displayState.hasScroll) {
            shadowVisible.top = this._displayState.shadowPosition.indexOf('top') !== -1;
            shadowVisible.bottom = this._displayState.shadowPosition.indexOf('bottom') !== -1;

            if (this._shadowVisiblityMode.top === 'visible') {
               shadowVisible.top = true;
            }
            if (this._shadowVisiblityMode.bottom === 'visible') {
               shadowVisible.bottom = true;
            }
         }

         if (shadowVisible.top) {
            shadowPosition += 'top';
         }
         if (shadowVisible.bottom) {
            shadowPosition += 'bottom';
         }

         if (this._stickyHeaderContext.shadowPosition !== shadowPosition) {
            this._stickyHeaderContext.shadowPosition = shadowPosition;
            this._stickyHeaderContext.updateConsumers();
         }
      },

      _getChildContext: function() {
         return {
            stickyHeader: this._stickyHeaderContext
         };
      },

      getDataId: function() {
               return 'Controls/_scroll/Container';
      },

      /**
       * Скроллит к выбранной позиции. Позиция определяется в пикселях от верха контейнера.
       * @function Controls/_scroll/Container#scrollTo
       * @param {Number} Позиция в пикселях
       */

      /*
       * Scrolls to the given position from the top of the container.
       * @function Controls/_scroll/Container#scrollTo
       * @param {Number} Offset
       */
      scrollTo: function(offset) {
         _private.setScrollTop(this, offset);
      },

      /**
       * Скроллит к верху контейнера
       * @function Controls/_scroll/Container#scrollToTop
       */

      /*
       * Scrolls to the top of the container.
       * @function Controls/_scroll/Container#scrollToTop
       */
      scrollToTop: function() {
         _private.setScrollTop(this, 0);
      },

      /**
       * Скроллит к низу контейнера
       * @function Controls/_scroll/Container#scrollToBottom
       */

      /*
       * Scrolls to the bottom of the container.
       * @function Controls/_scroll/Container#scrollToBottom
       */
      scrollToBottom: function() {
         _private.setScrollTop(this, _private.getScrollHeight(this._children.content) + this._topPlaceholderSize);
      },

      // TODO: система событий неправильно прокидывает аргументы из шаблонов, будет исправлено тут:
      // https://online.sbis.ru/opendoc.html?guid=19d6ff31-3912-4d11-976f-40f7e205e90a
      selectedKeysChanged: function(event) {
         _private.proxyEvent(this, event, 'selectedKeysChanged', Array.prototype.slice.call(arguments, 1));
      },

      excludedKeysChanged: function(event) {
         _private.proxyEvent(this, event, 'excludedKeysChanged', Array.prototype.slice.call(arguments, 1));
      },

      itemClick: function(event) {
         _private.proxyEvent(this, event, 'itemClick', Array.prototype.slice.call(arguments, 1));
      },

      _updatePlaceholdersSize: function(e, placeholdersSizes) {
         if (this._topPlaceholderSize !== placeholdersSizes.top ||
            this._bottomPlaceholderSize !== placeholdersSizes.bottom) {
            this._topPlaceholderSize = placeholdersSizes.top;
            this._bottomPlaceholderSize = placeholdersSizes.bottom;
            this._children.scrollWatcher.updatePlaceholdersSize(placeholdersSizes);
         }
      },

      _saveScrollPosition: function(e) {
         /**
          * Only closest scroll container should react to this event, so we have to stop propagation here.
          * Otherwise we can accidentally scroll a wrong element.
          */
         e.stopPropagation();
         function getScrollTop(element: Element): number {
            const scrollTop = element.scrollTop;
            // scrollTop in MobileIOS at the moment of inertial scrolling and display overflow is equals negative value.
            if (Env.detection.isMobileIOS && scrollTop < 0) {
               return 0;
            }
            return scrollTop;
         }
         // todo KINGO. Костыль с родословной из старых списков. Инерционный скролл приводит к дерганью: мы уже
         // восстановили скролл, но инерционный скролл продолжает работать и после восстановления, как итог - прыжки,
         // дерганья и лишняя загрузка данных.
         // Поэтому перед восстановлением позиции скрола отключаем инерционный скролл, а затем включаем его обратно.
         // https://popmotion.io/blog/20170704-manually-set-scroll-while-ios-momentum-scroll-bounces/
         if (Env.detection.isMobileIOS) {
            this.setOverflowScrolling('auto');
         }
         this._savedScrollTop = getScrollTop(this._children.content);
         this._savedScrollPosition = this._children.content.scrollHeight - this._savedScrollTop;
      },

      _restoreScrollPosition: function(e, removedHeight, direction) {
         /**
          * Only closest scroll container should react to this event, so we have to stop propagation here.
          * Otherwise we can accidentally scroll a wrong element.
          */
         e.stopPropagation();
         if (direction === 'up') {
            this._children.content.scrollTop = this._children.content.scrollHeight - this._savedScrollPosition + removedHeight;
         } else {
            this._children.content.scrollTop = this._savedScrollTop - removedHeight;
         }
         // todo KINGO. Костыль с родословной из старых списков. Инерционный скролл приводит к дерганью: мы уже
         // восстановили скролл, но инерционный скролл продолжает работать и после восстановления, как итог - прыжки,
         // дерганья и лишняя загрузка данных.
         // Поэтому перед восстановлением позиции скрола отключаем инерционный скролл, а затем включаем его обратно.
         // https://popmotion.io/blog/20170704-manually-set-scroll-while-ios-momentum-scroll-bounces/
         if (Env.detection.isMobileIOS) {
            this.setOverflowScrolling('');
         }
      },

      _fixedHandler: function(event, topHeight, bottomHeight) {
         this._headersHeight.top = topHeight;
         this._headersHeight.bottom = bottomHeight;
         this._displayState.contentHeight = _private.getContentHeight(this);
         this._scrollbarStyles =  'top:' + topHeight + 'px; bottom:' + bottomHeight + 'px;';
      }
   });

Scroll.getDefaultOptions = function() {
   return {
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

export = Scroll;

