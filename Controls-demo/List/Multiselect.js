/**
 * Created by kraynovdo on 31.01.2018.
 */
define('Controls-demo/List/Multiselect', [
   'Core/Control',
   'tmpl!Controls-demo/List/Multiselect/Multiselect',
   'WS.Data/Source/Memory'
], function (BaseControl,
             template,
             MemorySource
) {
   'use strict';

   var srcData = [
      {
         id: 1,
         title: 'Настолько длинное название папки что оно не влезет в максимальный размер 1',
         description: 'Другое название 1'
      },
      {
         id: 2,
         title: 'Notebooks 2',
         description: 'Описание вот такое'
      },
      {
         id: 3,
         title: 'Smartphones 3 ',
         description: 'Хватит страдать'

      }
   ];

   var ModuleClass = BaseControl.extend(
      {
         _template: template,

         constructor: function() {
            ModuleClass.superclass.constructor.apply(this, arguments);
            this._viewSource = new MemorySource({
               keyProperty: 'id',
               data: srcData
            })
         }
      });
   return ModuleClass;
});