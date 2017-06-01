define('js!SBIS3.CONTROLS.VirtualScrollController', ['Core/Abstract'],
   function (cAbstract) {

      var BATCH_SIZE = 20;
      var PAGES_COUNT = 5;

      var VirtualScrollController = cAbstract.extend({
         $protected: {
            _options: {
               mode: 'down',
               projection: null,
               beginWrapper: null,
               endWrapper: null,
               viewport: null,
               itemsContainer: null
            },
            _currentVirtualPage: 0,
            _virtualPages: [0],
            _heights: [],
            _bottomIndex: null,
            _beginWrapperHeight: 0,
            _endWrapperHeight: 0,
            _newItemsCount: 0,
            // высота добавленных элементов
            _notAddedAmount: 0,
            // количество не отображаемых страниц сверху списка
            _dettachedCount: 0,
            _scrollableHeight: 0,
            _DEBUG: true,
         },

         init: function () {
            var view = this._options.view;
            VirtualScrollController.superclass.init.call(this);
            // В начале только одна страница
            if (this._options.projection) {
               this._currentWindow = this._getRangeToShow(0, BATCH_SIZE, 1);
            }
            if (this._options.viewport) {
               this._options.viewport[0].addEventListener('scroll', this._scrollHandler.bind(this), { passive: true });
            }
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
                  return i / BATCH_SIZE >> 0;
               }
            }
            return (this._heights.length - 1) / BATCH_SIZE >> 0;
         },

         _onVirtualPageChange: function (pageNumber) {
            var projCount = this._options.projection.getCount(),
               newWindow = this._getRangeToShow(pageNumber, BATCH_SIZE, PAGES_COUNT, projCount),
               items;

            // разница между промежутками
            var diff = this._getDiff(this._currentWindow, newWindow, projCount);
            
            // нет разницы - нечего делать
            if (!diff) {
               // текущее окно может быть вложенным в новое
               this._currentWindow = newWindow;
               return;
            }

            var direction = this._getDirection(this._currentWindow, newWindow),
               offset = this._newItemsCount ? BATCH_SIZE - newItemsCount : 0;
            
            if (this._DEBUG) {
               console.log('page', pageNumber);
               console.log('Current widnow:', this._currentWindow[0], this._currentWindow[1], 'New widnow:', newWindow[0], newWindow[1]);
               console.log('Scrolling', direction ? 'down' : 'up');
               console.log('diff.top', diff.top);
               console.log('diff.bottom', diff.bottom);
            }

            // удаляем записи
            items = this._getItemsToRemove(direction ? diff.top : diff.bottom, direction ? 0 : offset, projCount);
            if (items.length) {
               this._notify('onItemsRemove', items);
               
               if (this._DEBUG) {
                  console.log('remove from', items[0], 'to', items[items.length - 1]);
               }
            }
            // добавляем записи
            items = this._getItemsToAdd(direction ? diff.bottom : diff.top, direction ? offset : 0, projCount);
            if (items.length) {
               var at = this._getPositionToAdd(diff, direction, this._options.mode);
               this._notify('onItemsAdd', items, at);
               
               if (this._DEBUG) {
                  console.log('add from', items[0], 'to', items[items.length - 1], 'at', at);
               }
            }
            //Меняем высоту распорок
            this._setWrappersHeight(pageNumber);
            this._currentWindow = newWindow;

            if (this._DEBUG) {
               console.log('displayed from ', newWindow[0], 'to', newWindow[1]);
            }
         },

         /**
          * Поучить направление смещения окна
          * @param  {Array}   currentWindow текущее виртуальное окно
          * @param  {Array}   newWindow     новое виртуальное окно
          * @return {Boolean}               true - прокрутка к концу, false - прокрутка к началу
          */
         _getDirection: function(currentWindow, newWindow) {
            return (currentWindow[0] < newWindow[0] || currentWindow[0] > newWindow[1]) && currentWindow[1] > newWindow[0];
         },

         /**
          * Получить положение для вставки в проекцию
          * @param  {Arra} diff         разница промежутков
          * @param  {Boolean} direction направление смещения окна
          * @param  {String} mode       режим работы
          * @return {Number}            позиция вставки
          */
         _getPositionToAdd: function(diff, direction, mode, projCount){
            var at = 0;
            if (direction) {
               if (mode == 'down') {
                  at = diff.bottom[0];
               }
            } else {
               if (mode == 'up') {
                  at = projCount - (diff.top[1] - diff.top[0] + 1);
               }
            }
            return at;
         },

         /**
          * Получить верхнюю и нижниюю отображаемые страницы
          * @param {Number} page номер страницы
          * @param {Number} pagesCount количество отображаемых страниц
          */
         _getShownRange: function(page, pagesCount){
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
          * Получить высоту распорок
          * @param  {Array} shownPages Массив из номеров первой и последней отображаемых записей
          * @return {Array} Высота верхней и нижней распорок
          */
         _calculateWrappersHeight: function (shownPages) {
            var topPage = shownPages[0],
               bottomPage = shownPages[1],
               beginHeight = 0,
               endHeight = 0;

            for (var i = 0; i < topPage; i++) {
               beginHeight += this._heights[i];
            }

            for (i = bottomPage; i < this._heights.length; i++) {
               endHeight += this._heights[i];
            }

            this._beginWrapperHeight = beginHeight;
            this._endWrapperHeight = endHeight; 
            
            if (this._DEBUG) {
               console.log('top height', this._beginWrapperHeight);
               console.log('bottom height', this._endWrapperHeight);
            }

            return {
               begin: beginHeight, 
               end: endHeight
            };
         },

         _setWrappersHeight: function(pageNumber){
            var wrappersHeight = this._calculateWrappersHeight(
                  this._getShownRange(pageNumber, PAGES_COUNT)
               );
            this._options.beginWrapper.height(wrappersHeight.begin);
            this._options.endWrapper.height(wrappersHeight.end);
         },

         /**
          * Удаляет промежуток range записей из списка с отсупом в offset
          * @param  {Array} Промежуток записей
          * @param  {Number} отступ
          * @param  {IList} проекция
          */
         _getItemsToRemove: function (range, offset, count) {
            var toRemove = [],
               from = range[0],
               to = range[1] < count ? range[1] : count,
               index;
            for (var i = from; i <= to; i++) {
               if (this._options.mode == 'down') {
                  index = i;
               } else {
                  index = count - i - 1 + offset;
               }
               toRemove.push(index);
            }
            return toRemove;
         },

         /**
          * Добавляет промежуток range записей в позицию at списка с отсупом в offset
          * @param  {Array} Промежуток записей
          * @param  {Number} отступ
          * @param  {IList} проекция
          */
         _getItemsToAdd: function (range, offset, count) {
            var toAdd = [],
               from = range[0],
               to = range[1] < count ? range[1] : count,
               index;

            offset = offset || this._notAddedAmount;

            for (var i = from; i <= to; i++) {
               if (this._options.mode == 'down') {
                  index = i;
               } else {
                  index = count - i - 1 + offset;
               }
               toAdd.push(index);
            }
            if (this._options.mode == 'up') {
               toAdd.reverse();
            }
            return toAdd;
         },

         _getRangeToShow: function (pageNumber, pageSize, pagesCount, projCount) {
            var range = this._calculateRangeToShow(pageNumber, pageSize, pagesCount);
            // Может добавиться меньше BATCH_SIZE новых элементов, учтем это
            if (range[0] >= BATCH_SIZE && this._newItemsCount) {
               range[0] -= (BATCH_SIZE - this._newItemsCount);
            }

            // Не можем отображать больше чем есть
            if (range[1] > projCount) {
               range[1] = projCount;
            }

            return range;
         },
         
         /**
          * @param  {Number} номер страницы
          * @param  {Number} размер страницы
          * @param  {Number} Количество страниц
          * @return {Array} номера записей в начале и конце этого промежутка страниц
          */
         _calculateRangeToShow: function(pageNumber, pageSize, pagesCount){
            var sidePagesCount = Math.floor(pagesCount / 2),
               toShow;
            if (pageNumber - sidePagesCount < 0) {
               return [0, pagesCount * pageSize - 1];
            }
            return [(pageNumber - sidePagesCount) * pageSize, (pageNumber + sidePagesCount + 1) * pageSize - 1];
         },


         /**
          *                                                                             a      b            c      d
          * @param  {Array} Текущий отображаемый промежуток элементов    [a,c]          |-------------------|       
          * @param  {Array} Новый промежуток элементов                   [b,d]                 |-------------------|
          * @return {Array} Разница между промежутками - два промежутка  [[a,b],[c,d]]  |------|            |------|
          */
         _getDiff: function (currentRange, newRange, count) {
            var top, bottom;
            //Если промежутки равны или вложены
            if (currentRange[0] == newRange[0] && currentRange[1] == newRange[1]) {
               return false;
            }

            // Если промежутки не пересекаются
            if (currentRange[1] < newRange[0]) {
               if (this._options.mode == 'down') {
                  top = newRange;
                  bottom = currentRange;
               } else {
                  top = currentRange;
                  bottom = newRange;
               }
               return {
                  top: top,
                  bottom: bottom
               };
            }

            // Если промежутки не пересекаются
            if (currentRange[0] > newRange[1]) {
               if (this._options.mode == 'down') {
                  top = currentRange;
                  bottom = newRange;
               } else {
                  top = newRange;
                  bottom = currentRange;
               }
               return {
                  top: top,
                  bottom: bottom
               };
            }

            //Если промежутки пересекаются
            if (currentRange[0] < newRange[0]) {
               top = [currentRange[0], newRange[0] - 1];
               bottom = [currentRange[1] + 1, newRange[1]];
            } else {
               top = [newRange[0], currentRange[0] - 1];
               bottom = [newRange[1] + 1, currentRange[1]];
            }

            if (bottom[0] > count){
               bottom[0] = count;
            }

            return {
               top: top,
               bottom: bottom
            };
         },

         _getElementOffset: function (element) {
            element = $(element);
            if (this._options.mode == 'down') {
               return element.position().top + element.outerHeight(true) + this._beginWrapperHeight;
            } else {
               return this._viewHeight - element.position().top;
            }
         },
         /*
          * Пересчет страниц для VirtualScroll
          * Для каждой страницы хранится отступ ее первого элемента от начала списка и состояние dettached удалена из DOM или нет
          * Вызывается на каждый onResizeHandler у родительского списка
          */
         updateVirtualPages: function () {
            var view = this._options.view,
               pageOffset = 0,
               self = this,
               //Учитываем все что есть в itemsContainer (группировка и тд)
               listItems = $('> *', this._options.itemsContainer).filter(':visible'),
               count = 0,
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

         // Добавление новых элементов, когда они добавляются не через подгрузку по скроллу
         // TODO: пока не работает для элементов которые в данный момент не нужно вставлять в DOM
         addItems: function (items, at) {
            var hash;

            // Пока рассчитываем, что добавляется один элемент за раз
            if (items.length == 1) {
               this._currentWindow[1] += 1;
               hash = items[0].getHash();
               var itemHeight = $('[data-hash="' + hash + '"]', this._options.viewContainer).height();
               this._heights.push(itemHeight);
            }

            if (this._newItemsCount == BATCH_SIZE) {
               this._onVirtualPageChange(this._currentVirtualPage);
               this._newItemsCount = 0;
            }
            this._currentWindow[1] += items.length;
         },

         getCurrentRange: function () {
            return this._currentWindow;
         }

      });

      return VirtualScrollController;

   });