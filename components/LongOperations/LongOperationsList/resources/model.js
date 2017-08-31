define(
   [
      'js!WS.Data/Entity/Model',
      'js!SBIS3.CONTROLS.LongOperationEntry'
   ],

   function (Model, LongOperationEntry) {

      var _timeSpent = function (model) {
         var timeSpent = model.get('timeSpent');
         if (typeof timeSpent !== 'number' || timeSpent <= 0) {
            var STATUSES = LongOperationEntry.STATUSES;
            var status = model.get('status');
            if (status === STATUSES.running) {
               var timeIdle = model.get('timeIdle');
               timeSpent = (new Date()).getTime() - model.get('startedAt') - (typeof timeIdle === 'number' && 0 < timeIdle ? timeIdle : 0);
            }
            else {
               timeSpent = 0;
            }
         }
         return timeSpent;
      };

      var LongOperationModel = Model.extend({
         $protected: {
            _options: {
               properties: {
                  fullId: {
                     get: function () {
                        return LongOperationModel.getFullId(this.get('tabKey'), this.get('producer'), this.get('id'));
                     }
                  },

                  strTimeSpent: {
                     get: function () {
                        return LongOperationModel.timeSpentAsString(_timeSpent(this), 2);
                     }
                  },

                  shortTimeSpent: {
                     get: function () {
                        return LongOperationModel.timeSpentAsString(_timeSpent(this), 1);
                     }
                  },

                  userFullName: {
                     get: function () {
                        var parts = [];
                        for (var i = 0, props = ['userLastName', 'userFirstName', 'userPatronymicName']; i < props.length; i++) {
                           var part = this.get(props[i]);
                           if (!part) {
                              break;
                           }
                           parts.push(i === 0 ? part : part.charAt(0) + '.');
                        }
                        return parts.length ? parts.join(' ') : rk('Пользователь удален');
                     }
                  }
               }
            }
         }
      });

      /**
       * Возвращает промежуток времени с указаной подробностью
       * @param {number} details Детальность - количество элементов в строке
       * @return {string}
       */
      LongOperationModel.timeSpentAsString = function (timeSpent, details) {
         var spent = [];
         if (typeof timeSpent === 'number' && 0 < timeSpent) {
            details = 1 < details ? details : 1;
            var secs = Math.round(timeSpent/1000);
            for (var i = 0, periods = [86400, 3600, 60, 1], names = ['д.', 'ч.', 'мин.', 'сек.']; i < periods.length; i++) {
               var period = periods[i];
               var t = Math.floor(secs/period);
               secs = secs%period;
               if (t) {
                  spent.push(t + ' ' + rk(names[i], 'ДлительныеОперации'));
                  if (details <= spent.length) {
                     break;
                  }
               }
               /*else
               if (spent.length) {
               // Не должно быть пропущенных элементов
                  break;
               }*/
            }
         }
         return spent.length ? spent.join(' ') : '0 сек.';
      };

      /**
       * Составить полный идентификатор
       * @param {string} tabKey Ключ вкладки
       * @param {string} producer Имя продюсера
       * @param {string|number} id Идентификатор операции
       */
      LongOperationModel.getFullId = function (tabKey, producer, id) {
         return (tabKey || '') + ':' + producer + ':' + id;
      };

      return LongOperationModel;
   }
);