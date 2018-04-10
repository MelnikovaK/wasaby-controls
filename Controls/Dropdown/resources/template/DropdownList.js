define('Controls/Dropdown/resources/template/DropdownList',
   [
      'Core/Control',
      'tmpl!Controls/Dropdown/resources/template/DropdownList',
      'Controls/Dropdown/resources/MenuViewModel',
      'tmpl!Controls/Dropdown/resources/template/itemTemplate',
      'tmpl!Controls/Dropdown/resources/template/defaultHeadTemplate',
      'tmpl!Controls/Dropdown/resources/template/defaultContentHeadTemplate',
      'css!Controls/Dropdown/resources/template/DropdownList'
   ],
   function(Control, MenuItemsTpl, MenuViewModel, itemTemplate, defaultHeadTemplate, defaultContentHeadTemplate) {

      /**
       * Действие открытия прилипающего окна
       * @class Controls/Popup/Opener/Menu
       * @control
       * @public
       * @category Popup
       */

      /**
        * @name Controls/Menu#menuStyle
        * @cfg {String} Отображения меню
        * @variant defaultHead Стандартный заголовок
        * @variant duplicateHead Иконка вызывающего элемента дублрируется в первый пункт. Заголовка с фоном нет.
        * @variant cross Добавляется крест закрытия. Заголовка с фоном нет.
        */
      /**
        * @name Controls/Menu#showHeader
        * @cfg {Boolean} Показывать ли заголовок в меню.
        * @variant true Заголовок есть
        * @variant false Заголовка нет.
        */
      var Menu = Control.extend([], {
         _template: MenuItemsTpl,
         _defaultItemTemplate: itemTemplate,
         _defaultHeadTemplate: defaultHeadTemplate,
         _defaultContentHeadTemplate: defaultContentHeadTemplate,
         _controlName: 'Controls/Dropdown/resources/template/DropdownList',
         _hasHierarchy: false,
         constructor: function(config) {
            var self = this;
            var sizes = ['small', 'medium', 'large'];
            var iconSize;

            if (config.defaultItemTemplate) {
               this._defaultItemTemplate = config.defaultItemTemplate;
            }

            if (config.showHeader) {
               this._headConfig = config.headConfig || {};
               this._headConfig.caption = this._headConfig.caption || config.caption;
               this._headConfig.icon = this._headConfig.icon || config.icon;
               this._headConfig.menuStyle =  this._headConfig.menuStyle || 'defaultHead';

               if (this._headConfig.icon) {
                  sizes.forEach(function(size) {
                     if (self._headConfig.icon.indexOf('icon-' + size) !== -1) {
                        iconSize = size;
                     }
                  });
               }
               if (this._headConfig.menuStyle === 'duplicateHead') {
                  this._duplicateHeadClassName = 'control-MenuButton-duplicate-head_' + iconSize;
               }
               if (this._headConfig.menuStyle === 'cross') {
                  this._headConfig.icon = null;
               }
            }
            Menu.superclass.constructor.apply(this, arguments);
            this.resultHandler = this.resultHandler.bind(this);
            this._mousemoveHandler = this._mousemoveHandler.bind(this);
         },
         _beforeMount: function(newOptions) {
            if (newOptions.items) {
               this._listModel = new MenuViewModel({
                  items: newOptions.items,
                  rootKey: newOptions.rootKey || null,
                  selectedKeys: newOptions.selectedKeys,
                  keyProperty: newOptions.keyProperty,
                  itemTemplateProperty: newOptions.itemTemplateProperty,
                  nodeProperty: newOptions.nodeProperty,
                  parentProperty: newOptions.parentProperty
               });
               this._hasHierarchy = this._listModel.hasHierarchy();
            }
         },

         _itemMouseEnter: function(event, item, hasChildren) {
            if (hasChildren) {
               var config = {
                  componentOptions: {
                     items: this._options.items,
                     itemTemplate: this._options.itemTemplate,
                     keyProperty: this._options.keyProperty,
                     parentProperty: this._options.parentProperty,
                     nodeProperty: this._options.nodeProperty,
                     selectedKeys: this._options.selectedKeys,
                     rootKey: item.get(this._options.keyProperty),
                     showHeader: false,
                     defaultItemTemplate: this._options.defaultItemTemplate
                  },
                  corner: {
                     horizontal: 'right'
                  },
                  target: event.target
               };
               this._children.subDropdownOpener.open(config, this);
            } else if (this._hasHierarchy) {
               this._children.subDropdownOpener.close();
            }
         },
         resultHandler: function(result) {
            switch (result.action) {
               case 'itemClick':
                  this._notify('sendResult', [result]);
            }
         },
         _itemClickHandler: function(event, item, flag) { //todo нужно обсудить
            var result = {
               action: 'itemClick',
               event: event,
               data: [item, flag]
            };
            this._notify('sendResult', [result]);
         },
         _footerClick: function(event) {
            var result = {
               action: 'footerClick',
               event: event
            };
            this._notify('sendResult', [result]);
         },
         _headerClick: function() {
            this._notify('close');
         },
         _mousemoveHandler: function(emitterEvent, event) {
            if (!event.target.closest('.controls-DropdownList__popup') && this._container.closest('.controls-DropdownList__subMenu')) { //Если увели курсор мимо - закрываемся
               this._notify('close');
            }
         }
      });

      Menu.getDefaultOptions = function() {
         return {
            menuStyle: 'defaultHead'
         };
      };

      return Menu;
   }
);
