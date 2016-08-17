define('js!SBIS3.CONTROLS.DataGridView',
   [
      'js!SBIS3.CONTROLS.ListView',
      'html!SBIS3.CONTROLS.DataGridView',
      'html!SBIS3.CONTROLS.DataGridView/resources/rowTpl',
      'html!SBIS3.CONTROLS.DataGridView/resources/colgroupTpl',
      'html!SBIS3.CONTROLS.DataGridView/resources/headTpl',
      'html!SBIS3.CONTROLS.DataGridView/resources/ResultsTpl',
      'js!SBIS3.CORE.MarkupTransformer',
      'js!SBIS3.CONTROLS.DragAndDropMixin',
      'browser!html!SBIS3.CONTROLS.DataGridView/resources/DataGridViewGroupBy',
      'js!SBIS3.CONTROLS.Utils.HtmlDecorators.LadderDecorator',
      'js!SBIS3.CONTROLS.Utils.TemplateUtil',
      'browser!html!SBIS3.CONTROLS.DataGridView/resources/ItemTemplate',
      'browser!html!SBIS3.CONTROLS.DataGridView/resources/ItemContentTemplate',
      'browser!html!SBIS3.CONTROLS.DataGridView/resources/cellTemplate',
      'browser!html!SBIS3.CONTROLS.DataGridView/resources/GroupTemplate'
   ],
   function(ListView, dotTplFn, rowTpl, colgroupTpl, headTpl, resultsTpl, MarkupTransformer, DragAndDropMixin, groupByTpl, LadderDecorator, TemplateUtil, ItemTemplate, ItemContentTemplate, cellTemplate, GroupTemplate) {
   'use strict';

      var ANIMATION_DURATION = 500, //Продолжительность анимации скролла заголовков
         _prepareColumns = function(columns, cfg) {
            var columnsNew = $ws.core.clone(columns);
            for (var i = 0; i < columnsNew.length; i++) {
               if (columnsNew[i].cellTemplate) {
                  columnsNew[i].contentTpl = TemplateUtil.prepareTemplate(columnsNew[i].cellTemplate);
               }
               else {
                  columnsNew[i].contentTpl = TemplateUtil.prepareTemplate(cfg._defaultCellTemplate);
               }

               if (columnsNew[i].includedTemplates) {
                  var tpls = columnsNew[i].includedTemplates;
                  columnsNew[i].included = {};
                  for (var j in tpls) {
                     if (tpls.hasOwnProperty(j)) {
                        columnsNew[i].included[j] = TemplateUtil.prepareTemplate(tpls[j]);
                     }
                  }
               }


            }
            return columnsNew;
         },
         getColumnVal = function (item, colName) {
            if (!colName || !(colName.indexOf("['") == 0 && colName.indexOf("']") == (colName.length - 2))){
               return item.get(colName);
            }
            var colNameParts = colName.slice(2, -2).split('.'),
               curItem = item,
               value;
            for (var i = 0; i < colNameParts.length; i++){
               if (i !== colNameParts.length - 1){
                  curItem = curItem.get(colNameParts[i]);
               }
               else{
                  value = curItem.get(colNameParts[i]);
               }
            }
            return value;
         },

         buildTplArgsDG = function(cfg) {
            var tplOptions = cfg._buildTplArgsLV.call(this, cfg);
            tplOptions.columns = _prepareColumns.call(this, cfg.columns, cfg);
            tplOptions.cellData = {
               /*TODO hierField вроде тут не должно быть*/
               hierField: cfg.hierField,
               getColumnVal: getColumnVal,
               decorators : tplOptions.decorators,
               displayField : tplOptions.displayField
            };
            tplOptions.startScrollColumn = cfg.startScrollColumn;

            return tplOptions;
         },
         checkColumns = function(cfg) {
            for (var i = 0; i < cfg.columns.length; i++) {
               var column = cfg.columns[i];
               if (column.highlight === undefined) {
                  column.highlight =  true;
               }
            }
         },
         prepareHeadColumns = function(cfg){
            var
               rowData = {},
               columns = $ws.core.clone(cfg.columns),
               supportUnion = $ws.core.clone(columns[0]),
               supportDouble,
               curCol,
               nextCol,
               curColSplitTitle,
               nextColSplitTitle;

            rowData.countRows = 1;
            rowData.content = [[], []];

            if (!cfg.transformHead){
               rowData.content[0] = columns;
               return rowData;
            }

            for (var i = 0, l = columns.length; i < l; i++){
               curCol = columns[i];
               nextCol = columns[i + 1];
               curColSplitTitle = curCol.title.split('.');
               nextColSplitTitle = nextCol && nextCol.title.split('.');

               if (!supportDouble){
                  supportDouble = $ws.core.clone(curCol);
               }
               else {
                  curColSplitTitle = [supportDouble.value, curColSplitTitle];
               }
               if (nextCol && (curColSplitTitle.length == nextColSplitTitle.length) && (curColSplitTitle.length == 2) && (curColSplitTitle[0] == nextColSplitTitle[0])){
                  supportDouble.value = supportDouble.title = curColSplitTitle[0];
                  supportDouble.colspan = ++supportDouble.colspan || 2;
                  curCol.title = curColSplitTitle[1];
                  nextCol.title = nextColSplitTitle[1];
                  rowData.countRows = 2;
               }
               else{
                  rowData.content[1].push(supportDouble);
                  supportDouble = null;
               }

               if (!supportUnion){
                  supportUnion = $ws.core.clone(curCol);
               }
               if (nextCol && (supportUnion.title == nextCol.title)){
                  supportUnion.colspan = ++supportUnion.colspan || 2;
               }
               else{
                  rowData.content[0].push(supportUnion);
                  supportUnion = null;
               }
            }
            return rowData;
         },
         prepareHeadData = function(cfg) {
            var
               headData = {
                  columns: $ws.core.clone(cfg.columns),
                  multiselect : cfg.multiselect,
                  startScrollColumn: cfg.startScrollColumn,
                  showHead: cfg.showHead
               },
               value,
               column,
               headColumns = prepareHeadColumns(cfg);
            $ws.core.merge(headData, headColumns);
            for (var i = 0; i < headData.content[0].length; i++) {
               column = headData.content[0][i];

               if (column.headTemplate) {
                  value = MarkupTransformer(TemplateUtil.prepareTemplate(column.headTemplate)({
                     column: column
                  }));
               } else {
                  value = '<div class="controls-DataGridView__th-content">' + ($ws.helpers.escapeHtml(column.title) || '') + '</div>';
               }
               column.value = value;
            }
            return headData;
         },
         prepareColGroupData = function(cfg) {
            return {
               columns: cfg.columns,
               multiselect: cfg.multiselect
            }
         };
   /**
    * Контрол, отображающий набор данных в виде таблицы с несколькими колонками.
    * @class SBIS3.CONTROLS.DataGridView
    * @extends SBIS3.CONTROLS.ListView
    * @author Крайнов Дмитрий Олегович
    * @control
    * @public
    * @demo SBIS3.CONTROLS.Demo.MyDataGridView
    * @designTime plugin /design/DesignPlugin
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
    * @cssModifier controls-ListView__withoutMarker Убирать маркер активной строки.
    * @cssModifier controls-DataGridView__markerRight Маркер отображается не слева строки, а справа.
    * @cssModifier controls-DataGridView__hasSeparator Включает линии разделители между строками
    * @ignoreEvents onDragStop onDragIn onDragOut onDragStart
    */
   var DataGridView = ListView.extend([DragAndDropMixin],/** @lends SBIS3.CONTROLS.DataGridView.prototype*/ {
      _dotTplFn : dotTplFn,
      /**
       * @event onDrawHead Возникает после отрисовки шапки
       * @param {$ws.proto.EventObject} eventObject Дескриптор события.
       */
      $protected: {
         _rowTpl : rowTpl,
         _rowData : [],
         _isPartScrollVisible: false,                 //Видимость скроллбара
         _movableElements: undefined,                 //Скролируемые элементы
         _arrowLeft: undefined,                       //Контейнер для левой стрелки
         _arrowRight: undefined,                      //Контейнер для правой стрелки
         _thumb: undefined,                           //Контейнер для ползунка
         _hoveredColumn: {
            cells: null,
            columnIndex: null
         },
         _stopMovingCords: {
            left: 0,
            right: 0
         },
         _currentScrollPosition: 0,                   //Текущее положение частичного скрола заголовков
         _scrollingNow: false,                        //Флаг обозначающий, происходит ли в данный момент скролирование элементов
         _partScrollRow: undefined,                   //Строка-контейнер, в которой лежит частичный скролл
         _isHeaderScrolling: false,                   //Флаг обозначающий, происходит ли скролл за заголовок
         _lastLeftPos: null,                          //Положение по горизонтали, нужно когда происходит скролл за заголовок
         _options: {
            _headTpl: headTpl,
            _colGroupTpl: colgroupTpl,
            _defaultCellTemplate: cellTemplate,
            _defaultItemTemplate: ItemTemplate,
            _defaultItemContentTemplate: ItemContentTemplate,
            _canServerRender: true,
            _buildTplArgs: buildTplArgsDG,
            _buildTplArgsDG: buildTplArgsDG,
            /**
             * @typedef {Object} Columns
             * @property {String} title Заголовок колонки
             * @property {String} field Имя поля
             * @property {String} width Ширина колонки
             * Значение необходимо задавать для колонок с фиксированной шириной.
             * @property {Boolean} [highlight=true] Подсвечивать фразу при поиске
             * @property {String} resultTemplate Шаблон отображения колонки в строке результатов
             * @property {String} className Имя класса, который будет применён к каждой ячейке столбца
             * Стилевые классы:
             *    controls-DataGridView-cell-overflow-ellipsis - текст внутри ячейки будет обрезаться троеточием (актуально для однострочных ячеек)
             *    controls-DataGridView__td__textAlignRight Стиль задается колонке, выравнивает текст во всех ячейках этой колонки по правой стороне
             *    controls-DataGridView-cell-verticalAlignTop - содержимое ячейки будет выравниваться по верхнему краю
             *    controls-DataGridView-cell-verticalAlignMiddle - содержимое ячейки будет выравниваться по середине
             *    controls-DataGridView-cell-verticalAlignBottom - содержимое ячейки будет выравниваться по нижнему краю
             * @property {String} headTemplate Шаблон отображения шапки колонки
             * @property {String} headTooltip Всплывающая подсказка шапки колонки
             * @property {String} editor Устанавливает редактор колонки для режима редактирования по месту.
             * Редактор отрисовывается поверх редактируемой строки с прозрачным фоном. Это поведение считается нормальным в целях решения прикладных задач.
             * Чтобы отображать только редактор строки без прозрачного фона, нужно установить для него свойство background-color.
             * Пример использования опции вы можете найти в разделе <a href="https://wi.sbis.ru/doc/platform/developmentapl/interfacedev/components/list/list-settings/records-editing/edit-in-place/simple-edit-in-place/">Редактирование записи по клику</a>.
             * @property {Boolean} allowChangeEnable Доступность установки сотояния активности редактирования колонки в зависимости от состояния табличного представления
             * @property {String} cellTemplate Шаблон отображения ячейки
             * Данные, которые передаются в cellTemplate:
             * <ol>
             *    <li>item - отрисовываемая запись {@link WS.Data/Entity/Record}</li>
             *    <li>hierField - поле иерархии</li>
             *    <li>isNode - является ли узлом</li>
             *    <li>decorators - объект декораторов</li>
             *    <li>field - имя поля</li>
             *    <li>highlight - есть ли подсветка</li>
             * </ol>
             * Необходимо указать настройки декораторов разметки, если требуется
             * Пример
             * <pre>
             *    {{=it.decorators.applyOnly(it.value, {
             *      highlight: it.highlight,
             *      ladder: it.field
             *    })}}
             * </pre>
             * @remark
             * Если в настройке колонки имя поля соответствует шаблону ['Name1.Name2'] то при подготовке полей для рендеринга
             * строки считаем, что в .get('Name1') находится рекорд и значение получаем уже у этого рекорда через .get('Name2')
             * @property {Object.<String,String>} templateBinding соответствие опций шаблона полям в рекорде
             * @property {Object.<String,String>} includedTemplates подключаемые внешние шаблоны, ключу соответствует поле it.included.<...> которое будет функцией в шаблоне ячейки
             * @editor headTemplate CloudFileChooser
             * @editorConfig headTemplate extFilter xhtml
             * @editor resultTemplate CloudFileChooser
             * @editorConfig resultTemplate extFilter xhtml
             * @editor cellTemplate CloudFileChooser
             * @editorConfig cellTemplate extFilter xhtml
             * @translatable title
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
             * @cfg {Number} Количество столбцов слева, которые будут не скроллируемы
             * @remark
             * Для появления частичного скролла, надо установить такую ширину колонок,
             * чтобы сумма ширин всех столбцов была больше чем ширина контейнера таблицы
             * @example
             * <pre>
             *     <option name="startScrollColumn">3</option>
             * </pre>
             * @group Scroll
             */
            startScrollColumn: undefined,
            /**
             * @cfg {Array} Лесенка
             * Массив имен столбцов, по которым строится лесенка
             * @example
             * <pre>
             *    <option name="ladder" type="array">
             *       <option>Документ.Дата</option>
             *    </option>
             * </pre>
             */
            ladder: undefined,
            /**
             * @cfg {String} Устанавливает шаблон отображения строки итогов.
             * @remark
             * Подробнее о правилах построения шаблона вы можете прочитать в статье {@link https://wi.sbis.ru/doc/platform/developmentapl/interfacedev/components/list/list-settings/list-visual-display/results/ Строка итогов}.
             * <br/>
             * Чтобы шаблон можно было передать в опцию компонента, его нужно предварительно подключить в массив зависимостей.
             * @example
             * 1. Подключаем шаблон в массив зависимостей:
             * <pre>
             *     define('js!SBIS3.Demo.nDataGridView',
             *        [
             *           ...,
             *           'html!SBIS3.Demo.nDataGridView/resources/resultTemplate'
             *        ],
             *        ...
             *     );
             * </pre>
             * 2. Передаем шаблон в опцию:
             * <pre class="brush: xml">
             *     <option name="resultsTpl" value="html!SBIS3.Demo.nDataGridView/resources/resultTemplate"></option>
             * </pre>
             * 3. Содержимое шаблона должно начинаться с тега tr, для которого установлен атрибут class со значением "controls-DataGridView__results".
             * <pre>
             *    <tr class="controls-DataGridView__results">
             *       ...
             *    </tr>
             * </pre>
             * @editor CloudFileChooser
             * @editorConfig extFilter xhtml
             * @see resultsPosition
             * @see resultsText
             */
            resultsTpl: resultsTpl,
            /**
             * @cfg {Boolean} Производить ли преобразование колонок в шапке
             * Если опция включена, то колонки в шапке будут преобразованы следующим образом:
             *  <ul>
             *    <li>Колонки с одинаковым title будут объединены</li>
             *    <li>Для колонок, title которых задан через разделитель "точка", т.е. вида выводимоеОбщееИмя.выводимоеИмяДаннойКолонки,
             *        будет отрисован двустрочный заголовок
             * </ul>
             * @example
             * <pre>
             *     <option name="transformHead">true</option>
             * </pre>
             */
            transformHead: false,
            /**
             * @cfg {Boolean} Скрывать шапку, если данных нет
             * Нужно ли скрывать шапку, если данных нет
             * @example
             * <pre>
             *     <option name="allowToggleHead">false</option>
             * </pre>
             */
            allowToggleHead: true,
            /**
             * @cfg {Boolean} Включает фиксацию / прилипание заголовков таблицы к шапке страницы / всплывающей панели.
             * @example
             * <pre>
             *     <option name="stickyHeader">true</option>
             * </pre>
             */
            stickyHeader: false
         }
      },

      _modifyOptions: function() {
         var newCfg = DataGridView.superclass._modifyOptions.apply(this, arguments);
         newCfg._decorators.add(new LadderDecorator());
         checkColumns(newCfg);
         newCfg._colgroupData = prepareColGroupData(newCfg);
         newCfg._headData = prepareHeadData(newCfg);
         return newCfg;
      },

      $constructor: function() {
         this._publish('onDrawHead');
         this._tfoot = $('.controls-DataGridView__tfoot', this._container[0]);
         this._tbody = $('.controls-DataGridView__tbody', this._container[0]);
      },

      init: function() {
         DataGridView.superclass.init.call(this);
         this._updateHeadAfterInit();
      },

      _updateHeadAfterInit: function() {
         this._bindHead();
      },

      _mouseMoveHandler: function(e) {
         DataGridView.superclass._mouseMoveHandler.apply(this, arguments);

         var td = $(e.target).closest('.controls-DataGridView__td, .controls-DataGridView__th', this._container[0]),
             trs = [],
             cells = [],
             index, hoveredColumn, cell;

         if(td.length) {
            index = td.index();
            hoveredColumn = this._hoveredColumn;

            if (hoveredColumn.columnIndex !== index) {
               this._clearHoveredColumn();
               hoveredColumn.columnIndex = index;
               trs = $(this._tbody[0].children);

               if(this._options.showHead) {
                  trs.push(this._thead[0].children[0]);
               }

               for(var i = 0, len = trs.length; i < len; i++) {
                  cell = trs[i].children[index];
                  if(cell) {
                     cells.push(cell);
                  }
               }


               hoveredColumn.cells = $(cells).addClass('controls-DataGridView__hoveredColumn__cell');
            }
         }
      },

      _mouseLeaveHandler: function() {
         DataGridView.superclass._mouseLeaveHandler.apply(this, arguments);
         this._clearHoveredColumn();
      },

      _clearHoveredColumn: function() {
         var hoveredColumn = this._hoveredColumn;

         if(hoveredColumn.columnIndex !== null) {
            hoveredColumn.cells.removeClass('controls-DataGridView__hoveredColumn__cell');
            hoveredColumn.cells = null;
            hoveredColumn.columnIndex = null;
         }
      },

      _getItemsContainer: function(){
         return $('.controls-DataGridView__tbody', this._container);
      },

      _buildTplArgs : function(cfg) {
         function getColumnVal(item, colName) {
            if (!colName || !(colName.indexOf("['") == 0 && colName.indexOf("']") == (colName.length - 2))){
               return item.get(colName);
            }
            var colNameParts = colName.slice(2, -2).split('.'),
               curItem = item,
               value;
            for (var i = 0; i < colNameParts.length; i++){
               if (i !== colNameParts.length - 1){
                  curItem = curItem.get(colNameParts[i]);
               }
               else{
                  value = curItem.get(colNameParts[i]);
               }
            }
            return value;
         }
         var args = DataGridView.superclass._buildTplArgs.apply(this, arguments);
         args.columns = _prepareColumns.call(this, cfg.columns, this._options);
         args.cellData = {
            /*TODO hierField вроде тут не должно быть*/
            hierField: cfg.hierField,
            getColumnVal: getColumnVal,
            decorators : args.decorators,
            displayField : args.displayField,
            isSearch : args.isSearch
         };
         args.startScrollColumn = cfg.startScrollColumn;

         return args;
      },

      _redrawHead : function() {
         var
            headData,
            headMarkup;

         headData = prepareHeadData(this._options);
         headMarkup = MarkupTransformer(headTpl(headData));
         var body = $('.controls-DataGridView__tbody', this._container);

         if (this._thead) {
            this._clearItems(this._thead);
            this._thead.remove()
         }
         this._thead = $(headMarkup).insertBefore(body);

         this._redrawColgroup();
         this._bindHead();
         this._notify('onDrawHead');
      },

      _bindHead: function() {
         if (!this._thead) {
            // при фиксации заголовка таблицы в шапке реальный thead перемещён в шапку, а в контроле лежит заглушка
            this._thead = $('.controls-DataGridView__thead', this._container.get(0));
         }
         this._colgroup = $('.controls-DataGridView__colgroup', this._container.get(0));
         if(this._options.showHead) {
            this._isPartScrollVisible = false;
         }

         if(this.hasPartScroll()) {
            this._initPartScroll();
            this.updateDragAndDrop();

            /* Т.к. у таблицы стиль table-layout:fixed, то в случае,
             когда суммарная ширина фиксированных колонок шире родительского контейнера,
             колонка с резиновой шириной скукоживается до 0,
             потому что table-layout:fixed игнорирует минимальную ширину колонки.
             Поэтому мы вынуждены посчитать... и установить минимальную ширину на всю таблицу целиком.
             В этом случае плавающая ширина скукоживаться не будет.
             Пример можно посмотреть в реестре номенклатур. */
            this._setColumnWidthForPartScroll();
         }
      },

      _redrawColgroup : function() {
         var markup, data, body;
         data = prepareColGroupData(this._options);
         markup = colgroupTpl(data);
         body = $('.controls-DataGridView__tbody', this._container);
         if(this._colgroup) {
            this._colgroup.remove();
         }
         this._colgroup = $(markup).insertBefore(this._thead || body);
      },

      _drawItemsCallback: function () {
         if (this.hasPartScroll()) {
            if (!this._thead) {
               this._bindHead();
            }
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

      _editFieldFocusHandler: function(focusedCtrl) {
         if(this._itemsToolbar) {
            this._hideItemsToolbar()
         }

         if(this._isPartScrollVisible) {
            this._scrollToEditControl(focusedCtrl)
         }
      },
      _onResizeHandler: function() {
         DataGridView.superclass._onResizeHandler.apply(this, arguments);

         if(this._isPartScrollVisible) {
            this._updatePartScrollWidth();
         }
      },
      //********************************//
      //   БЛОК РЕДАКТИРОВАНИЯ ПО МЕСТУ //
      //*******************************//
      redrawItem: function() {
         DataGridView.superclass.redrawItem.apply(this, arguments);

         /* При перерисовке элемента, надо обновить стили для частичного скрола */
         if(this.hasPartScroll()) {
            this.updateScrollAndColumns();
         }
      },

      _redrawItems: function() {
         //FIXME в 3.7.4 поправить, не всегда надо перерисовывать, а только когда изменились колонки
         this._redrawHead();
         DataGridView.superclass._redrawItems.apply(this, arguments);
      },
      _onItemClickHandler: function(event, id, record, target) {
         var
            targetColumn,
            targetColumnIndex;
         if (!this._options.editingTemplate) {
            targetColumn = $(target).closest('.controls-DataGridView__td');
            if (targetColumn.length) {
               targetColumnIndex = targetColumn.index();
            }
         }
         event.setResult(this.showEip($(target).closest('.js-controls-ListView__item'), record, { isEdit: true }, targetColumnIndex)
            .addCallback(function(result) {
               return !result;
            })
            .addErrback(function() {
               return true;
            }));
      },
      showEip: function(target, model, options, targetColumnIndex) {
         return this._canShowEip(targetColumnIndex) ? this._getEditInPlace().showEip(target, model, options) : $ws.proto.Deferred.fail();
      },
      _canShowEip: function(targetColumnIndex) {
         var
            column = 0,
            canShow = this.isEnabled();
         if (this._options.editingTemplate || targetColumnIndex === undefined) {
            // Отображаем редактирование по месту и для задизабленного DataGrid, но только если хоть у одиной колонки
            // доступен редактор при текущем состоянии задизабленности DataGrid.
            while (!canShow && column < this._options.columns.length) {
               if (this._options.columns[column].allowChangeEnable === false) {
                  canShow = true;
               } else {
                  column++;
               }
            }
         } else {
            if (this._options.multiselect) {
               targetColumnIndex -= 1;
            }
            canShow = !!this._options.columns[targetColumnIndex].editor && (canShow || this._options.columns[targetColumnIndex].allowChangeEnable === false);
         }
         return canShow;
      },
      _getEditInPlaceConfig: function() {
         var
            self = this,
            columns = this._options.enabled ? this._options.columns : [];
         if (!this._options.enabled) {
            $ws.helpers.forEach(this._options.columns, function(item) {
               columns.push(item.allowChangeEnable === false ? item : {});
            });
         }

         return $ws.core.merge(DataGridView.superclass._getEditInPlaceConfig.apply(this, arguments), {
            columns: columns,
            getCellTemplate: function(item, column) {
               return this._getCellTemplate(item, column);
            }.bind(this),
            handlers: {
               onInitEditInPlace: function(e, eip) {
                  var tds;

                  if(!self._options.editingTemplate && self.hasPartScroll()) {
                     tds = eip.getContainer().find('td');

                     /* Развесим классы для частичного скрола при инициализации редактирования по месту */
                     for (var i = 0, len = tds.length; i < len; i++) {
                        tds.eq(i).addClass(self._options.startScrollColumn <= i ? 'controls-DataGridView__scrolledCell' : 'controls-DataGridView__notScrolledCell');
                     }
                     /* Подпишемся у рекдатирования по месту на смену фокуса дочерних элементов,
                        чтобы правильно позиционировать частичный скролл при изменении фокуса */
                     eip.subscribe('onChildControlFocusIn', function(e, control) {
                        self._scrollToEditControl(control);
                     });

                     /* При инициализации надо проскрлить редактируемые колонки */
                     self.updateScrollAndColumns();
                  }
               }
            }
         }, {preferSource: true});
      },
      //********************************//
      // <editor-fold desc="PartScrollBlock">

      //TODO Нужно вынести в отдельный класс(контроллер?), чтобы не смешивать все drag-and-drop'ы в кучу

      /************************/
      /*   Частичный скролл   */
      /***********************/
      hasPartScroll: function() {
         return this._options.startScrollColumn !== undefined;
      },

      _initPartScroll: function() {
         (this._arrowLeft = this._thead.find('.controls-DataGridView__PartScroll__arrowLeft')).click(this._arrowClickHandler.bind(this, true));
         (this._arrowRight = this._thead.find('.controls-DataGridView__PartScroll__arrowRight')).click(this._arrowClickHandler.bind(this, false));
         (this._thumb = this._thead.find('.controls-DataGridView__PartScroll__thumb')).mousedown(this._thumbClickHandler.bind(this));
         this._partScrollRow = this._thead.find('.controls-DataGridView__PartScroll__row');
         this.initializeDragAndDrop();
      },
      /**
       * Обрабатывает переход фокуса в редатировании по месту, проставляет позицию элементам в таблице
       */
      _scrollToEditControl: function(ctrl) {
         var ctrlOffset = ctrl.getContainer()[0].getBoundingClientRect(),
             tableOffset = this._container[0].getBoundingClientRect(),
             leftScrollPos = tableOffset.left + this._stopMovingCords.left,
             leftOffset;


         /* Если контрол находится за пределами таблицы(скрыт) справа или слева, то проскролим ячейки так, чтобы его было видно */
         if(ctrlOffset.right > tableOffset.right) {
            leftOffset = this._currentScrollPosition + (ctrlOffset.right - tableOffset.right)/this._partScrollRatio;
         } else if(ctrlOffset.left < leftScrollPos){
            leftOffset = this._currentScrollPosition - (leftScrollPos - ctrlOffset.left)/this._partScrollRatio;
         }

         if(leftOffset) {
            this._moveThumbAndColumns({left: leftOffset});
         }
      },

      _setColumnWidthForPartScroll: function() {
         var cols = this._colgroup.find('col'),
            columns = this.getColumns(),
            columnsWidth = 0,
            colIndex,
            minWidth;


         /* Если включена прокрутка заголовков и сумма ширин всех столбцов больше чем ширина контейнера таблицы,
            то свободные столцы (без жёстко заданной ширины), могут сильно ужиматься,
            для этого надо проставить этим столбцам ширину равную минимальной (если она передана) */

         /* Посчитаем ширину всех колонок */
         for (var i = 0; i < columns.length; i++) {
            columnsWidth += (columns[i].width && parseInt(columns[i].width)) || (columns[i].minWidth && parseInt(columns[i].minWidth)) || 0;
         }

         /* Проставим ширину колонкам, если нужно */
         if(columnsWidth > this._container[0].offsetWidth) {
            for (var j = 0; j < columns.length; j++) {
               colIndex = this._options.multiselect ? j + 1 : j;
               minWidth = columns[j].minWidth && parseInt(columns[j].minWidth, 10);
               if (minWidth) {
                  cols[colIndex].width = minWidth + 'px';
               }
            }
         }
      },

      _dragStart: function(e) {
         $ws._const.$body.addClass('ws-unSelectable');

         /* Если скролл происходит перетаскиванием заголовков
            то выставим соответствующие флаги */
         this._isHeaderScrolling = $(e.currentTarget).hasClass('controls-DataGridView__th');
         if(this._isHeaderScrolling) {
            this.getContainer().addClass('controls-DataGridView__scrollingNow');
         }
         /* На touch устройствах надо перевести фокус(нативный) на ползунок,
            т.к. сейчас взаимодействие происходит с ним. Иначе могут возникать проблемы,
            когда курсор остаётся в поле ввода, или ховер останется на иконке другой */
         if(this._touchSupport) {
            this._thumb.focus();
         }
         this._scrollingNow = true;
      },

      updateScrollAndColumns: function() {
         this._updatePartScrollWidth();
         this._findMovableCells();
         this._moveThumbAndColumns({left: this._currentScrollPosition});
      },

      _arrowClickHandler: function(isRightArrow) {
         var shift = (this._getPartScrollContainer()[0].offsetWidth/100)*5;
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
       * Анимация по окончании скролла заголовков
       * Используется для того, чтобы в редактировании по месту не было обрезков при прокрутке
       */
      _animationAtPartScrollDragEnd: function() {
         if(this._currentScrollPosition === this._stopMovingCords.right) {
            return;
         }
         //Найдём элемент, который нужно доскроллить
         var arrowRect = this._arrowLeft[0].getBoundingClientRect(),
             elemToScroll = document.elementFromPoint(arrowRect.left + arrowRect.width / 2, arrowRect.top + arrowRect.height + 1),
             elemWidth,
             delta;

         //Если нашли, то рассчитаем куда и на сколько нам скролить
         if(elemToScroll) {
            delta = arrowRect.left - elemToScroll.getBoundingClientRect().left;
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

      _getPartScrollContainer: function() {
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
             scrollContainer = this._getPartScrollContainer(),
             thumbWidth = this._thumb[0].offsetWidth,
             correctMargin = 0,
             notScrolledCells;

         /* Найдём ширину нескроллируемых колонок */
         if(this._options.startScrollColumn > 0) {
            notScrolledCells = this._thead.find('tr').eq(0).find('.controls-DataGridView__notScrolledCell');
            for(var i = 0, len = notScrolledCells.length; i < len; i++) {
               correctMargin += notScrolledCells[i].offsetWidth
            }
            /* Сдвинем контейнер скролла на ширину нескроллируемых колонок */
            scrollContainer[0].style.marginLeft = correctMargin + 'px';
         }
         /* Проставим ширину контейнеру скролла */
         scrollContainer[0].style.width = containerWidth - correctMargin + 'px';

         /* Найдём соотношение, для того чтобы правильно двигать скроллируемый контент относительно ползунка */
         this._partScrollRatio = (this._getItemsContainer()[0].offsetWidth - containerWidth) / (containerWidth - correctMargin - thumbWidth - 40);
         this._stopMovingCords = {
            right: scrollContainer[0].offsetWidth - thumbWidth - 40,
            left: correctMargin
         }
      },

      _findMovableCells: function() {
         this._movableElems = this._container.find('.controls-DataGridView__scrolledCell');
      },

      _appendResultsContainer: function(container, resultRow){
         DataGridView.superclass._appendResultsContainer.call(this, container, resultRow);
         if(this.hasPartScroll()) {
            this.updateScrollAndColumns();
         }
      },

      _checkThumbPosition: function(cords) {
         if (cords.left <= 0){
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
          checkColumns(this._options);
       },

      _oldRedraw: function() {
         DataGridView.superclass._oldRedraw.apply(this, arguments);
         this._redrawHead();
      },

      setMultiselect: function() {
         DataGridView.superclass.setMultiselect.apply(this, arguments);

         if(this.getItems()) {
            this.redraw();
         } else if(this._options.showHead) {
            this._redrawHead();
         }
      },

      _toggleEmptyData: function(show) {
         DataGridView.superclass._toggleEmptyData.apply(this, arguments);
         if(this._emptyData && this._options.allowToggleHead) {
            this._thead.toggleClass('ws-hidden', !!show);
         }
      },
      _showItemsToolbar: function(item) {
         if(!this.isNowScrollingPartScroll()) {
            DataGridView.superclass._showItemsToolbar.call(this, item);
         }
      },

      _getLeftOfItemContainer : function(container) {
         return $(".controls-DataGridView__td", container.get(0)).first();
      },
      //------------------------GroupBy---------------------
      _getGroupTpl : function(){
         return this._options.groupBy.template || groupByTpl;
      },
      _getResultsData: function(){
         var resultsRecord = this._getResultsRecord(),
            self = this,
            value,
            data;
         if (!resultsRecord){
            return;
         }
         data = $ws.helpers.map(this.getColumns(), function(col, index){
            value = resultsRecord.get(col.field);
            if (value == undefined){
               value = index == 0 ? self._options.resultsText : '';
            }
            else{
               value = $ws.render.defaultColumn.integer(value);
            }
            return self._getColumnResultTemplate(col, index, value, resultsRecord);
         });
         return data;
      },
      _getColumnResultTemplate: function (column, index, result, item) {
         var columnTpl = result;
         if (column.resultTemplate) {
            columnTpl = MarkupTransformer(TemplateUtil.prepareTemplate(column.resultTemplate)({
               result: result,
               item: item,
               column: column,
               index: index,
               resultsText: this._options.resultsText
            }));
         }
         return columnTpl;
      },
      _getResultsContainer: function(){
         var isPositionTop = this._options.resultsPosition == 'top';
         this._addResultsMethod = isPositionTop ? 'append' : 'prepend';
         return this._options.resultsPosition == 'top' ? this._thead : this._tfoot;
      },
      destroy: function() {
         if (this.hasPartScroll()) {
            this._thumb.unbind('click');
            this._thumb = undefined;
            this._arrowLeft.unbind('click');
            this._arrowLeft = undefined;
            this._arrowRight.unbind('click');
            this._arrowRight = undefined;
            this._movableElems = [];
         }
         DataGridView.superclass.destroy.call(this);
      },
      /* ----------------------------------------------------------------------------
       ------------------- НИЖЕ ПЕРЕХОД НА ItemsControlMixin ----------------------
       ---------------------------------------------------------------------------- */

      _getCellTemplate: function(item, column) {
         /*TODO не выпиливать. Тут хранится список параметров которые отдаются в шаблон ячейки. Важно не потерять*/
         var value = this._getColumnValue(item, column.field);
         if (column.cellTemplate) {
            var cellTpl = TemplateUtil.prepareTemplate(column.cellTemplate);
            var tplOptions = {
               item: item,
               hierField: this._options.hierField,
               isNode: item.get(this._options.hierField + '@'),
               decorators: this._options._decorators,
               field: column.field,
               value: value,
               highlight: column.highlight
            };
            if (column.templateBinding) {
               tplOptions.templateBinding = column.templateBinding;
            }
            if (column.includedTemplates) {
               var tpls = column.includedTemplates;
               tplOptions.included = {};
               for (var j in tpls) {
                  if (tpls.hasOwnProperty(j)) {
                     tplOptions.included[j] = TemplateUtil.prepareTemplate(tpls[j]);
                  }
               }
            }
            value = MarkupTransformer((cellTpl)(tplOptions));
         } else {
            value = this._options._decorators.applyOnly(
                  value === undefined || value === null ? '' : $ws.helpers.escapeHtml(value), {
                  highlight: column.highlight,
                  ladder: {
                     column: column.field,
                     parentId: item.get(this._options.hierField)
                  }
               }
            );
         }
         return value;
      },

      _getColumnValue: function(item, colName){

         if (!colName || !this._isCompositeRecordValue(colName)){
            return item.get(colName);
         }
         var colNameParts = colName.slice(2, -2).split('.'),
            curItem = $ws.core.clone(item),
            value;
         for (var i = 0; i < colNameParts.length; i++){
            if (i !== colNameParts.length - 1){
               curItem = curItem.get(colNameParts[i]);
            }
            else{
               value = curItem.get(colNameParts[i]);
            }
         }
         return value;
      },

      _isCompositeRecordValue: function(colName){
         return colName.indexOf("['") == 0 && colName.indexOf("']") == (colName.length - 2);
      }
   });

   return DataGridView;

});
