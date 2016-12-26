define('js!SBIS3.CONTROLS.ScrollContainer', [
      'js!SBIS3.CONTROLS.CompoundControl',
      'js!SBIS3.CONTROLS.Scrollbar',
      'html!SBIS3.CONTROLS.ScrollContainer',
      'Core/detection',
      'js!SBIS3.CORE.FloatAreaManager'
   ],
   function(CompoundControl, Scrollbar, dotTplFn, cDetection, FloatAreaManager) {

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
       * <pre class="brush: html">
       *    <component data-component="SBIS3.CONTROLS.ScrollContainer" class="myScrollContainer">
       *       <option name="content">
       *          <component data-component="SBIS3.CONTROLS.ListView">
       *             <option name="displayField">title</option>
       *             <option name="keyField">id</option>
       *             <option name="infiniteScroll">down</option>
       *             <option name="infiniteScrollContainer">.myScrollContainer</option>
       *             <option name="pageSize">7</option>
       *          </component>
       *       </option>
       *    </component>
       * </pre>
       *
       * @cssModifier controls-ScrollContainer__light Устанавливает светлый тонкий скролл
       *
       * @control
       * @public
       */
      var ScrollContainer = CompoundControl.extend({ /** @lends SBIS3.CONTROLS.ScrollContainer.prototype */

         _dotTplFn: dotTplFn,

         $protected: {
            _options: {
               /**
                * @cfg {Content} Контент в ScrollContainer
                * @remark
                * Контент в ScrollContainer - это пользовательская верстка, которая будет скроллироваться.
                * @example
                * <pre class="brush: html">
                *    <option name="content">
                *       <component data-component="SBIS3.CONTROLS.ListView">
                *          <option name="displayField">title</option>
                *          <option name="keyField">id</option>
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
            },
            _content: null
         },

         $constructor: function() {
            // Что бы при встаке контрола (в качетве обертки) логика работы с контекстом не ломалась,
            // сделаем свой контекст прозрачным
            this._context = this._context.getPrevious();
         },

         _modifyOptionsAfter: function(finalConfig) {
            delete finalConfig.content;
         },

         init: function() {
            ScrollContainer.superclass.init.call(this);
            this._content = $('.controls-ScrollContainer__content', this.getContainer());
            //Под android оставляем нативный скролл
            if (!cDetection.isMobileSafari && !cDetection.isMobileAndroid){
               this._initScrollbar = this._initScrollbar.bind(this);
               if (!cDetection.isIE8){
                  this._container[0].addEventListener('touchstart', this._initScrollbar, true);
               }
               this._container.one('mousemove', this._initScrollbar);
               this._hideScrollbar();
               this._subscribeOnScroll();
            }

            // Что бы до инициализации не было видно никаких скроллов
            this._content.removeClass('controls-ScrollContainer__content-overflowHidden');

            // task: 1173330288
            // im.dubrovin по ошибке необходимо отключать -webkit-overflow-scrolling:touch у скролл контейнеров под всплывашками
            FloatAreaManager._scrollableContainers[this.getId()] = this.getContainer().find('.controls-ScrollContainer__content');
         },

         _subscribeOnScroll: function(){
            this._content.on('scroll', this._onScroll.bind(this));
         },

         _onScroll: function(){
            if (this._scrollbar){
               this._scrollbar.setPosition(this._getScrollTop());
            }
         },

         _hideScrollbar: function(){
            if (!cDetection.safari && !cDetection.chrome){
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
            ScrollContainer.superclass._onResizeHandler.apply(this, arguments);
            if (this._scrollbar){
               this._scrollbar.setContentHeight(this._getScrollHeight());
               this._scrollbar.setPosition(this._getScrollTop());
            }
         },

         _getScrollTop: function(){
            return this._content[0].scrollTop;
         },

         _scrollTo: function(value){
            this._content[0].scrollTop = value;
         },

         _initScrollbar: function(){
            this._scrollbar = new Scrollbar({
               element: $('.controls-ScrollContainer__scrollbar', this._container),
               contentHeight: this._getScrollHeight(),
               parent: this
            });
            if (!cDetection.isIE8){
               this._container[0].removeEventListener('touchstart', this._initScrollbar);
            }
            this.subscribeTo(this._scrollbar, 'onScrollbarDrag', this._scrollbarDragHandler.bind(this));
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
            this._content.off('scroll', this._onScroll);
            this._container.off('mousemove', this._initScrollbar);
            ScrollContainer.superclass.destroy.call(this);
            // task: 1173330288
            // im.dubrovin по ошибке необходимо отключать -webkit-overflow-scrolling:touch у скролл контейнеров под всплывашками
            delete $ws.single.FloatAreaManager._scrollableContainers[ this.getId() ];
         }
      });

      return ScrollContainer;
   });
