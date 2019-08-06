define(
   [
      'Controls/toggle',
      'Types/entity',
      'Types/source',
      'Types/collection'
   ],
   function(toggle, entity, sourceLib, collection) {
      'use strict';
      describe('Controls/_toggle/RadioGroup', function () {
         it('change selected key', function() {
            var radio = new toggle.RadioGroup();
            var keyChanged = false;
            var item = new entity.Model();
            item.set("2", "test");

            radio._notify = function (event, value) {
               if (event === "selectedKeyChanged" && value[0] === "test") {
                  keyChanged = true;
               }
            };

            radio._selectKeyChanged("event", item, "2");

            assert.isTrue(keyChanged, 'changed selected key is not success');
         });

         it('_beforeMount', function(done) {
            var radio = new toggle.RadioGroup();
            var source = new sourceLib.Memory({
               idProperty: 'id',
               data: [
                  {
                     id: '1',
                     tittle: 'test1'
                  },
                  {
                     id: '2',
                     tittle: 'test2'
                  }
               ]
            });
            var options = {
               source: source
            };

            radio._beforeMount(options).addCallback(function () {
               assert.isTrue(radio._items.at(0).get("tittle") === "test1", '_beforeMount work uncorrect');
               assert.isTrue(radio._items.at(1).get("tittle") === "test2", '_beforeMount work uncorrect');
               done();
            });
         });

         it('_beforeUpdate', function(done) {
            var radio = new toggle.RadioGroup();
            var source = new sourceLib.Memory({
               idProperty: 'id',
               data: [
                  {
                     id: '1',
                     tittle: 'test1'
                  },
                  {
                     id: '2',
                     tittle: 'test2'
                  }
               ]
            });
            var options = {
               source: source
            };

            radio.saveOptions(options);

            source = new sourceLib.Memory({
               idProperty: 'id',
               data: [
                  {
                     id: '1',
                     tittle: 'caption1'
                  },
                  {
                     id: '2',
                     tittle: 'caption2'
                  }
               ]
            });
            options = {
               source: source
            };

            radio._beforeUpdate(options).addCallback(function () {
               assert.isTrue(radio._items.at(0).get("tittle") === "caption1", '_beforeUpdate work uncorrect');
               assert.isTrue(radio._items.at(1).get("tittle") === "caption2", '_beforeUpdate work uncorrect');
               done();
            });
         });
      });
   });
