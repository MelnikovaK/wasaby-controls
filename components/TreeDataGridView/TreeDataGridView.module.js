define('js!SBIS3.CONTROLS.TreeDataGridView', [
   "Core/IoC",
   "Core/core-merge",
   "Core/constants",
   'Core/CommandDispatcher',
   'Core/helpers/dom&controls-helpers',
   "js!SBIS3.CONTROLS.DataGridView",
   "tmpl!SBIS3.CONTROLS.TreeDataGridView",
   "js!SBIS3.CONTROLS.TreeMixin",
   "js!SBIS3.CONTROLS.TreeViewMixin",
   "js!SBIS3.CONTROLS.IconButton",
   "tmpl!SBIS3.CONTROLS.TreeDataGridView/resources/ItemTemplate",
   "tmpl!SBIS3.CONTROLS.TreeDataGridView/resources/ItemContentTemplate",
   "tmpl!SBIS3.CONTROLS.TreeDataGridView/resources/FooterWrapperTemplate",
   "tmpl!SBIS3.CONTROLS.TreeDataGridView/resources/searchRender",
   'js!SBIS3.CONTROLS.MassSelectionHierarchyController',
   "Core/ConsoleLogger",
   'js!SBIS3.CONTROLS.Link',
   'css!SBIS3.CONTROLS.TreeDataGridView',
   'css!SBIS3.CONTROLS.TreeView'
], function( IoC, cMerge, constants, CommandDispatcher, dcHelpers, DataGridView, dotTplFn, TreeMixin, TreeViewMixin, IconButton, ItemTemplate, ItemContentTemplate, FooterWrapperTemplate, searchRender, MassSelectionHierarchyController) {


   var
      DEFAULT_SELECT_CHECKBOX_WIDTH = 24, // Стандартная ширина чекбокса отметки записи.
      DEFAULT_FIELD_PADDING_SIZE = 5,     // Стандартный отступ в полях ввода 4px + border 1px. Используется для расчёта отступа при редактировании по месту.
      DEFAULT_EXPAND_ELEMENT_WIDTH = 26,  // Стандартная ширина стрелки разворота в дереве
      DEFAULT_CELL_PADDING_DIFFERENCE = 1,// Стандартная разница между оступом в ячейке табличного представления и отступом в текстовых полях (6px - 5px = 1px)
      buildTplArgsTDG = function(cfg) {
         var tplOptions, tvOptions;
         tplOptions = cfg._buildTplArgsDG.call(this, cfg);
         tvOptions = cfg._buildTplArgsTV.call(this, cfg);
         cMerge(tplOptions, tvOptions);
         tplOptions.arrowActivatedHandler = cfg.arrowActivatedHandler;
         tplOptions.editArrow = cfg.editArrow;
         tplOptions.hasScroll = tplOptions.startScrollColumn !== undefined;
         tplOptions.foldersColspan = cfg.foldersColspan;
         tplOptions.getItemContentTplData = getItemContentTplData;
         tplOptions.cellData.isSearch = tvOptions.isSearch;
         return tplOptions;
      },

      getSearchCfg = function(cfg) {
         return {
            idProperty: cfg.idProperty,
            displayProperty: cfg.displayProperty,
            highlightEnabled: cfg.highlightEnabled,
            highlightText: cfg.highlightText,
            colorMarkEnabled: cfg.colorMarkEnabled,
            colorField: cfg.colorField,
            allowEnterToFolder: cfg.allowEnterToFolder,
            colspan: cfg.columns.length,
            multiselect: cfg.multiselect
         }
      },
      getFolderFooterOptions = function(cfg) {
         var options = cfg._getFolderFooterOptionsTVM.apply(this, arguments);
         options.colspan = cfg.columns.length;
         return options;
      },
      hasFolderFooters = function() {
         //Отключаем отрисовку футеров на сервере, потому что пока что нет возможности построить treePaging,
         //т.к. в момент отрисовки нет информации, есть ли ещё записи в открытой папке.
         return false;
      },
      getItemTemplateData = function (cfg) {
         var config = {
            nodePropertyValue: cfg.item.get(cfg.nodeProperty),
            projection: cfg.projItem.getOwner()
         };
         config.children = cfg.hierarchy.getChildren(cfg.item, config.projection.getCollection());
         config.isLoaded = cfg.projItem.isLoaded();
         config.hasLoadedChild = config.children.length > 0;
         config.classIsLoaded = config.isLoaded ? ' controls-ListView__item-loaded' : '';
         config.classHasLoadedChild = config.hasLoadedChild ? ' controls-ListView__item-with-child' : ' controls-ListView__item-without-child';
         config.classNodeType = ' controls-ListView__item-type-' + (config.nodePropertyValue == null ? 'leaf' : config.nodePropertyValue == true ? 'node' : 'hidden');
         config.classNodeState = config.nodePropertyValue !== null ? (' controls-TreeView__item-' + (cfg.projItem.isExpanded() ? 'expanded' : 'collapsed')) : '';
         config.classIsSelected = (cfg.selectedKey == cfg.item.getId()) ? ' controls-ListView__item__selected' : '';
         config.isColumnScrolling = cfg.startScrollColumn !== undefined;
         config.columnsShift = cfg.columnsShift;
         config.addClasses = 'controls-DataGridView__tr controls-ListView__item js-controls-ListView__item ' + (cfg.className ? cfg.className : '') + config.classNodeType + config.classNodeState + config.classIsLoaded + config.classHasLoadedChild + config.classIsSelected;
         
         if(cfg.selectedKey === cfg.item.get(cfg.idProperty)) {
            config.addClasses += ' controls-ListView__item__selected';
         }
         
         return config;
      },
      getItemContentTplData = function(cfg){
         var data = {};
         data.hierField$ = cfg.projItem.getContents().get(cfg.parentProperty + '$');
         data.hasScroll = cfg.startScrollColumn !== undefined;
         data.itemLevel = cfg.projItem.getLevel() - 1;
         data.isNode = cfg.projItem.getContents().get(cfg.nodeProperty);
         data.hasChilds = cfg.hierarchy.getChildren(cfg.item, cfg.projItem.getOwner().getCollection()).length > 0;
         return data;
      };

   'use strict';

   /**
    * Контрол, отображающий набор данных с иерархической структурой в виде в таблицы с несколькими колонками. Подробнее о настройке контрола и его окружения вы можете прочитать в разделе <a href="https://wi.sbis.ru/doc/platform/developmentapl/interfacedev/components/list/list-settings/">Настройка списков</a>.
    *
    * @class SBIS3.CONTROLS.TreeDataGridView
    * @extends SBIS3.CONTROLS.DataGridView
    * @mixes SBIS3.CONTROLS.TreeMixin
    * @mixes SBIS3.CONTROLS.TreeViewMixin
    *
    * @cssModifier controls-TreeDataGridView__hideExpandsOnHiddenNodes Скрывает треугольник рядом с записью типа "Скрытый узел" (см. <a href='https://wi.sbis.ru/doc/platform/developmentapl/workdata/structure/vocabl/tabl/relations/#hierarchy'>Иерархия</a>). Для контрола SBIS3.CONTROLS.TreeCompositeView модификатор актуален только для режима отображения "Таблица" (см. {@link SBIS3.CONTROLS.CompositeViewMixin#viewMode viewMode}=table).
    * @cssModifier controls-TreeDataGridView__withPhoto-S Устанавливает отступы с учетом расположения в верстке изображения, размера S.
    * @cssModifier controls-TreeDataGridView__withPhoto-M Устанавливает отступы с учетом расположения в верстке изображения, размера M.
    * @cssModifier controls-TreeDataGridView__withPhoto-L Устанавливает отступы с учетом расположения в верстке изображения, размера L.
    * @cssModifier controls-TreeView__withoutLevelPadding Устанавливает режим отображения дерева без иерархических отступов.
    * @cssModifier controls-TreeView__hideExpands Устанавливает режим отображения дерева без иконок сворачивания/разворачивания узлов.
    *
    * @demo SBIS3.CONTROLS.Demo.MyTreeDataGridView Пример 1. Простое иерархическое представление данных в режиме множественного выбора записей.
    * @demo SBIS3.CONTROLS.DOCS.AutoAddHierarchy Пример 2. Автодобавление записей в иерархическом представлении данных.
    * Инициировать добавление можно как по нажатию кнопок в футерах, так и по кнопке Enter из режима редактирования последней записи.
    * Подробное описание конфигурации компонента и футеров вы можете найти в разделе <a href="https://wi.sbis.ru/doc/platform/developmentapl/interfacedev/components/list/list-settings/records-editing/edit-in-place/add-in-place/"> Добавление по месту</a>.
    *
    * @author Авраменко Алексей Сергеевич
    *
    * @control
    * @public
    * @category Lists
    * @initial
    * <component data-component='SBIS3.CONTROLS.TreeDataGridView'>
    *    <options name="columns" type="array">
    *       <options>
    *          <option name="title">№</option>
    *          <option name="field">@Идентификатор</option>
    *          <option name="width">100</option>
    *       </options>
    *       <options>
    *          <option name="title">Наименование</option>
    *          <option name="title">Наименование</option>
    *       </options>
    *    </options>
    * </component>
    */

   var TreeDataGridView = DataGridView.extend([TreeMixin, TreeViewMixin], /** @lends SBIS3.CONTROLS.TreeDataGridView.prototype*/ {
      _dotTplFn : dotTplFn,
      $protected: {
         _options: {
            _buildTplArgs: buildTplArgsTDG,
            _buildTplArgsTDG: buildTplArgsTDG,
            _canServerRender: true,
            _defaultItemTemplate: ItemTemplate,
            _defaultItemContentTemplate: ItemContentTemplate,
            _defaultSearchRender: searchRender,
            _getItemTemplateData: getItemTemplateData,
            _footerWrapperTemplate: FooterWrapperTemplate,
            _getFolderFooterOptions: getFolderFooterOptions,
            _getSearchCfg: getSearchCfg,
            _hasFolderFooters: hasFolderFooters,
            /**
             * @cfg {Function}
             * @see editArrow
             * @deprecated Опция устарела и будет удалена в версии 3.7.5. Используйте {@link editArrow}.
             */
            arrowActivatedHandler: undefined,
            /**
             * @cfg {String} Устанавливает отображение кнопки (>>) справа от названия папки.
             * @remark
             * Папкой в контексте иерархического списка может быть запись типа "Узел" и "Скрытый узел". Подробнее о различиях между типами записей вы можете прочитать в разделе <a href='https://wi.sbis.ru/doc/platform/developmentapl/workdata/structure/vocabl/tabl/relations/#hierarchy'>Иерархия</a>.
             * <br/>
             * Кнопка отображается в виде иконки с классом icon-16 icon-View icon-primary (синяя двойная стрелочка). Изменение иконки не поддерживается.
             * <br/>
             * При клике по стрелке происходит событие {@link onItemActivate}, в обработчике которого, как правило, устанавливают отрытие <a href='https://wi.sbis.ru/doc/platform/developmentapl/interfacedev/components/editing-dialog/'>диалога редактирования</a>.
             * @example
             * Устанавливаем опцию:
             * <pre>
             *     <option name="editArrow">true</option>
             * </pre>
             * Устанавливаем обработчик:
             * <pre>
             * myView.subscribe('onItemActivate', function(eventObject, meta){
             *    action.execute(meta);
             * });
             * </pre>
             * @see arrowActivatedHandler
             * @see SBIS3.CONTROLS.ListView#onItemActivate
             */
            editArrow: false,
            /**
             * @cfg {Boolean} отображает папки с одной колонкой на всю строку
             * Значение по умолчанию false
             * @deprecated
             */
            // Добавил опцию для версии 220
            // с 3.7.5 будет рулиться через пользовательский шаблон
            foldersColspan: false
         },
         _dragStartHandler: undefined,
         _editArrow: undefined
      },

      $constructor: function() {
         CommandDispatcher.declareCommand(this, 'loadNode', this._folderLoad);
      },
      init: function(){
         TreeDataGridView.superclass.init.call(this);
         if (this._options._serverRender) {
            this._createAllFolderFooters();
         }
         if (this._options.useSelectAll) {
            this._makeMassSelectionController();
         }
      },

      _getSearchBreadCrumbsWidth: function(){
      	var
            firstCol = $('td:first', this._getItemsContainer()),
      	   firstColWidth = this._options.multiselect ? firstCol.outerWidth() : 0,
      		secondCol = firstCol.next('td'),
      		cellPadding = secondCol.outerWidth() - secondCol.width();
      	return this.getContainer().width() - cellPadding - firstColWidth;
      },

      redraw: function() {
         /* Перед перерисовкой скроем стрелки редактирования, иначе будет мограние,
            т.к. после отрисовки данные полностью могу измениться */
         this._hideEditArrow();
         TreeDataGridView.superclass.redraw.apply(this, arguments);
         /*redraw может позваться, когда данных еще нет*/
         if (this._getItemsProjection()) {
            this._createAllFolderFooters();
         }
         //Если есть скролящиеся заголовки, нужно уменьшить ширину хлебных крошек в поиске до ширины таблицы
         if (this._options.startScrollColumn && this._isSearchMode()){
         	this.getContainer().find('.controls-TreeView__searchBreadCrumbs').width(this._getSearchBreadCrumbsWidth());
         }
      },

      _makeMassSelectionController: function() {
         this._massSelectionController = new MassSelectionHierarchyController(this._getMassSelectorConfig());
      },

      _drawItemsCallback: function() {
         this._updateEditArrow();
         TreeDataGridView.superclass._drawItemsCallback.apply(this, arguments);
      },

      //Переопределяем метод, потому что в дереве могут присутствовать футеры папок, и если записи добавляются в конец,
      //то они добавятся после футера папки, чего быть не должно. Проверим что записи добавляются в конец и добавим их после
      //последнего элемента, иначе будет выполнена штатная логика.
      _getInsertMarkupConfig: function(newItemsIndex, newItems) {
         var
            cfg = TreeDataGridView.superclass._getInsertMarkupConfig.apply(this, arguments),
            lastItem = this._options._itemsProjection.at(newItemsIndex - 1);

         if (cfg.inside && !cfg.prepend) {
            cfg.inside = false;
            cfg.container = this._getDomElementByItem(lastItem);
         }

         // Если в режиме поиска контейнер для вставки так и не был определен и lastItem - хлебная крошка (isNode), то ищем tr-ку в которой она лежит.
         // Подробное объяснение:
         // В режиме поиска последним отрисованным элементом запросто может быть хлебная крошка и вставлять нужно после tr-ки в которая она лежит.
         // Можно было вызывать перерисовку, если запущен режим поиска и последним элементом на текущей загруженной странице является папка.
         // Но этот вариант очень трудно реализуем, т.к. куча точек входа, где загрузка может быть прервана или перезапущена.
         // Как итог - завел задачу, по которой нужно переосмыслить текущий механизм и решить подобные проблемы раз и навсегда.
         // p.s. data-id используется потому что у крошек нет data-hash.
         if (this._isSearchMode() && !cfg.container.length && lastItem && lastItem.isNode()) {
            cfg.container = this._getItemsContainer().find('.js-controls-BreadCrumbs__crumb[data-id="' + lastItem.getContents().getId() + '"]').parents('.controls-DataGridView__tr.controls-HierarchyDataGridView__path');
         }
         return cfg;
      },

      _getEditorOffset: function(model, target) {
         var
            container = this.getContainer(),
            parentProj = this._getItemProjectionByItemId(model.get(this._options.parentProperty)),
            // Без режима поиска и при наличии родителя - необходимо учесть отступ иерархии
            levelOffset = !this._isSearchMode() && parentProj ? parentProj.getLevel() * this._getLevelPaddingWidth() : 0,
            hasCheckbox = container.hasClass('controls-ListView__multiselect'),
            checkboxOffset = this._options.editingTemplate && hasCheckbox && !container.hasClass('controls-ListView__hideCheckBoxes') ? DEFAULT_SELECT_CHECKBOX_WIDTH : 0,
            // Считаем необходимый отступ слева-направо:
            // отступ чекбокса + отступ строки + отступ иерархии (в режиме поиска 0) + ширина стрелки разворота.
            // Так же в режиме поиска не нужно учитывать DEFAULT_EXPAND_ELEMENT_WIDTH, т.к. expand { display: none; }
            result = checkboxOffset + this._getRowPadding(target) + levelOffset + (this._isSearchMode() ? 0 : DEFAULT_EXPAND_ELEMENT_WIDTH);
         // Если не задан шаблон редактирования строки и отображаются чекбоксы - компенсируем разницу оступов в полях ввода и ячеек таблицы (в полях ввода 5px, в таблице - 6px)
         if (!this._options.editingTemplate && hasCheckbox) {
            result += DEFAULT_CELL_PADDING_DIFFERENCE;
         } else { // иначе - компенсируем отступ до редактора, исходя из оступов в полях ввода
            result -= DEFAULT_FIELD_PADDING_SIZE;
         }
         return result;
      },

      _getRowPadding: function(target) {
         // На редактироавние могут быть открыты хлебные крошки и тогда левый отступ строки не нужно учитывать.
         var
            paddingElement = target.find('.controls-DataGridView__firstContentCell').get(0);
         return paddingElement ? parseInt(window.getComputedStyle(paddingElement, null).getPropertyValue('padding-left')) : 0;
      },

      _getLevelPaddingWidth: function() {
         var
            $levelPadding = $('<div class="controls-TreeDataGridView__levelPadding" style="position: absolute; visibility: hidden;">'),
            result;
         $levelPadding.appendTo(this._getItemsContainer());
         result = parseInt($levelPadding.width());
         $levelPadding.remove();
         return result;
      },

      _keyboardHover: function(e) {
         var
            parentResult = TreeDataGridView.superclass._keyboardHover.apply(this, arguments),
            selectedKey, rec;
         if (e.which === constants.key.right || e.which === constants.key.left) {
            selectedKey = this.getSelectedKey();
            rec = this.getItems().getRecordById(selectedKey);
            if (rec && rec.get(this._options.nodeProperty)) {
               this[e.which === constants.key.right ? 'expandNode' : 'collapseNode'](selectedKey);
            }
         }
         return parentResult;
      },

      collapseNode: function (key, hash) {
         return TreeDataGridView.superclass.collapseNode.apply(this, arguments);
      },

      expandNode: function (key, hash) {
         return TreeDataGridView.superclass.expandNode.apply(this, arguments);
      },

      /**
       * Возвращает стрелку редактирования папки
       * @returns {IconButton|undefined}
       */
      getEditArrow: function() {
         var self = this;
         if(!this._editArrow && (this._options.editArrow || this._options.arrowActivatedHandler)) {
            this._editArrow = new IconButton({
               element: this._container.find('> .controls-TreeView__editArrow-container'),
               icon: 'icon-16 icon-View icon-primary action-hover icon-size',
               cssClassName: 'ws-hidden',
               parent: this,
               allowChangeEnable: false,
               handlers: {
                  onActivated: function () {
                     var id = self.getHoveredItem().key;
                     self._activateItem(id);
                     self.setSelectedKey(id);
                  }
               }
            });
         }
         return this._editArrow;
      },

      _getEditArrowPosition: function(hoveredItem) {
         var folderTitle = hoveredItem.container.find('.controls-TreeView__folderTitle'),
             td = folderTitle.closest('.controls-DataGridView__td', hoveredItem.container),
             containerCords = this._container[0].getBoundingClientRect(),
             /* в 3.7.3.200 сделать это публичным маркером для стрелки */
             arrowContainer = td.find('.js-controls-TreeView__editArrow'),
             arrowCords;

         if(!arrowContainer.length) {
            arrowContainer = td.find('.controls-TreeView__editArrow');
         }

         /* Контейнера для стрелки может не быть, тогда не показываем */
         if(!arrowContainer.length) {
            return false;
         }

         /* Т.к. у нас в вёрстке две иконки, то позиционируем в зависимости от той, которая показывается,
            в .200 переделаем на маркер */
         if(arrowContainer.length === 2) {
            /* Считаем, чтобы правая координата названия папки не выходила за ячейку,
               учитываем возможные отступы иерархии и ширину expander'a*/
            if ( td[0].getBoundingClientRect().right - parseInt(td.css('padding-right'), 10) < folderTitle[0].getBoundingClientRect().right) {
               arrowContainer = arrowContainer[1];
            } else {
               arrowContainer = arrowContainer[0];
            }
         } else {
            arrowContainer = arrowContainer[0];
         }

         arrowCords = arrowContainer.getBoundingClientRect();

         return {
            top: arrowCords.top - containerCords.top + this._container[0].scrollTop,
            left: arrowCords.left - containerCords.left
         }
      },

      _onChangeHoveredItem: function() {
         /* Т.к. механизм отображения стрелки и операций над записью на ipad'e релизован с помощью свайпов,
            а на PC через mousemove, то и скрывать/показывать их надо по-разному */
         if(!this._touchSupport || !this._hasHoveredItem()) {
            this._updateEditArrow();
         }
         TreeDataGridView.superclass._onChangeHoveredItem.apply(this, arguments);
      },

      _updateEditArrow: function() {
         if(this._options.editArrow || this._options.arrowActivatedHandler) {
            if(this._hasHoveredItem()) {
               this._showEditArrow();
            } else {
               this._hideEditArrow();
            }
         }
      },

      reload: function() {
         this._hideEditArrow();
         return TreeDataGridView.superclass.reload.apply(this, arguments);
      },

      _showEditArrow: function() {
         var hoveredItem = this.getHoveredItem(),
             editArrowContainer = this.getEditArrow().getContainer(),
             needShowArrow, hiContainer, editArrowPosition;

         hiContainer = hoveredItem.container;
         /* Не показываем если:
            1) Иконку скрыли
            2) Не папка
            3) Режим поиска (по стандарту) */
         needShowArrow = hiContainer && hiContainer.hasClass('controls-ListView__item-type-node') && this.getEditArrow().isVisible() && !this._isSearchMode();

         if(hiContainer && needShowArrow) {
            editArrowPosition = this._getEditArrowPosition(hoveredItem);

            if(editArrowPosition) {
               editArrowContainer.css(editArrowPosition);
               editArrowContainer.removeClass('ws-hidden');
            }
         } else {
            this._hideEditArrow();
         }
      },

      _hideEditArrow: function() {
         if(this._editArrow) {
            this._editArrow.getContainer().addClass('ws-hidden');
         }
      },

      _onLeftSwipeHandler: function() {
         if(this._options.editArrow || this._options.arrowActivatedHandler) {
            this._showEditArrow();
         }
         TreeDataGridView.superclass._onLeftSwipeHandler.apply(this, arguments);
      },

      _onRightSwipeHandler: function() {
         if(this._options.editArrow || this._options.arrowActivatedHandler) {
            this._hideEditArrow();
         }
         TreeDataGridView.superclass._onRightSwipeHandler.apply(this, arguments);
      },
   
      _mouseDownHandler: function(e) {
         /* По стандарту отключаю выделение по двойному клику мышкой в дереве */
         if(e.originalEvent.detail > 1) {
            e.preventDefault();
         }
         TreeDataGridView.superclass._mouseDownHandler.apply(this, arguments);
      },

      _isHoverControl: function(target) {
         var res = TreeDataGridView.superclass._isHoverControl.apply(this, arguments);

         if(!res && (this._options.editArrow || this._options.arrowActivatedHandler)) {
            return dcHelpers.contains(this.getEditArrow().getContainer()[0], target[0]);
         }
         return res;
      },
      _addItemAttributes : function(container, itemProjection) {
         TreeDataGridView.superclass._addItemAttributes.call(this, container, itemProjection);
         var
            item = itemProjection.getContents(),
            hierType = item.get(this._options.nodeProperty),
            itemType = hierType == null ? 'leaf' : hierType == true ? 'node' : 'hidden';
         container.addClass('controls-ListView__item-type-' + itemType);
         var
            key = item.getId(),
            parentKey = item.get(this._options.parentProperty),
         	parentContainer = $('.controls-ListView__item[data-id="' + parentKey + '"]', this._getItemsContainer().get(0)).get(0);
         container.attr('data-parent', parentKey);

         if (this._options.openedPath[key]) {
            var hierarchy = this._options._getHierarchyRelation(this._options),
               children = hierarchy.getChildren(key, this.getItems());

            if (children.length) {
               $('.js-controls-TreeView__expand', container).addClass('controls-TreeView__expand__open');
            } else {
               /*TODO:
                  После перезагрузки у браузера в опции openedPath остаются значения с открытыми узлами,
                  и если впоследствии попытаться открыть такой узел, то он не откроется, т.к. считается
                  что он уже открыт. Единственный вариант проверить может ли быть открыт узел, посмотреть
                  есть ли у него дочерние элементы, и если их нет значит необходимо удалить данный узел
                  из набора открытых. В будущем когда будет определено поведение после перезагрузки (
                  сохранять состояние открытых узлов или сбрасывать) данный костыль не понадобится.
               */
               delete this._options.openedPath[key];
            }
         }
         /*TODO пока придрот*/
         if (typeof parentKey != 'undefined' && parentKey !== null && parentContainer) {
            var parentMargin = parseInt($('.controls-TreeView__expand', parentContainer).parent().css('padding-left'));
            $('.controls-TreeView__expand', container).parent().css('padding-left', parentMargin + this._options.paddingSize);
         }
      },

      _elemClickHandlerInternal: function(data, id, target, e) {
         var $target =  $(target),
             closestExpand = this._findExpandByElement($target);

         /* Не обрабатываем клики по чекбоку и по стрелке редактирования, они обрабатываются в elemClickHandler'e */
         if ($target.hasClass('js-controls-TreeView__editArrow') || $target.hasClass('js-controls-ListView__itemCheckBox')) {
            return;
         }

         /* При клике по треугольнику надо просто раскрыть ветку */
         if (closestExpand.hasClass('js-controls-TreeView__expand')) {
            if (this._options.loadItemsStrategy == 'append') {
               var tr = this._findItemByElement($(target));
               var hash = tr.attr('data-hash');
               this.toggleNode(id, hash);
            }
            else {
               this.toggleNode(id);
            }
            return;
         }

         if (this._options.allowEnterToFolder){
            /* Не обрабатываем клики по чекбоку и по стрелке редактирования, они обрабатываются в elemClickHandler'e */
            if ($target.hasClass('js-controls-TreeView__editArrow') || $target.hasClass('js-controls-ListView__itemCheckBox')) {
               return false;
            } else if (data.get(this._options.nodeProperty)) {
               this._currentScrollPosition = 0;
               this.setCurrentRoot(id);
               this.reload();
            }
            else {
               this._activateItem(id);
            }
         }
         else {
            if (data.get(this._options.nodeProperty)) {
               //В режиме "поиска" ветки не надо разворачивать
               if (!this._options.hierarchyViewMode) {
                  this.toggleNode(id);
               }
            }
            else {
               this._activateItem(id);
            }
         }
      },

      /**
       * Говорят, что группировка должна быть только в текущем разделе. Поддерживаем
       * @param record
       * @private
       */
      _groupByDefaultMethod: function(record){
         if (record.get(this._options.parentProperty) != this.getCurrentRoot()){
            return false;
         }
         return TreeDataGridView.superclass._groupByDefaultMethod.apply(this, arguments);
      },
      _getEditInPlaceConfig: function() {
         var config = TreeDataGridView.superclass._getEditInPlaceConfig.apply(this, arguments);
         config.getEditorOffset = this._getEditorOffset.bind(this);
         config.parentProperty = this._options.parentProperty;
         config.currentRoot = this.getCurrentRoot();
         return config;
      },

      _canStartEditOnItemClick: function(target) {
         //При клике на треугольник раскрытия папки начинать редактирование записи не нужно
         return !$(target).hasClass('js-controls-TreeView__expand') && TreeDataGridView.superclass._canStartEditOnItemClick.apply(this, arguments);
      },

      _onDragHandler: function (dragObject, e) {
         DataGridView.superclass._onDragHandler.call(this, dragObject, e);
         this._onDragCallback(dragObject, e);
      }
   });

   return TreeDataGridView;

});