define('Controls/Controllers/QueryParamsController/Page',
   ['Core/core-simpleExtend', 'Types/source'],
   function(cExtend, sourceLib) {
      /**
       *
       * @author Крайнов Дмитрий
       * @public
       */
      var PageNavigation = cExtend.extend({
         _nextPage: 1,
         _prevPage: -1,
         _more: null,
         _page: 0,
         constructor: function(cfg) {
            this._options = cfg;
            PageNavigation.superclass.constructor.apply(this, arguments);
            this._page = cfg.page || 0;
            if (this._page !== undefined) {
               this._prevPage = this._page - 1;
               this._nextPage = this._page + 1;
            }
            if (!this._options.pageSize) {
               throw new Error('Option pageSize is undefined in PageNavigation');
            }
         },

         prepareQueryParams: function(direction) {
            var addParams = {}, neededPage;
            if (direction === 'down') {
               neededPage = this._nextPage;
            } else if (direction === 'up') {
               neededPage = this._prevPage;
            } else {
               neededPage = this._page;
            }

            addParams.offset = neededPage * this._options.pageSize;
            addParams.limit = this._options.pageSize;

            if (this._options.hasMore === false) {
               addParams.meta = { hasMore: false };
            }

            return addParams;
         },

         setState: function(state) {
            if (state.more) {
               this._more = state.more;
            }
         },

         calculateState: function(list, direction) {
            var meta = list.getMetaData();

            //TODO https://online.sbis.ru/opendoc.html?guid=45d6e26f-5a2f-4275-bc4f-667e176a5d85
            if (this._options.mode === 'totalCount' || this._options.hasMore === false) {
               // meta.more can be undefined is is not error
               if (meta.more && (typeof meta.more !== 'number')) {
                  throw new Error('"more" Parameter has incorrect type. Must be numeric');
               }
            } else {
               // meta.more can be undefined is is not error
               if (meta.more && (typeof meta.more !== 'boolean')) {
                  throw new Error('"more" Parameter has incorrect type. Must be boolean');
               }
            }
            this._more = meta.more;

            if (direction === 'down') {
               this._nextPage++;
            } else if (direction === 'up') {
               this._prevPage--;
            } else {

               //Если направление не указано, значит это расчет параметров после начальной загрузки списка или после перезагрузки
               this._nextPage = this._page + 1;
               this._prevPage = this._page - 1;
            }
         },

         getAllDataCount: function() {
            return this._more;
         },

         getLoadedDataCount: function() {
            return this._nextPage * this._options.pageSize;
         },

         hasMoreData: function(direction) {
            if (direction === 'down') {

               //TODO https://online.sbis.ru/opendoc.html?guid=45d6e26f-5a2f-4275-bc4f-667e176a5d85
               if (this._options.mode === 'totalCount' || this._options.hasMore === false) {

                  //в таком случае в more приходит общее число записей в списке
                  //значит умножим номер след. страницы на число записей на одной странице и сравним с общим
                  return typeof this._more === 'boolean' ? this._more : this.getLoadedDataCount() < this.getAllDataCount();
               } else {
                  return this._more;
               }
            } else if (direction === 'up') {
               return this._prevPage >= 0;
            } else {
               throw new Error('Parameter direction is not defined in hasMoreData call');
            }
         },

         prepareSource: function(source) {
            var options = source.getOptions();
            options.navigationType = sourceLib.SbisService.NAVIGATION_TYPE.PAGE;
            source.setOptions(options);
         },

         setEdgeState: function(direction) {
            if (direction == 'up') {
               this._page = 0;
            } else if (direction == 'down') {
               if (typeof this._more == 'number') {
                  this._page = this._more / this._options.pageSize - 1;
               } else {
                  this._page = -1;
               }
            } else {
               throw new Error('Wrong argument Direction in NavigationController::setEdgeState');
            }
         },

         destroy: function() {
            this._options = null;
         }
      });

      return PageNavigation;
   });

