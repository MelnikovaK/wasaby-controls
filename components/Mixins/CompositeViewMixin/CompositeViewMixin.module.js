define('js!SBIS3.CONTROLS.CompositeViewMixin', ['html!SBIS3.CONTROLS.CompositeViewMixin'], function(dotTplFn) {
   'use strict';
   /**
    * Миксин добавляет функционал, который позволяет контролу устанавливать режимы отображения элементов коллекции по типу "Таблица", "Плитка" и "Список".
    * @mixin SBIS3.CONTROLS.CompositeViewMixin
    * @public
    * @author Крайнов Дмитрий Олегович
    */
   var MultiView = /** @lends SBIS3.CONTROLS.CompositeViewMixin.prototype */{
      _dotTplFn : dotTplFn,
      $protected: {
         _tileWidth: null,
         _folderWidth: null,
         _options: {
            /**
             * @cfg {String} Устанавливает режим отображения элементов коллекции
             * @variant table Режим отображения "Таблица"
             * @variant list Режим отображения "Список"
             * @variant tile Режим отображения "Плитка"
             */
            viewMode : 'table',
            /**
             * @cfg {String} Устанавливает файловое поле элемента коллекции, которое предназначено для хранения изображений.
             * @remark
             * Файловое поле используется в шаблоне для построения отображения элементов коллекции.
             * Использование опции актуально для режимов отображения "Список" и "Плитка".
             * Если для этих режимов используется пользовательский шаблон (задаётся опциями {@link listTemplate} и {@link tileTemplate}), то опция также неактуальна.
             * @see SBIS3.CONTROLS.DSMixin#displayField
             * @see tileTemplate
             * @see listTemplate
             */
            imageField : null,
            /**
             * @cfg {String} Шаблон отображения строки в режиме "Список".
             * В шаблоне допускается использование директив шаблонизатора для доступа к значениям полей текущей записи.
             * Шаблоны представляют собой обычные XHTML-файлы, которые помещают рядом с компонентом в директории resources.
             * @example
             * Шаблон для отображения только картинки, наименования и идентификатора.
             * <pre>
             *    <div>
             *       <img class="docs-MyCompositeView__list-image" src="{{=it.item.get('Изображение')}}" />
             *       <div class="docs-MyCompositeView__list-title">{{=it.item.get('Наименование')}}</div>
             *       <div class="docs-MyCompositeView__list-id">{{=it.item.get('@СписокИмущества')}}</div>
             *    </div>
             * </pre>
             * @see tileTemplate
             * @see SBIS3.CONTROLS.ListView#itemTemplate
             */
            listTemplate : null,
            /**
             * @cfg {String} Шаблон отображения строки в режиме "Плитка".
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
             * @see SBIS3.CONTROLS.ListView#itemTemplate
             */
            tileTemplate : null
         }
      },

      $constructor: function() {
         this._drawViewMode(this._options.mode);
         this._container.addClass('controls-CompositeView-' + this._options.viewMode);
         var self = this;

         this.subscribe('onDrawItems', function(){
            if (self._options.viewMode == 'tile'){
               self._calculateTileWidth();
            }
         });
         //TODO:Нужен какой то общий канал для ресайза окна
         $(window).bind('resize', function(){
            if (self._options.viewMode == 'tile'){
               self._calculateTileWidth();
            }
         });
      },

      setViewMode: function(mode) {
         this._getItemsContainer().unbind('mousedown', this._dragStartHandler);
         this._options.viewMode = mode;
         this._getItemsContainer().bind('mousedown', this._dragStartHandler);
         this._options.openedPath = [];
         this._drawViewMode(mode);
      },

      getViewMode: function(){
         return this._options.viewMode;
      },

      _drawViewMode : function(mode) {
         this._container.toggleClass('controls-CompositeView-table', mode == 'table')
                        .toggleClass('controls-CompositeView-list', mode == 'list')
                        .toggleClass('controls-CompositeView-tile', mode == 'tile');
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
            folders = $('.controls-ListView__type-true', itemsContainer);
         if (!this._tileWidth) {
            this._tileWidth = $(tiles[0]).width();
         }
         if (!this._folderWidth) {
            this._folderWidth = $(folders[0]).width();
         }
         this._calcWidth(tiles, this._tileWidth);
         this._calcWidth(folders, this._folderWidth);
      },

      _calcWidth: function(tiles, oldWidth){
         if (tiles.length){
            var itemsContainerWidth =  this._getItemsContainer().outerWidth(),
               tilesCount = Math.floor(itemsContainerWidth / oldWidth),
               newTileWidth = itemsContainerWidth / tilesCount;

            if (itemsContainerWidth - tiles.length * oldWidth < oldWidth) {
               tiles.outerWidth(newTileWidth);
            }
         }
      },

      around : {
         _getItemTemplate: function(parentFnc, item) {
            var resultTpl, dotTpl;
            switch (this._options.viewMode) {
               case 'table':
                  resultTpl = parentFnc.call(this, item);
                  break;
               case 'list':
                  {
                     if (this._options.listTemplate) {
                        if (this._options.listTemplate instanceof Function) {
                           dotTpl = this._options.listTemplate;
                        } else {
                           dotTpl = doT.template(this._options.listTemplate);
                        }
                     } else {
                        dotTpl = doT.template('<div style="{{=it.decorators.apply(it.color, \'color\')}}">{{=it.decorators.apply(it.item.get(it.description))}}</div>');
                     }
                     resultTpl = dotTpl;
                     break;
                  }
               case 'tile':
                  {
                     if (this._options.tileTemplate) {
                        if (this._options.tileTemplate instanceof Function) {
                           dotTpl = this._options.tileTemplate;
                        } else {
                           dotTpl = doT.template(this._options.tileTemplate);
                        }
                     } else {
                        var src;
                        if (!item.get(this._options.imageField)) {
                           src = $ws._const.resourceRoot + 'SBIS3.CONTROLS/themes/online/img/defaultItem.png';
                        } else {
                           src = '{{=it.item.get(it.image)}}';
                        }
                        dotTpl = doT.template('<div class="controls-CompositeView__verticalItemActions js-controls-CompositeView__verticalItemActions"><div class="controls-ListView__itemCheckBox js-controls-ListView__itemCheckBox"></div><img class="controls-CompositeView__tileImg" src="' + src + '"/><div class="controls-CompositeView__tileTitle" style="{{=it.decorators.apply(it.color, \'color\')}}">{{=it.decorators.apply(it.item.get(it.description))}}</div></div>');
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
               parentOptions.description = this._options.displayField;
            }
            return parentOptions;
         },

         expandNode: function(parentFunc, key) {
            if(this.getViewMode() === 'table') {
               parentFunc.call(this, key);

            }
         },

         collapseNode: function(parentFunc, key) {
            if(this.getViewMode() === 'table') {
               parentFunc.call(this, key);
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
         }
      }

   };

   return MultiView;

});