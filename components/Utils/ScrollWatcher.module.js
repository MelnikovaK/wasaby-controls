/**
 * Created by ad.chistyakova on 12.11.2015.
 */
define('js!SBIS3.CONTROLS.ScrollWatcher', [], function() {
   'use strict';
   $ws.proto.ScrollWatcher = $ws.proto.Abstract.extend(/** @lends SBIS3.CONTROLS.ScrollWatcher.prototype */{
      /**
       * @event onScroll Событие проиходит, когда срабатывает проверка на скроллею Например, когда достигли низа страницы
       * @remark
       *
       * @param {$ws.proto.EventObject} eventObject Дескриптор события.
       * @param {String} type - какое именно событие произошло. Достигли дна окна, контейнера, всплывающей панели.
       * Или это наоборот доскроллили вверх
       * @param {jQuery} event - то самое соыбтие scroll, на которое подписан ScrollWatcher
       * @example
       * <pre>
       *     ScrollWatcher.subscribe('onScroll', function(event, type) {
       *        if (type === 'bottom') {
       *          $ws.core.alert('Вы достигли дна');
       *        }
       *     });
       * </pre>
       */
      $protected: {
         _options: {
            /**
             * @cfg {jQuery} У какого элемента отслеживат скролл.
             * @remark
             * Если не передать, то подписка на скролл будет у window
             */
            element : undefined,
            /**
             * @cfg {Control} Контрол, от которого отслеживается скролл.
             * @remark
             * По нему будем искать находимся ли мы на floatArea.
             *
             */
            opener: undefined,
            /**
             * @cfg {Number} Определитель нижней границы. Если передать число > 0 то событие с типом "Достигли дна(до скроллили до низа\верха страницы)"
             * будет срабатывать на checkOffset px раньше
             */
            checkOffset : 0
         },
         _type : 'window',                      //Тип "Отслеживателя": container, window, floatArea
         _isScrollUp: false,                       //Проверка, в какую сторону scroll. Первый скролл вверх не может быть.
         _lastScrollTop: 0,                        //Последний сохраненный скролл
         _scrollingContainer: undefined,
         _onWindowScrollHandler : undefined,
         _floatAreaScrollHandler : undefined,
         _onContainerScrollHandler: undefined
      },

      $constructor: function() {
         var self = this,
             opener = this.getOpener(),
             topParent;
         this._publish('onScroll', 'onScrollMove');
         this._scrollingContainer = this._options.element;
         this._type = (this._options.element ? 'container' : 'window');
         if (opener){
            topParent = opener.getTopParent();
            //Если уже определен тип отслежтивания в контейнере, то это имеет большее значение, чем то, находимся ли мы на floatArea или нет.
            this._type = $ws.helpers.instanceOfModule(topParent, 'SBIS3.CORE.FloatArea') && this._inWindow() ? 'floatArea' : this._type;
         }
         if (this._type === 'window'){
            var scrollingContent = $('.ws-body-scrolling-content');
            if (scrollingContent && scrollingContent.length){
               this._scrollingContainer = scrollingContent;
               this._type = 'container';
            }
         }

         //В зависимости от настроек высоты подписываемся либо на скролл у окна, либо у контейнера
         if (this._inContainer()) {
            this._onContainerScrollHandler =  this._onContainerScroll.bind(this);
            this._scrollingContainer.bind('scroll', this._onContainerScrollHandler);

         } else if (this._inWindow()) {
            this._onWindowScrollHandler = this._onWindowScroll.bind(this);
            $(window).bind('scroll', this._onWindowScrollHandler);

         } else {//inFloatArea
            //Если браузер лежит на всплывающей панели и имеет автовысоту, то скролл появляется у контейнера всплывашки (.parent())
            this._floatAreaScrollHandler = this._onFAScroll.bind(this);
            topParent.subscribe('onScroll', this._floatAreaScrollHandler);
            topParent.subscribe('onDestroy', function(){
               self.destroy();
            });
         }

      },
      getOpener : function(){
         return this._options.opener;
      },
      _getContainer: function(){
         return this._scrollingContainer || (this._inWindow() ?  $('body') : this.getOpener().getTopParent().getContainer().closest('.ws-scrolling-content'));
      },
      _inFloatArea: function(){
         return this._type === 'floatArea';
      },
      _inContainer: function(){
         return this._type === 'container';
      },
      _inWindow: function(){
         return this._type === 'window';
      },
      /**
       * Точка соприкосновения всех подписанных скроллов
       * Здесь проиходяит проверки - куда поскроллили, вызываются пользовательские функции проверки
       * @param isBottom Проверка на то, находимся ли мы внизу страницы. При этом isScrollUp не учитывается, потому что мы просто
       * вычисляем.
       * @param {number} curScrollTop - текущее положение скролла
       * @private
       */
      _processScrollEvent: function (isBottom, curScrollTop) {
         this._defineScrollDirection(curScrollTop);
         this._notify('onScrollMove', curScrollTop);
         if (this._isScrollUp ) {
            if (this._isOnTop()) {
               this._notify('onScroll', 'top', curScrollTop);
            }
         } else if (isBottom) {
            this._notify('onScroll', 'bottom', curScrollTop);
         }
      },
      _defineScrollDirection : function(curScrollTop){
         //Это значит вызываем с тем же значением - перепроверять не надо.
         if (this._lastScrollTop === curScrollTop) {
            return;
         }
         this._isScrollUp = this._lastScrollTop > curScrollTop;
         this._lastScrollTop = curScrollTop;
      },
      _onWindowScroll: function (event) {
         var docBody = document.body,
               docElem = document.documentElement,
               clientHeight = $(window).height(),
               scrollTop = Math.max(docBody.scrollTop, docElem.scrollTop),
               scrollHeight = Math.max(docBody.scrollHeight, docElem.scrollHeight);
         this._processScrollEvent((clientHeight + scrollTop  >= scrollHeight - this._options.checkOffset), scrollTop);
      },
      _onFAScroll: function(event, scrollOptions) {
         this._processScrollEvent(scrollOptions.clientHeight + scrollOptions.scrollTop  >= scrollOptions.scrollHeight - this._options.checkOffset, scrollOptions.scrollTop);
      },
      _onContainerScroll: function (event) {
         var elem = event.target;
         //если высота скролла меньше чем высота контейнера с текущим scrollTop, то мы где-то внизу.
         //offsetHeight - высота контейнра, scrollHeight - вся высота скролла,
         //elem.clientHeight === elem.offsetHeight если где-то не будет соблюдаться, то нужно взять offsetHeight
         this._processScrollEvent(elem.clientHeight + elem.scrollTop >= elem.scrollHeight - this._options.checkOffset, elem.scrollTop);
      },
      _isOnTop : function(){
         return this._isScrollUp && (this._lastScrollTop <= this._options.checkOffset);
      },

      getScrollableContainer: function() {
         return this._getContainer();
      },

      getScrollContainer: function(element){
         var scrollable;
         if (this._inContainer() && this._scrollingContainer.length){
            return this._scrollingContainer[0];
         }
         if (this._inWindow()){
            if (element) {
               scrollable = element.closest('.ws-scrolling-content');
               if (scrollable.length) {
                  return scrollable[0];
               }
               return element[0];
            }
            var scrollingConainer = document.getElementsByClassName('ws-body-scrolling-content');
            if (scrollingConainer.length){
               return document.getElementsByClassName('ws-body-scrolling-content');
            } else {
               return document.body;
            }
         }
         if (this._inFloatArea()) {
            return this.getOpener().getTopParent().getContainer().closest('.ws-scrolling-content')[0];
         }
      },

      /**
       * Проскроллить в контейнере
       * @param {String|Number} offset куда или насколько скроллить.
       * @variant top - доскроллить до верха контейнера
       * @variant bottom - доскроллить до низа контейнера
       * @variant {Number} - поскроллить на указанную величину
       */
      scrollTo:function(offset){
         var scrollable = this._getContainer();
         scrollable.scrollTop(typeof offset === 'string' ? (offset === 'top' ? 0 : scrollable[0].scrollHeight) : offset);
      },
      /**
       * Получить текущую высоту скролла отслеживаемого элемента
       * @returns {*}
       */
      getScrollHeight: function(element){
         return this.getScrollContainer(element).scrollHeight;
      },
      /**
       * Получить текущую высоту скроллируемого контейнера
       * @returns {Number}
       */
      getContainerHeight: function(){
         if (this._inContainer() && this._scrollingContainer.length){
            return this._scrollingContainer[0].offsetHeight;
         }
         if (this._inWindow()){
            return $(window).height();
         }
         if (this._inFloatArea()) {
            return this.getOpener().getTopParent().getContainer().closest('.ws-scrolling-content').height();
         }
      },
      /**
       * Есть ли у скроллируемого элемента скролл (т.е. данные, вылезшие за пределы контейнера по высоте)
       * @param {jQuery} element блок элемента, в котором работает отслеживание скролла (контейнер контрола например)
       * @returns {boolean}
       */
      hasScroll: function(element, offset){
         var scrollHeight = this.getScrollHeight(element);
         return scrollHeight > this.getContainerHeight() + offset || scrollHeight > $(window).height() + offset;
      },
      destroy: function(){
         if (this._inWindow()) {
            $(window).unbind('scroll', this._onWindowScrollHandler);
            this._onWindowScrollHandler = undefined;
         }
         $ws.proto.ScrollWatcher.superclass.destroy.call(this);
      }

   });
   return  $ws.proto.ScrollWatcher;
});