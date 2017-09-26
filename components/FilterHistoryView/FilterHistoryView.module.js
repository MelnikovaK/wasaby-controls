define('js!SBIS3.CONTROLS.FilterHistoryView',
    [
       'js!SBIS3.CONTROLS.ListView',
       'tmpl!SBIS3.CONTROLS.FilterHistoryView/footerTpl',
       'tmpl!SBIS3.CONTROLS.FilterHistoryView/itemTpl',
       'js!SBIS3.CONTROLS.HistoryList',
       'Core/CommandDispatcher',
       'js!SBIS3.CONTROLS.CommandsSeparator',
       'css!SBIS3.CONTROLS.FilterHistoryView'
    ],

    function(ListView, footerTpl, itemTpl, HistoryList, CommandDispatcher) {

       'use strict';
        /**
         *
         * @class SBIS3.CONTROLS.FilterHistoryView
         * @extends SBIS3.CONTROLS.ListView
         */
       var FilterHistoryView = ListView.extend(/** @lends SBIS3.CONTROLS.FilterHistoryView.prototype*/{
          $protected: {
             _options: {
                historyId: '',
                itemsActions: [],
                itemsDragNDrop: false,
                itemContentTpl: itemTpl
             }
          },

          $constructor: function() {
             this.subscribe('onDrawItems', function() {
                this.getChildControlByName('toggle').toggle(Boolean(this.getItems().getCount() > 5));
             });

             CommandDispatcher.declareCommand(this, 'toggle', function() {
                this.getContainer().toggleClass('controls-HistoryView__expanded');
             })
          },

          _modifyOptions: function() {
             var opts = FilterHistoryView.superclass._modifyOptions.apply(this, arguments);
             opts.footerTpl = footerTpl;
             opts.idProperty = 'id';
             opts.cssClassName += ' controls-HistoryView';
             return opts;
          },

          init: function() {
             FilterHistoryView.superclass.init.apply(this, arguments);

             if(this._options.historyId) {
                var historyController = new HistoryList({historyId: this.getProperty('historyId')});

                this.subscribeTo(historyController, 'onHistoryUpdate', function(event, history) {
                   this.setItems(history.clone(true));
                }.bind(this));

                this.setItems(historyController.getHistory().clone(true));
             }
          }
       });

       return FilterHistoryView;
    });