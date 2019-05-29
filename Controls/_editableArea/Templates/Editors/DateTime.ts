import Base from './Base';

'use strict';

/**
 * @class Controls/_editableArea/Templates/Editors/DateTime
 * @public
 */
var DateTime = Base.extend({
   _prepareValueForEditor: function (value) {
      // todo fixed by: https://online.sbis.ru/opendoc.html?guid=00a8daf1-c567-46bb-a40e-53c1eef5a26b
      return value.toLocaleDateString('ru-RU', {
         year: '2-digit',
         month: 'numeric',
         day: 'numeric'
      });
   }
});

export default DateTime;
