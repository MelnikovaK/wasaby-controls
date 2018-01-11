/**
 * Created by dv.zuev on 25.12.2017.
 */
define('Controls/Application',
   [
      'Core/Control',
      'tmpl!Controls/Application/Page',
      'Core/helpers/URLHelpers',
      'Core/Deferred'
   ],

   /**
    * Компонент приложение. не делает НИЧЕГО. На вход принимает конфиг - на выходе шаблон.
    * Никакой логики внутри нет.
    */
   function (Base,
             template,
             URLHelpers,
             Deferred) {
      'use strict';

      var _private,
         DEFAULT_DEBUG_CATALOG = 'debug/';

      _private = {
         /**
          * Перекладываем опции или recivedState на инстанс
          * @param self
          * @param cfg
          * @param routesConfig
          */
         initState: function(self, cfg) {
            self.cssLinks = cfg.cssLinks;
            self.title = cfg.title;
            self.wsRoot = cfg.wsRoot;
            self.content = cfg.content;
            self.resourceRoot = cfg.resourceRoot;
            self.jsLinks = cfg.jsLinks;
            self.templateConfig = cfg.templateConfig;
         }
      };
      var Page = Base.extend({
         _template: template,

         /*Небольшой фикс, для блокировки слоя совместимости*/
         fixBaseCompatible: true,

         getDataId: function(){
            return 'cfg-pagedata';
         },

         _beforeMount: function(cfg, context, receivedState) {
            var self = this,
               def = new Deferred();

            _private.initState(self, receivedState||cfg);

            /**
             * Этот перфоманс нужен, для сохранения состояния с сервера, то есть, cfg - это конфиг, который нам прийдет из файла
             * роутинга и с ним же надо восстанавливаться на клиенте.
             */
            def.callback(cfg);
            return def;
         }


         /*TODO:: это будет нужно для роутинга, но пока роутинг не нужен, просто оставим
         _afterMount: function() {
            var
               navigation = EventBus.channel('navigation'),
               self = this;
            navigation.subscribe('onNavigate', function(e, location) {
               self._setLocation.apply(self, arguments);
            });
         },

         _setLocation: function(e, path) {
            this._tplConfig = this._routes[path];
            history.pushState(history.state, '', path + '?' + URLHelpers.getQuery());
         }*/
      });

      return Page;
   }
);