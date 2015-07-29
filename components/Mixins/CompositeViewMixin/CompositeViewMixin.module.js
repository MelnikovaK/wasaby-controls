define('js!SBIS3.CONTROLS.CompositeViewMixin', ['html!SBIS3.CONTROLS.CompositeViewMixin'], function(dotTplFn) {
   'use strict';

   var MultiView = {
      _dotTplFn : dotTplFn,
      $protected: {
         _tileWidth: null,
         _folderWidth: null,
         _options: {
            /**
             * @cfg {Object} Режим отображения
             * @variant table таблица
             * @variant list список
             * @variant tile плитка
             */
            viewMode : 'table',

            imageField : null,
            listTemplate : null,
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
         this._options.viewMode = mode;
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
            $('.controls-DataGrid__table', this._container.get(0)).removeClass('ws-hidden');
            $('.controls-CompositeView__itemsContainer', this._container.get(0)).addClass('ws-hidden');
         }
         else {
            $('.controls-CompositeView__itemsContainer', this._container.get(0)).removeClass('ws-hidden');
            $('.controls-DataGrid__table', this._container.get(0)).addClass('ws-hidden');
         }
      },

      _calculateTileWidth: function(){
         var itemsContainer = this._getItemsContainer(),
            tiles = $('.controls-CompositeView__tileItem:not(.controls-ListView__folder)', itemsContainer), 
            folders = $('.controls-ListView__folder', itemsContainer);
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
                     resultTpl = dotTpl({
                        item: item,
                        decorators: this._decorators,
                        color: this._options.colorField ? item.get(this._options.colorField) : '',
                        description: this._options.displayField,
                        image: this._options.imageField
                     });
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
                        dotTpl = doT.template('<div><div class="controls-ListView__itemCheckBox js-controls-ListView__itemCheckBox"></div><img class="controls-CompositeView__tileImg" src="' + src + '"/><div class="controls-CompositeView__tileTitle" style="{{=it.decorators.apply(it.color, \'color\')}}">{{=it.decorators.apply(it.item.get(it.description))}}</div></div>');
                     }
                     resultTpl = dotTpl({
                        item: item,
                        decorators: this._decorators,
                        color: this._options.colorField ? item.get(this._options.colorField) : '',
                        description: this._options.displayField,
                        image: this._options.imageField
                     });
                     break;
                  }

            }
            return resultTpl;
         },

         _getItemActionsPosition: function(parentFunc, item) {
            if (this._options.viewMode == 'table') {
               return parentFunc.call(this, item);
            } else 
            return {
               top: item.position.top,
               right: this._container[0].offsetWidth - (item.position.left + item.size.width)
            };
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