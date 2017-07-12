define('js!SBIS3.CONTROLS.VirtualScrollController', ['Core/Abstract'],
   function (cAbstract) {

      var BATCH_SIZE = 20;
      var PAGES_COUNT = 5;

      var VirtualScrollController = cAbstract.extend({
         $protected: {
            _options: {
               mode: 'down',
               projection: null,
               viewport: null,
               itemsContainer: null
            },
            _currentVirtualPage: 0,
            _heights: [],
            _newItemsCount: 0,
            _removedItemsCount: 0,
            _notAddedAmount: 0,
            // количество не отображаемых страниц сверху списка
            _scrollableHeight: 0,
            _DEBUG: false,
            _con: null
         },

         init: function () {
            var view = this._options.view;
            VirtualScrollController.superclass.init.call(this);
            // В начале только одна страница
            if (this._options.projection) {
               this._currentWindow = this._getRangeToShow(0, PAGES_COUNT);
            }
            if (this._options.viewport) {
               this._options.viewport[0].addEventListener('scroll', this._scrollHandler.bind(this), { passive: true });
            }
   
            //FIXME заглушка
            this._con = window && window.console;
            if (!this._con) {
               this._con = { log: function () {} };
            }
         },

         reset: function(){
            this._currentVirtualPage = 0;
            this._heights = [];
            this._newItemsCount = 0;
            this._removedItemsCount = 0;
         },

         _scrollHandler: function (e, scrollTop) {
            clearTimeout(this._scrollTimeout);
            this._scrollTimeout = setTimeout(function () {
               var viewportHeight = this._options.viewport.height(), 
                  scrollTop;
               if (this._options.mode == 'down') {
                  scrollTop = this._options.viewport.scrollTop();
               } else {
                  scrollTop = this._options.viewContainer.height() - scrollTop - this._scrollableHeight;
               }
               var page = this._getPage(scrollTop);
               if (this._currentVirtualPage != page) {
                  this._onVirtualPageChange(page);
                  this._currentVirtualPage = page;
               }
            }.bind(this), 0);
         },

         _getPage: function (scrollTop) {
            var height = 0;
            for (var i = 0; i < this._heights.length; i++) {
               height += this._heights[i];
               if (height >= scrollTop) {
                  return Math.floor(i / BATCH_SIZE);
               }
            }
            return Math.floor((this._heights.length - 1) / BATCH_SIZE);
         },

         _onVirtualPageChange: function (pageNumber) {
            var projCount = this._options.projection.getCount(),
               newWindow = this._getRangeToShow(pageNumber, PAGES_COUNT),
               diff = this._getDiff(this._currentWindow, newWindow, projCount);

            if (diff) {   
                  
               if (this._DEBUG) {
                  this._con.log('page', pageNumber);
                  this._con.log('Current widnow:', this._currentWindow[0], this._currentWindow[1], 'New widnow:', newWindow[0], newWindow[1]);
                  this._con.log('add from', diff.add[0], 'to', diff.add[1], 'at', diff.addPosition);
                  this._con.log('add from', diff.remove[0], 'to', diff.remove[1]);
                  this._con.log('displayed from ', newWindow[0], 'to', newWindow[1]);
               }

               var wrappersHeights = this._getWrappersHeight(pageNumber);

               this._notify('onWindowChange', {
                  remove: diff.remove,
                  add: diff.add,
                  addPosition: diff.addPosition,
                  topWrapperHeight: wrappersHeights.begin,
                  bottomWrapperHeight: wrappersHeights.end
               });
            }

            this._currentWindow = newWindow;
         },

         /**
          * Получить высоту распорок
          * @param  {Array} shownPages Массив из номеров первой и последней отображаемых записей
          * @return {Array} Высота верхней и нижней распорок
          */
         _getWrappersHeight: function (pageNumber) {
            var shownRange = this._getRangeToShow(pageNumber, PAGES_COUNT),
               beginHeight = 0,
               endHeight = 0;

            for (var i = 0; i < shownRange[0]; i++) {
               beginHeight += this._heights[i];
            }

            for (i = shownRange[1]; i < this._heights.length; i++) {
               endHeight += this._heights[i];
            }

            if (this._DEBUG) {
               this._con.log('top height', beginHeight);
               this._con.log('bottom height', endHeight);
            }

            return {
               begin: beginHeight, 
               end: endHeight
            };
         },

         /**
          * Получить верхнюю и нижниюю отображаемые страницы
          * @param {Number} page номер страницы
          * @param {Number} pagesCount количество отображаемых страниц
          */
         _getRangeToShow: function(page, pagesCount){
            var 
               //половина страниц
               halfPage = Math.ceil(pagesCount / 2),
               // Нижняя страница - текущая + половина страниц, но не меньше чем количество отображаемых страниц
               bottomPage = page + halfPage < pagesCount ? pagesCount : page + halfPage,
               // Верхняя страница - теущая - половина страниц, но не меньше -1
               topPage = page - halfPage < 0 ? 0 : page - halfPage + 1;
            
            topPage *= BATCH_SIZE;
            bottomPage *= BATCH_SIZE;

            if (bottomPage >= this._heights.length) {
               bottomPage = this._heights.length - 1;
            }

            return [topPage, bottomPage];
         },

         /**
          *                                                                             a      b            c      d
          * @param  {Array} Текущий отображаемый промежуток элементов    [a,c]          |-------------------|       
          * @param  {Array} Новый промежуток элементов                   [b,d]                 |-------------------|
          * @return {Array} Разница между промежутками - два промежутка  [[a,b],[c,d]]  |------|            |------|
          */
         _getDiff: function (currentRange, newRange, count) {
            var top, bottom, diff = {}, addPosition = 0;
            //Если промежутки равны
            if (currentRange[0] == newRange[0] && currentRange[1] == newRange[1]) {
               return false;
            }

            //Если промежутки пересекаются
            if (currentRange[0] < newRange[0]) {
               diff.add = [currentRange[1] + 1, newRange[1]];
               diff.remove = [currentRange[0], newRange[0] - 1];
               addPosition = diff.add[0];
            } else {
               diff.add = [newRange[0], currentRange[0] - 1];
               diff.remove = [newRange[1] + 1, currentRange[1]];
            }

            // Если промежутки не пересекаются
            if (currentRange[1] < newRange[0]) {
               diff.remove = currentRange;
               diff.add = newRange;
               addPosition = diff.add[0];
            }

            // Если промежутки не пересекаются
            if (currentRange[0] > newRange[1]) {
               diff.add = newRange;
               diff.remove = currentRange;
            }

            if (diff.add[0] > count){
               diff.add[0] = count;
            }

            return {
               remove: diff.remove,
               add: diff.add,
               addPosition: addPosition
            };
         },

         /*
          * Пересчет страниц для VirtualScroll
          * Для каждой страницы хранится отступ ее первого элемента от начала списка и состояние dettached удалена из DOM или нет
          * Вызывается на каждый onResizeHandler у родительского списка
          */
         updateVirtualPages: function () {
            var self = this,
               //Учитываем все что есть в itemsContainer (группировка и тд)
               listItems = $('> *', this._options.itemsContainer).filter(':visible'),
               dettachedCount = this._currentWindow[0],
               lastPageStart;

            if (self._options.mode == 'up') {
               listItems = $(listItems.get().reverse());
            }

            lastPageStart = this._heights.length - dettachedCount;

            if (lastPageStart <= listItems.length) {
               this._viewHeight = this._options.viewContainer[0].offsetHeight;
               this._scrollableHeight = this._options.viewport[0].offsetHeight;
            }

            //Считаем оффсеты страниц начиная с последней (если ее нет - сначала)
            listItems.slice(lastPageStart).each(function () {
               self._heights.push(this.offsetHeight);
            });
         },

         _getItemHeight: function(item) {
            var hash = item.getHash();
            return $('[data-hash="' + hash + '"]', this._options.viewContainer).height();
         },

         // Добавление новых элементов, когда они добавляются не через подгрузку по скроллу
         // TODO: пока не работает для элементов которые в данный момент не нужно вставлять в DOM
         addItems: function (items, at) {
            var hash;

            // добавили в начало
            if (at === 0 && this._heights.length !== 0) {
               for (var i = items.length - 1; i >= 0; i--) {
                  this._heights.unshift(this._getItemHeight(items[i]));
               }
            }

            // Пока рассчитываем, что добавляется один элемент за раз
            for (var i = 0; i < items.length; i++) {
               this._heights.push(this._getItemHeight(items[i]));
            }
            
            this._newItemsCount += items.length;
            this._currentWindow[1] += items.length;

            if (this._newItemsCount >= BATCH_SIZE) {
               this._onVirtualPageChange(this._currentVirtualPage);
               this._newItemsCount -= BATCH_SIZE;
            }
         },

         removeItems: function(items, itemsIndex) {
            this._heights.splice(itemsIndex, items.length);
            this._removedItemsCount += items.length;

            if (this._removedItemsCount >= BATCH_SIZE) {
               this._onVirtualPageChange(this._currentVirtualPage);
               this._newItemsCount -= BATCH_SIZE;
            }
         }

      });

      return VirtualScrollController;

   });