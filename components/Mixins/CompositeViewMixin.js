define('SBIS3.CONTROLS/Mixins/CompositeViewMixin', [
   'Core/constants',
   'Core/Deferred',
   'tmpl!SBIS3.CONTROLS/Mixins/CompositeViewMixin/CompositeViewMixin',
   'Core/IoC',
   'tmpl!SBIS3.CONTROLS/Mixins/CompositeViewMixin/resources/CompositeItemsTemplate',
   'SBIS3.CONTROLS/Utils/TemplateUtil',
   'tmpl!SBIS3.CONTROLS/Mixins/CompositeViewMixin/resources/TileTemplate',
   'tmpl!SBIS3.CONTROLS/Mixins/CompositeViewMixin/resources/TileContentTemplate',
   'tmpl!SBIS3.CONTROLS/Mixins/CompositeViewMixin/resources/ListTemplate',
   'tmpl!SBIS3.CONTROLS/Mixins/CompositeViewMixin/resources/ListContentTemplate',
   'tmpl!SBIS3.CONTROLS/Mixins/CompositeViewMixin/resources/ItemsTemplate',
   'tmpl!SBIS3.CONTROLS/Mixins/CompositeViewMixin/resources/InvisibleItemsTemplate',
   'tmpl!SBIS3.CONTROLS/ListView/resources/GroupTemplate',
   'tmpl!SBIS3.CONTROLS/DataGridView/resources/GroupTemplate',
   'Core/core-merge',
   'Core/core-instance',
   'SBIS3.CONTROLS/Link'
], function(constants, Deferred, dotTplFn, IoC, CompositeItemsTemplate, TemplateUtil, TileTemplate, TileContentTemplate, ListTemplate, ListContentTemplate,
            ItemsTemplate, InvisibleItemsTemplate, ListViewGroupTemplate, DataGridGroupTemplate, cMerge, cInstance) {
   'use strict';
   /**
    * Миксин добавляет функционал, который позволяет контролу устанавливать режимы отображения элементов коллекции по типу "Таблица", "Плитка" и "Список".
    * @mixin SBIS3.CONTROLS/Mixins/CompositeViewMixin
    * @public
    * @author Крайнов Дмитрий Олегович
    */
   var
       TILE_MODE = { // Возможные результаты режима отображения плитки
          DYNAMIC: 'dynamic', // плитка с изменяемой шириной
          STATIC: 'static' // плитка с постоянной шириной
       };
   var canServerRenderOther = function(cfg) {
      return !(cfg.itemTemplate || cfg.listTemplate || cfg.tileTemplate);
   },
   buildTplArgsComposite = function(cfg) {
      var parentOptions = cfg._buildTplArgsLV.call(this, cfg);
      if ((cfg.viewMode == 'list') || (cfg.viewMode == 'tile')) {
         var tileContentTpl, tileTpl, listContentTpl, listTpl;

         parentOptions.image = cfg.imageField;
         parentOptions.widthProperty = cfg.widthProperty;
         parentOptions.description = cfg.displayProperty;
         parentOptions.viewMode = cfg.viewMode;
         parentOptions._itemsTemplate = cfg._itemsTemplate;
         parentOptions.resourceRoot = constants.resourceRoot;
         parentOptions.tileMode =  cfg.tileMode;
         parentOptions.invisibleItemsTemplate = TemplateUtil.prepareTemplate(cfg._invisibleItemsTemplate);
         if (cfg.itemsHeight) {
            parentOptions.minWidth = cfg.itemsHeight / 1.4; //Формат A4
            parentOptions.maxWidth = cfg.itemsHeight * 1.5;
         }

         if (cfg.tileContentTpl) {
            tileContentTpl = cfg.tileContentTpl;
         }
         else {
            tileContentTpl = cfg._defaultTileContentTemplate;
         }
         parentOptions.tileContent = TemplateUtil.prepareTemplate(tileContentTpl);
         if (cfg.tileTpl) {
            tileTpl = cfg.tileTpl;
         }
         else {
            tileTpl = cfg._defaultTileTemplate;
         }
         parentOptions.tileTpl = TemplateUtil.prepareTemplate(tileTpl);
         parentOptions.defaultTileTpl = TemplateUtil.prepareTemplate(cfg._defaultTileTemplate);

         if (cfg.listContentTpl) {
            listContentTpl = cfg.listContentTpl;
         }
         else {
            listContentTpl = cfg._defaultListContentTemplate;
         }
         parentOptions.listContent = TemplateUtil.prepareTemplate(listContentTpl);
         if (cfg.listTpl) {
            listTpl = cfg.listTpl;
         }
         else {
            listTpl = cfg._defaultListTemplate;
         }
         parentOptions.listTpl = TemplateUtil.prepareTemplate(listTpl);
         parentOptions.defaultListTpl = TemplateUtil.prepareTemplate(cfg._defaultListTemplate);

         switch (cfg.viewMode) {
            case 'tile':
               parentOptions.itemTpl = tileTpl;
               break;
            case 'list':
               parentOptions.itemTpl = listTpl;
               break;
         }
      }
      return parentOptions
   },
   buildTplArgs = function(cfg) {
      var parentOptions = cfg._buildTplArgsDG(cfg);
      var myOptions = cfg._buildTplArgsComposite(cfg);
      cMerge(parentOptions, myOptions);
      return parentOptions;
   },
   getGroupTemplate = function(cfg) {
      if (cfg.viewMode === 'table') {
         return DataGridGroupTemplate;
      }
      return ListViewGroupTemplate;
   };
   var MultiView = /** @lends SBIS3.CONTROLS/Mixins/CompositeViewMixin.prototype */{
       /**
        * @event onViewModeChanged Происходит при изменении режима отображения {@link mode}.
        * @param {Core/EventObject} Дескриптор события.
        */
      _dotTplFn : dotTplFn,
      $protected: {
         _tileWidth: null,
         _folderWidth: null,
         _options: {
            _getGroupTemplate: getGroupTemplate,
            _ListViewGroupTemplate: ListViewGroupTemplate,
            _DataGridGroupTemplate: DataGridGroupTemplate,
            _defaultTileContentTemplate: TileContentTemplate,
            _defaultTileTemplate: TileTemplate,
            _defaultListContentTemplate: ListContentTemplate,
            _defaultListTemplate: ListTemplate,
            _invisibleItemsTemplate: InvisibleItemsTemplate,
            _canServerRender: true,
            _canServerRenderOther : canServerRenderOther,
            _compositeItemsTemplate : CompositeItemsTemplate,
            _buildTplArgs : buildTplArgs,
            _buildTplArgsComposite: buildTplArgsComposite,
            /**
             * @cfg {String} Устанавливает режим отображения элементов коллекции
             * @variant table Режим отображения "Таблица"
             * @variant list Режим отображения "Список"
             * @variant tile Режим отображения "Плитка"
             */
            viewMode : 'table',
            /**
             * @cfg {String} Устанавливает режим отображения в режиме плитки
             * @variant static
             * @variant dynamic
             */
            tileMode: '',
            /**
             * @cfg {String} Устанавливает файловое поле элемента коллекции, которое предназначено для хранения изображений.
             * @remark
             * Файловое поле используется в шаблоне для построения отображения элементов коллекции.
             * Использование опции актуально для режимов отображения "Список" и "Плитка".
             * Если для этих режимов используется пользовательский шаблон (задаётся опциями {@link listTemplate} и {@link tileTemplate}), то опция также неактуальна.
             * @see SBIS3.CONTROLS/Mixins/DSMixin#displayProperty
             * @see tileTemplate
             * @see listTemplate
             */
            imageField : null,
            /**
             * @cfg {String} Устанавливает файловое поле элемента коллекции, которое предназначено для хранения ширины изображения.
             * @remark
             * Файловое поле используется для режима viewMode = tile и tileMode = dynamic.
             * @see viewMode
             * @see tileMode
             */
            widthProperty: null,
            /**
             * @cfg {Number} Высота элементов.
             * @remark
             * Необхоимо указывать для режима viewMode = tile и tileMode = dynamic.
             * @see viewMode
             * @see tileMode
             */
            itemsHeight: undefined,
            /**
             * @cfg {String} Шаблон отображения строки в режиме "Список".
             * @deprecated Используйте опции {@link listContentTpl} или {@link listTpl}.
             */
            listTemplate : null,
            /**
             * @cfg {String} Шаблон отображения строки в режиме "Плитка".
             * @deprecated Используйте опции {@link tileContentTpl} или {@link tileTpl}.
             */
            tileTemplate : null,
            /**
             * @cfg {String} Шаблон отображения внутреннего содержимого элемента в режиме "Плитка".
             * В шаблоне допускается использование директив шаблонизатора для доступа к значениям полей текущей записи.
             * Шаблоны представляют собой обычные XHTML-файлы, которые помещают рядом с компонентом в директории resources.
             * @example
             * Шаблон для отображения только картинки, наименования и идентификатора.
             * <pre>
             *    <div>
             *       <img class="docs-MyCompositeView__tile-image" src="{{=it.item.get('Изображение')}}" />
             *       <div class="docs-MyCompositeView__tile-title">{{=it.item.get('Наименование')}}</div>
             *       <div class="docs-MyCompositeView__tile-id">{{=it.item.get('@СписокИмущества')}}</div>
             *    </div>
             * </pre>
             * @see listTemplate
             * @see SBIS3.CONTROLS/ListView#itemTemplate
             */
            tileContentTpl : null,
            /**
             * @cfg {String} Шаблон отображения элемента в режиме "Плитка".
             * Используется чтобы добавить атрибуты на элементы или полностью переопрделить шаблон
             * В шаблоне допускается использование директив шаблонизатора для доступа к значениям полей текущей записи.
             * Шаблоны представляют собой обычные XHTML-файлы, которые помещают рядом с компонентом в директории resources.
             * @example
             * Навешивание класса на элементы
             * <pre>
             *    {{it.className="myClass";}}{{=it.defaultTileTpl(it)}}
             * </pre>
             * @see listTemplate
             * @see SBIS3.CONTROLS/ListView#itemTemplate
             */
            tileTpl: null,
            /**
             * @cfg {String} Шаблон отображения внутреннего содержимого элемента в режиме "Список".
             * В шаблоне допускается использование директив шаблонизатора для доступа к значениям полей текущей записи.
             * Шаблоны представляют собой обычные XHTML-файлы, которые помещают рядом с компонентом в директории resources.
             * @example
             * Шаблон для отображения только картинки, наименования и идентификатора.
             * <pre>
             *    <div>
             *       <img class="docs-MyCompositeView__tile-image" src="{{=it.item.get('Изображение')}}" />
             *       <div class="docs-MyCompositeView__tile-title">{{=it.item.get('Наименование')}}</div>
             *       <div class="docs-MyCompositeView__tile-id">{{=it.item.get('@СписокИмущества')}}</div>
             *    </div>
             * </pre>
             * @see listTemplate
             * @see SBIS3.CONTROLS/ListView#itemTemplate
             */
            listContentTpl : null,
            /**
             * @cfg {String} Шаблон отображения элемента в режиме "Список".
             * Используется чтобы добавить атрибуты на элементы или полностью переопрделить шаблон
             * В шаблоне допускается использование директив шаблонизатора для доступа к значениям полей текущей записи.
             * Шаблоны представляют собой обычные XHTML-файлы, которые помещают рядом с компонентом в директории resources.
             * @example
             * Навешивание класса на элементы
             * <pre>
             *    {{it.className="myClass";}}{{=it.defaultTileTpl(it)}}
             * </pre>
             * @see listTemplate
             * @see SBIS3.CONTROLS/ListView#itemTemplate
             */
            listTpl: null
         }
      },

      $constructor: function() {
         //this._drawViewMode(this._options.mode);
         this._container.addClass('controls-CompositeView-' + this._options.viewMode);

         this._calculateTileHandler = this._calculateTile.bind(this);
         this.subscribe('onDrawItems', this._calculateTileHandler);
   
         //TODO:Нужен какой то общий канал для ресайза окна
         $(window).bind('resize', this._calculateTileHandler);
         this.subscribe('onAfterVisibilityChange', this._calculateTileHandler);
         
         if (this._options.tileTemplate) {
            IoC.resolve('ILogger').log('CompositeView', 'Контрол ' + this.getName() + ' отрисовывается по неоптимальному алгоритму. Задан tileTemplate');
         }
         if (this._options.listTemplate) {
            IoC.resolve('ILogger').log('CompositeView', 'Контрол ' + this.getName() + ' отрисовывается по неоптимальному алгоритму. Задан listTemplate');
         }
      },

      _calculateTile: function() {
         if (this._options.viewMode == 'tile' && !this._options.tileMode){
            this._calculateTileWidth();
         }
      },

      _setHoveredStyles: function(item) {
         if (item && !item.hasClass('controls-CompositeView__hoverStylesInit')) {
            this._calculateHoveredStyles(item);
            this._hasItemsActions().addCallback(function(hasItemsActions) {
               item.toggleClass('controls-CompositeView__item-withoutItemsAction', !hasItemsActions);
            });
            item.addClass('controls-CompositeView__hoverStylesInit');
         }
      },

      _hasItemsActions: function() {
         var
            result,
            itemsActions = this.getItemsActions();

         if (itemsActions) {
            result = itemsActions.ready().addCallback(function() {
               return !!itemsActions.hasVisibleActions();
            });
         } else {
            result = Deferred.success(false);
         }

         return result;
      },

      _calculateHoveredStyles: function(item) {
         if (this._options.tileMode === TILE_MODE.DYNAMIC) {
            this._setDynamicHoveredStyles(item);
         } else if (this._options.tileMode === TILE_MODE.STATIC && !this._container.hasClass('controls-CompositeView-tile__static-smallImage')) {
            this._setStaticHoveredStyles(item);
         }
      },

      _setDynamicHoveredStyles: function(item) {
         var
             margin,
             additionalWidth,
             additionalHeight;
         additionalWidth = item.outerWidth() / 2;
         margin = item.outerWidth(true) / 2 - additionalWidth;
         additionalHeight = item.outerHeight() / 2;
         item.css('padding', (additionalHeight / 2) + 'px ' + (additionalWidth / 2) + 'px').css('margin', '' + (-additionalHeight / 2) + 'px ' + (-(additionalWidth / 2 - margin)) + 'px');
      },

      _setStaticHoveredStyles: function(item) {
         var offset, margin;
         offset = $('.controls-CompositeView__tileTitle', item).outerHeight(true) - (item.hasClass('controls-CompositeView__item-withTitle') ? 25 : 0);
         margin = (item.outerHeight(true) - item.outerHeight()) / 2;
         item.css('padding-bottom', offset).css('margin-bottom', -(offset - margin));
         $('.controls-CompositeView__tileContainer', item).css('margin-bottom', offset);
      },

      _updateHeadAfterInit: function() {
         if (this._options.viewMode == 'table') {
            this._redrawTheadAndTfoot();
         }
      },
      /**
       * Устанавливает режим отображения данных.
       * @param {String} mode Режим отображения данных: table (таблица), list (список) и tile (плитка).
       * Подробнее о каждом режиме отображения вы можете прочитать в описании к опции {@link viewMode}.
       * При изменении режима происходит событие {@link onViewModeChanged}.
       * @see viewMode
       * @see getViewMode
       * @see onViewModeChanged
       */
      setViewMode: function(mode) {
         if (this._options.viewMode === mode) {
            return;
         }
         var dragndrop = this.getItemsDragNDrop();
         this.setItemsDragNDrop(false);
         this._options.viewMode = mode;
         this.setItemsDragNDrop(dragndrop);
         this._drawViewMode(mode);
         if (mode === 'table') {
            this._updateAjaxLoaderPosition();
         }
         this._notify('onViewModeChanged');
      },
      /**
       * Возвращает признак, по которому можно определить установленный режим отображения данных.
       * @returns {String} Режим отображения данных: table (таблица), list (список) и tile (плитка).
       * Подробнее о каждом режиме отображения вы можете прочитать в описании к опции {@link viewMode}.
       * @see viewMode
       * @see setViewMode
       */
      getViewMode: function(){
         return this._options.viewMode;
      },

      _getItemsTemplate: function() {
         if (this._options.viewMode == 'table') {
            return this._options._itemsTemplate;
         }
         else {
            return TemplateUtil.prepareTemplate(this._options._compositeItemsTemplate);
         }
      },

      _drawViewMode : function(mode) {
         var tileMode = this._options.tileMode;
         this._container.toggleClass('controls-CompositeView-table', mode == 'table')
             .toggleClass('controls-CompositeView-list', mode == 'list')
             .toggleClass('controls-CompositeView-tile', mode == 'tile')
             .toggleClass('controls-CompositeView-tile__static', mode == 'tile' && tileMode == TILE_MODE.STATIC)
             .toggleClass('controls-CompositeView-tile__dynamic', mode == 'tile' && tileMode == TILE_MODE.DYNAMIC);
         if (this._options.viewMode == 'table') {
            $('.controls-DataGridView__table', this._container.get(0)).removeClass('ws-hidden');
            $('.controls-CompositeView__itemsContainer', this._container.get(0)).addClass('ws-hidden');
         }
         else {
            $('.controls-CompositeView__itemsContainer', this._container.get(0)).removeClass('ws-hidden');
            $('.controls-DataGridView__table', this._container.get(0)).addClass('ws-hidden');
         }
      },
      _isAllowInfiniteScroll : function(){
         var allow = this._allowInfiniteScroll && (this._options.viewMode === 'table' || !this._options.showPaging);
         //TODO сделать красивее. тут отключать индикатор - это костыль
         if (!allow){
            this._hideLoadingIndicator();
         }
         return allow;
      },
      _calculateTileWidth: function(){
         var itemsContainer = this._getItemsContainer(),
            tiles = $('.controls-CompositeView__tileItem:not(.controls-ListView__item-type-node)', itemsContainer),
            folders = $('.controls-ListView__item-type-node', itemsContainer);
         if (!this._tileWidth) {
            this._tileWidth = $(tiles[0]).outerWidth(true);
         }
         if (!this._folderWidth) {
            this._folderWidth = $(folders[0]).outerWidth(true);
         }
         this._calcWidth(tiles, this._tileWidth);
         this._calcWidth(folders, this._folderWidth);
      },

      _calcWidth: function(tiles, oldWidth){
         if (tiles.length){
            var itemsContainerWidth =  Math.floor(this._getItemsContainer()[0].getBoundingClientRect().width),
               tilesCount = Math.floor(itemsContainerWidth / oldWidth),
               newTileWidth = itemsContainerWidth / tilesCount;

            tiles.outerWidth(newTileWidth, true);
         }
      },

      /**
       * Устанавливает Шаблон отображения строки в режиме "Список".
       * @see listTemplate
       */
      setListTemplate : function(tpl) {
         this._options.listTemplate = tpl;
      },


      /**
       * Устанавливает Шаблон отображения строки в режиме "Плитка".
       * @see tileTemplate
       */
      setTileTemplate : function(tpl) {
         this._options.tileTemplate = tpl;
      },

      around : {
         _getItemTemplate: function(parentFnc, itemProj) {
            var resultTpl, dotTpl, item = itemProj.getContents();
            switch (this._options.viewMode) {
               case 'table':
                  resultTpl = parentFnc.call(this, itemProj);
                  break;
               case 'list':
                  {
                     if (this._options.listTemplate) {
                        dotTpl = this._options.listTemplate;
                     } else {
                        dotTpl = '<div style="{{=it.decorators.apply(it.color, \'color\')}}">{{=it.decorators.apply(it.item.get(it.description))}}</div>';
                     }
                     resultTpl = dotTpl;
                     break;
                  }
               case 'tile':
                  {
                     if (this._options.tileTemplate) {
                        dotTpl = this._options.tileTemplate;
                     } else {
                        var src;
                        if (!item.get(this._options.imageField)) {
                           src = constants.resourceRoot + 'SBIS3.CONTROLS/themes/online/img/defaultItem.png';
                        } else {
                           src = '{{=it.item.get(it.image)}}';
                        }
                        dotTpl = '<div class="controls-CompositeView__verticalItemActions js-controls-CompositeView__verticalItemActions"><div class="controls-ListView__itemCheckBox js-controls-ListView__itemCheckBox"></div><img class="controls-CompositeView__tileImg" src="' + src + '"/><div class="controls-CompositeView__tileTitle" style="{{=it.decorators.apply(it.color, \'color\')}}">{{=it.decorators.apply(it.item.get(it.description))}}</div></div>';
                     }
                     resultTpl = dotTpl;
                     break;
                  }

            }
            return resultTpl;
         },


         _buildTplArgs : function(parentFnc, item) {
            var parentOptions = parentFnc.call(this, item);
            if ((this._options.viewMode == 'list') || (this._options.viewMode == 'tile')) {
               parentOptions.image = this._options.imageField;
               parentOptions.description = this._options.displayProperty;
            }
            return parentOptions;
         },

         expandNode: function(parentFunc, key, hash) {
            if(this.getViewMode() === 'table') {
               parentFunc.call(this, key, hash);

            }
         },

         collapseNode: function(parentFunc, key, hash) {
            if(this.getViewMode() === 'table') {
               parentFunc.call(this, key, hash);
            }
         },

         _getItemsContainer: function(parentFnc){
            if (this._options.viewMode == 'table') {
               return parentFnc.call(this);
            }
            else {
               return $('.controls-CompositeView__itemsContainer', this._container.get(0));
            }
         },

         _addItemAttributes: function (parentFnc, container, key) {
            switch (this._options.viewMode) {
               case 'list': container.addClass('controls-CompositeView__listItem'); break;
               case 'tile': container.addClass('controls-CompositeView__tileItem'); break;
            }
            parentFnc.call(this, container, key);
         },

         //TODO заглушка для CompositeView
         _isSlowDrawing: function(parentFnc, easy) {
            var flag = parentFnc.call(this, easy);
            if (this._options.viewMode == 'list') {
               if (this._options.listTemplate) {
                  flag = true;
               }
            }

            if (this._options.viewMode == 'tile') {
               if (this._options.tileTemplate) {
                  flag = true;
               }
            }
            return flag;
         },

         destroy: function(parentFnc) {
            $(window).unbind('resize', this._calculateTileHandler);
            parentFnc.call(this);
         },

         _onCollectionAddMoveRemove: function(parentFnc, event, action, newItems, newItemsIndex) {
            //TODO в плитке с деревом сложная логика при определении позиций контейнеров, которые необходимо вставлять
            //а случаи в которых это требуются редкие, но все же есть, вызовем пока что полную перерисовку до внедрения VDOM
            var args = Array.prototype.slice.call(arguments, 1);
            if (this._options.viewMode == 'table') {
               //надо убрать первый аргумент parentFnc а остальное прокинуть.
               //TODO убрать когда будем отказываться от before/after в миксинах
               parentFnc.apply(this, args);
            }
            else {

               var lastItemsIndex = this._getItemsProjection().getCount() - newItems.length;

               //TODO когда идет догрузка по скроллу, все перерисовывать слишком дорого - возникли тормоза в контактах, до VDOM вставляем такую проверку
               //1. Если это добавление в конец и на второй странице нет папок
               //2. Если это удаление
               // тогда можно отрисовать как обычно
               // в остальных случаях полная перерисовка
               if (((lastItemsIndex == newItemsIndex) && !(cInstance.instanceOfModule(newItems[0], 'WS.Data/Display/TreeItem') && newItems[0].isNode()) && !this._redrawOnCollectionChange) || action == 'rm') {
                  parentFnc.apply(this, args);
               }
               else {
                  /* Дополнение к комментарию выше:
                     во время одной пачки изменений может происходить несколько событий,
                     например, несколько add подряд.
                     И если мы перерисовали список один раз, то и на все последующие события данной пачки изменений,
                     мы тоже должны вызывать перерисовку. Иначе может возникнуть ситуация,
                     когда после перерисовки добавятся записи в конец и задублируются. */
                  this._redrawOnCollectionChange = true;
                  this.redraw();
               }

            }
         },

         _afterCollectionChange: function(parentFnc) {
            parentFnc.call(this);
            this._redrawOnCollectionChange = false;
         },

         _getItemsTemplateForAdd: function(parentFnc) {
            if (this._options.viewMode == 'table') {
               return parentFnc.call(this);
            }
            else {
               return ItemsTemplate;
            }
         }
      }

   };
   MultiView.TILE_MODE = TILE_MODE;
   return MultiView;

});