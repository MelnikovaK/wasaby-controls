

      

      function prepareEmpty(emptyText) {
         if (emptyText) {
            return emptyText === true ? rk('Не выбрано') : emptyText;
         }
      }

      export = {prepareEmpty: prepareEmpty};
   
