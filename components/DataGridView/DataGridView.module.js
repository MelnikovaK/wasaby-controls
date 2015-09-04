define('js!SBIS3.CONTROLS.DataGridView',
   [
      'js!SBIS3.CONTROLS.ListView',
      'html!SBIS3.CONTROLS.DataGridView',
      'html!SBIS3.CONTROLS.DataGridView/resources/rowTpl',
      'html!SBIS3.CONTROLS.DataGridView/resources/headTpl',
      'js!SBIS3.CORE.MarkupTransformer',
      'js!SBIS3.CONTROLS.EditInPlaceController',
      'js!SBIS3.CONTROLS.Link',
      'js!SBIS3.CONTROLS.DragAndDropMixin',
      'is!browser?html!SBIS3.CONTROLS.DataGridView/resources/DataGridViewGroupBy'
   ],
   function(ListView, dotTplFn, rowTpl, headTpl, MarkupTransformer, EditInPlaceController, Link, DragAndDropMixin, groupByTpl) {
   'use strict';
      /* TODO: Надо считать высоту один раз, а не делать константой */
      var
         ITEMS_ACTIONS_HEIGHT = 20,
         ANIMATION_DURATION = 500; //Продолжительность анимации скрола заголовков
   /**
    * Контрол, отображающий набор данных в виде в таблицы с несколькими колонками.
    * @class SBIS3.CONTROLS.DataGridView
    * @extends SBIS3.CONTROLS.ListView
    * @control
    * @public
    * @demo SBIS3.CONTROLS.Demo.MyDataGridView
    * @initial
    * <component data-component='SBIS3.CONTROLS.DataGridView'>
    *    <options name="columns" type="array">
    *       <options>
    *          <option name="title">Поле 1</option>
    *          <option name="width">100</option>
    *       </options>
    *       <options>
    *          <option name="title">Поле 2</option>
    *       </options>
    *    </options>
    * </component>
    */

   var DataGridView = ListView.extend([DragAndDropMixin],/** @lends SBIS3.CONTROLS.DataGridView.prototype*/ {
      _dotTplFn : dotTplFn,
      $protected: {
         _rowTpl : rowTpl,
         _headTpl : headTpl,
         _rowData : [],
         _editInPlace: null,
         _addInPlaceButton: null,
         _isPartScrollVisible: false,                 //Видимость скроллбара
         _movableElements: undefined,                 //Скролируемые элементы
         _arrowLeft: undefined,                       //Контейнер для левой стрелки
         _arrowRight: undefined,                      //Контейнер для правой стрелки
         _thumb: undefined,                           //Контейнер для ползунка
         _stopMovingCords: {
            left: 0,
            right: 0
         },
         _currentScrollPosition: 0,                   //Текущее положение частичного скрола заголовков
         _scrollingNow: false,                        //Флаг обозаначающий, происходит ли в данный момент скролирование элементов
         _partScrollRow: undefined,                   //Строка-контейнер, в которой лежит частичный скролл
         _isHeaderScrolling: false,                   //Флаг обозначающий, проиходит ли скролл за заголовок
         _lastLeftPos: null,                          //Положение по горизонтали, нужно когда происходит скролл за заголовок
         _newColumnsSetted: false,                    //Флаг, обозначающий, что выставлены новые колонки
         _options: {
            /**
             * @typedef {Object} Columns
             * @property {String} title Заголовок колонки
             * @property {String} field Имя поля
             * @property {String} width Ширина колонки
             * Значение необходимо задавать для колонок с фиксированной шириной.
             * @property {Boolean} highlight=true Подсвечивать фразу при поиске
             * @property {String} className Имя класса, который будет применён к каждой ячейке столбца
             * @property {String} captionTemplate Шаблон отображения шапки колонки
             * @property {String} cellTemplate Шаблон отображения ячейки
             */
            /**
             * @cfg {Columns[]} Набор колонок
             * @see setColumns
             * @see getColumns
             */
            columns: [],
            /**
             * @cfg {Boolean} Отображать заголовки колонок
             * @example
             * <pre>
             *     <option name="showHead">false</option>
             * </pre>
             */
            showHead : true,
            /**
             * @typedef {Object} PagingEnum
             * @variant no Не используется
             * @variant part Частичная
             * @variant full Полная
             */
            /**
             * @cfg {PagingEnum} Режим постраничной навигации
             * @remark
             * При частичной постраничной навигации заранее неизвестно общее количество страниц.
             * @example
             * <pre>
             *     <option name="paging">full</option>
             * </pre>
             * @see setPage
             * @see getPage
             */
            paging: 'no',
            /**
             * @cfg {Object} Редактирование по месту
             */
            editInPlace: {
               enabled: false,
               addInPlace: false,
               onValueChange: undefined
            },
            /**
             * @cfg {Number} Частичный скролл
             */
            startScrollColumn: undefined
         }
      },

      $constructor: function() {
         this._thead = $('.controls-DataGridView__thead', this._container.get(0));
         this._colgroup = $('.controls-DataGridView__colgroup', this._container.get(0));
         this._checkColumns();
      },

      init: function() {
         DataGridView.superclass.init.call(this);
         if (this._options.editInPlace.enabled && this._options.editInPlace.addInPlace && !this._editInPlace) {
            this._initAddInPlace();
         }
         this._buildHead();
         if(this._options.startScrollColumn !== undefined) {
            this._initPartScroll();
         }
      },
      _initAddInPlace: function() {
         var
            self = this,
            itemsContainer = this._getItemsContainer(),
            tr = '';
         this._addInPlaceButton = new Link({
            name: 'controls-ListView__addInPlace-button',
            icon: 'sprite:icon-16 icon-NewCategory',
            caption: 'Новая запись',
            element: $('<div>').appendTo(this._container.find('.controls-DataGridView__addInPlace-container'))
         });
         if (this._options.multiselect) {
            tr += '<td class="controls-DataGridView__td"></td>';
         }
         for (var i in this._options.columns) {
            tr += '<td class="controls-DataGridView__td"></td>';
         }
         tr += '</tr>';
         this._addInPlaceButton.subscribe('onActivated', function() {
            self._initEditInPlace();
            self._editInPlace.showEditing(
               $('<tr class="controls-DataGridView__tr controls-ListView__item">' + tr)
                  .appendTo(itemsContainer));
         });
      },

      _initEditInPlace: function() {
         var
            self = this,
            debounceInterval = 10;
         if (!this._editInPlace) {
            this._dataSet.subscribe('onRecordChange', function(event, record) {
               self.redrawRow(record);
            }.debounce(debounceInterval));
            this._createEditInPlace();
         }
      },

      /**
       * Метод для перерисовки указанной записи
       * @param record Запись, перерисовка которой осуществляется
       */
      redrawRow: function(record) {
         var row = this._getItemsContainer().find('.controls-ListView__item[data-id="' + record.getKey() + '"]');
         if (row.length) {
            row.empty()
               .append($(this._getItemTemplate(record)).children());
            this._addItemAttributes(row, record);
            if (this._isPartScrollVisible) {
               this.updateScrollAndColumns();
            }
         }
      },
      _dataLoadedCallback: function() {
         DataGridView.superclass._dataLoadedCallback.apply(this, arguments);
         if(this._newColumnsSetted) {
            this._buildHead();
         }
      },


      setDataSource: function(ds) {
         DataGridView.superclass.setDataSource.apply(this, arguments);
         if (this._options.editInPlace.enabled && this._editInPlace) {
            this._editInPlace.destroy();
            this._editInPlace = null;
         }
      },
      _createEditInPlace: function() {
         this._editInPlace = new EditInPlaceController({
            columns: this._options.columns,
            addInPlaceButton: this._addInPlaceButton,
            element: $('<div>').insertBefore(this._container.find('.controls-DataGridView__table')),
            parent: this,
            dataSet: this._dataSet,
            ignoreFirstColumn: this._options.multiselect,
            dataSource: this._dataSource,
            handlers: this._options.editInPlace.onValueChange ? {
               onValueChange: this._options.editInPlace.onValueChange
            } : undefined
         });
      },

      _onChangeHoveredItem: function(hoveredItem) {
         if(!this.isNowScrollingPartScroll()) {
            this._updateEditInPlaceDisplay(hoveredItem);
         }
         DataGridView.superclass._onChangeHoveredItem.apply(this, arguments);
      },
      _updateEditInPlaceDisplay: function(hoveredItem) {
         if (this._options.editInPlace.enabled && this._options.columns && this._options.columns.length) {
            this._initEditInPlace();
            this._editInPlace.updateDisplay(hoveredItem);
         }
      },
      _checkTargetContainer: function(target) {
         return this._options.showHead && this._thead.length && $.contains(this._thead[0], target[0]) ||
                this._addInPlaceButton && $.contains(this._addInPlaceButton.getContainer().parent()[0], target[0]) ||
                DataGridView.superclass._checkTargetContainer.apply(this, arguments);
      },

      _getItemsContainer: function(){
         return $('.controls-DataGridView__tbody', this._container);
      },

      _getItemTemplate: function(item){
         if (!this._options.itemTemplate) {

            var rowData = {
               columns: $ws.core.clone(this._options.columns),
               decorators: this._decorators,
               color: this._options.colorField ? item.get(this._options.colorField) : '',
               multiselect : this._options.multiselect,
               arrowActivatedHandler: this._options.arrowActivatedHandler,
               hierField: this._options.hierField + '@',
               startScrollColumn: this._options.startScrollColumn
            };

            for (var i = 0; i < rowData.columns.length; i++) {
               var value,
                   column = rowData.columns[i];
               if (column.cellTemplate) {
                  var cellTpl = column.cellTemplate;
                  value = MarkupTransformer(doT.template(cellTpl)({
                     item: item,
                     field: column.field,
                     highlight: column.highlight
                  }));
               } else {
                  value = $ws.helpers.escapeHtml(item.get(column.field));
                  value = ((value != undefined) && (value != null)) ? value : '';
               }
               column.value = value;
               column.item = item;
            }
            return this._rowTpl(rowData)
         }
         else {
            return this._options.itemTemplate(item)
         }

      },

      _isHoverControl: function($target) {
         return DataGridView.superclass._isHoverControl.apply(this, arguments) ||
                this._editInPlace && $.contains(this._editInPlace.getContainer()[0], $target[0]);
      },

      _drawItemsCallback: function () {
         if(this._options.startScrollColumn !== undefined) {

          /* Т.к. у таблицы стиль table-layout:fixed, то в случае,
             когда суммарная ширина фиксированных колонок шире родительского контейнера,
             колонка с резиновой шириной скукоживается до 0,
             потому что table-layout:fixed игнорирует минимальную ширину колонки.
             Поэтому мы вынуждены посчитать... и установить минимальную ширину на всю таблицу целиком.
             В этом случае плавающая ширина скукоживаться не будет.
             Пример можно посмотреть в реестре номенклатур. */
            this._setColumnWidthForPartScroll();
            var needShowScroll = this._isTableWide();

            this._isPartScrollVisible ?
               needShowScroll ?
                  this.updateScrollAndColumns() : this._hidePartScroll() :
               needShowScroll ?
                  this._showPartScroll() : this._hidePartScroll();

            this._findMovableCells();
         }
         DataGridView.superclass._drawItemsCallback.call(this);
      },

      _onResizeHandler: function() {
         DataGridView.superclass._onResizeHandler.apply(this, arguments);

         if(this._isPartScrollVisible) {
            this._updatePartScrollWidth();
         }
      },
      // <editor-fold desc="PartScrollBlock">

      //TODO Нужно вынести в отдельный класс(контроллер?), чтобы не смешивать все drag-and-drop'ы в кучу

      /************************/
      /*   Частичный скролл   */
      /***********************/
      _initPartScroll: function() {
         (this._arrowLeft = this._thead.find('.controls-DataGridView__PartScroll__arrowLeft')).click(this._arrowClickHandler.bind(this, true));
         (this._arrowRight = this._thead.find('.controls-DataGridView__PartScroll__arrowRight')).click(this._arrowClickHandler.bind(this, false));
         (this._thumb = this._thead.find('.controls-DataGridView__PartScroll__thumb')).mousedown(this._thumbClickHandler.bind(this));
         this._partScrollRow = this._thead.find('.controls-DataGridView__PartScroll__row');
         this.initializeDragAndDrop();
      },


      _setColumnWidthForPartScroll: function() {
         var tds = this._getItemsContainer().find('.controls-DataGridView__tr').eq(0).find('.controls-DataGridView__td'),
            columns = this.getColumns(),
            tdIndex,
            minWidth;

         /* если у нас включается прокрутка заголовков,
            то минимальная ширина ужимается до заданного значения,
            и в этом режиме можно просто поставить width,
            т.к. в режиме table-layout:fixed учитывается только width */
         if(tds.length) {
            for (var i = 0; i < columns.length; i++) {
               tdIndex = this._options.multiselect ? i + 1 : i;
               minWidth = columns[i].minWidth && parseInt(columns[i].minWidth, 10);
               if (minWidth && tds[tdIndex]&& tds[tdIndex].offsetWidth < minWidth) {
                  this._colgroup.find('col')[tdIndex].width = minWidth + 'px';
               }
            }
         }
      },

      _dragStart: function(e) {
         $ws._const.$body.addClass('ws-unSelectable');

         /* Если скрол происходит перетаскиванием заголовков
            то выставим соответствующие флаги */
         this._isHeaderScrolling = $(e.currentTarget).hasClass('controls-DataGridView__th');
         if(this._isHeaderScrolling) {
            this.getContainer().addClass('controls-DataGridView__scrollingNow');
         }
         this._scrollingNow = true;
      },

      updateScrollAndColumns: function() {
         this._updatePartScrollWidth();
         this._findMovableCells();
         this._moveThumbAndColumns({left: this._currentScrollPosition});
      },

      _arrowClickHandler: function(isRightArrow) {
         var shift = (this._getScrollContainer()[0].offsetWidth/100)*5;
         this._moveThumbAndColumns({left: (parseInt(this._thumb[0].style.left) || 0) + (isRightArrow ?  -shift : shift)});
      },

      _thumbClickHandler: function() {
        this._thumb.addClass('controls-DataGridView__PartScroll__thumb-clicked');
      },

      _dragEnd: function() {
         this._animationAtPartScrollDragEnd();

         /* Навешиваем класс на body,
            это самый оптимальный способ избавиться от выделения */
         $ws._const.$body.removeClass('ws-unSelectable');
         if(this._isHeaderScrolling) {
            this.getContainer().removeClass('controls-DataGridView__scrollingNow');
         }
         this._thumb.removeClass('controls-DataGridView__PartScroll__thumb-clicked');
         this._scrollingNow = false;
         this._lastLeftPos = null;
      },

      /*
       * Анимация по окончании скрола заголовков
       * Используется для того, чтобы в редактировании по месту не было обрезков при прокрутке
       */
      _animationAtPartScrollDragEnd: function() {
         if(this._currentScrollPosition === this._stopMovingCords.right) {
            return;
         }
         //Найдём элемент, который нужно доскролить
         var arrowRect = this._arrowLeft[0].getBoundingClientRect(),
             elemToScroll = document.elementFromPoint(arrowRect.left + arrowRect.width / 2, arrowRect.top + arrowRect.height + 1),
             elemRect,
             elemWidth,
             delta;

         //Если нашли, то расчитаем куда и на сколько нам скролить
         if(elemToScroll) {
            elemRect = elemToScroll.getBoundingClientRect();
            delta = arrowRect.left - elemRect.left;
            elemWidth = elemToScroll.offsetWidth;

            //Подключим анимацию
            this._container.addClass('controls-DataGridView__PartScroll__animation');
            this._moveThumbAndColumns({left: this._currentScrollPosition - ((delta > elemWidth / 2  ? - (elemWidth - delta) : delta) / this._partScrollRatio)});

            //Тут приходится делать таймаут, чтобы правильно прошло выключение-включение анимации
            setTimeout(function() {
               this._container.removeClass('controls-DataGridView__PartScroll__animation')
            }.bind(this), ANIMATION_DURATION);
         }
      },

      _getDragContainer: function() {
         return this._thead.find('.controls-DataGridView__PartScroll__thumb, .controls-DataGridView__scrolledCell');
      },

      _getScrollContainer: function() {
         return this._thead.find('.controls-DataGridView__PartScroll__container');
      },

      _dragMove: function(event, cords) {
         if(this._isHeaderScrolling) {
            var pos;

            /* Выставим начальную координату, чтобы потом правильно передвигать колонки */
            if(this._lastLeftPos === null) {
               this._lastLeftPos = cords.left;
            }

            /* Посчитаем сначала разницу со старым значением */
            pos = this._currentScrollPosition - (cords.left - this._lastLeftPos);

            /* После расчётов, можно выставлять координату */
            this._lastLeftPos = cords.left;
            cords.left = pos;
         }
         this._moveThumbAndColumns(cords);
      },

      _moveThumbAndColumns: function(cords) {
         this._currentScrollPosition = this._checkThumbPosition(cords);
         var movePosition = -this._currentScrollPosition*this._partScrollRatio;

         this._setThumbPosition(this._currentScrollPosition);
         for(var i= 0, len = this._movableElems.length; i < len; i++) {
            this._movableElems[i].style.left = movePosition + 'px';
         }
      },

      _setThumbPosition: function(cords) {
         this._thumb[0].style.left = cords + 'px';
      },

      _updatePartScrollWidth: function() {
         var containerWidth = this._container[0].offsetWidth,
             scrollContainer = this._getScrollContainer(),
             thumbWidth = this._thumb[0].offsetWidth,
             correctMargin = 0,
             notScrolledCells;

         /* Найдём ширину нескролируемых колонок */
         if(this._options.startScrollColumn > 0) {
            notScrolledCells = this._thead.find('tr').eq(0).find('.controls-DataGridView__notScrolledCell');
            for(var i = 0, len = notScrolledCells.length; i < len; i++) {
               correctMargin += notScrolledCells[i].offsetWidth
            }
            /* Сдвинем контейнер скрола на ширину нескролируемых колонок */
            scrollContainer[0].style.marginLeft = correctMargin + 'px';
         }
         /* Проставим ширину контейнеру скрола */
         scrollContainer[0].style.width = containerWidth - correctMargin + 'px';

         /* Найдём соотношение, для того чтобы правильно двигать скролируемый контент относительно ползунка */
         this._partScrollRatio = (this._getItemsContainer()[0].offsetWidth - containerWidth) / (containerWidth - correctMargin - thumbWidth - 40);
         this._stopMovingCords.right = scrollContainer[0].offsetWidth - thumbWidth - 40;
      },

      _findMovableCells: function() {
         this._movableElems = this._container.find('.controls-DataGridView__scrolledCell');
      },

      _checkThumbPosition: function(cords) {
         if (cords.left <= this._stopMovingCords.left){
            this._toggleActiveArrow(this._arrowLeft, false);
            return 0;
         } else if (!this._arrowLeft.hasClass('icon-primary')) {
            this._toggleActiveArrow(this._arrowLeft, true);
         }

         if (cords.left >= this._stopMovingCords.right) {
            this._toggleActiveArrow(this._arrowRight, false);
            return this._stopMovingCords.right;
         } else if (!this._arrowRight.hasClass('icon-primary')) {
            this._toggleActiveArrow(this._arrowRight, true);
         }
         return cords.left;
      },

      _toggleActiveArrow: function(arrow, enable) {
         arrow.toggleClass('icon-disabled', !enable)
              .toggleClass('icon-primary action-hover', enable);
      },

      _isTableWide: function() {
         return this._container[0].offsetWidth < this._getItemsContainer()[0].offsetWidth;
      },

      _hidePartScroll: function() {
         if(this._isPartScrollVisible) {
            this._partScrollRow.addClass('ws-hidden');
            this._isPartScrollVisible = false;
         }
      },

      _showPartScroll: function() {
         if(!this._isPartScrollVisible) {
            this._partScrollRow.removeClass('ws-hidden');
            this._updatePartScrollWidth();
            this._isPartScrollVisible = true;
         }
      },

      isNowScrollingPartScroll: function() {
         return this._scrollingNow;
      },

      /*******************************/
      /*  Конец частичного скролла   */
      /*******************************/
      // </editor-fold>
       /**
        * Метод получения текущего описания колонок представления данных.
        * @returns {*|columns} Описание набора колонок.
        * @example
        * <pre>
        *    var columns = DataGridView.getColumns(),
        *        newColumns = [];
        *    for(var i = 0, l = columns.length; i < l; i++){
        *       if(columns[i].title !== "Примечание")
        *          newColumns.push(columns[i]);
        *    }
        *    newColumns.push({
        *       title: 'ФИО',
        *       field: 'РП.ФИО'
        *    });
        *    DataGridView.setColumns(newColumns);
        * </pre>
        */
      getColumns : function() {
         return this._options.columns;
      },
       /**
        * Метод установки либо замены колонок, заданных опцией {@link columns}.
        * @param columns Новый набор колонок.
        * @example
        * <pre>
        *    var columns = DataGridView.getColumns(),
        *        newColumns = [];
        *    for(var i = 0, l = columns.length; i < l; i++){
        *       if(columns[i].title !== "Примечание")
        *          newColumns.push(columns[i]);
        *    }
        *    newColumns.push({
        *       title: 'ФИО',
        *       field: 'РП.ФИО'
        *    });
        *    DataGridView.setColumns(newColumns);
        * </pre>
        */
       setColumns : function(columns) {
          this._options.columns = columns;
          this._newColumnsSetted = true;
          this._checkColumns();
       },
      /**
       * Проверяет настройки колонок, заданных опцией {@link columns}.
       */
      _checkColumns : function() {
         for (var i = 0; i < this._options.columns.length; i++) {
            var column = this._options.columns[i];
            if (column.highlight === undefined) {
               column.highlight =  true;
            }
         }
      },
      _buildHead: function() {
         var head = this._getHeadTemplate();
         this._newColumnsSetted = false;
         this._isPartScrollVisible = false;
         this._thead.remove();
         this._colgroup.remove();
         $('.controls-DataGridView__tbody', this._container).before(head);
         this._thead = $('.controls-DataGridView__thead', this._container.get(0));
         this._colgroup = $('.controls-DataGridView__colgroup', this._container.get(0));
         if (this._editInPlace) {
            this._editInPlace.destroy();
         }
         this._createEditInPlace();
         if(this._options.startScrollColumn !== undefined) {
            this._initPartScroll();
            this.updateDragAndDrop();
         }
      },

      _getHeadTemplate: function(){
         var rowData = {
            columns: $ws.core.clone(this._options.columns),
            multiselect : this._options.multiselect,
            startScrollColumn: this._options.startScrollColumn,
            showHead: this._options.showHead
         };

         for (var i = 0; i < rowData.columns.length; i++) {
            var value,
                column = rowData.columns[i];
            if (column.headTemplate) {
               value = MarkupTransformer(doT.template(column.headTemplate)({
                  column: column
               }));
            } else {
               var title = $ws.helpers.escapeHtml(column.title);
               value = '<div class="controls-DataGridView__th-content">' + title + '</div>';
            }
            column.value = value;
         }
         return this._headTpl(rowData);
      },


      _getItemActionsPosition: function(item) {
         return {
            top: item.position.top + ((item.size.height > ITEMS_ACTIONS_HEIGHT) ? item.size.height - ITEMS_ACTIONS_HEIGHT : 0 ),
            right: 0
         };
      },
      _showItemActions: function() {
         if(!this.isNowScrollingPartScroll()) {
            DataGridView.superclass._showItemActions.call(this);
         }
      },

      reload: function() {
         if (this._editInPlace && this._editInPlace.isEditing()) {
            this._editInPlace.finishEditing();
         }
         return DataGridView.superclass.reload.apply(this, arguments);
      },

      _getLeftOfItemContainer : function(container) {
         return $(".controls-DataGridView__td", container.get(0)).first();
      },
      //------------------------GroupBy---------------------
      _getGroupTpl : function(){
         return this._options.groupBy.template || groupByTpl;
      },

      destroy: function() {
         if(this._options.startScrollColumn !== undefined) {
            this._thumb.unbind('click');
            this._thumb = undefined;
            this._arrowLeft.unbind('click');
            this._arrowLeft = undefined;
            this._arrowRight.unbind('click');
            this._arrowRight = undefined;
            this._movableElems = [];
         }
         DataGridView.superclass.destroy.call(this);
      }

   });

   return DataGridView;

});