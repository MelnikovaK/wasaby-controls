/**
 * Created by kraynovdo on 25.01.2018.
 */
define('Controls/Tabs/Buttons', [
   'Core/Control',
   'Controls/Controllers/SourceController',
   'tmpl!Controls/Tabs/Buttons/Buttons',
   'tmpl!Controls/Tabs/Buttons/ItemTemplate',
   'css!Controls/Tabs/Buttons/Buttons'

], function(Control,
   SourceController,
   TabButtonsTpl,
   ItemTemplate
) {
   'use strict';

   var _private = {
      initItems: function(source, instance) {
         instance._sourceController = new SourceController({
            source: source
         });
         return instance._sourceController.load().addCallback(function(items) {
            var
               leftOrder = 1,
               rightOrder = 30;

            // Необходимо обратить внимание на set/get методы тк возможно item будет enumerable
            // и нужно будет делать через обёртку
            items.each(function(item) {
               if (item.get('align') === 'left') {
                  item.set('_order', leftOrder++);
               } else {
                  item.set('_order', rightOrder++);
               }
            });

            //save last right order
            rightOrder--;
            instance._lastRightOrder = rightOrder;
            return items;
         });
      },
      prepareItemOrder: function(order) {
         return '-ms-flex-order:' + order + '; order:' + order;
      },
      prepareItemClass: function(item, options, lastRightOrder) {
         var
            classes = ['controls-Tabs__item'];
         classes.push('controls-Tabs__item_align_' + (item.get('align') ? item.get('align') : 'right'));
         if (item.get('_order') === 1 || item.get('_order') === lastRightOrder) {
            classes.push('controls-Tabs__item_extreme');
         }
         if (item.get(options.keyProperty) === options.selectedKey) {
            classes.push('controls-Tabs_style_' + options.style + '__item_state_selected');
            classes.push('controls-Tabs__item_state_selected');
         } else {
            classes.push('controls-Tabs__item_state_default');
         }
         if (item.get('type')) {
            classes.push('controls-Tabs__item_type_' + item.get('type'));
         }
         return classes.join(' ');
      }
   };

   /**
     * Компонент - корешки закладок
     * @class Controls/Tabs/Buttons
     * @extends Core/Control
     * @mixes Controls/interface/ISource
     * @mixes Controls/interface/ISingleSelectable
     * @control
     * @public
     * @category List
     */

   /**
     * @name Controls/Tabs/Buttons#tabSpaceTemplate
     * @cfg {Content} Шаблон содержимого области, находящейся на одном уровне с корешками закладок
     */

   var TabsButtons = Control.extend({
      _template: TabButtonsTpl,
      items: [],
      constructor: function(cfg) {
         TabsButtons.superclass.constructor.apply(this, arguments);
         this._publish('selectedKeyChanged');
      },
      _beforeMount: function(options, context, receivedState) {
         if (receivedState) {
            this._items = receivedState;
         }
         if (options.source) {
            return _private.initItems(options.source, this).addCallback(function(items) {
               this._items = items;
            }.bind(this));
         }
      },
      _beforeUpdate: function(newOptions) {
         var
            self = this;
         if (newOptions.source && newOptions.source !== this._options.source) {
            return _private.initItems(newOptions.source, this).addCallback(function(items) {
               this._items = items;
               self._forceUpdate();
            }.bind(this));
         }
      },
      _onItemClick: function(event, key) {
         this._notify('selectedKeyChanged', [key]);
      },
      _prepareItemClass: function(item) {
         return _private.prepareItemClass(item, this._options, this._lastRightOrder);
      },
      _prepareItemOrder: function(order) {
         return _private.prepareItemOrder(order);
      }
   });

   TabsButtons.getDefaultOptions = function() {
      return {
         itemTemplate: ItemTemplate,
         style: 'default',
         displayProperty: 'title'
      };
   };

   //необходимо для тестов
   TabsButtons._private = _private;
   return TabsButtons;
});
