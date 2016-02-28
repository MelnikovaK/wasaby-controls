/**
 * Created by am.gerasimov on 30.03.2015.
 */
define('js!SBIS3.CONTROLS.CommonHandlers',[],
   function() {
      var CommonHandlers = {
         deleteRecords: function(idArray) {
            var
               idArray = Array.isArray(idArray) ? idArray : [idArray],
               message = idArray.length !== 1 ? "Удалить записи?" : "Удалить текущую запись?",
               self = this;

            return $ws.helpers.question(message).addCallback(function(res) {
               if (res) {
                  return self._dataSource.destroy(idArray).addCallback(function () {
                     self.removeItemsSelection(idArray);
                     if ($ws.helpers.instanceOfModule(self, 'SBIS3.CONTROLS.TreeCompositeView') && self.getViewMode() === 'table') {
                        self.partialyReload(idArray);
                     } else {
                        self.reload();
                     }
                  }).addErrback(function(result) {
                     $ws.helpers.alert(result)
                  });
               }
            });
         },
         editItems: function(tr, id) {
            this.sendCommand('activateItem', id);
         }
      };

      return CommonHandlers;
   });
