define(
   [
      'Controls/Toggle/Radio',
      'WS.Data/Entity/Model',
      'WS.Data/Source/Memory',
      'WS.Data/Collection/RecordSet'
   ],
   function(RadioGroup, Model, MemorySource, RecordSet) {
      'use strict';
      describe('Controls/Toggle/Radio', function () {
         it('change selected key', function() {
            var radio = new RadioGroup();
            var keyChanged = false;
            var item = new Model();
            item.set("2", "test");

            radio._notify = function (event, value) {
               if (event === "onSelectedItemChange" && value === "test") {
                  keyChanged = true;
               }
            };

            radio.selectKeyChanged("event", item, "2");

            assert.isTrue(keyChanged, 'changed selected key is not success');
         });

         it('_beforeMount', function(done) {
            var radio = new RadioGroup();
            var source = new MemorySource({
               idProperty: 'id',
               data: [
                  {
                     id: '1',
                     caption: 'test1'
                  },
                  {
                     id: '2',
                     caption: 'test2'
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
            var radio = new RadioGroup();
            var source = new MemorySource({
               idProperty: 'id',
               data: [
                  {
                     id: '1',
                     caption: 'test1'
                  },
                  {
                     id: '2',
                     caption: 'test2'
                  }
               ]
            });
            var options = {
               source: source
            };

            radio.saveOptions(options);

            source = new MemorySource({
               idProperty: 'id',
               data: [
                  {
                     id: '1',
                     caption: 'caption1'
                  },
                  {
                     id: '2',
                     caption: 'caption2'
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