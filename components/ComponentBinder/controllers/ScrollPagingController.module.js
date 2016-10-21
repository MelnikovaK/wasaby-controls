define('js!SBIS3.CONTROLS.ScrollPagingController', ['js!SBIS3.StickyHeaderManager', "Core/Abstract", "Core/core-instance"], function(StickyHeaderManager, cAbstract, cInstance) {

   var ScrollPagingController = cAbstract.extend({
      $protected: {
         _options: {
            view: null,
            paging: null
         },
         _scrollPages: [], // Набор страниц для скролл-пэйджина
         _pageOffset: 0, // offset последней страницы
         _currentScrollPage: 1,
         _windowResizeTimeout: null
      },

      bindScrollPaging: function(paging) {
         var view = this._options.view, self = this;
         paging = paging || this._options.paging;
         var isTree = cInstance.instanceOfMixin(view, 'SBIS3.CONTROLS.TreeMixin');

         if (isTree){
            view.subscribe('onSetRoot', function(){
               var curRoot = view.getCurrentRoot();
               if (this._currentRoot !== curRoot){
                  this._options.paging.setPagesCount(0);
                  this.updateScrollPages(true);
                  this._currentRoot = curRoot;
               }
            }.bind(this));

            view.subscribe('onNodeExpand', function(){
               this.updateScrollPages(true);
            }.bind(this));
         }

         paging.subscribe('onLastPageSet', this._scrollToLastPage.bind(this));

         paging.subscribe('onSelectedItemChange', function(e, pageNumber){
            var scrollToPage = function(page){
               // Если первая страница - проскролим к самому верху, не считая оффсет
               var offset = page.offset ? this._offsetTop : 0;
               view._scrollWatcher.scrollTo(page.offset + offset);
            }.bind(this);
            if (pageNumber != this._currentScrollPage && this._scrollPages.length){
               var view = this._options.view,
                  page = this._scrollPages[pageNumber - 1];
                  if (page){
                     scrollToPage(page);
                  } else {
                     view.once('onDrawItems', function(){
                        this.updateScrollPages();
                        page = this._scrollPages[pageNumber - 1];
                        scrollToPage(page);
                     }.bind(this));
                     view._scrollLoadNextPage();
                  }
               this._currentScrollPage = pageNumber;
            }
         }.bind(this));

         view.subscribe('onScrollPageChange', function(e, page){
            var newKey, curKey,
               paging = this._options.paging;
            if (page >= 0 && paging.getItems()) {
               newKey = page + 1;
               curKey = parseInt(paging.getSelectedKey(), 10);
               if (curKey != newKey) {
                  if (newKey > paging.getItems().getCount()) {
                     paging.setPagesCount(newKey);
                  }
                  this._currentScrollPage = newKey;
                  paging.setSelectedKey(newKey);
               }
            }
         }.bind(this));

         $(window).on('resize.wsScrollPaging', this._resizeHandler.bind(this));
      },

      _scrollToLastPage: function(){
         this._options.view.setPage(-1);
      },

      _isPageStartVisisble: function(page){
         return page.element.offset().top + page.element.outerHeight(true) >= 0
      },

      _resizeHandler: function(){
         var windowHeight = $(window).height();
         clearTimeout(this._windowResizeTimeout);
         if (this._windowHeight != windowHeight){
            this._windowHeight = windowHeight;
            this._windowResizeTimeout = setTimeout(function(){
               this.updateScrollPages(true);
            }.bind(this), 200);
         }
      },

      getScrollPage: function(){
         var view = this._options.view;
         if (this._options.view.isScrollOnBottom(true)){
            return this._scrollPages.length - 1;
         }
         for (var i = 0; i < this._scrollPages.length; i++){
            var page = this._scrollPages[i];
            if (this._isPageStartVisisble(page)){
               return i;
            }
         }
      },

      updateScrollPages: function(reset){
         var view = this._options.view;
         var viewportHeight = $(view._scrollWatcher.getScrollContainer()).height(),
            pageHeight = 0,
            lastPageStart = 0,
            self = this,
            //Учитываем все что есть в itemsContainer (группировка и тд)
            listItems = $('> *', view._getItemsContainer()).filter(':visible'),
            stickyHeaderHeight = StickyHeaderManager.getStickyHeaderHeight(view.getContainer()) || 0;

            //Если элементов в верстке то нечего и считать
            if (!listItems.length){
               this._options.paging.setVisible(false);
               return;
            }

            // Нужно учитывать отступ от родителя, что бы правильно скроллить к странице
            if (!this._offsetTop){
               this._offsetTop = self._options.view._getItemsContainer().get(0).getBoundingClientRect().top; //itemsContainerTop - containerTop + self._options.view.getContainer().get(0).offsetTop;
            }
         //Сбрасываем все для пересчета
         if (reset){
            this._scrollPages = [];
            self._pageOffset = 0;
         }
         //Берем последнюю посчитаную страницу, если она есть
         if (this._scrollPages.length){
            lastPageStart = this._scrollPages[this._scrollPages.length - 1].element.index();
         } else {
            //Запушим первый элемент, если он есть
            var element = listItems.eq(0);
            if (view.getItems() && view.getItems().getCount() && element.length){
               this._scrollPages.push({
                  element: element,
                  offset: self._pageOffset
               })
            }
         }
         //Считаем оффсеты страниц начиная с последней (если ее нет - сначала)
         listItems.slice(lastPageStart ? lastPageStart + 1 : 0).each(function(){
            var $this = $(this),
               nextHeight = $this.next('.controls-ListView__item').outerHeight(true);
            pageHeight += $this.outerHeight(true);
            // Если набралось записей на выстору viewport'a добавим еще страницу
            // При этом нужно учесть отступ сверху от view и фиксированую шапку
            var offsetTop = self._scrollPages.length == 1 ? self._offsetTop : stickyHeaderHeight;
            if (pageHeight + nextHeight > viewportHeight - offsetTop) {
               self._pageOffset += pageHeight;
               self._scrollPages.push({
                  element: $this,
                  offset: self._pageOffset - stickyHeaderHeight
               });
               pageHeight = 0;
            }
         });

         var pagesCount = this._scrollPages.length;

         if (pagesCount > 1){
            this._options.view.getContainer().css('padding-bottom', '32px');
         }
         if (this._options.paging.getSelectedKey() > pagesCount){
            this._options.paging._options.selectedKey = pagesCount;
         }
         this._options.paging.setPagesCount(pagesCount);

         //Если есть страницы - покажем paging
         this._options.paging.setVisible(pagesCount > 1);
      },

      destroy: function(){
         $(window).off('resize.wsScrollPaging');
         ScrollPagingController.superclass.destroy.apply(this, arguments);
      }

   });

   return ScrollPagingController;

});