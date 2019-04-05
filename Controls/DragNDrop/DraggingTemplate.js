define('Controls/DragNDrop/DraggingTemplate', [
   'Core/Control',
   'wml!Controls/DragNDrop/DraggingTemplate/DraggingTemplate',
   'css!theme?Controls/DragNDrop/DraggingTemplate/DraggingTemplate'
], function(Control, template) {

   var MAX_ITEMS_COUNT = 999;

   var _private = {
      getCounterText: function(itemsCount) {
         var result;
         if (itemsCount > MAX_ITEMS_COUNT) {
            result = MAX_ITEMS_COUNT + '+';
         } else if (itemsCount > 1) {
            result = itemsCount;
         }
         return result;
      }
   };

   /**
    * Standard dragging template for the list.
    * More information you can read <a href="/doc/platform/developmentapl/interface-development/wasaby/components/drag-n-drop/">here</a>.
    * @class Controls/DragNDrop/DraggingTemplate
    * @extends Core/Control
    * @control
    * @public
    * @author Авраменко А.С.
    * @category DragNDrop
    */

   /**
    * @name Controls/DragNDrop/DraggingTemplate#mainText
    * @cfg {String} Main information about the entity being moved.
    * @default Запись реестра
    * @example
    * The following example shows how to use a standard dragging template.
    * <pre>
    *    <Controls.lists:View source="{{_viewSource}}"
    *                   keyProperty="id"
    *                   on:dragStart="_onDragStart()"
    *                   itemsDragNDrop="{{true}}">
    *       <ws:draggingTemplate>
    *          <ws:partial template="Controls/DragNDrop/DraggingTemplate"
    *                      mainText="{{draggingTemplate.entity._options.mainText}}"
    *                      image="{{draggingTemplate.entity._options.image}}"
    *                      additionalText="{{draggingTemplate.entity._options.additionalText}}">
    *          </ws:partial>
    *       </ws:draggingTemplate>
    *    </Controls.lists:View>
    * </pre>
    *
    * <pre>
    *    Control.extend({
    *       ...
    *       _onDragStart: function(event, items) {
    *          var mainItem = this._items.getRecordById(items[0]);
    *          return new Entity({
    *             items: items,
    *             mainText: mainItem.get('FIO'),
    *             additionalText: mainItem.get('title'),
    *             image: mainItem.get('userPhoto')
    *          });
    *       },
    *       _beforeMount: function() {
    *          this._viewSource= new Source({...});
    *       }
    *       ...
    *    });
    * </pre>
    */

   /**
    * @name Controls/DragNDrop/DraggingTemplate#additionalText
    * @cfg {String} Additional information about the entity being moved.
    * @example
    * The following example shows how to use a standard dragging template.
    * <pre>
    *    <Controls.lists:View source="{{_viewSource}}"
    *                   keyProperty="id"
    *                   on:dragStart="_onDragStart()"
    *                   itemsDragNDrop="{{true}}">
    *       <ws:draggingTemplate>
    *          <ws:partial template="Controls/DragNDrop/DraggingTemplate"
    *                      mainText="{{draggingTemplate.entity._options.mainText}}"
    *                      image="{{draggingTemplate.entity._options.image}}"
    *                      additionalText="{{draggingTemplate.entity._options.additionalText}}">
    *          </ws:partial>
    *       </ws:draggingTemplate>
    *    </Controls.lists:View>
    * </pre>
    *
    * <pre>
    *    Control.extend({
    *       ...
    *       _onDragStart: function(event, items) {
    *          var mainItem = this._items.getRecordById(items[0]);
    *          return new Entity({
    *             items: items,
    *             mainText: mainItem.get('FIO'),
    *             additionalText: mainItem.get('title'),
    *             image: mainItem.get('userPhoto')
    *          });
    *       },
    *       _beforeMount: function() {
    *          this._viewSource= new Source({...});
    *       }
    *       ...
    *    });
    * </pre>
    */

   /**
    * @name Controls/DragNDrop/DraggingTemplate#image
    * @cfg {String} A image of the entity being moved.
    * @remark The option must contain a link to the image. If this option is specified, the logo option is not applied.
    * @example
    * The following example shows how to use a standard dragging template.
    * <pre>
    *    <Controls.lists:View source="{{_viewSource}}"
    *                   keyProperty="id"
    *                   on:dragStart="_onDragStart()"
    *                   itemsDragNDrop="{{true}}">
    *       <ws:draggingTemplate>
    *          <ws:partial template="Controls/DragNDrop/DraggingTemplate"
    *                      mainText="{{draggingTemplate.entity._options.mainText}}"
    *                      image="/resources/imageForDragTemplate.jpg"
    *                      additionalText="{{draggingTemplate.entity._options.additionalText}}">
    *          </ws:partial>
    *       </ws:draggingTemplate>
    *    </Controls.lists:View>
    * </pre>
    *
    * <pre>
    *    Control.extend({
    *       ...
    *       _onDragStart: function(event, items) {
    *          var mainItem = this._items.getRecordById(items[0]);
    *          return new Entity({
    *             items: items,
    *             mainText: mainItem.get('FIO'),
    *             additionalText: mainItem.get('title')
    *          });
    *       },
    *       _beforeMount: function() {
    *          this._viewSource= new Source({...});
    *       }
    *       ...
    *    });
    * </pre>
    */

   /**
    * @name Controls/DragNDrop/DraggingTemplate#logo
    * @cfg {String} A logo of the entity being moved.
    * @default icon-DocumentUnknownType
    * @remark The full list of possible values can be found <a href="/docs/js/icons/">here</a>. This option is used if the image option is not specified.
    * @example
    * The following example shows how to use a standard dragging template.
    * <pre>
    *    <Controls.lists:View source="{{_viewSource}}"
    *                   keyProperty="id"
    *                   on:dragStart="_onDragStart()"
    *                   itemsDragNDrop="{{true}}">
    *       <ws:draggingTemplate>
    *          <ws:partial template="Controls/DragNDrop/DraggingTemplate"
    *                      mainText="{{draggingTemplate.entity._options.mainText}}"
    *                      logo="icon-Album"
    *                      additionalText="{{draggingTemplate.entity._options.additionalText}}">
    *          </ws:partial>
    *       </ws:draggingTemplate>
    *    </Controls.lists:View>
    * </pre>
    *
    * <pre>
    *    Control.extend({
    *       ...
    *       _onDragStart: function(event, items) {
    *          var mainItem = this._items.getRecordById(items[0]);
    *          return new Entity({
    *             items: items,
    *             mainText: mainItem.get('FIO'),
    *             additionalText: mainItem.get('title')
    *          });
    *       },
    *       _beforeMount: function() {
    *          this._viewSource= new Source({...});
    *       }
    *       ...
    *    });
    * </pre>
    */

   return Control.extend({
      _template: template,

      _beforeMount: function(options) {
         this._itemsCount = _private.getCounterText(options.entity.getItems().length);
      }
   });
});
