define('js!SBIS3.CONTROLS.ScrollContainer', [
      'Core/core-extend',
      "Core/Abstract.compatible",
      'js!SBIS3.CORE.Control/Control.compatible',
      "js!SBIS3.CORE.AreaAbstract/AreaAbstract.compatible",
      'js!SBIS3.CORE.BaseCompatible',
      'tmpl!SBIS3.CONTROLS.ScrollContainer',
      'js!SBIS3.CONTROLS.Scrollbar',
      'Core/detection',
      'Core/core-functions',
      'js!SBIS3.CORE.FloatAreaManager',
      'js!SBIS3.StickyHeaderManager',
      "Core/core-instance",
      'Core/compatibility',
      'Core/constants',
      'css!SBIS3.CONTROLS.ScrollContainer'
   ],
   function (extend,
             AbstractCompatible,
             ControlCompatible,
             AreaAbstractCompatible,
             BaseCompatible,
             template,
             Scrollbar,
             cDetection,
             functions,
             FloatAreaManager,
             StickyHeaderManager,
             cInstance,
             compatibility,
             constants) {
      'use strict';


      /**
       * Контрол представляющий из себя контейнер для контента с тонким скроллом.
       * Тонкий скролл {@link SBIS3.CONTROLS.Scrollbar}
       *
       * @class SBIS3.CONTROLS.ScrollContainer
       * @demo SBIS3.CONTROLS.Demo.MyScrollContainer
       * @extends SBIS3.CONTROLS.CompoundControl
       * @author Крайнов Дмитрий Олегович
       *
       * @example
       * Использование ScrollContainer с вложенным в него ListView, и настройкой автоподгрузки вниз.
       * @remark Для  работы ScrollContainer требуется установить height или max-height.
       * Если установить height, то тонкий скролл появится, когда высота контента станет больше установленной
       * вами высоты ScrollContainer. Если установить max-height, то ScrollContainer будет растягивать по
       * мере увеличения контента. Когда размер контента превысит max-height, тогда появится тонкий скролл.
       * <pre class="brush: html">
       *    <component data-component="SBIS3.CONTROLS.ScrollContainer" class="myScrollContainer">
       *       <option name="content">
       *          <component data-component="SBIS3.CONTROLS.ListView">
       *             <option name="displayProperty">title</option>
       *             <option name="idProperty">id</option>
       *             <option name="infiniteScroll">down</option>
       *             <option name="infiniteScrollContainer">.myScrollContainer</option>
       *             <option name="pageSize">7</option>
       *          </component>
       *       </option>
       *    </component>
       * </pre>
       *
       * @cssModifier controls-ScrollContainer__light Устанавливает светлый тонкий скролл
       * @cssModifier controls-ScrollContainer__hiddenScrollbar Скрыть ползунок
       *
       * @control
       * @public
       *
       * @initial
       * <component data-component='SBIS3.CONTROLS.ScrollContainer' name="MyScrollContainer>
       *     <option name="content">
       *         <component data-component="SBIS3.CONTROLS.ListView" name="ContentList">
       *             <option name="idProperty">key</option>
       *             <option name="displayProperty">title</option>
       *         </component>
       *     </option>
       * </component>
       */
      var ScrollContainer = extend.extend([AbstractCompatible, ControlCompatible, AreaAbstractCompatible, BaseCompatible], {
         _template: template,

         _controlName: 'SBIS3.CONTROLS.ScrollContainer',
         _useNativeAsMain: true,
         _doNotSetDirty: true,

         constructor: function (cfg) {

            this._options = {
               /**
                * @cfg {Content} Контент в ScrollContainer
                * @remark
                * Контент в ScrollContainer - это пользовательская верстка, которая будет скроллироваться.
                * @example
                * <pre class="brush: html">
                *    <option name="content">
                *       <component data-component="SBIS3.CONTROLS.ListView">
                *          <option name="displayProperty">title</option>
                *          <option name="idProperty">id</option>
                *          <option name="infiniteScroll">down</option>
                *          <option name="infiniteScrollContainer">.controls-Scroll__container</option>
                *          <option name="pageSize">7</option>
                *       </component>
                *    </option>
                * </pre>
                * @see getContent
                */
               content: '',
               /**
                * @cfg {Boolean} Включает фиксацию заголовоков в рамках контенера ScrollContainer
                */
               stickyContainer: false,

               activableByClick: false
            };
            this._content = null;
            this._headerHeight = 0;
            this.deprecatedContr(cfg);
            // Что бы при встаке контрола (в качетве обертки) логика работы с контекстом не ломалась,
            // сделаем свой контекст прозрачным
            if (cfg.parent && cfg.parent._template) {
               /** Если scrollContainer вставлен в старое окружение, ему позже будет установлен
                * правильный контекст, а сейчас ссылку на текущий терять нельзя
                */
               this._craftedContext = false;
               this._context = this._context.getPrevious();
            }
         },

         _containerReady: function() {
            var showScrollbar;
            if (window && this._container && (typeof this._container.length === "number")) {

               this._content = $('> .controls-ScrollContainer__content', this.getContainer());
               showScrollbar = !(cDetection.isMobileIOS || cDetection.isMobileAndroid || compatibility.touch && cDetection.isIE);
               this._bindOfflainEvents();
               //Под android оставляем нативный скролл
               if (showScrollbar){
                  this._hideScrollbar = this._hideScrollbar.bind(this);
                  this._touchStartHandler = this._touchStartHandler.bind(this);
                  this._initScrollbar = this._initScrollbar.bind(this);
                  this._container[0].addEventListener('touchstart', this._touchStartHandler, true);
                  this._container.one('mousemove', this._initScrollbar);
                  this._container.one('wheel', this._initScrollbar);
                  if (cDetection.IEVersion >= 10) {
                     // Баг в ie. При overflow: scroll, если контент не нуждается в скроллировании, то браузер добавляет
                     // 1px для скроллирования и чтобы мы не могли скроллить мы отменим это действие.
                     this._content[0].onmousewheel = function(event) {
                        if (this._content[0].scrollHeight - this._content[0].offsetHeight === 1) {
                           event.preventDefault();
                        }
                     }.bind(this);
                  }
                  this._hideNativeScrollbar();
               }
               this._subscribeOnScroll();

               // Что бы до инициализации не было видно никаких скроллов
               this._content.removeClass('controls-ScrollContainer__content-overflowHidden');

               // task: 1173330288
               // im.dubrovin по ошибке необходимо отключать -webkit-overflow-scrolling:touch у скролл контейнеров под всплывашками
               FloatAreaManager._scrollableContainers[this.getId()] = this.getContainer().find('.controls-ScrollContainer__content');
            }
         },

         _touchStartHandler: function() {
            this._initScrollbar();
            this._showScrollbar();
         },

         _initScrollbar: function(){
            if (!this._scrollbar) {
               this._scrollbar = new Scrollbar({
                  element: $('> .controls-ScrollContainer__scrollbar', this._container),
                  contentHeight: this._getScrollHeight(),
                  parent: this
               });

               this.subscribeTo(this._scrollbar, 'onScrollbarDrag', this._scrollbarDragHandler.bind(this));
            }
         },

         // Показать скролл на touch устройствах
         _showScrollbar: function() {
            // Покажем скролл и подпишемся на touchend чтобы его снять. Подписываемся у document, потому что палец может
            // уйти с элемента, но при этом скроллинг продолжается.
            this._container.toggleClass('controls-ScrollContainer__showScrollbar', true);
            document.addEventListener('touchend', this._hideScrollbar, true);
         },

         //Скрыть скролл на touch устройствах
         _hideScrollbar: function() {
            // Скроем скролл и отпишемся от touchend.
            this._container.toggleClass('controls-ScrollContainer__showScrollbar', false);
            document.removeEventListener('touchend', this._hideScrollbar);
         },

         setContext: function(ctx){
            BaseCompatible.setContext.call(this, ctx);
            /**
             * Добавим проксирование данных для EngineBrowser
             * Этот костыль будет выпилен в 3.17.20
             */
            if (this.getParent()) {
               var selfCtx = this._context,
                  prevContext = this._context.getPrevious();
               this._context.subscribe('onFieldChange', function (ev, name, value) {
                  if (this.getValueSelf(name) !== undefined) {
                     if (prevContext.getValueSelf(name) !== value) {
                        prevContext.setValue(name, value);
                     }
                  }
               });

               this._context.subscribe('onFieldRemove', function (ev, name, value) {
                  if (prevContext.getValueSelf(name) !== undefined) {
                     prevContext.removeValue(name);
                  }
               });

               prevContext.subscribe('onFieldChange', function (ev, name, value) {
                  if (prevContext.getValueSelf(name) !== undefined) {
                     if (selfCtx.getValueSelf(name) !== value) {
                        selfCtx.setValue(name, value);
                     }
                  }
               });

               prevContext.subscribe('onFieldRemove', function (ev, name, value) {
                  if (selfCtx.getValueSelf(name) !== undefined) {
                     selfCtx.removeValue(name);
                  }
               });
            }
         },

         _subscribeOnScroll: function(){
            this._content.on('scroll', this._onScroll.bind(this));
         },

         _onScroll: function(event) {
            var scrollTop = this._getScrollTop();

            if (this._scrollbar){
               this._scrollbar.setPosition(scrollTop);
            }
            this.getContainer().toggleClass('controls-ScrollContainer__top-gradient', scrollTop > 0);
         },

         _hideNativeScrollbar: function(){
            if (!cDetection.webkit && !cDetection.chrome){
               var style = {
                     marginRight: -this._getBrowserScrollbarWidth()
                  };
               this._content.css(style);
            }
         },

         _getBrowserScrollbarWidth: function() {
            var outer, outerStyle, scrollbarWidth;
            outer = document.createElement('div');
            outerStyle = outer.style;
            outerStyle.position = 'absolute';
            outerStyle.width = '100px';
            outerStyle.height = '100px';
            outerStyle.overflow = 'scroll';
            outerStyle.top = '-9999px';
            document.body.appendChild(outer);
            scrollbarWidth = outer.offsetWidth - outer.clientWidth;
            document.body.removeChild(outer);
            return scrollbarWidth;
          },

         _scrollbarDragHandler: function(event, position){
            if (position != this._getScrollTop()){
               this._scrollTo(position);
            }
         },

         _onResizeHandler: function(){
            var headerHeight, scrollbarContainer;
            AreaAbstractCompatible._onResizeHandler.apply(this, arguments);
            if (this._scrollbar){
               this._scrollbar.setContentHeight(this._getScrollHeight());
               this._scrollbar.setPosition(this._getScrollTop());
               if (this._options.stickyContainer) {
                  headerHeight = StickyHeaderManager.getStickyHeaderHeight(this._content);
                  if (this._headerHeight !== headerHeight) {
                     scrollbarContainer = this._scrollbar._container;
                     this._headerHeight = headerHeight;
                     scrollbarContainer.css('margin-top', headerHeight);
                     //У scrollbar изначально стоит height(calc(100% - 8px)). Поэтому нужно учесть эти 8px.
                     headerHeight += 8;
                     scrollbarContainer.height('calc(100% - ' + headerHeight + 'px)');
                  }
               }
            }
         },

         _getScrollTop: function(){
            return this._content[0].scrollTop;
         },

         _scrollTo: function(value){
            this._content[0].scrollTop = value;
         },

         _getScrollHeight: function(){
            var height;
            height = this._content[0].scrollHeight;
            // Баг в IE версии 10 и старше, если повесить стиль overflow-y:scroll, то scrollHeight увеличивается на 1px,
            // поэтому мы вычтем его.
            if (cDetection.IEVersion >= 10) {
               height -= 1;
            }
            // TODO: придрот для правильного рассчета с модификатором __withHead
            // он меняет высоту скроллабара - из за этого получаются неверные рассчеты
            // убрать вместе с этим модификатором, когда будет шаблон страницы со ScrollContainer и фиксированой шапкой
            if (this.getContainer().hasClass('controls-ScrollContainer__withHead')){
               height -= 24;
            }
            return height;
         },

         destroy: function(){
            if (this._content) {
               this._content.off('scroll', this._onScroll);
            }
            this._container.off('mousemove', this._initScrollbar);
            this._container[0].removeEventListener('touchstart', this._touchStartHandler);

            BaseCompatible.destroy.call(this);
            // task: 1173330288
            // im.dubrovin по ошибке необходимо отключать -webkit-overflow-scrolling:touch у скролл контейнеров под всплывашками
            delete FloatAreaManager._scrollableContainers[ this.getId() ];
         },
         //region retail_offlain
         _bindOfflainEvents: function() {
            if (constants.browser.retailOffline) {
               this._content[0].addEventListener('touchstart', function (event) {
                  this._startPos = this._content.scrollTop() + event.targetTouches[0].pageY;
               }.bind(this), true);
               // На движение пальцем - сдвигаем положение
               this._content[0].addEventListener('touchmove', function (event) {
                  this._moveScroll(this._startPos - event.targetTouches[0].pageY);
                  event.preventDefault();
               }.bind(this));
            }
         },
         _moveScroll: function(top) {
            this._content.scrollTop(top);
         }
         //endregion retail_offlain
      });

      return ScrollContainer;
   });
